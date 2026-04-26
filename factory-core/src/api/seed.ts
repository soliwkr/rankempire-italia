import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { PromptService, sanitizeHtml, type AvatarType } from '../services/prompts';
import { projects, pages } from '../db/schema';

type Bindings = {
  DB: D1Database;
  GOOGLE_AI_API_KEY: string;
  CF_ACCOUNT_ID: string;
  CF_AI_GATEWAY_NAME: string;
  CF_AI_GATEWAY_TOKEN: string;
};

// Re-export sanitizeHtml so tests can import it from './seed'
export { sanitizeHtml } from '../services/prompts';

const VALID_TYPES = ['homepage', 'services', 'zones', 'service_zones', 'blog'] as const;
type PageType = typeof VALID_TYPES[number];

// Interfaccia pagina generata da Gemini — corrisponde a PageContent
interface GeneratedPage {
  slug: string;
  type: string;
  title: string;
  body: string;
  faq: Array<{ question: string; answer: string }>;
  meta: { description: string; canonical: string };
}

/**
 * Chiama Gemini con accesso al finishReason raw.
 * Non usa AiService.generateContent() perché non espone finishReason.
 * Fa fetch diretta all'AI Gateway per validare finishReason PRIMA del parse JSON.
 */
async function callGemini(
  prompt: string,
  env: { GOOGLE_AI_API_KEY: string; CF_ACCOUNT_ID: string; CF_AI_GATEWAY_NAME: string; CF_AI_GATEWAY_TOKEN?: string }
): Promise<GeneratedPage[]> {
  // Se CF_AI_GATEWAY_TOKEN non è disponibile (dev locale), chiama Google AI direttamente
  const url = env.CF_AI_GATEWAY_TOKEN
    ? `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.CF_AI_GATEWAY_NAME}/google-ai-studio/v1beta/models/gemini-2.5-flash:generateContent`
    : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-goog-api-key': env.GOOGLE_AI_API_KEY,
  };
  if (env.CF_AI_GATEWAY_TOKEN) {
    headers['Authorization'] = `Bearer ${env.CF_AI_GATEWAY_TOKEN}`;
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

  // CF-04: validare finishReason PRIMA del parse
  const candidate = result.candidates?.[0];
  const finishReason = candidate?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    throw new Error(`Gemini output incompleto: finishReason=${finishReason}`);
  }

  const textContent: string = candidate?.content?.parts?.[0]?.text ?? '';

  if (!textContent) {
    throw new Error('Gemini ha ritornato risposta vuota');
  }

  // Pitfall 4: regex fallback nel caso Gemini aggiunga testo preamble
  let parsed: any;
  try {
    parsed = JSON.parse(textContent);
  } catch {
    const match = textContent.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Impossibile estrarre JSON array dalla risposta Gemini');
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Gemini ha ritornato array vuoto o non-array');
  }

  return parsed as GeneratedPage[];
}

/**
 * Scrive batch di pagine su D1 con upsert idempotente (D-04).
 * Usa onConflictDoUpdate su (project_id, slug) per sovrascrivere senza errori.
 */
async function upsertPages(
  db: ReturnType<typeof drizzle>,
  projectId: string,
  generatedPages: GeneratedPage[]
): Promise<void> {
  const now = new Date().toISOString();
  const rows = generatedPages.map(p => ({
    id: crypto.randomUUID(),
    projectId,
    slug: p.slug,
    type: p.type,
    title: p.title,
    body: sanitizeHtml(p.body),  // D-13: sanitizzazione PRIMA della write
    faq: JSON.stringify(p.faq),
    meta: JSON.stringify(p.meta),
    createdAt: now,
  }));

  await db
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

const api = new Hono<{ Bindings: Bindings }>();

api.post('/seed-project/:projectId', async (c) => {
  const projectId = c.req.param('projectId');
  const type = c.req.query('type') as PageType | undefined;

  // Validazione type — D-02
  if (!type) {
    return c.json({ error: 'Parametro ?type= obbligatorio' }, 400);
  }
  if (!VALID_TYPES.includes(type as any)) {
    return c.json({
      error: `type non valido: "${type}". Valori permessi: ${VALID_TYPES.join(', ')}`,
    }, 400);
  }

  // Lettura body — D-10: services e zones nel request body
  let body: { services?: string[]; zones?: string[]; avatar?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // body opzionale per alcuni tipi (homepage, blog)
  }

  const avatar = (body.avatar ?? 'in-pain') as AvatarType;
  const services: string[] = body.services ?? [];
  const zones: string[] = body.zones ?? [];

  // Lettura progetto da D1
  const db = drizzle(c.env.DB);
  let project: any;
  try {
    project = await db.select().from(projects).where(eq(projects.id, projectId)).get();
  } catch (err: any) {
    console.error('[seed] DB query error:', err.message);
    return c.json({ error: `Progetto "${projectId}" non trovato` }, 404);
  }

  if (!project) {
    return c.json({ error: `Progetto "${projectId}" non trovato` }, 404);
  }

  const context = { niche: project.niche, city: project.location };
  const promptService = new PromptService();
  const geminiEnv = {
    GOOGLE_AI_API_KEY: c.env.GOOGLE_AI_API_KEY,
    CF_ACCOUNT_ID: c.env.CF_ACCOUNT_ID,
    CF_AI_GATEWAY_NAME: c.env.CF_AI_GATEWAY_NAME,
    CF_AI_GATEWAY_TOKEN: c.env.CF_AI_GATEWAY_TOKEN,
  };

  try {
    let totalPages = 0;

    if (type === 'homepage') {
      const prompt = promptService.generateHomepagePrompt(context, avatar);
      const generated = await callGemini(prompt, geminiEnv);
      await upsertPages(db, projectId, generated);
      totalPages = generated.length;

    } else if (type === 'services') {
      if (services.length === 0) {
        return c.json({ error: 'services[] richiesto per type=services' }, 400);
      }
      const prompt = promptService.generateServicesPrompt(context, services, avatar);
      const generated = await callGemini(prompt, geminiEnv);
      await upsertPages(db, projectId, generated);
      totalPages = generated.length;

    } else if (type === 'zones') {
      if (zones.length === 0) {
        return c.json({ error: 'zones[] richiesto per type=zones' }, 400);
      }
      const prompt = promptService.generateZonesPrompt(context, zones, avatar);
      const generated = await callGemini(prompt, geminiEnv);
      await upsertPages(db, projectId, generated);
      totalPages = generated.length;

    } else if (type === 'service_zones') {
      // CF-02 MITIGATION: loop per servizio — N call Gemini, mai una mega-call
      if (services.length === 0 || zones.length === 0) {
        return c.json({ error: 'services[] e zones[] richiesti per type=service_zones' }, 400);
      }
      for (const service of services) {
        const prompt = promptService.generateServiceZonesPrompt(context, service, zones, avatar);
        const generated = await callGemini(prompt, geminiEnv);
        // D-11: write D1 immediatamente dopo ogni call Gemini
        await upsertPages(db, projectId, generated);
        totalPages += generated.length;
      }

    } else if (type === 'blog') {
      const prompt = promptService.generateBlogPrompt(context, avatar);
      const generated = await callGemini(prompt, geminiEnv);
      await upsertPages(db, projectId, generated);
      totalPages = generated.length;
    }

    return c.json({
      success: true,
      type,
      projectId,
      pagesWritten: totalPages,
    });

  } catch (err: any) {
    console.error(`[seed] Error generating type=${type} for project=${projectId}:`, err);
    return c.json({ error: 'Generazione fallita', details: err.message }, 500);
  }
});

export default api;
