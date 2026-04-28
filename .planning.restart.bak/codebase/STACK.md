# Technology Stack

**Analysis Date:** 2026-04-24

## Languages

**Primary:**
- TypeScript ~5.8.x - All application code across all sub-projects (frontend, backend, edge workers)

**Secondary:**
- JavaScript - Google Apps Script webhook (`client-mgc-reparation/google_apps_script_webhook.js`)
- CSS - Tailwind utility classes via `src/index.css`

## Runtime

**Environment:**
- Node.js (main app + client-mgc-reparation) - development server via `tsx`, production via Express
- Cloudflare Workers (factory-core) - edge runtime with D1, KV bindings

**Package Manager:**
- npm (all three sub-projects)
- Lockfiles: `package-lock.json` present in root and both sub-projects

## Frameworks

**Frontend (root app - `src/`):**
- React 19 - UI component framework
- Vite 6 - build tool and dev server

**Frontend (client sub-project - `client-mgc-reparation/`):**
- React 19.2 - UI component framework
- React Router DOM 7 - client-side routing
- Vite 6.4 - build tool
- react-helmet-async 2 - document head management
- react-fast-marquee 1.6 - marquee animation component

**Backend (root app - `server.ts`):**
- Express 4.21 - Node.js HTTP server
- Vite middleware in development mode

**Backend (factory-core - edge):**
- Hono 4.12 - lightweight edge-native HTTP framework

**Testing (factory-core):**
- Vitest 4.1 - unit test runner

**Build/Dev:**
- tsx 4.21 - TypeScript execution for Node.js dev server (all projects)
- Wrangler 4.84 - Cloudflare Workers CLI and local dev for factory-core
- Drizzle Kit 0.31 - database schema management and migration CLI

## Key Dependencies

**Critical:**
- `@google/genai` ^1.29.0 (root) - Gemini AI SDK for market intelligence and content generation
- `@google-cloud/vertexai` ^1.10.0 (client-mgc-reparation) - Vertex AI SDK
- `firebase` ^12.12.1 (root) - Firestore real-time database + Google Auth
- `googleapis` ^171.4.0 (root) / ^167.0.0 (client) - Google APIs (Search Console, Analytics Admin, Drive)
- `google-auth-library` ^10.6.2 (root) - Google service account JWT auth
- `drizzle-orm` ^0.45.2 (factory-core) - ORM for Cloudflare D1 SQLite
- `hono` ^4.12.14 (factory-core) - edge-native API framework
- `zod` ^4.3.6 (factory-core) - runtime schema validation

**UI:**
- `tailwindcss` ^4.1.14 (root, via `@tailwindcss/vite`) / ^3.4.17 (client-mgc-reparation)
- `lucide-react` ^0.546.0 (root) - icon library
- `@heroicons/react` ^2.2.0 (client-mgc-reparation) - icon library
- `motion` ^12.23.24 (root) - Framer Motion animations
- `recharts` ^3.x (both) - charting library
- `react-markdown` ^10.1.0 (root) - Markdown rendering
- `clsx` ^2.1.1 + `tailwind-merge` ^3.5.0 (root) - class utilities

**Infrastructure:**
- `@libsql/client` ^0.17.2 (factory-core) - libSQL client for D1 compatibility
- `express` ^4.21.2 (root) - HTTP server for dev + API proxy
- `dotenv` ^17.2.3 (root) - environment variable loading
- `axios` ^1.13.2 (client-mgc-reparation) - HTTP client

## Configuration

**Environment:**
- Root app: `.env` file loaded via `dotenv` in `server.ts`; `GEMINI_API_KEY` injected into Vite via `vite.config.ts` `define`
- factory-core: Secrets managed via Wrangler `.dev.vars` file and `wrangler secret put` for production; non-secret vars in `wrangler.toml` `[vars]`
- client-mgc-reparation: `.env` file with `GEMINI_API_KEY`; `.npmrc` present (note: do not read)

**Key env vars (root):**
- `GEMINI_API_KEY` - Gemini AI API
- `APP_URL` - Cloud Run hosted URL
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- `META_WA_CLIENT_ID`, `META_WA_ACCESS_TOKEN`
- `VOIP_API_KEY`, `VOIP_API_SECRET`
- `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`
- `GOOGLE_ANALYTICS_ACCOUNT_ID`

**Key env vars (factory-core via Wrangler):**
- `RESEND_API_KEY` - transactional email
- `GITHUB_TOKEN` - GitHub API for repo creation
- `GOOGLE_AI_API_KEY` - Google Gemini AI
- `CF_ACCOUNT_ID`, `CF_AI_GATEWAY_NAME`, `CF_AI_GATEWAY_TOKEN` - Cloudflare AI Gateway

**Build:**
- Root: `vite.config.ts` (Vite + React + Tailwind v4 Vite plugin), `tsconfig.json` (ES2022, bundler resolution)
- factory-core: `wrangler.toml` (Cloudflare Workers config), `drizzle.config.ts` (D1 HTTP driver), `tsconfig.json`
- client-mgc-reparation: `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`

## Platform Requirements

**Development:**
- Node.js (LTS recommended)
- Wrangler CLI for factory-core edge worker development
- npm

**Production:**
- Root app: Google Cloud Run (referenced in `.env.example` as `APP_URL`)
- factory-core: Cloudflare Workers + Cloudflare D1 (SQLite) + Cloudflare KV
- client-mgc-reparation: Cloudflare Pages (referenced in `.env.example` deploy hook)

---

*Stack analysis: 2026-04-24*
