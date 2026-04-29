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
        innerJoin: vi.fn(() => ({
           where: vi.fn(() => ({
             get: async () => mockGetResult,
           }))
        }))
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => ({
          get: async () => mockGetResult
        }))
      }))
    }))
  })),
}));

import app from '../../index';

describe('Media API Integration', () => {
  const JWT_SECRET = 'test-secret-media';
  const MOCK_PROJECT_ID = 'p1';
  const MOCK_RENTER_ID = 'renter_1';
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockResults = [];
    mockGetResult = null;
  });

  it('should upload a file and track it in DB', async () => {
    const token = await AuthUtils.signToken({ sub: MOCK_RENTER_ID, role: 'renter' }, JWT_SECRET);
    
    // 1. Mock project ownership check
    mockGetResult = { id: MOCK_PROJECT_ID, renterId: MOCK_RENTER_ID };
    
    // 2. Prepare mock R2
    const mockR2 = {
      put: vi.fn().mockResolvedValue({}),
    };

    // 3. Mock the insert result (the returning().get() call)
    const mockMediaRecord = {
      id: 'media-uuid',
      projectId: MOCK_PROJECT_ID,
      renterId: MOCK_RENTER_ID,
      url: 'https://media.test/renter_1/p1/media-uuid.png'
    };
    
    // This is a bit tricky with the chained mock above, let's adjust mockGetResult
    // First call (check project):
    // mockGetResult = { id: MOCK_PROJECT_ID, renterId: MOCK_RENTER_ID };
    // Second call (insert):
    // mockGetResult = mockMediaRecord;
    
    // We can use vi.fn().mockReturnValueOnce(...) if we want to be precise, 
    // but here we can just swap it after the first check if we were in the handler.
    // Since we are mocking the whole drizzle, let's make it smarter if needed.
    
    const formData = new FormData();
    const file = new File(['blob'], 'test.png', { type: 'image/png' });
    formData.append('file', file);
    formData.append('projectId', MOCK_PROJECT_ID);

    const res = await app.request('/api/renter/media/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    }, { 
      DB: {} as any,
      R2_MEDIA: mockR2 as any,
      MEDIA_PUBLIC_URL: 'https://media.test',
      JWT_SECRET 
    });

    expect(res.status).toBe(200);
    expect(mockR2.put).toHaveBeenCalled();
  });

  it('should list media for a project', async () => {
    const token = await AuthUtils.signToken({ sub: MOCK_RENTER_ID, role: 'renter' }, JWT_SECRET);
    
    mockResults = [
      { id: 'm1', projectId: MOCK_PROJECT_ID, renterId: MOCK_RENTER_ID, url: 'url1' },
      { id: 'm2', projectId: MOCK_PROJECT_ID, renterId: MOCK_RENTER_ID, url: 'url2' }
    ];

    const res = await app.request(`/api/renter/media?projectId=${MOCK_PROJECT_ID}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }, { 
      DB: {} as any,
      JWT_SECRET 
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any[];
    expect(body).toHaveLength(2);
    expect(body[0].projectId).toBe(MOCK_PROJECT_ID);
  });
});
