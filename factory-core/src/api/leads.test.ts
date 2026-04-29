import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock drizzle-orm/d1 MUST be at the top level
vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(),
}));

import api from './leads';
import { leads } from '../db/schema';
import { drizzle } from 'drizzle-orm/d1';

// Mock D1 Database
const mockD1 = {
  prepare: vi.fn(),
  batch: vi.fn(),
  exec: vi.fn(),
  dump: vi.fn(),
} as any;

describe('Leads API Filter and PATCH', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/leads', () => {
    it('should support filtering by status', async () => {
      const mockAll = vi.fn().mockResolvedValue([{ id: '1', status: 'active' }]);
      const mockWhere = vi.fn().mockReturnValue({ all: mockAll });
      const mockLimit = vi.fn().mockReturnValue({ where: mockWhere });
      const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockLeftJoin = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ leftJoin: mockLeftJoin });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      
      (drizzle as any).mockReturnValue({
        select: mockSelect,
      } as any);

      const res = await api.request('/?status=active', {
        method: 'GET',
      }, { DB: mockD1 } as any);

      expect(res.status).toBe(200);
      expect(mockWhere).toHaveBeenCalled();
      const body = await res.json() as any;
      expect(body[0].status).toBe('active');
    });
  });

  describe('PATCH /api/leads/:id', () => {
    it('should update lead status', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 1 } });
      const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
      
      (drizzle as any).mockReturnValue({
        update: mockUpdate,
      } as any);

      const res = await api.request('/123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'trash' }),
        headers: { 'Content-Type': 'application/json' }
      }, { DB: mockD1 } as any);

      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith(leads);
      expect(mockSet).toHaveBeenCalledWith({ status: 'trash' });
      const body = await res.json() as any;
      expect(body.success).toBe(true);
    });

    it('should return 400 for invalid status', async () => {
      const res = await api.request('/123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'invalid' }),
        headers: { 'Content-Type': 'application/json' }
      }, { DB: mockD1 } as any);

      expect(res.status).toBe(400);
    });

    it('should return 404 if lead not found', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 0 } });
      const mockWhere = vi.fn().mockReturnValue({ run: mockRun });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });
      
      (drizzle as any).mockReturnValue({
        update: mockUpdate,
      } as any);

      const res = await api.request('/non-existent', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
        headers: { 'Content-Type': 'application/json' }
      }, { DB: mockD1 } as any);

      expect(res.status).toBe(404);
    });
  });
});
