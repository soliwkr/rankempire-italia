import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { leads, projects } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { GitHubService } from '../services/github';
import { EmailService } from '../services/email';
import { TelegramService } from '../services/telegram';
import { z } from 'zod';

const leadSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone format'),
  message: z.string().optional(),
  project_name: z.string().optional(),
  avatar: z.enum(['A', 'B', 'C', 'D']).optional(),
  website_url: z.string().optional(), // Honeypot
});

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  VERIFICATION_BASE_URL: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
};

const api = new Hono<{ Bindings: Bindings }>();

api.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const projectSlug = c.req.query('project_slug');

  const baseQuery = db
    .select({
      id: leads.id,
      name: leads.name,
      phone: leads.phone,
      email: leads.email,
      message: leads.message,
      status: leads.status,
      doiStatus: leads.doiStatus,
      createdAt: leads.createdAt,
      projectSlug: projects.slug,
      projectName: projects.name,
    })
    .from(leads)
    .leftJoin(projects, eq(leads.projectId, projects.id))
    .orderBy(desc(leads.createdAt))
    .limit(limit);

  const rows = projectSlug
    ? await baseQuery.where(eq(projects.slug, projectSlug)).all()
    : await baseQuery.all();

  return c.json(rows);
});

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

  const { project_id, name, email, phone, message, project_name, avatar } = validation.data;
  
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
    avatar: avatar,
  });

  const emailService = new EmailService({ apiKey: c.env.RESEND_API_KEY, from: c.env.EMAIL_FROM, verificationBaseUrl: c.env.VERIFICATION_BASE_URL });
  await emailService.sendVerificationEmail(email, token, project_name || 'Rank & Rent Project');

  return c.json({ success: true, id: leadId }, 201);
});

api.get('/verify', async (c) => {
  const db = drizzle(c.env.DB);
  const token = c.req.query('token');

  if (!token) return c.text('Missing token', 400);

  const result = await db.select({
    id: leads.id,
    email: leads.email,
    avatar: leads.avatar,
    projectName: projects.name,
  })
  .from(leads)
  .innerJoin(projects, eq(leads.projectId, projects.id))
  .where(eq(leads.verificationToken, token))
  .get();

  if (!result) return c.text('Invalid token', 404);

  await db.update(leads)
    .set({ doiStatus: 'verified', status: 'active' })
    .where(eq(leads.id, result.id))
    .run();

  // Trigger Telegram Notification
  if (c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_CHAT_ID) {
    const telegram = new TelegramService({
      botToken: c.env.TELEGRAM_BOT_TOKEN,
      chatId: c.env.TELEGRAM_CHAT_ID
    });
    
    try {
      await telegram.notifyLeadVerified({
        email: result.email!,
        projectName: result.projectName,
        avatar: result.avatar || undefined
      });
    } catch (e) {
      console.error('Failed to send Telegram notification:', e);
    }
  }

  return c.text('Email verificata con successo!');
});

export default api;
