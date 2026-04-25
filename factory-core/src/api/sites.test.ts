import { describe, it, expect } from 'vitest';

// Test 1: schema.ts deve avere la tabella pages con tutti i campi richiesti
describe('pages table schema', () => {
  it('deve esportare la tabella pages', async () => {
    const schema = await import('../db/schema');
    expect(schema.pages).toBeDefined();
  });

  it('deve avere tutti i 9 campi richiesti da D-05', async () => {
    const schema = await import('../db/schema');
    // Le colonne Drizzle sono accessibili direttamente come proprietà della tabella
    const tbl = schema.pages as any;
    expect(tbl).toBeDefined();
    // Verifica nome colonna DB per ogni campo richiesto
    expect(tbl.id.name).toBe('id');
    expect(tbl.projectId.name).toBe('project_id');
    expect(tbl.slug.name).toBe('slug');
    expect(tbl.type.name).toBe('type');
    expect(tbl.title.name).toBe('title');
    expect(tbl.body.name).toBe('body');
    expect(tbl.faq.name).toBe('faq');
    expect(tbl.meta.name).toBe('meta');
    expect(tbl.createdAt.name).toBe('created_at');
  });

  it('faq deve avere default "[]"', async () => {
    const schema = await import('../db/schema');
    const tbl = schema.pages as any;
    expect(tbl.faq.default).toBe('[]');
  });

  it('meta deve avere default "{}"', async () => {
    const schema = await import('../db/schema');
    const tbl = schema.pages as any;
    expect(tbl.meta.default).toBe('{}');
  });
});

// Helper: crea un mock D1Database compatibile con drizzle-orm/d1
// drizzle usa stmt.bind(...params).raw() per le query con fields (SELECT standard)
// raw() restituisce array di array, nell'ordine delle colonne della SELECT
function makeMockD1(rowsAsObjects: Record<string, unknown>[]) {
  // Ordine colonne come nella SELECT di Drizzle per la tabella pages
  const colOrder = ['id', 'project_id', 'slug', 'type', 'title', 'body', 'faq', 'meta', 'created_at'];
  const rawRows = rowsAsObjects.map(row => colOrder.map(col => row[col] ?? null));
  return {
    prepare: () => ({
      bind: () => ({
        raw: async () => rawRows,
        all: async () => ({ results: rowsAsObjects }),
      }),
      all: async () => ({ results: rowsAsObjects }),
    }),
  };
}

// Test 3 & 4: sites.ts router Hono
describe('GET /:projectId/pages', () => {
  it('deve restituire { pages: [] } quando il DB ha righe per projectId', async () => {
    const { default: api } = await import('./sites');
    const mockPages = [
      { id: '1', project_id: 'proj-1', slug: 'homepage', type: 'homepage', title: 'Home', body: '<p>Body</p>', faq: '[]', meta: '{}', created_at: '2026-01-01' }
    ];
    const mockDB = makeMockD1(mockPages);
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
    const mockDB = makeMockD1([]);
    const res = await api.request('/proj-unknown/pages', {
      method: 'GET',
    }, { DB: mockDB as any });
    expect(res.status).toBe(404);
    const json = await res.json() as any;
    expect(json.error).toBeDefined();
  });
});
