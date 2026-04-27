import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { projects } from '../db/schema';
import { GitHubService } from '../services/github';
import { CloudflarePagesService } from '../services/cloudflare-pages';

type Bindings = {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_TEMPLATE_OWNER: string;
  GITHUB_TEMPLATE_REPO: string;
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  FACTORY_API_URL: string;
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
    domain: body.domain,
    status: 'pending',
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
  const cfPages = new CloudflarePagesService({
    apiToken: c.env.CF_API_TOKEN,
    accountId: c.env.CF_ACCOUNT_ID,
  });

  try {
    const repoName = `rr-${project.slug}`;
    let repoOwner: string;
    let repoGithubName: string;

    // Step 1: Crea repo GitHub (skip se già completato)
    if (project.status === 'pending') {
      // IMPORTANTE (D-10 idempotency): l'ordine è fisso:
      // (a) createRepoFromTemplate → ottieni repoData subito, senza aspettare disponibilità
      // (b) db.update repo_created → salva PRIMA del retry loop
      // (c) waitForRepo → se fallisce, D1 è già aggiornato → ritorna 503 correttamente
      const repoData = await github.createRepoFromTemplate(
        repoName,
        `Rank & Rent Site for ${project.niche} in ${project.location}`
      );
      repoOwner = (repoData as any).owner?.login ?? c.env.GITHUB_TEMPLATE_OWNER;
      repoGithubName = (repoData as any).name ?? repoName;

      // Salva subito — PRIMA di waitForRepo — per garantire idempotency (D-10)
      await db.update(projects)
        .set({
          status: 'repo_created',
          githubRepoUrl: `https://github.com/${repoOwner}/${repoGithubName}`,
        })
        .where(eq(projects.id, id));

      // Ora aspetta che il repo sia disponibile — se lancia Error, D1 è già salvato
      await github.waitForRepo(repoOwner, repoGithubName);
    } else {
      // Riprendi da status parziale: estrai owner/name dal githubRepoUrl salvato
      const savedUrl = project.githubRepoUrl ?? '';
      const urlParts = savedUrl.replace('https://github.com/', '').split('/');
      repoOwner = urlParts[0] ?? c.env.GITHUB_TEMPLATE_OWNER;
      repoGithubName = urlParts[1] ?? repoName;

      // Se status è 'repo_created', il repo esiste ma potrebbe non essere ancora disponibile
      // Prova waitForRepo per sicurezza prima di procedere con createFile
      if (project.status === 'repo_created') {
        await github.waitForRepo(repoOwner, repoGithubName);
      }
    }

    // Step 2: Inietta site.config.json (D-07/D-08)
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

      await db.update(projects)
        .set({ status: 'pages_linked' })
        .where(eq(projects.id, id));
    }

    // Step 3: Crea CF Pages project (D-01/D-02/D-03/D-04)
    const pagesResult = await cfPages.createProject(
      project.slug,
      repoOwner,
      repoGithubName,
      c.env.FACTORY_API_URL
    );

    const subdomain = (pagesResult as any).subdomain ?? `rr-${project.slug}`;
    const pagesUrl = subdomain.includes('.pages.dev') ? `https://${subdomain}` : `https://${subdomain}.pages.dev`;
    const pagesProjectName = (pagesResult as any).name ?? `rr-${project.slug}`;

    await db.update(projects)
      .set({
        status: 'deploying',
        pagesProjectName,
        pagesUrl,
      })
      .where(eq(projects.id, id));

    return c.json({
      success: true,
      repoUrl: `https://github.com/${repoOwner}/${repoGithubName}`,
      pagesUrl,
      status: 'deploying',
    });

  } catch (err: any) {
    // waitForRepo lancia Error con "not ready after N attempts"
    if (err.message?.includes('not ready after')) {
      // D1 è già a 'repo_created' (salvato PRIMA del waitForRepo nel blocco pending)
      return c.json({
        error: 'GitHub repo not ready — richiama /deploy per riprendere',
        status: 'repo_created',
      }, 503);
    }
    console.error('[deploy] Error:', err.message);
    return c.json({ error: 'Deployment failed', details: err.message }, 500);
  }
});

export default api;
