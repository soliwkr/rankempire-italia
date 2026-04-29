import { sign, verify } from 'hono/jwt';

/**
 * Utility per la gestione dell'autenticazione basata su Web Crypto e Hono JWT.
 * Fornisce metodi per l'hashing delle password e la gestione dei token JWT.
 */
export class AuthUtils {
  private static readonly HASH_ALGORITHM = 'SHA-256';
  private static readonly ITERATIONS = 100000;

  /**
   * Genera un hash di una password utilizzando PBKDF2 e Web Crypto.
   * Restituisce una stringa formattata "salt:hash" in esadecimale.
   */
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: this.HASH_ALGORITHM,
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
    const hashBuffer = new Uint8Array(exportedKey);

    return `${this.toHex(salt)}:${this.toHex(hashBuffer)}`;
  }

  /**
   * Verifica se una password corrisponde all'hash memorizzato.
   */
  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;

    const encoder = new TextEncoder();
    const salt = this.fromHex(saltHex);
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: this.HASH_ALGORITHM,
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
    const hashBuffer = new Uint8Array(exportedKey);

    return this.toHex(hashBuffer) === hashHex;
  }

  /**
   * Firma un payload JWT.
   */
  static async signToken(payload: any, secret: string, expiresAt?: number): Promise<string> {
    const jwtPayload = {
      ...payload,
      exp: expiresAt || Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // Default 1 settimana
    };
    return await sign(jwtPayload, secret, 'HS256');
  }

  /**
   * Verifica un token JWT.
   */
  static async verifyToken(token: string, secret: string): Promise<any> {
    try {
      return await verify(token, secret, 'HS256');
    } catch (e) {
      return null;
    }
  }

  private static toHex(buffer: Uint8Array): string {
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static fromHex(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}
