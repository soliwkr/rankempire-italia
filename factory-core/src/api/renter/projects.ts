import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { projects } from '../../db/schema';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  renterId: string;
};

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/renter/projects
 * Lista tutti i progetti assegnati al Renter autenticato.
 */
api.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const renterId = c.get('renterId');

  const renterProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.renterId, renterId))
    .all();

  return c.json(renterProjects);
});

/**
 * GET /api/renter/projects/:id
 * Dettaglio di un singolo progetto, con controllo di appartenenza.
 */
api.get('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const renterId = c.get('renterId');
  const id = c.req.param('id');

  const project = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, id),
        eq(projects.renterId, renterId)
      )
    )
    .get();

  if (!project) {
    return c.json({ error: 'Project not found or unauthorized' }, 404);
  }

  return c.json(project);
});

export default api;
