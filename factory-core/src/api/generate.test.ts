import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock drizzle-orm/d1
let mockGetResult: any = undefined;
vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    select: () => ({
      from: () => ({
        where: () => ({
          get: async () => mockGetResult,
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => Promise.resolve(),
      }),
    }),
  })),
}));

import api from './generate';

describe('POST /api/generate/batch/:projectId', () => {
  beforeEach(() => {
    mockGetResult = {
      id: 'proj-1',
      niche: 'idraulico',
      location: 'Formia'
    };
    vi.restoreAllMocks();
  });

  const mockBindings = {
    DB: {} as any,
    GOOGLE_AI_API_KEY: 'test-key',
    CF_ACCOUNT_ID: 'test-acc',
    CF_AI_GATEWAY_NAME: 'test-gw',
    CF_AI_GATEWAY_TOKEN: 'test-token'
  };

  it('should return 400 if services or zones are missing', async () => {
    const res = await api.request('/batch/proj-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: 'in-pain' }),
    }, mockBindings as any);
    
    expect(res.status).toBe(400);
    const body = await res.json() as any;
    expect(body.error).toContain('Missing required fields');
  });

  it('should return 500 if project not found', async () => {
    mockGetResult = null;
    
    const res = await api.request('/batch/missing-proj', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: ['a'], zones: ['b'] }),
    }, mockBindings as any);
    
    expect(res.status).toBe(500);
    const body = await res.json() as any;
    expect(body.error).toContain('Failed to generate batch content');
    expect(body.details).toContain('not found');
  });

  it('should call Gemini and return results on success', async () => {
    // Mock successful Gemini response
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          finishReason: 'STOP',
          content: {
            parts: [{
              text: JSON.stringify([{
                slug: 'test',
                type: 'homepage',
                title: 'Test HP',
                body: '<p>Test</p>',
                faq: [],
                meta: { description: 'desc', canonical: '' }
              }])
            }]
          }
        }]
      }),
    } as any);

    const res = await api.request('/batch/proj-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        services: ['riparazione'], 
        zones: ['centro'],
        includeBlog: false
      }),
    }, mockBindings as any);

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    expect(body.data.total).toBeGreaterThan(0);
    
    // Check if it made multiple calls (HP, Services, Zones, Service Zones)
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
