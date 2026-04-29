import { createMiddleware } from 'hono/factory';
import { AuthUtils } from '../services/auth-utils';

type Bindings = {
  JWT_SECRET: string;
};

export const renterAuth = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const payload = await AuthUtils.verifyToken(token, c.env.JWT_SECRET);

  if (!payload || payload.role !== 'renter') {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Aggiunge l'ID del renter al contesto per l'uso nei controller
  c.set('renterId', payload.sub);
  
  await next();
});
