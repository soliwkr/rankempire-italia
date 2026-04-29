import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { pages, projects } from '../../db/schema';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  renterId: string;
};

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * GET /api/renter/pages?projectId=...
 * List all pages for a specific project assigned to the authenticated Renter.
 */
api.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const renterId = c.get('renterId');
  const projectId = c.req.query('projectId');

  if (!projectId) {
    return c.json({ error: 'Missing projectId' }, 400);
  }

  // First verify project belongs to renter
  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.renterId, renterId)))
    .get();

  if (!project) {
    return c.json({ error: 'Project not found or unauthorized' }, 404);
  }

  const projectPages = await db
    .select()
    .from(pages)
    .where(eq(pages.projectId, projectId))
    .all();

  return c.json(projectPages);
});

/**
 * GET /api/renter/pages/:id
 * Get a single page, with multi-tenant isolation.
 */
api.get('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const renterId = c.get('renterId');
  const id = c.req.param('id');

  // Join with projects to verify ownership
  const page = await db
    .select({
      id: pages.id,
      projectId: pages.projectId,
      slug: pages.slug,
      type: pages.type,
      title: pages.title,
      body: pages.body,
      faq: pages.faq,
      meta: pages.meta,
      createdAt: pages.createdAt,
    })
    .from(pages)
    .innerJoin(projects, eq(pages.projectId, projects.id))
    .where(and(eq(pages.id, id), eq(projects.renterId, renterId)))
    .get();

  if (!page) {
    return c.json({ error: 'Page not found or unauthorized' }, 404);
  }

  return c.json(page);
});

/**
 * PATCH /api/renter/pages/:id
 * Update a page, with multi-tenant isolation.
 */
api.patch('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const renterId = c.get('renterId');
  const id = c.req.param('id');
  
  let updates;
  try {
    updates = await c.req.json();
  } catch (e) {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  // Basic validation
  const allowedFields = ['title', 'body', 'faq', 'meta'];
  const filteredUpdates: any = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    return c.json({ error: 'No valid fields provided for update' }, 400);
  }

  // Verify ownership before update
  const pageToUpdate = await db
    .select({
      id: pages.id,
    })
    .from(pages)
    .innerJoin(projects, eq(pages.projectId, projects.id))
    .where(and(eq(pages.id, id), eq(projects.renterId, renterId)))
    .get();

  if (!pageToUpdate) {
    return c.json({ error: 'Page not found or unauthorized' }, 404);
  }

  const result = await db
    .update(pages)
    .set(filteredUpdates)
    .where(eq(pages.id, id))
    .returning()
    .get();

  return c.json(result);
});

export default api;
