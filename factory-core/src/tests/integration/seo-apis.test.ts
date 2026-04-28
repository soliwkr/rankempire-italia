import { describe, it, expect, vi } from 'vitest';
import { createGA4Property } from '../../services/google-analytics';
import { verifyDomain } from '../../services/search-console';

// Mock googleapis
vi.mock('googleapis', () => {
  return {
    google: {
      analyticsadmin: () => ({
        properties: {
          create: vi.fn().mockResolvedValue({ data: { name: 'properties/12345' } }),
        },
      }),
      searchconsole: () => ({
        sites: {
          get: vi.fn().mockResolvedValue({ data: { siteUrl: 'http://example.com' } }),
        },
      }),
    },
  };
});

describe('SEO Automation API Integration', () => {
  it('should call GA4 Admin API to create a property', async () => {
    const result = await createGA4Property('test-project');
    expect(result).toBeDefined();
  });

  it('should call GSC API to verify domain', async () => {
    const result = await verifyDomain('example.com');
    expect(result).toBe(true);
  });
});
