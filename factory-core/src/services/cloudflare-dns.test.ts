import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudflareDNSService } from './cloudflare-dns';

function mockResponse(status: number, body: any = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('CloudflareDNSService', () => {
  let service: CloudflareDNSService;

  beforeEach(() => {
    service = new CloudflareDNSService({
      apiToken: 'test-cf-token',
      accountId: 'test-account-id',
    });
    vi.restoreAllMocks();
  });

  describe('getZoneId', () => {
    it('chiama GET /zones?name={domain}', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        mockResponse(200, { result: [{ id: 'zone-123' }], success: true })
      );

      const zoneId = await service.getZoneId('example.com');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('api.cloudflare.com/client/v4/zones?name=example.com'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(zoneId).toBe('zone-123');
    });

    it('lancia errore se la zona non viene trovata', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        mockResponse(200, { result: [], success: true })
      );

      await expect(service.getZoneId('nonexistent.com')).rejects.toThrow('Zone not found for domain: nonexistent.com');
    });
  });

  describe('createCnameRecord', () => {
    it('chiama POST /zones/{zoneId}/dns_records', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        mockResponse(200, { result: { id: 'record-456' }, success: true })
      );

      await service.createCnameRecord('zone-123', 'www', 'rr-test.pages.dev');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('api.cloudflare.com/client/v4/zones/zone-123/dns_records'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            type: 'CNAME',
            name: 'www',
            content: 'rr-test.pages.dev',
            proxied: true,
            ttl: 1
          })
        })
      );
    });

    it('gestisce errore 409 (record già esistente) in modo grazioso o lo lancia', async () => {
       // Per ora lo lanciamo, l'idempotenza la gestiamo nell'api handler
       vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        mockResponse(409, { errors: [{ message: 'Record already exists' }] })
      );

      await expect(service.createCnameRecord('zone-123', 'www', 'content'))
        .rejects.toThrow(/Cloudflare DNS API error: 409/);
    });
  });
});
