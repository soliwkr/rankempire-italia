import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock drizzle-orm/d1
let mockGetResult: any = undefined;
let upsertedPages: any[] = [];

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
      values: (rows: any[]) => {
        upsertedPages.push(...rows);
        return {
          onConflictDoUpdate: () => Promise.resolve(),
        };
      },
    }),
  })),
}));

import api from './generate';

describe('Batch Generation Integration Test', () => {
  beforeEach(() => {
    mockGetResult = {
      id: 'proj-integration-1',
      niche: 'idraulico',
      location: 'Formia'
    };
    upsertedPages = [];
    vi.restoreAllMocks();
  });

  const mockBindings = {
    DB: {} as any,
    GOOGLE_AI_API_KEY: 'test-key',
    CF_ACCOUNT_ID: 'test-acc',
    CF_AI_GATEWAY_NAME: 'test-gw',
    CF_AI_GATEWAY_TOKEN: 'test-token'
  };

  it('should execute the full batch generation flow (Homepage + Services + Zones + ServiceZones)', async () => {
    // We expect calls for:
    // 1. Homepage
    // 2. Services
    // 3. Zones
    // 4. Service Zones (one call per service)
    
    const services = ['riparazione-caldaie', 'pronto-intervento'];
    const zones = ['centro', 'periferia'];
    
    let callCount = 0;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init: any) => {
      callCount++;
      const body = JSON.parse(init.body);
      const promptText = body.contents[0].parts[0].text;
      
      let responsePages = [];
      
      if (promptText.includes('Genera 1 pagina homepage')) {
        responsePages = [{
          slug: 'index',
          type: 'homepage',
          title: 'Idraulico Formia',
          body: '<p>Benvenuti</p>',
          faq: [],
          meta: { description: 'HP desc', canonical: '' }
        }];
      } else if (promptText.includes('UNA pagina per CIASCUNO dei seguenti servizi')) {
        responsePages = services.map(s => ({
          slug: s,
          type: 'service',
          title: `Servizio ${s}`,
          body: `<p>Dettagli ${s}</p>`,
          faq: [],
          meta: { description: `Desc ${s}`, canonical: '' }
        }));
      } else if (promptText.includes('UNA pagina per CIASCUNA delle seguenti zone')) {
        responsePages = zones.map(z => ({
          slug: z,
          type: 'zone',
          title: `Idraulico a ${z}`,
          body: `<p>Copriamo ${z}</p>`,
          faq: [],
          meta: { description: `Desc ${z}`, canonical: '' }
        }));
      } else if (promptText.includes('genera UNA pagina per CIASCUNA zona')) {
        // Find which service this call is for
        const serviceMatch = services.find(s => promptText.includes(s));
        responsePages = zones.map(z => ({
          slug: `${serviceMatch}-${z}`,
          type: 'service_zone',
          title: `${serviceMatch} a ${z}`,
          body: `<p>${serviceMatch} in zona ${z}</p>`,
          faq: [],
          meta: { description: `Desc ${serviceMatch} ${z}`, canonical: '' }
        }));
      }

      return {
        ok: true,
        json: async () => ({
          candidates: [{
            finishReason: 'STOP',
            content: {
              parts: [{
                text: JSON.stringify(responsePages)
              }]
            }
          }]
        }),
      } as any;
    });

    const res = await api.request('/batch/proj-integration-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        services, 
        zones,
        includeBlog: false
      }),
    }, mockBindings as any);

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.success).toBe(true);
    
    // Expected results:
    // HP: 1
    // Services: 2
    // Zones: 2
    // ServiceZones: 2 services * 2 zones = 4
    // Total: 1 + 2 + 2 + 4 = 9
    expect(body.data.total).toBe(9);
    expect(body.data.homepage).toBe(1);
    expect(body.data.services).toBe(2);
    expect(body.data.zones).toBe(2);
    expect(body.data.service_zones).toBe(4);
    
    // Check call count: HP(1) + Services(1) + Zones(1) + ServiceZones(2) = 5
    expect(callCount).toBe(5);
    
    // Verify DB writes
    expect(upsertedPages.length).toBe(9);
    expect(upsertedPages.find(p => p.slug === 'index')).toBeDefined();
    expect(upsertedPages.find(p => p.slug === 'riparazione-caldaie-centro')).toBeDefined();

    fetchSpy.mockRestore();
  });

  it('should handle partial failures in AI calls', async () => {
    // Fail the second call (Services)
    let callCount = 0;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount++;
      if (callCount === 2) {
        return {
          ok: false,
          status: 500,
          text: async () => 'AI Gateway Timeout'
        } as any;
      }
      return {
        ok: true,
        json: async () => ({
          candidates: [{
            finishReason: 'STOP',
            content: { parts: [{ text: JSON.stringify([{ slug: 'test', type: 'test', title: 't', body: 'b', faq: [], meta: {} }]) }] }
          }]
        }),
      } as any;
    });

    const res = await api.request('/batch/proj-integration-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        services: ['s1'], 
        zones: ['z1'],
        includeBlog: false
      }),
    }, mockBindings as any);

    expect(res.status).toBe(500);
    const body = await res.json() as any;
    expect(body.error).toContain('Failed to generate batch content');
    expect(body.details).toContain('AI Gateway error: 500');

    fetchSpy.mockRestore();
  });
});
