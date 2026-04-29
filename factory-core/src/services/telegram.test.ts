import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelegramService } from './telegram';

describe('TelegramService', () => {
  const config = {
    botToken: 'test-token',
    chatId: 'test-chat-id',
  };

  let service: TelegramService;

  beforeEach(() => {
    service = new TelegramService(config);
    // Reset global fetch mock
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should send a message via Telegram API', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ ok: true }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as any);

    await service.sendMessage('Hello World');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: 'test-chat-id',
          text: 'Hello World',
          parse_mode: 'HTML',
        }),
      })
    );
  });

  it('should throw error if Telegram API fails', async () => {
    const mockResponse = { 
      ok: false, 
      status: 400, 
      text: () => Promise.resolve('Bad Request') 
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as any);

    await expect(service.sendMessage('Hello World')).rejects.toThrow('Telegram API error: 400 Bad Request');
  });

  it('should format lead verification message correctly', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ ok: true }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as any);

    const lead = {
      email: 'lead@example.com',
      projectName: 'RankEmpire',
      avatar: 'Agent X'
    };

    await service.notifyLeadVerified(lead);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('lead@example.com'),
      })
    );
    
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as any).body);
    expect(body.text).toContain('Nuovo Lead Verificato');
    expect(body.text).toContain('lead@example.com');
    expect(body.text).toContain('RankEmpire');
    expect(body.text).toContain('Agent X');
  });

  it('should format lead verification message without avatar', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ ok: true }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as any);

    const lead = {
      email: 'lead@example.com',
      projectName: 'RankEmpire'
    };

    await service.notifyLeadVerified(lead);
    
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as any).body);
    expect(body.text).not.toContain('Avatar:');
  });

  it('should format proof ready message correctly', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ ok: true }) };
    vi.mocked(fetch).mockResolvedValue(mockResponse as any);

    const project = {
      name: 'RankEmpire IT',
      url: 'https://rankempire.it'
    };

    await service.notifyProofReady(project);

    expect(fetch).toHaveBeenCalled();
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as any).body);
    expect(body.text).toContain('Proof Package Pronto');
    expect(body.text).toContain('RankEmpire IT');
    expect(body.text).toContain('https://rankempire.it');
  });
});
