import { describe, it, expect, beforeEach, vi } from 'vitest';
import app from '../../index';
import { AuthUtils } from '../../services/auth-utils';
import { drizzle } from 'drizzle-orm/d1';

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(),
}));

describe('CMS Flow E2E Verification', () => {
  let renterToken: string;
  const renterId = 'renter-123';
  const projectId = 'project-456';
  const pageId = 'page-789';

  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    all: vi.fn(),
    get: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };

  const ENV = {
    DB: {} as any,
    R2_MEDIA: {
        put: vi.fn().mockResolvedValue({}),
    } as any,
    MEDIA_PUBLIC_URL: 'https://media.test.com',
    JWT_SECRET: 'test-secret',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    renterToken = await AuthUtils.signToken({ sub: renterId, role: 'renter' }, ENV.JWT_SECRET);
    (drizzle as any).mockReturnValue(mockDb);
  });

  it('verifies the full CMS flow: upload media -> edit page -> verify public fetch', async () => {
    // 1. Upload Media
    mockDb.get.mockResolvedValueOnce({ id: projectId, renterId }); // Project ownership check
    mockDb.get.mockResolvedValueOnce({ id: 'media-1', url: 'https://media.test.com/renter-123/project-456/media-1.png' }); // Return media after insert

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('file', new Blob(['fake content'], { type: 'image/png' }), 'test.png');

    const uploadRes = await app.request('/api/renter/media/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${renterToken}` },
      body: formData,
    }, ENV);

    expect(uploadRes.status).toBe(200);
    const media = await uploadRes.json() as any;
    expect(media.url).toContain('https://media.test.com/renter-123/project-456/');

    // 2. Edit Page (incorporating the new media URL in the body)
    mockDb.get.mockResolvedValueOnce({ id: pageId }); // Ownership check for patch
    const updatedBody = `<p>Check out our image: <img src="${media.url}" /></p>`;
    mockDb.get.mockResolvedValueOnce({ id: pageId, title: 'Updated Title', body: updatedBody }); // Return updated page

    const patchRes = await app.request(`/api/renter/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${renterToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Updated Title',
        body: updatedBody,
      }),
    }, ENV);

    expect(patchRes.status).toBe(200);
    const page = await patchRes.json() as any;
    expect(page.title).toBe('Updated Title');
    expect(page.body).toContain(media.url);

    // 3. Verify Public Fetch (simulating Astro SSR fetch)
    mockDb.all.mockResolvedValueOnce([
        { id: pageId, projectId, title: 'Updated Title', body: updatedBody, slug: 'home', type: 'homepage' }
    ]);

    const publicRes = await app.request(`/api/sites/${projectId}/pages`, {}, ENV);
    expect(publicRes.status).toBe(200);
    const publicData = await publicRes.json() as any;
    expect(publicData.pages).toHaveLength(1);
    expect(publicData.pages[0].title).toBe('Updated Title');
    expect(publicData.pages[0].body).toContain(media.url);
  });

  it('validates batch generation and specific slug lookups', async () => {
    // 1. Simulate Batch Generation
    mockDb.get.mockResolvedValueOnce({ 
      id: projectId, 
      niche: 'Plumbing', 
      location: 'Milan' 
    }); // Project lookup in BatchGenerator.generateAll

    // Mock successful fetch for callGemini (homepage)
    const mockPages = [
      { slug: 'home', type: 'homepage', title: 'Home', body: 'Body', faq: [], meta: {} }
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: { parts: [{ text: JSON.stringify(mockPages) }] },
          finishReason: 'STOP'
        }]
      })
    } as any);

    const batchRes = await app.request(`/api/generate/batch/${projectId}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-secret'
      },
      body: JSON.stringify({
        services: [], // Keep it simple to only trigger homepage
        zones: []
      }),
    }, { ...ENV, GOOGLE_AI_API_KEY: 'test-key', API_SECRET: 'test-secret' });

    expect(batchRes.status).toBe(200);
    const batchData = await batchRes.json() as any;
    expect(batchData.success).toBe(true);
    expect(batchData.data.homepage).toBe(1);

    // 2. Specific Slug Lookup (SSR style)
    mockDb.all.mockResolvedValueOnce([
      { 
        id: 'p2', 
        slug: 'service-a-city-b', 
        title: 'Service A in City B',
        projectId
      }
    ]);

    const slugRes = await app.request(`/api/sites/${projectId}/pages?slug=service-a-city-b`, {}, ENV);
    expect(slugRes.status).toBe(200);
    const slugData = await slugRes.json() as any;
    expect(slugData.pages).toBeDefined();
  });

  it('ensures public API does not leak sensitive renter data', async () => {
    mockDb.all.mockResolvedValueOnce([
      { 
        id: pageId, 
        projectId, 
        slug: 'public-slug',
        type: 'service',
        title: 'Public Title', 
        body: 'Public Body',
        faq: '[]',
        meta: '{}',
        createdAt: new Date().toISOString()
      }
    ]);

    const res = await app.request(`/api/sites/${projectId}/pages`, {}, ENV);
    const data = await res.json() as any;
    
    const firstPage = data.pages[0];
    expect(firstPage).toHaveProperty('title');
    expect(firstPage).toHaveProperty('body');
    
    // We explicitly check that NO extra fields are present beyond the schema
    const allowedKeys = ['id', 'projectId', 'slug', 'type', 'title', 'body', 'faq', 'meta', 'createdAt'];
    const keys = Object.keys(firstPage);
    keys.forEach(key => {
      expect(allowedKeys).toContain(key);
    });
    
    // Specifically check for renter-related or config-related leaks
    expect(firstPage.renterId).toBeUndefined();
    expect(firstPage.configJson).toBeUndefined();
  });
});
