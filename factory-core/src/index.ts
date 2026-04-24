import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import leadsApi from './api/leads';
import projectsApi from './api/projects';
import generateApi from './api/generate';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  GITHUB_TOKEN: string;
  GOOGLE_AI_API_KEY: string;
  CF_ACCOUNT_ID: string;
  CF_AI_GATEWAY_NAME: string;
  CF_AI_GATEWAY_TOKEN: string;
  EMAIL_FROM: string;
  RESEND_API_KEY: string;
  API_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (c) => c.text('OK'));

// Endpoint pubblici — nessun auth richiesto
app.route('/api/leads', leadsApi);

// Endpoint protetti — Bearer token richiesto
const protectedApp = new Hono<{ Bindings: Bindings }>();
protectedApp.use('/*', (c, next) => bearerAuth({ token: c.env.API_SECRET })(c, next));
protectedApp.route('/api/projects', projectsApi);
protectedApp.route('/api/generate', generateApi);

app.route('/', protectedApp);

export default app;
