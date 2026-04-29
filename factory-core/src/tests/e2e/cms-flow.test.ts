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
});
