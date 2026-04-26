import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { projects } from '../db/schema';
import { GitHubService } from '../services/github';

type Bindings = {
  DB: D1Database;
  GITHUB_TOKEN: string;
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

  // 1. Recupero progetto
  const project = await db.select().from(projects).where(eq(projects.id, id)).get();
  
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }

  // 2. Configurazione GitHub
  const github = new GitHubService({
    token: c.env.GITHUB_TOKEN,
    templateOwner: 'StudioPuraLuce',
    templateRepo: 'astro-base'
  });

  try {
    // 3. Creazione Repo dal Template
    const repoName = `rr-${project.slug}`;
    const repoResponse = await github.createProjectRepo(repoName, `Rank & Rent Site for ${project.niche} in ${project.location}`);
    
    // 4. Iniezione Configurazione (src/data/config.json)
    const siteConfig = {
      projectId: project.id,
      niche: project.niche,
      city: project.location,
      factoryApi: 'https://factory-core.soliwkr.workers.dev' // TODO: Usare URL dinamico o env
    };

    // Attendiamo un secondo per assicurarci che GitHub abbia inizializzato il repo
    await new Promise(resolve => setTimeout(resolve, 2000));

    await github.createFile(
      repoResponse.owner.login,
      repoResponse.name,
      'src/data/config.json',
      JSON.stringify(siteConfig, null, 2),
      'Inject site configuration'
    );

    // 5. Aggiornamento Stato DB
    await db.update(projects)
      .set({ status: 'deploying' })
      .where(eq(projects.id, id));

    return c.json({ 
      success: true, 
      repoUrl: repoResponse.html_url,
      status: 'deploying'
    });
  } catch (err: any) {
    console.error('Deployment Error:', err);
    return c.json({ error: 'Deployment failed', details: err.message }, 500);
  }
});

export default api;
