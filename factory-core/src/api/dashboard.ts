import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { projects, leads } from '../db/schema';
import { count, eq, sql } from 'drizzle-orm';

type Bindings = {
  DB: D1Database;
};

const api = new Hono<{ Bindings: Bindings }>();

api.get('/stats', async (c) => {
  const db = drizzle(c.env.DB);

  try {
    // Basic counts
    const [projectCountResult] = await db.select({ value: count() }).from(projects).all();
    const [leadCountResult] = await db.select({ value: count() }).from(leads).all();

    // Granular status counts for projects
    const projectStatusStats = await db
      .select({
        status: projects.status,
        count: count(),
      })
      .from(projects)
      .groupBy(projects.status)
      .all();

    // Granular status counts for leads
    const leadStatusStats = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .groupBy(leads.status)
      .all();

    // Converted lead ratio calculation
    // Assuming "active" leads are considered "converted" or "verified"
    // We also have doiStatus 'verified' in schema. Let's count verified DOI leads.
    const [verifiedLeadsResult] = await db
      .select({ value: count() })
      .from(leads)
      .where(eq(leads.doiStatus, 'verified'))
      .all();

    const totalProjects = projectCountResult?.value ?? 0;
    const totalLeads = leadCountResult?.value ?? 0;
    const verifiedLeads = verifiedLeadsResult?.value ?? 0;

    return c.json({
      totalProjects,
      totalLeads,
      projectStatusDistribution: Object.fromEntries(
        projectStatusStats.map((s) => [s.status, s.count])
      ),
      leadStatusDistribution: Object.fromEntries(
        leadStatusStats.map((s) => [s.status, s.count])
      ),
      conversionRatio: totalLeads > 0 ? (verifiedLeads / totalLeads).toFixed(2) : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[dashboard/stats] Error:', error.message);
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

export default api;
