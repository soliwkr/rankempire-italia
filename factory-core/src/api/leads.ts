import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { leads } from '../db/schema';
import { eq } from 'drizzle-orm';
import { GitHubService } from '../services/github';
import { EmailService } from '../services/email';
import { z } from 'zod';

const leadSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone format'),
  message: z.string().optional(),
  project_name: z.string().optional(),
  website_url: z.string().optional(), // Honeypot
});

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  VERIFICATION_BASE_URL: string;
};

const api = new Hono<{ Bindings: Bindings }>();

api.post('/', async (c) => {
  const body = await c.req.json();

  // 1. Honeypot check
  if (body.website_url) {
    return c.json({ success: true, message: 'Message received' }, 201); // Silent success
  }

  // 2. Data validation
  const validation = leadSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ success: false, errors: validation.error.errors }, 400);
  }

  const { project_id, name, email, phone, message, project_name } = validation.data;
  
  const db = drizzle(c.env.DB);
  const leadId = crypto.randomUUID();
  const token = crypto.randomUUID();
  
  await db.insert(leads).values({
    id: leadId,
    projectId: project_id,
    name: name,
    email: email,
    phone: phone,
    message: message,
    status: 'pending',
    doiStatus: 'pending',
    verificationToken: token,
  });

  const emailService = new EmailService({ apiKey: c.env.RESEND_API_KEY, from: c.env.EMAIL_FROM });
  await emailService.sendVerificationEmail(email, token, project_name || 'Rank & Rent Project');

  return c.json({ success: true, id: leadId }, 201);
});

api.get('/verify', async (c) => {
  const db = drizzle(c.env.DB);
  const token = c.req.query('token');

  if (!token) return c.text('Missing token', 400);

  const result = await db.update(leads)
    .set({ doiStatus: 'verified', status: 'active' })
    .where(eq(leads.verificationToken, token))
    .returning();

  if (result.length === 0) return c.text('Invalid token', 404);

  return c.text('Email verificata con successo!');
});

export default api;
