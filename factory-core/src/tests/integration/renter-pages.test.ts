import { describe, it, expect, beforeEach, vi } from 'vitest';
import app from '../../index';
import { AuthUtils } from '../../services/auth-utils';
import { drizzle } from 'drizzle-orm/d1';

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(),
}));

describe('Renter Pages API Integration', () => {
  let renterToken: string;

  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue([{ id: 'p1' }]),
    get: vi.fn().mockResolvedValue({ id: 'p1', renterId: 'renter-1' }),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  };

  const ENV = {
    DB: {} as any,
    JWT_SECRET: 'test-secret',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    renterToken = await AuthUtils.signToken({ sub: 'renter-1', role: 'renter' }, ENV.JWT_SECRET);
    (drizzle as any).mockReturnValue(mockDb);
  });

  describe('GET /api/renter/pages', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await app.request('/api/renter/pages?projectId=p1', {}, ENV);
      expect(res.status).toBe(401);
    });

    it('should return 400 if projectId is missing', async () => {
      const res = await app.request('/api/renter/pages', {
        headers: { Authorization: `Bearer ${renterToken}` },
      }, ENV);
      expect(res.status).toBe(400);
    });

    it('should return 200 if project belongs to renter', async () => {
      const res = await app.request('/api/renter/pages?projectId=p1', {
        headers: { Authorization: `Bearer ${renterToken}` },
      }, ENV);
      
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/renter/pages/:id', () => {
    it('should return 200 if page belongs to renter', async () => {
      const res = await app.request('/api/renter/pages/pg1', {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${renterToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'New Title' }),
      }, ENV);

      expect(res.status).toBe(200);
    });
  });
});
