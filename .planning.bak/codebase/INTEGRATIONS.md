# External Integrations

**Analysis Date:** 2025-05-14

## APIs & External Services

**Version Control & CI/CD:**
- GitHub (API integration via `factory-core/src/services/github.ts`)
  - Config: `GITHUB_TEMPLATE_OWNER`, `GITHUB_TEMPLATE_REPO` in `wrangler.toml`

**Cloudflare Services:**
- Cloudflare Pages (Deployment automation via `factory-core/src/services/cloudflare-pages.ts`)
- Cloudflare D1 (Database storage)
- Cloudflare KV (Key-Value storage)

**Notifications:**
- Telegram (via `factory-core/src/services/telegram.ts`)
- Email (via `factory-core/src/services/email.ts`)

**SEO & Analytics:**
- Google Search Console (via `factory-core/src/services/search-console.ts`)
- Google Analytics (GA4) (via `factory-core/src/services/google-analytics.ts`)

## Data Storage

**Databases:**
- Cloudflare D1 (Binding `DB` in `wrangler.toml`)
  - Client: `drizzle-orm/d1`

**Caching/KV:**
- Cloudflare KV (Binding `KV` in `wrangler.toml`)

## Authentication & Identity

**Auth Provider:**
- Custom (bearer authentication via `hono/bearer-auth` in `factory-core/src/index.ts`)

## Environment Configuration

**Required env vars:**
- `EMAIL_FROM`, `VERIFICATION_BASE_URL`, `GITHUB_TEMPLATE_OWNER`, `GITHUB_TEMPLATE_REPO`, `FACTORY_API_URL`
- Secrets (managed via `wrangler secret`): `RESEND_API_KEY`, `API_SECRET`, `CF_API_TOKEN`

---

*Integration audit: 2025-05-14*
