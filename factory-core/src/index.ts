import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import authApi from './api/auth';
import leadsApi from './api/leads';
import sitesApi from './api/sites';
import projectsApi from './api/projects';
import dashboardApi from './api/dashboard';
import generateApi from './api/generate';
import seedApi from './api/seed';
import { renterAuth } from './middleware/renter-auth';
import renterProjectsApi from './api/renter/projects';
import renterPagesApi from './api/renter/pages';
import renterMediaApi from './api/renter/media';

type Bindings = {
  DB: D1Database;
  R2_MEDIA: R2Bucket;
  MEDIA_PUBLIC_URL: string;
  KV: KVNamespace;
  GITHUB_TOKEN: string;
  GOOGLE_AI_API_KEY: string;
  CF_ACCOUNT_ID: string;
  GITHUB_TEMPLATE_OWNER: string;
  GITHUB_TEMPLATE_REPO: string;
  CF_API_TOKEN: string;
  FACTORY_API_URL: string;
  CF_AI_GATEWAY_NAME: string;
  CF_AI_GATEWAY_TOKEN: string;
  EMAIL_FROM: string;
  RESEND_API_KEY: string;
  API_SECRET: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (c) => c.text('OK'));

// Endpoint pubblici — nessun auth richiesto
app.route('/api/auth', authApi);
app.route('/api/leads', leadsApi);
app.route('/api/sites', sitesApi); // Contenuto siti: pubblico per design (SEO, fetch Astro build time)

// Area Renter — Autenticazione basata su JWT
const renterApp = new Hono<{ Bindings: Bindings }>();
renterApp.use('/*', renterAuth);
renterApp.route('/projects', renterProjectsApi);
renterApp.route('/pages', renterPagesApi);
renterApp.route('/media', renterMediaApi);

app.route('/api/renter', renterApp);

// Endpoint protetti Factory (Master Admin) — Bearer token statico richiesto
const protectedApp = new Hono<{ Bindings: Bindings }>();
protectedApp.use('/*', async (c, next) => { return bearerAuth({ token: c.env.API_SECRET })(c, next); });
protectedApp.route('/api/dashboard', dashboardApi);
protectedApp.route('/api/projects', projectsApi);
protectedApp.route('/api/generate', generateApi);
protectedApp.route('/api/generate', seedApi);

app.route('/', protectedApp);

export default app;
