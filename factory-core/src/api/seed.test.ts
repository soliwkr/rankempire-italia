import { describe, it, expect, vi, beforeEach } from 'vitest';

// mock drizzle-orm/d1 hoisted — controllato per test tramite mockGetResult
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

import api from './seed';

describe('POST /api/generate/seed-project/:projectId', () => {
  beforeEach(() => {
    mockGetResult = undefined;
  });

  it('FACT-02-a: dovrebbe ritornare 400 se type è mancante', async () => {
    const res = await api.request('/seed-project/proj-test-1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: ['idraulico'], zones: ['Formia'], avatar: 'in-pain' }),
    }, { DB: {} as any, GOOGLE_AI_API_KEY: 'test', CF_ACCOUNT_ID: 'test', CF_AI_GATEWAY_NAME: 'test', CF_AI_GATEWAY_TOKEN: 'test' } as any);
    expect(res.status).toBe(400);
  });

  it('FACT-02-b: dovrebbe ritornare 400 se type è invalido', async () => {
    const res = await api.request('/seed-project/proj-test-1?type=invalid_type', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: ['idraulico'], zones: ['Formia'], avatar: 'in-pain' }),
    }, { DB: {} as any, GOOGLE_AI_API_KEY: 'test', CF_ACCOUNT_ID: 'test', CF_AI_GATEWAY_NAME: 'test', CF_AI_GATEWAY_TOKEN: 'test' } as any);
    expect(res.status).toBe(400);
  });

  it('FACT-02-c: dovrebbe ritornare 404 se projectId non esiste in D1', async () => {
    mockGetResult = null; // progetto non trovato
    const res = await api.request('/seed-project/progetto-inesistente?type=homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: [], zones: [], avatar: 'in-pain' }),
    }, { DB: {} as any, GOOGLE_AI_API_KEY: 'test', CF_ACCOUNT_ID: 'test', CF_AI_GATEWAY_NAME: 'test', CF_AI_GATEWAY_TOKEN: 'test' } as any);
    expect(res.status).toBe(404);
  });

  it('FACT-02-f: dovrebbe ritornare 500 se finishReason non è STOP', async () => {
    // progetto valido in DB
    mockGetResult = {
      id: 'proj-test', slug: 'idraulico-formia', name: 'Test',
      niche: 'idraulico', location: 'Formia', domain: null,
      status: 'active', renter_id: null, config_json: '{}', created_at: '2026-01-01',
    };

    // Gemini risponde con finishReason=MAX_TOKENS
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '' }] } }],
      }),
    } as any);

    const res = await api.request('/seed-project/proj-test?type=homepage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: [], zones: [], avatar: 'in-pain' }),
    }, { DB: {} as any, GOOGLE_AI_API_KEY: 'test', CF_ACCOUNT_ID: 'acc', CF_AI_GATEWAY_NAME: 'gw' } as any);

    expect(res.status).toBe(500);
    const body = await res.json() as any;
    expect(body.details).toContain('MAX_TOKENS');

    fetchSpy.mockRestore();
  });
});
