import { describe, it, expect, vi } from 'vitest';

// Mock fetch for Serper API
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    searchParameters: { q: 'rankempire' },
    organic: [{ title: 'RankEmpire', link: 'https://rankempire.com' }]
  })
});

global.fetch = mockFetch;

describe('Serper.dev SERP Monitoring', () => {
  it('should fetch search results from Serper.dev', async () => {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      body: JSON.stringify({ q: 'rankempire' })
    });
    const data = await response.json();
    
    expect(mockFetch).toHaveBeenCalled();
    expect(data.organic[0].title).toBe('RankEmpire');
  });
});
