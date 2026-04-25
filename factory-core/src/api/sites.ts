import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { pages } from '../db/schema';

type Bindings = { DB: D1Database };

const api = new Hono<{ Bindings: Bindings }>();

// GET /api/sites/:projectId/pages
// Endpoint PUBBLICO — nessun Bearer token richiesto al fetch al build time da Cloudflare Pages.
// Il contenuto dei siti è pubblicamente leggibile per design (SEO). Il projectId non è segreto.
api.get('/:projectId/pages', async (c) => {
  const db = drizzle(c.env.DB);
  const projectId = c.req.param('projectId');
  const allPages = await db.select().from(pages).where(eq(pages.projectId, projectId)).all();
  if (allPages.length === 0) {
    return c.json({ error: `Nessun contenuto trovato per project ${projectId}` }, 404);
  }
  return c.json({ pages: allPages });
});

export default api;
