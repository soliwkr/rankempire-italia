import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudflarePagesService } from './cloudflare-pages';

// Helper per creare una risposta fetch mock
function mockResponse(status: number, body: any = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('CloudflarePagesService — createProject', () => {
  let service: CloudflarePagesService;

  beforeEach(() => {
    service = new CloudflarePagesService({
      apiToken: 'test-cf-token',
      accountId: 'test-account-id',
    });
    vi.restoreAllMocks();
  });

  it('chiama POST /accounts/{accountId}/pages/projects con metodo POST', async () => {
    const cfResult = { name: 'rr-idraulico-roma', subdomain: 'rr-idraulico-roma' };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      mockResponse(200, { result: cfResult, success: true, errors: [] })
    );

    await service.createProject('idraulico-roma', 'myorg', 'rr-idraulico-roma', 'https://factory.example.com');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('api.cloudflare.com/client/v4/accounts/test-account-id/pages/projects');
    expect((init as RequestInit).method).toBe('POST');
  });

  it('include header Authorization: Bearer {apiToken}', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      mockResponse(200, { result: { name: 'rr-test', subdomain: 'rr-test' }, success: true, errors: [] })
    );

    await service.createProject('test', 'owner', 'rr-test', 'https://factory.example.com');

    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-cf-token');
  });

  it('costruisce payload con name: rr-{slug}', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      mockResponse(200, { result: { name: 'rr-idraulico', subdomain: 'rr-idraulico' }, success: true, errors: [] })
    );

    await service.createProject('idraulico', 'myorg', 'rr-idraulico', 'https://factory.example.com');

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.name).toBe('rr-idraulico');
  });

  it('costruisce payload con build_config corretto (D-04)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      mockResponse(200, { result: { name: 'rr-test', subdomain: 'rr-test' }, success: true, errors: [] })
    );

    await service.createProject('test', 'owner', 'rr-test', 'https://factory.example.com');

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.build_config.build_command).toBe('npm run build');
    expect(body.build_config.destination_dir).toBe('dist');
    expect(body.build_config.root_dir).toBe('');
  });

  it('costruisce payload con source.type: "github" e config owner/repo/branch (D-03)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      mockResponse(200, { result: { name: 'rr-test', subdomain: 'rr-test' }, success: true, errors: [] })
    );

    await service.createProject('test', 'myorg', 'rr-test', 'https://factory.example.com');

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.source.type).toBe('github');
    expect(body.source.config.owner).toBe('myorg');
    expect(body.source.config.repo_name).toBe('rr-test');
    expect(body.source.config.production_branch).toBe('main');
  });

  it('include FACTORY_API_URL in deployment_configs.production.env_vars (D-03)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      mockResponse(200, { result: { name: 'rr-test', subdomain: 'rr-test' }, success: true, errors: [] })
    );

    await service.createProject('test', 'owner', 'rr-test', 'https://factory.example.com');

    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.deployment_configs.production.env_vars.FACTORY_API_URL.value).toBe('https://factory.example.com');
  });

  it('restituisce result.result (unwrap wrapper CF API)', async () => {
    const cfResult = { name: 'rr-idraulico', subdomain: 'rr-idraulico' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      mockResponse(200, { result: cfResult, success: true, errors: [] })
    );

    const result = await service.createProject('idraulico', 'owner', 'rr-idraulico', 'https://factory.example.com');

    expect(result).toEqual(cfResult);
  });

  it('lancia Error con status code se la risposta non è ok (T-04-03-01: token non incluso)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('{"errors":["Permission denied"]}', { status: 403 })
    );

    await expect(
      service.createProject('test', 'owner', 'rr-test', 'https://factory.example.com')
    ).rejects.toThrow(/Cloudflare Pages API error: 403/);

    // Verifica che il token NON sia nel messaggio di errore (T-04-03-01)
    try {
      await service.createProject('test', 'owner', 'rr-test', 'https://factory.example.com');
    } catch (e: any) {
      expect(e.message).not.toContain('test-cf-token');
    }
  });
});
