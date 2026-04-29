import { describe, it, expect } from 'vitest';
import { AuthUtils } from './auth-utils';

describe('AuthUtils', () => {
  describe('Password Hashing', () => {
    it('genera un hash diverso per la stessa password (grazie al salt)', async () => {
      const password = 'my-secret-password';
      const hash1 = await AuthUtils.hashPassword(password);
      const hash2 = await AuthUtils.hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(hash1).toContain(':');
      expect(hash2).toContain(':');
    });

    it('verifica correttamente una password valida', async () => {
      const password = 'my-secret-password';
      const hash = await AuthUtils.hashPassword(password);
      const isValid = await AuthUtils.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('rifiuta una password errata', async () => {
      const password = 'my-secret-password';
      const wrongPassword = 'wrong-password';
      const hash = await AuthUtils.hashPassword(password);
      const isValid = await AuthUtils.verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('gestisce hash malformati senza crashare', async () => {
      const isValid = await AuthUtils.verifyPassword('password', 'malformed-hash');
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    const secret = 'test-secret-key';
    const payload = { userId: '123', role: 'renter' };

    it('firma e verifica correttamente un token', async () => {
      const token = await AuthUtils.signToken(payload, secret);
      const decoded = await AuthUtils.verifyToken(token, secret);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.exp).toBeDefined();
    });

    it('rifiuta un token con secret errato', async () => {
      const token = await AuthUtils.signToken(payload, secret);
      const decoded = await AuthUtils.verifyToken(token, 'wrong-secret');

      expect(decoded).toBeNull();
    });

    it('rifiuta un token malformato', async () => {
      const decoded = await AuthUtils.verifyToken('invalid.token.here', secret);
      expect(decoded).toBeNull();
    });

    it('rispetta la data di scadenza (mocking non necessario per test base)', async () => {
        // Scadenza passata
        const pastExp = Math.floor(Date.now() / 1000) - 10;
        const token = await AuthUtils.signToken(payload, secret, pastExp);
        const decoded = await AuthUtils.verifyToken(token, secret);
        
        expect(decoded).toBeNull();
    });
  });
});
