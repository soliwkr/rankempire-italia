import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { renterAuth } from '../middleware/renter-auth';
import { AuthUtils } from '../services/auth-utils';

describe('Renter Auth Middleware', () => {
  const secret = 'test-secret';
  
  it('should return 401 if Authorization header is missing', async () => {
    const app = new Hono<{ Bindings: { JWT_SECRET: string } }>();
    app.use('/*', renterAuth);
    app.get('/test', (c) => c.text('ok'));

    const res = await app.request('/test', {}, { JWT_SECRET: secret });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 if token is invalid', async () => {
    const app = new Hono<{ Bindings: { JWT_SECRET: string } }>();
    app.use('/*', renterAuth);
    app.get('/test', (c) => c.text('ok'));

    const res = await app.request('/test', {
      headers: { 'Authorization': 'Bearer invalid-token' }
    }, { JWT_SECRET: secret });
    
    expect(res.status).toBe(401);
  });

  it('should return 401 if role is not renter', async () => {
    const token = await AuthUtils.signToken({ sub: '123', role: 'admin' }, secret);
    const app = new Hono<{ Bindings: { JWT_SECRET: string } }>();
    app.use('/*', renterAuth);
    app.get('/test', (c) => c.text('ok'));

    const res = await app.request('/test', {
      headers: { 'Authorization': `Bearer ${token}` }
    }, { JWT_SECRET: secret });
    
    expect(res.status).toBe(401);
  });

  it('should call next and set renterId if token is valid', async () => {
    const token = await AuthUtils.signToken({ sub: 'renter_123', role: 'renter' }, secret);
    const app = new Hono<{ Bindings: { JWT_SECRET: string } }>();
    app.use('/*', renterAuth);
    app.get('/test', (c) => {
      const renterId = c.get('renterId');
      return c.json({ renterId });
    });

    const res = await app.request('/test', {
      headers: { 'Authorization': `Bearer ${token}` }
    }, { JWT_SECRET: secret });
    
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ renterId: 'renter_123' });
  });
});
