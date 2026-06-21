import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { projects } from '../db/schema';
import { GitHubService } from '../services/github';
import { CloudflareDNSService } from '../services/cloudflare-dns';
import { GoogleTrackingService } from '../services/google-tracking';
import { workerUrl, buildWranglerToml } from '../services/cloudflare-workers';

type Bindings = {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_TEMPLATE_OWNER: string;
  GITHUB_TEMPLATE_REPO: string;
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  CF_WORKERS_SUBDOMAIN: string;
  FACTORY_API_URL: string;
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GA4_ACCOUNT_ID: string;
};

const api = new Hono<{ Bindings: Bindings }>();

api.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const allProjects = await db.select().from(projects).all();
  return c.json(allProjects);
});

api.post('/', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  
  const projectId = crypto.randomUUID();
  
  await db.insert(projects).values({
    id: projectId,
    slug: body.slug,
    name: body.name,
    niche: body.niche,
    location: body.location,
    domain: body.domain ?? null,
    status: 'pending',
    createdVia: body.createdVia ?? 'api',
    buildMode: body.buildMode ?? 'speculative',
    sourcePhotoR2Key: body.sourcePhotoR2Key ?? null,
  });

  return c.json({ success: true, id: projectId }, 201);
});

api.post('/:id/deploy', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');

  // Validazione input id (prevenire injection)
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return c.json({ error: 'Invalid project id format' }, 400);
  }

  // Fetch progetto
  const project = await db.select().from(projects).where(eq(projects.id, id)).get();
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // Idempotency check (D-12)
  if (project.status === 'live') {
    return c.json({
      error: 'Project already deployed',
      pages_url: project.pagesUrl,
      github_repo_url: project.githubRepoUrl,
    }, 409);
  }

  // Validazione slug (prevenire injection nel nome repo/pages)
  if (!/^[a-z0-9-]+$/.test(project.slug)) {
    return c.json({ error: 'Invalid project slug format' }, 422);
  }

  const body = await c.req.json().catch(() => ({}));

  // Inizializza services
  const github = new GitHubService({
    token: c.env.GITHUB_TOKEN,
    templateOwner: c.env.GITHUB_TEMPLATE_OWNER,
    templateRepo: c.env.GITHUB_TEMPLATE_REPO,
  });

  const workersSubdomain = c.env.CF_WORKERS_SUBDOMAIN ?? 'soliwkr';

  try {
    const repoName = `rr-${project.slug}`;
    let repoOwner: string;
    let repoGithubName: string;

    // Step 1: Crea repo GitHub (skip se già completato)
    // Ordine fisso per idempotency: createRepo → salva D1 → waitForRepo
    if (project.status === 'pending') {
      const repoData = await github.createRepoFromTemplate(
        repoName,
        `Rank & Rent Site for ${project.niche} in ${project.location}`
      );
      repoOwner = (repoData as any).owner?.login ?? c.env.GITHUB_TEMPLATE_OWNER;
      repoGithubName = (repoData as any).name ?? repoName;

      await db.update(projects)
        .set({
          status: 'repo_created',
          githubRepoUrl: `https://github.com/${repoOwner}/${repoGithubName}`,
        })
        .where(eq(projects.id, id));

      await github.waitForRepo(repoOwner, repoGithubName);
    } else {
      const savedUrl = project.githubRepoUrl ?? '';
      const urlParts = savedUrl.replace('https://github.com/', '').split('/');
      repoOwner = urlParts[0] ?? c.env.GITHUB_TEMPLATE_OWNER;
      repoGithubName = urlParts[1] ?? repoName;

      if (project.status === 'repo_created') {
        await github.waitForRepo(repoOwner, repoGithubName);
      }
    }

    // Step 2: Inietta site.config.json e wrangler.toml
    if (project.status === 'pending' || project.status === 'repo_created') {
      const siteConfig = {
        projectId: project.id,
        niche: project.niche,
        city: project.location,
        services: (body as any).services ?? [],
        zones: (body as any).zones ?? [],
        avatar: (body as any).avatar ?? 'in-pain',
        factoryApi: c.env.FACTORY_API_URL,
        slug: project.slug,
        domain: null,
        gmbPlaceId: null,
        ga4MeasurementId: null,
        businessName: null,
        phone: null,
        address: null,
        geo: null,
      };

      await github.createFile(
        repoOwner,
        repoGithubName,
        'src/data/site.config.json',
        JSON.stringify(siteConfig, null, 2),
        'Inject site configuration'
      );

      // Inject wrangler.toml with correct worker name — triggers GitHub Action deploy
      await github.createFile(
        repoOwner,
        repoGithubName,
        'wrangler.toml',
        buildWranglerToml(project.slug, c.env.FACTORY_API_URL),
        'Configure Cloudflare Worker deployment'
      );

      await db.update(projects)
        .set({ status: 'pages_linked' })
        .where(eq(projects.id, id));
    }

    // Step 3: Record expected Worker URL (GitHub Action will do the actual deploy on push)
    const wUrl = workerUrl(project.slug, workersSubdomain);

    await db.update(projects)
      .set({
        status: 'deploying',
        pagesProjectName: `rr-${project.slug}`,
        pagesUrl: wUrl,
      })
      .where(eq(projects.id, id));

    return c.json({
      success: true,
      repoUrl: `https://github.com/${repoOwner}/${repoGithubName}`,
      workerUrl: wUrl,
      pagesUrl: wUrl,
      status: 'deploying',
      note: 'GitHub Action is building and deploying — site will be live in ~2 minutes',
    });

  } catch (err: any) {
    if (err.message?.includes('not ready after')) {
      return c.json({
        error: 'GitHub repo not ready — richiama /deploy per riprendere',
        status: 'repo_created',
      }, 503);
    }
    console.error('[deploy] Error:', err.message);
    return c.json({ error: 'Deployment failed', details: err.message }, 500);
  }
});

api.post('/:id/domain', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();
  const customDomain = body.domain;

  if (!customDomain) {
    return c.json({ error: 'Domain is required' }, 400);
  }

  // Fetch progetto
  const project = await db.select().from(projects).where(eq(projects.id, id)).get();
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const dns = new CloudflareDNSService({
    apiToken: c.env.CF_API_TOKEN,
    accountId: c.env.CF_ACCOUNT_ID,
  });
  const workersSubdomain = c.env.CF_WORKERS_SUBDOMAIN ?? 'soliwkr';

  try {
    // 1. Estrai Apex Domain per trovare la Zone ID
    // Esempio: "idraulico-roma.puraluce.studio" -> "puraluce.studio"
    const domainParts = customDomain.split('.');
    const apexDomain = domainParts.slice(-2).join('.');

    console.log(`[domain] Resolving zone for ${apexDomain}...`);
    const zoneId = await dns.getZoneId(apexDomain);

    // 2. Crea record CNAME
    const recordName = customDomain === apexDomain ? '@' : customDomain.replace(`.${apexDomain}`, '');
    // Workers URL as CNAME target
    const workerTarget = `rr-${project.slug}.${workersSubdomain}.workers.dev`;

    console.log(`[domain] Creating CNAME record: ${recordName} -> ${workerTarget}...`);
    try {
      await dns.createCnameRecord(zoneId, recordName, workerTarget);
    } catch (dnsErr: any) {
      if (!dnsErr.message.includes('409')) {
        throw dnsErr;
      }
      console.log(`[domain] DNS record already exists, skipping.`);
    }

    // 3. Setup Google Tracking (GSC & GA4)
    let measurementId = project.ga4MeasurementId;
    const siteUrl = `https://${customDomain}`;

    if (c.env.GOOGLE_CLIENT_EMAIL && c.env.GOOGLE_PRIVATE_KEY) {
      const googleTracking = new GoogleTrackingService({
        clientEmail: c.env.GOOGLE_CLIENT_EMAIL,
        privateKey: c.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });

      try {
        console.log(`[domain] Setting up Google Search Console for ${siteUrl}...`);
        await googleTracking.addSiteToGSC(siteUrl);
      } catch (gscErr: any) {
        console.error(`[domain] GSC Setup failed (non-fatal):`, gscErr.message);
      }

      if (!measurementId && c.env.GA4_ACCOUNT_ID) {
        try {
          console.log(`[domain] Setting up GA4 for ${customDomain}...`);
          measurementId = await googleTracking.setupGA4(
            c.env.GA4_ACCOUNT_ID,
            project.name || customDomain,
            siteUrl
          );
        } catch (ga4Err: any) {
          console.error(`[domain] GA4 Setup failed (non-fatal):`, ga4Err.message);
        }
      }
    }

    // 5. Update D1
    await db.update(projects)
      .set({
        domain: customDomain,
        status: 'live',
        ga4MeasurementId: measurementId,
        gscSiteUrl: siteUrl,
      })
      .where(eq(projects.id, id));

    return c.json({
      success: true,
      domain: customDomain,
      status: 'live'
    });

  } catch (err: any) {
    console.error('[domain] Error:', err.message);
    return c.json({ error: 'Domain assignment failed', details: err.message }, 500);
  }
});

api.patch('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();

  const project = await db.select().from(projects).where(eq(projects.id, id)).get();
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  const updateData: Partial<typeof projects.$inferInsert> = {};
  
  if (body.status) updateData.status = body.status;
  if (body.renterId !== undefined) updateData.renterId = body.renterId;
  if (body.name) updateData.name = body.name;
  if (body.domain) updateData.domain = body.domain;

  if (Object.keys(updateData).length === 0) {
    return c.json({ error: 'No fields to update' }, 400);
  }

  await db.update(projects)
    .set(updateData)
    .where(eq(projects.id, id));

  return c.json({ success: true, updated: Object.keys(updateData) });
});

export default api;
