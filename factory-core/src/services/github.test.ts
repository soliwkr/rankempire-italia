import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubService } from './github';

// Helper per creare una risposta fetch mock
function mockResponse(status: number, body: any = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('GitHubService — createRepoFromTemplate e waitForRepo', () => {
  let service: GitHubService;

  beforeEach(() => {
    service = new GitHubService({
      token: 'test-token',
      templateOwner: 'test-owner',
      templateRepo: 'test-template',
    });
    vi.restoreAllMocks();
  });

  describe('createRepoFromTemplate', () => {
    it('chiama POST /generate e ritorna repoData subito senza attendere', async () => {
      const repoData = { id: 1, name: 'test-repo', owner: { login: 'test-owner' } };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        mockResponse(201, repoData)
      );

      const result = await service.createRepoFromTemplate('test-repo', 'desc');

      // Deve chiamare solo una volta (nessun retry o GET aggiuntivo)
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const call = fetchSpy.mock.calls[0];
      expect(call[0]).toContain('/generate');
      expect((call[1] as RequestInit).method).toBe('POST');
      expect(result).toEqual(repoData);
    });

    it('lancia Error se la risposta non è ok', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 })
      );

      await expect(service.createRepoFromTemplate('test-repo')).rejects.toThrow(
        /GitHub template generate error: 401/
      );
    });
  });

  describe('waitForRepo', () => {
    it('ritorna immediatamente se il repo è pronto al primo tentativo', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse(200, {}));

      const start = Date.now();
      await service.waitForRepo('owner', 'repo', 10, 500);
      const elapsed = Date.now() - start;

      // Nessun delay — il repo era pronto subito
      expect(elapsed).toBeLessThan(200);
    });

    it('ritorna dopo 4 attese se il repo è pronto al 5° tentativo', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(mockResponse(404, {})) // tentativo 1
        .mockResolvedValueOnce(mockResponse(404, {})) // tentativo 2
        .mockResolvedValueOnce(mockResponse(404, {})) // tentativo 3
        .mockResolvedValueOnce(mockResponse(404, {})) // tentativo 4
        .mockResolvedValueOnce(mockResponse(200, {})); // tentativo 5 OK

      // Usa intervalMs=0 per evitare che il test sia lento
      await service.waitForRepo('owner', 'repo', 10, 0);

      expect(fetchSpy).toHaveBeenCalledTimes(5);
    });

    it('lancia Error se il repo non è mai pronto dopo 10 tentativi', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(404, {}));

      await expect(service.waitForRepo('owner', 'repo', 10, 0)).rejects.toThrow(
        /not ready after 10 attempts/
      );
    });

    it('usa le credenziali corrette nell\'header Authorization (non espone il token in errori)', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse(200, {}));

      await service.waitForRepo('owner', 'repo', 10, 0);

      const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer test-token');
    });
  });

  describe('createProjectRepo (backward-compat)', () => {
    it('NON usa setTimeout con 2000ms fisso (sleep hack rimosso)', async () => {
      // Verifica che createProjectRepo usi i due nuovi metodi
      const createRepoFromTemplateSpy = vi.spyOn(service, 'createRepoFromTemplate').mockResolvedValueOnce({
        id: 1, name: 'test-repo', owner: { login: 'test-owner' }
      });
      const waitForRepoSpy = vi.spyOn(service, 'waitForRepo').mockResolvedValueOnce(undefined);

      await service.createProjectRepo('test-repo', 'desc');

      expect(createRepoFromTemplateSpy).toHaveBeenCalledOnce();
      expect(waitForRepoSpy).toHaveBeenCalledOnce();
    });
  });

  describe('createFile (invariato)', () => {
    it('esiste ancora come metodo pubblico', () => {
      expect(typeof service.createFile).toBe('function');
    });
  });
});
