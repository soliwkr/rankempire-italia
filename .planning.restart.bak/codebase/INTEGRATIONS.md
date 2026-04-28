# External Integrations

**Analysis Date:** 2026-04-24

## APIs & External Services

**AI / Generative:**
- Google Gemini AI (via `@google/genai` SDK) - Market intelligence, niche research, site content generation, PPL plan generation
  - SDK/Client: `@google/genai` in `src/services/gemini.ts`, `src/services/geminiScout.ts`
  - Auth: `GEMINI_API_KEY` env var
  - Models used: `gemini-3-flash-preview`, `gemini-3.1-pro-preview`
  - Tools enabled: `googleSearch` (grounded results)

- Cloudflare AI Gateway (proxied Gemini 2.5 Flash) - AI content generation for factory-core edge worker
  - Client: native `fetch` in `factory-core/src/services/ai.ts`
  - Endpoint: `https://gateway.ai.cloudflare.com/v1/{accountId}/{gatewayName}/google-ai-studio/v1beta/models/gemini-2.5-flash:generateContent`
  - Auth: `GOOGLE_AI_API_KEY` (x-goog-api-key header), optional `CF_AI_GATEWAY_TOKEN` (Bearer)
  - Config: `CF_ACCOUNT_ID`, `CF_AI_GATEWAY_NAME`, `CF_AI_GATEWAY_TOKEN` (Wrangler secrets)

- Google Vertex AI - AI integration for client-mgc-reparation sub-project
  - SDK/Client: `@google-cloud/vertexai` in `client-mgc-reparation/`
  - Auth: `GEMINI_API_KEY`

**Email:**
- Resend - Transactional email (double opt-in verification emails, Italian language)
  - Client: native `fetch` to `https://api.resend.com/emails` in `factory-core/src/services/email.ts`
  - Auth: `RESEND_API_KEY` (Wrangler secret)
  - Sender: configured via `EMAIL_FROM` env var (`Rankame <noreply@rankame.com>`)

**Source Control / CI:**
- GitHub API - Programmatic repository creation from templates for rank-and-rent site factory
  - Client: native `fetch` in `factory-core/src/services/github.ts`
  - Operations: `POST /repos/{owner}/{repo}/generate` (template fork), `PUT /repos/{owner}/{repo}/contents/{path}` (file creation)
  - Auth: `GITHUB_TOKEN` (Bearer, Wrangler secret)

**Analytics & Marketing:**
- Google Tag Manager - Conversion tracking for client-mgc-reparation
  - Container ID: `GTM-N7LN5XBL` (hardcoded in `client-mgc-reparation/constants.ts`)
  - Events: `generate_lead_contact`, `generate_lead_wizard`, `click_to_call`, `view_landing_page`, `generate_lead`

- Google Search Console - Automated site registration for new rank-and-rent properties
  - Client: `googleapis` (`webmasters v3`) in `server.ts`
  - Auth: Google service account JWT (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`)
  - Scope: `https://www.googleapis.com/auth/webmasters`

- Google Analytics 4 Admin - Automated GA4 property + web data stream creation
  - Client: `googleapis` (`analyticsadmin v1beta`) in `server.ts`
  - Auth: Google service account JWT (shared with GSC)
  - Scope: `https://www.googleapis.com/auth/analytics.edit`
  - Config: `GOOGLE_ANALYTICS_ACCOUNT_ID`

**Communications:**
- Meta WhatsApp Business API - Planned integration (env vars present, not yet implemented in source)
  - Auth: `META_WA_CLIENT_ID`, `META_WA_ACCESS_TOKEN`

- VoIP / Cloud Communications (Vonage / MessageBird / OpenVOIP) - Planned integration
  - Auth: `VOIP_API_KEY`, `VOIP_API_SECRET`

**Deployment:**
- Cloudflare Pages Deploy Hook - Triggers site deployment (stub endpoint in `server.ts` at `POST /api/deploy/cloudflare`)
  - Auth: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Data Storage

**Databases:**
- Firebase Firestore - Primary real-time database for root app (opportunities, sites, leads)
  - Project: `soliwkr` (Firebase project ID from `firebase-applet-config.json`)
  - Database ID: `ai-studio-54d0ce8d-6c36-4138-a9c7-40f9cb6e1d96`
  - Client: `firebase/firestore` SDK in `src/lib/firebase.ts`
  - Collections: `opportunities`, `sites`, `leads`
  - Rules: `firestore.rules` (auth-gated; leads allow public create)

- Cloudflare D1 (SQLite) - Relational database for factory-core edge worker
  - Database name: `factory-db`; local binding: `local-db`
  - Schema: `factory-core/src/db/schema.ts` (tables: `renters`, `projects`, `leads`, `factory_settings`)
  - ORM: Drizzle ORM with D1 driver (`drizzle-orm/d1`)
  - Migrations: `factory-core/migrations/` (3 migrations: 0000–0002)

**Key-Value Store:**
- Cloudflare KV - Session/cache storage for factory-core
  - Binding name: `KV`; namespace ID: `FACTORY_KV_ID` (from `wrangler.toml`)

**File Storage:**
- Google Drive - Planned upload target for generated proof PDFs (`server.ts` `/api/proof/generate` stub)
- Firebase Storage - Available (bucket: `soliwkr.firebasestorage.app`), not yet actively used in source

**Spreadsheets (Operational):**
- Google Sheets - Lead CRM log for client-mgc-reparation
  - Integration: Google Apps Script webhook (`client-mgc-reparation/google_apps_script_webhook.js`)
  - Sheet name: `Leads`
  - Triggered via: `doPost` (incoming HTTP POST from lead form)

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication (Google OAuth)
  - Implementation: `signInWithPopup` with `GoogleAuthProvider` in `src/lib/firebase.ts`
  - Exported helpers: `signInWithGoogle()`, `signOut()`
  - Firestore security rules enforce `request.auth != null` for data access

- Google Service Account (JWT) - Server-to-server auth for GSC and GA4 Admin APIs
  - Auth library: `google-auth-library` in `server.ts`
  - Credentials: `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` (or full JSON via `GOOGLE_SERVICE_ACCOUNT_JSON`)

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Datadog, or equivalent found)

**Logs:**
- `console.error` and `console.log` used throughout codebase
- Cloudflare Workers logs via Wrangler in development

## CI/CD & Deployment

**Hosting:**
- Root app: Google Cloud Run (inferred from `APP_URL` env var description in `.env.example`)
- factory-core: Cloudflare Workers (`wrangler deploy --minify`)
- client-mgc-reparation: Cloudflare Pages (deploy hook in `.env.example`)

**CI Pipeline:**
- Not detected (no GitHub Actions workflows, CircleCI, etc.)

## Environment Configuration

**Required env vars (root app):**
- `GEMINI_API_KEY`
- `APP_URL`
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- `META_WA_CLIENT_ID`, `META_WA_ACCESS_TOKEN`
- `VOIP_API_KEY`, `VOIP_API_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_JSON` (or `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`)
- `GOOGLE_ANALYTICS_ACCOUNT_ID`

**Required secrets (factory-core via Wrangler):**
- `RESEND_API_KEY`
- `GITHUB_TOKEN`
- `GOOGLE_AI_API_KEY`
- `CF_ACCOUNT_ID`, `CF_AI_GATEWAY_NAME`, `CF_AI_GATEWAY_TOKEN`

**Secrets location:**
- Root app: `.env` file (gitignored; `.env.example` present at project root)
- factory-core: `factory-core/.dev.vars` (local) and Wrangler secrets store (production)

## Webhooks & Callbacks

**Incoming:**
- `POST /` on Google Apps Script web app URL - Receives lead form submissions from client-mgc-reparation, logs to Google Sheets and triggers email alert via `MailApp` (`client-mgc-reparation/google_apps_script_webhook.js`)
- `GET /api/leads/verify?token=...` - Email verification callback for double opt-in lead flow (`factory-core/src/api/leads.ts`)

**Outgoing:**
- Resend API (`https://api.resend.com/emails`) - Sends verification emails on lead creation
- GitHub API - Creates repos and files programmatically on project generation
- Cloudflare AI Gateway - Routes Gemini AI requests through Cloudflare

---

*Integration audit: 2026-04-24*
