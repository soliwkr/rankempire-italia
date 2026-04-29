import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { renters } from '../db/schema';
import { AuthUtils } from '../services/auth-utils';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const auth = new Hono<{ Bindings: Bindings }>();

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  
  if (!email || !password) {
    return c.json({ error: 'Missing email or password' }, 400);
  }

  const db = drizzle(c.env.DB);
  const renter = await db.select()
    .from(renters)
    .where(eq(renters.email, email))
    .get();

  if (!renter) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const isValid = await AuthUtils.verifyPassword(password, renter.passwordHash);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await AuthUtils.signToken(
    { sub: renter.id, email: renter.email, role: 'renter' },
    c.env.JWT_SECRET
  );

  return c.json({
    token,
    renter: {
      id: renter.id,
      name: renter.name,
      email: renter.email
    }
  });
});

export default auth;
