import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleTrackingService } from './google-tracking';
import { JWT } from 'google-auth-library';

vi.mock('google-auth-library', () => {
  const MockJWT = vi.fn(function() {
    return {
      request: vi.fn(),
    };
  });
  return {
    JWT: MockJWT,
  };
});

describe('GoogleTrackingService', () => {
  let service: GoogleTrackingService;
  const config = {
    clientEmail: 'test@example.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GoogleTrackingService(config);
  });

  it('should add a site to GSC', async () => {
    const mockRequest = vi.mocked(JWT).mock.results[0].value.request;
    mockRequest.mockResolvedValueOnce({ status: 204 });

    await service.addSiteToGSC('https://example.com');

    expect(mockRequest).toHaveBeenCalledWith({
      url: 'https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fexample.com',
      method: 'PUT',
    });
  });

  it('should throw error if GSC API fails', async () => {
    const mockRequest = vi.mocked(JWT).mock.results[0].value.request;
    mockRequest.mockResolvedValueOnce({ status: 400, data: { error: 'bad request' } });

    await expect(service.addSiteToGSC('https://example.com')).rejects.toThrow('GSC API error: 400 {"error":"bad request"}');
  });

  it('should setup GA4 and return measurement ID', async () => {
    const mockRequest = vi.mocked(JWT).mock.results[0].value.request;
    
    // Mock Property Creation
    mockRequest.mockResolvedValueOnce({
      status: 200,
      data: { name: 'properties/123' }
    });

    // Mock Stream Creation
    mockRequest.mockResolvedValueOnce({
      status: 200,
      data: { 
        webStreamData: { measurementId: 'G-TEST123' }
      }
    });

    const measurementId = await service.setupGA4('accounts/999', 'Test Property', 'https://example.com');

    expect(measurementId).toBe('G-TEST123');
    expect(mockRequest).toHaveBeenCalledTimes(2);
    
    // Check Property Creation Call
    expect(mockRequest).toHaveBeenNthCalledWith(1, {
      url: 'https://analyticsadmin.googleapis.com/v1beta/properties',
      method: 'POST',
      data: {
        parent: 'accounts/999',
        displayName: 'Test Property',
        timeZone: 'Europe/Rome',
        currencyCode: 'EUR',
      }
    });

    // Check Stream Creation Call
    expect(mockRequest).toHaveBeenNthCalledWith(2, {
      url: 'https://analyticsadmin.googleapis.com/v1beta/properties/123/webDataStreams',
      method: 'POST',
      data: {
        displayName: 'Web Stream',
        defaultUri: 'https://example.com',
      }
    });
  });
});
