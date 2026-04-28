import { describe, it, expect, vi } from 'vitest';
import { app } from '../../index'; // Assuming index exports the app

describe('Auth Integrity', () => {
  it('should return 401 for unauthorized requests', async () => {
    const res = await app.request('/api/projects');
    expect(res.status).toBe(401);
  });
});
