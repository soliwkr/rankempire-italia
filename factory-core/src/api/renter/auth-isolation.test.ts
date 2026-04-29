import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthUtils } from '../../services/auth-utils';

// Mock drizzle-orm/d1
let mockResults: any[] = [];
let mockGetResult: any = null;

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          all: async () => mockResults,
          get: async () => mockGetResult,
        })),
      })),
    })),
  })),
}));

import app from '../../index';

describe('Multi-Tenant Isolation Integration', () => {
  const JWT_SECRET = 'test-secret-isolation';
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults = [];
    mockGetResult = null;
  });

  it('should return only projects assigned to renter_1 when logged in as renter_1', async () => {
    const token = await AuthUtils.signToken({ sub: 'renter_1', role: 'renter' }, JWT_SECRET);
    
    // Simuliamo che nel DB ci siano solo 2 progetti per renter_1
    mockResults = [
      { id: 'p1', name: 'Project 1', renterId: 'renter_1' },
      { id: 'p2', name: 'Project 2', renterId: 'renter_1' }
    ];

    const res = await app.request('/api/renter/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    }, { 
      DB: {} as any,
      JWT_SECRET 
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any[];
    expect(body).toHaveLength(2);
    expect(body[0].renterId).toBe('renter_1');
  });

  it('should return 404 when renter_1 tries to access a project belonging to renter_2', async () => {
    const token = await AuthUtils.signToken({ sub: 'renter_1', role: 'renter' }, JWT_SECRET);
    
    // Simuliamo che la query WHERE (id = 'p3' AND renterId = 'renter_1') non trovi nulla
    mockGetResult = null;

    const res = await app.request('/api/renter/projects/p3', {
      headers: { 'Authorization': `Bearer ${token}` }
    }, { 
      DB: {} as any,
      JWT_SECRET 
    });

    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.error).toContain('Project not found or unauthorized');
  });

  it('should allow access when renter_1 accesses their own project', async () => {
    const token = await AuthUtils.signToken({ sub: 'renter_1', role: 'renter' }, JWT_SECRET);
    
    mockGetResult = { id: 'p1', name: 'Project 1', renterId: 'renter_1' };

    const res = await app.request('/api/renter/projects/p1', {
      headers: { 'Authorization': `Bearer ${token}` }
    }, { 
      DB: {} as any,
      JWT_SECRET 
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.id).toBe('p1');
    expect(body.renterId).toBe('renter_1');
  });

  it('should return 401 if a Renter token is used to access Admin endpoints', async () => {
    const token = await AuthUtils.signToken({ sub: 'renter_1', role: 'renter' }, JWT_SECRET);
    
    const res = await app.request('/api/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    }, { 
      DB: {} as any,
      JWT_SECRET,
      API_SECRET: 'master-admin-secret'
    });

    // Gli endpoint admin usano bearerAuth({ token: API_SECRET })
    // Quindi un JWT renter non passerà la validazione del token statico
    expect(res.status).toBe(401);
  });
});
