import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { PromptService, sanitizeHtml, type AvatarType } from './prompts';
import { slugify, slugifyServiceZone } from './slug';
import { projects, pages } from '../db/schema';

// Types from seed.ts for consistency
interface GeneratedPage {
  slug: string;
  type: string;
  title: string;
  body: string;
  faq: Array<{ question: string; answer: string }>;
  meta: { description: string; canonical: string };
}

type GeminiEnv = {
  GOOGLE_AI_API_KEY: string;
  CF_ACCOUNT_ID: string;
  CF_AI_GATEWAY_NAME: string;
  CF_AI_GATEWAY_TOKEN?: string;
};

export class BatchGenerator {
  private promptService: PromptService;
  private db: ReturnType<typeof drizzle>;
  private geminiEnv: GeminiEnv;

  constructor(db: any, geminiEnv: GeminiEnv) {
    this.db = drizzle(db);
    this.promptService = new PromptService();
    this.geminiEnv = geminiEnv;
  }

  /**
   * Orchestrates the full generation flow for a project.
   */
  async generateAll(
    projectId: string,
    config: {
      services: string[];
      zones: string[];
      avatar?: AvatarType;
      includeBlog?: boolean;
    }
  ) {
    const avatar = config.avatar ?? 'in-pain';
    const project = await this.db.select().from(projects).where(eq(projects.id, projectId)).get();

    if (!project) {
      throw new Error(`Project "${projectId}" not found`);
    }

    const context = { niche: project.niche, city: project.location };
    const results = {
      homepage: 0,
      services: 0,
      zones: 0,
      service_zones: 0,
      blog: 0,
      total: 0,
    };

    // 1. Homepage — slug always 'homepage' (Gemini's slug field is ignored here)
    const hpPrompt = this.promptService.generateHomepagePrompt(context, avatar);
    const hpGenerated = await this.callGemini(hpPrompt);
    await this.upsertPages(projectId, hpGenerated, () => 'homepage');
    results.homepage = hpGenerated.length;
    results.total += hpGenerated.length;

    // 2. Services — slug = slugify(serviceName), positional match to config.services
    if (config.services.length > 0) {
      const sPrompt = this.promptService.generateServicesPrompt(context, config.services, avatar);
      const sGenerated = await this.callGemini(sPrompt);
      await this.upsertPages(
        projectId,
        sGenerated,
        (_p, i) => slugify(config.services[i] ?? sGenerated[i]?.slug ?? '')
      );
      results.services = sGenerated.length;
      results.total += sGenerated.length;
    }

    // 3. Zones — slug = `zone/${slugify(zoneName)}`, positional match to config.zones
    if (config.zones.length > 0) {
      const zPrompt = this.promptService.generateZonesPrompt(context, config.zones, avatar);
      const zGenerated = await this.callGemini(zPrompt);
      await this.upsertPages(
        projectId,
        zGenerated,
        (_p, i) => `zone/${slugify(config.zones[i] ?? zGenerated[i]?.slug ?? '')}`
      );
      results.zones = zGenerated.length;
      results.total += zGenerated.length;
    }

    // 4. Service Zones — slug = `${slugify(service)}/${slugify(zone)}`, positional per service loop
    if (config.services.length > 0 && config.zones.length > 0) {
      for (const service of config.services) {
        const szPrompt = this.promptService.generateServiceZonesPrompt(context, service, config.zones, avatar);
        const szGenerated = await this.callGemini(szPrompt);
        await this.upsertPages(
          projectId,
          szGenerated,
          (_p, i) => slugifyServiceZone(service, config.zones[i] ?? '')
        );
        results.service_zones += szGenerated.length;
        results.total += szGenerated.length;
      }
    }

    // 5. Blog — slug = slugify(Gemini's slug); blog topics are not pre-known
    if (config.includeBlog) {
      const bPrompt = this.promptService.generateBlogPrompt(context, avatar);
      const bGenerated = await this.callGemini(bPrompt);
      await this.upsertPages(projectId, bGenerated, (p) => slugify(p.slug));
      results.blog = bGenerated.length;
      results.total += bGenerated.length;
    }

    return results;
  }

  /**
   * Direct call to Gemini via AI Gateway or Google AI Studio.
   * Logic mirrored from seed.ts to ensure consistency.
   */
  private async callGemini(prompt: string): Promise<GeneratedPage[]> {
    const { GOOGLE_AI_API_KEY, CF_ACCOUNT_ID, CF_AI_GATEWAY_NAME, CF_AI_GATEWAY_TOKEN } = this.geminiEnv;
    
    const url = CF_AI_GATEWAY_TOKEN
      ? `https://gateway.ai.cloudflare.com/v1/${CF_ACCOUNT_ID}/${CF_AI_GATEWAY_NAME}/google-ai-studio/v1beta/models/gemini-flash-latest:generateContent`
      : `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-goog-api-key': GOOGLE_AI_API_KEY,
    };
    if (CF_AI_GATEWAY_TOKEN) {
      headers['Authorization'] = `Bearer ${CF_AI_GATEWAY_TOKEN}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI Gateway error: ${response.status} ${err}`);
    }

    const result = await response.json() as any;
    const candidate = result.candidates?.[0];
    const finishReason = candidate?.finishReason;
    
    if (finishReason && finishReason !== 'STOP') {
      throw new Error(`Gemini output incomplete: finishReason=${finishReason}`);
    }

    const textContent: string = candidate?.content?.parts?.[0]?.text ?? '';
    if (!textContent) {
      throw new Error('Gemini returned empty response');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(textContent);
    } catch {
      const match = textContent.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Could not extract JSON array from Gemini response');
      }
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Gemini returned empty array or non-array');
    }

    return parsed as GeneratedPage[];
  }

  /**
   * Writes batch of pages to D1 with idempotent upsert.
   * Logic mirrored from seed.ts.
   *
   * The slug is deterministically computed by `slugBuilder` (positional
   * mapping back to the request context) so that Gemini's emitted `slug`
   * field cannot drift from the canonical form expected by the Astro
   * template.
   */
  private async upsertPages(
    projectId: string,
    generatedPages: GeneratedPage[],
    slugBuilder: (page: GeneratedPage, index: number) => string
  ): Promise<void> {
    const now = new Date().toISOString();
    const rows = generatedPages.map((p, i) => ({
      id: crypto.randomUUID(),
      projectId,
      slug: slugBuilder(p, i),
      type: p.type,
      title: p.title,
      body: sanitizeHtml(p.body),
      faq: JSON.stringify(p.faq),
      meta: JSON.stringify(p.meta),
      createdAt: now,
    }));

    await this.db
      .insert(pages)
      .values(rows)
      .onConflictDoUpdate({
        target: [pages.projectId, pages.slug],
        set: {
          title: sql`excluded.title`,
          body: sql`excluded.body`,
          faq: sql`excluded.faq`,
          meta: sql`excluded.meta`,
        },
      });
  }
}
