import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { media, projects } from '../../db/schema';

type Bindings = {
  DB: D1Database;
  R2_MEDIA: R2Bucket;
  MEDIA_PUBLIC_URL: string;
};

type Variables = {
  renterId: string;
};

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * POST /api/renter/media/upload
 * Upload a file to R2 and track it in D1.
 */
api.post('/upload', async (c) => {
  const db = drizzle(c.env.DB);
  const renterId = c.get('renterId');
  
  const formData = await c.req.parseBody();
  const file = formData['file'] as File;
  const projectId = formData['projectId'] as string;

  if (!file || !projectId) {
    return c.json({ error: 'Missing file or projectId' }, 400);
  }

  // Verify project ownership
  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.renterId, renterId)))
    .get();

  if (!project) {
    return c.json({ error: 'Project not found or unauthorized' }, 404);
  }

  const fileId = crypto.randomUUID();
  const extension = file.name.split('.').pop();
  const r2Key = `${renterId}/${projectId}/${fileId}.${extension}`;

  // Upload to R2
  await c.env.R2_MEDIA.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const url = `${c.env.MEDIA_PUBLIC_URL}/${r2Key}`;

  // Track in D1
  const newMedia = await db
    .insert(media)
    .values({
      id: fileId,
      projectId,
      renterId,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      url,
      r2Key,
    })
    .returning()
    .get();

  return c.json(newMedia);
});

/**
 * GET /api/renter/media
 * List media for a project.
 */
api.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const renterId = c.get('renterId');
  const projectId = c.req.query('projectId');

  if (!projectId) {
    return c.json({ error: 'Missing projectId' }, 400);
  }

  const projectMedia = await db
    .select()
    .from(media)
    .where(and(eq(media.projectId, projectId), eq(media.renterId, renterId)))
    .all();

  return c.json(projectMedia);
});

export default api;
