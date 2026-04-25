import { describe, it, expect } from 'vitest';

// Test 1: schema.ts deve avere la tabella pages con tutti i campi richiesti
describe('pages table schema', () => {
  it('deve esportare la tabella pages', async () => {
    const schema = await import('../db/schema');
    expect(schema.pages).toBeDefined();
  });

  it('deve avere tutti i 9 campi richiesti da D-05', async () => {
    const schema = await import('../db/schema');
    const columns = Object.keys(schema.pages);
    // Verifica che il simbolo della tabella esista (è un oggetto Drizzle)
    expect(schema.pages).toBeDefined();
    // Verifica struttura Drizzle — la tabella ha un _ con le colonne
    const tableDef = schema.pages as any;
    expect(tableDef._).toBeDefined();
    const colNames = Object.keys(tableDef._.columns);
    expect(colNames).toContain('id');
    expect(colNames).toContain('project_id');
    expect(colNames).toContain('slug');
    expect(colNames).toContain('type');
    expect(colNames).toContain('title');
    expect(colNames).toContain('body');
    expect(colNames).toContain('faq');
    expect(colNames).toContain('meta');
    expect(colNames).toContain('created_at');
  });

  it('faq deve avere default "[]"', async () => {
    const schema = await import('../db/schema');
    const tableDef = schema.pages as any;
    const faqCol = tableDef._.columns['faq'];
    expect(faqCol.default).toBe('[]');
  });

  it('meta deve avere default "{}"', async () => {
    const schema = await import('../db/schema');
    const tableDef = schema.pages as any;
    const metaCol = tableDef._.columns['meta'];
    expect(metaCol.default).toBe('{}');
  });
});

// Test 3 & 4: sites.ts router Hono
describe('GET /:projectId/pages', () => {
  it('deve restituire { pages: [] } quando il DB ha righe per projectId', async () => {
    const { default: api } = await import('./sites');
    const mockPages = [
      { id: '1', project_id: 'proj-1', slug: 'homepage', type: 'homepage', title: 'Home', body: '<p>Body</p>', faq: '[]', meta: '{}', created_at: '2026-01-01' }
    ];
    const mockDB = {
      prepare: () => ({
        bind: () => ({ all: async () => ({ results: mockPages }) }),
        all: async () => ({ results: mockPages }),
      }),
    };
    const res = await api.request('/proj-1/pages', {
      method: 'GET',
    }, { DB: mockDB as any });
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.pages).toBeDefined();
    expect(Array.isArray(json.pages)).toBe(true);
  });

  it('deve restituire 404 quando non esistono righe per projectId', async () => {
    const { default: api } = await import('./sites');
    const mockDB = {
      prepare: () => ({
        bind: () => ({ all: async () => ({ results: [] }) }),
        all: async () => ({ results: [] }),
      }),
    };
    const res = await api.request('/proj-unknown/pages', {
      method: 'GET',
    }, { DB: mockDB as any });
    expect(res.status).toBe(404);
    const json = await res.json() as any;
    expect(json.error).toBeDefined();
  });
});
