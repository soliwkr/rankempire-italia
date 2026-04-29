import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock drizzle-orm/d1
vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(),
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual('drizzle-orm');
  return {
    ...actual,
    eq: vi.fn(),
    count: vi.fn(() => ({})),
  };
});

import dashboardApi from './dashboard';
import projectsApi from './projects';
import leadsApi from './leads';
import { drizzle } from 'drizzle-orm/d1';

describe('Dashboard Core API', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      all: vi.fn(),
      get: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      run: vi.fn(),
    };
    (drizzle as any).mockReturnValue(mockDb);
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return aggregated stats with granular distributions', async () => {
      mockDb.all
        .mockResolvedValueOnce([{ value: 10 }]) // total projects count
        .mockResolvedValueOnce([{ value: 50 }]) // total leads count
        .mockResolvedValueOnce([
          { status: 'pending', count: 6 },
          { status: 'live', count: 4 }
        ]) // projectStatusStats
        .mockResolvedValueOnce([
          { status: 'new', count: 30 },
          { status: 'active', count: 20 }
        ]) // leadStatusStats
        .mockResolvedValueOnce([{ value: 25 }]); // verifiedLeads count (for conversion ratio)

      const res = await dashboardApi.request('/stats', {
        method: 'GET',
      }, { DB: {} } as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalProjects).toBe(10);
      expect(body.totalLeads).toBe(50);
      expect(body.projectStatusDistribution).toEqual({
        pending: 6,
        live: 4
      });
      expect(body.leadStatusDistribution).toEqual({
        new: 30,
        active: 20
      });
      expect(body.conversionRatio).toBe("0.50");
      expect(body.timestamp).toBeDefined();
    });

    it('should handle database errors', async () => {
      mockDb.all.mockRejectedValue(new Error('DB Error'));

      const res = await dashboardApi.request('/stats', {
        method: 'GET',
      }, { DB: {} } as any);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to fetch dashboard stats');
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('should update project fields', async () => {
      mockDb.get.mockResolvedValue({ id: 'proj-1' });
      mockDb.run.mockResolvedValue({ meta: { changes: 1 } });

      const res = await projectsApi.request('/proj-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'live', name: 'Updated Name' }),
        headers: { 'Content-Type': 'application/json' },
      }, { DB: {} } as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.updated).toContain('status');
      expect(body.updated).toContain('name');
    });

    it('should return 404 if project not found', async () => {
      mockDb.get.mockResolvedValue(null);

      const res = await projectsApi.request('/non-existent', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'live' }),
        headers: { 'Content-Type': 'application/json' },
      }, { DB: {} } as any);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/leads/:id', () => {
    it('should update lead status', async () => {
      mockDb.run.mockResolvedValue({ meta: { changes: 1 } });

      const res = await leadsApi.request('/lead-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
        headers: { 'Content-Type': 'application/json' },
      }, { DB: {} } as any);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('should validate status enum', async () => {
      const res = await leadsApi.request('/lead-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'invalid-status' }),
        headers: { 'Content-Type': 'application/json' },
      }, { DB: {} } as any);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('should return 404 if lead not found', async () => {
      mockDb.run.mockResolvedValue({ meta: { changes: 0 } });

      const res = await leadsApi.request('/non-existent', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'trash' }),
        headers: { 'Content-Type': 'application/json' },
      }, { DB: {} } as any);

      expect(res.status).toBe(404);
    });
  });
});
