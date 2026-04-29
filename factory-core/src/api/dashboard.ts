import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { projects, leads } from '../db/schema';
import { count } from 'drizzle-orm';

type Bindings = {
  DB: D1Database;
};

const api = new Hono<{ Bindings: Bindings }>();

api.get('/stats', async (c) => {
  const db = drizzle(c.env.DB);

  try {
    // Aggrega i dati da projects e leads
    const [projectCountResult] = await db.select({ value: count() }).from(projects).all();
    const [leadCountResult] = await db.select({ value: count() }).from(leads).all();

    return c.json({
      totalProjects: projectCountResult?.value ?? 0,
      totalLeads: leadCountResult?.value ?? 0,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[dashboard/stats] Error:', error.message);
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

export default api;
