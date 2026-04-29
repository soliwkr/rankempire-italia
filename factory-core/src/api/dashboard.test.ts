import { describe, it, expect, vi } from 'vitest';

// Mock drizzle-orm/d1
vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn((table) => ({
        all: async () => {
          // Nota: table è un oggetto schema di drizzle, non una stringa
          // Ma in questo mock semplificato cercheremo di capire quale tabella è
          return [{ value: 0 }];
        },
      })),
    })),
  })),
}));

import api from './dashboard';

describe('GET /api/dashboard/stats', () => {
  it('dovrebbe ritornare le statistiche aggregate', async () => {
    const { drizzle } = await import('drizzle-orm/d1');
    const mockSelect = vi.fn();
    (drizzle as any).mockReturnValue({
      select: mockSelect
    });

    // Mock della prima chiamata (projects)
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        all: async () => [{ value: 10 }]
      })
    });

    // Mock della seconda chiamata (leads)
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValueOnce({
        all: async () => [{ value: 50 }]
      })
    });

    const res = await api.request('/stats', {
      method: 'GET',
    }, { DB: {} as any } as any);

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.totalProjects).toBe(10);
    expect(body.totalLeads).toBe(50);
  });

  it('dovrebbe gestire errori del database', async () => {
    const { drizzle } = await import('drizzle-orm/d1');
    (drizzle as any).mockReturnValue({
      select: () => { throw new Error('DB Error'); }
    });

    const res = await api.request('/stats', {
      method: 'GET',
    }, { DB: {} as any } as any);

    expect(res.status).toBe(500);
    const body = await res.json() as any;
    expect(body.error).toBe('Failed to fetch dashboard stats');
  });
});
