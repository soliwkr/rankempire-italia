# Architecture

**Analysis Date:** 2026-04-24

## Pattern Overview

**Overall:** Multi-application monorepo with a React SPA + Express dev server (main app) and a separate Cloudflare Workers API backend (factory-core).

**Key Characteristics:**
- The main application (`/`) is a React SPA backed by Firebase Firestore for persistence and served via an Express + Vite dev server (`server.ts`).
- `factory-core/` is an independent Hono-based Cloudflare Worker that exposes REST endpoints for the site-factory pipeline (lead intake, project management, AI content generation).
- AI calls (Gemini API) are made both directly from the React frontend (via Vite env injection) and from the Cloudflare Worker via Cloudflare AI Gateway.
- There is no shared package between the two sub-applications. Each has its own `package.json`, `tsconfig.json`, and dependency tree.

## Layers

**Frontend SPA:**
- Purpose: Operator-facing dashboard for intelligence, site factory management, CRM, and settings.
- Location: `src/`
- Contains: React components, Firestore real-time subscriptions, Gemini API calls, UI state.
- Depends on: Firebase Auth/Firestore (`src/lib/firebase.ts`), Gemini service (`src/services/gemini.ts`, `src/services/geminiScout.ts`), `lucide-react`, `motion/react`, Recharts, `react-markdown`.
- Used by: End users (operators) via browser.

**Express Dev/Prod Server:**
- Purpose: Serves the Vite SPA in development (middleware mode) and static `dist/` in production. Also provides server-side proxy endpoints that bypass browser CORS and integrate Google APIs (Search Console, Analytics Admin).
- Location: `server.ts`
- Contains: Express routes (`/api/health`, `/api/google/setup-asset`, `/api/deploy/cloudflare`, `/api/scrape-site`, `/api/proof/generate`), Vite middleware in development.
- Depends on: `express`, `vite`, `googleapis`, `dotenv`.
- Used by: The React SPA for CORS-bypass calls; the runtime serving `dist/` in production.

**factory-core Cloudflare Worker:**
- Purpose: Backend for the deployed site-factory pipeline. Handles lead ingestion (with double opt-in verification), project/deployment orchestration via GitHub API, and AI content generation via Cloudflare AI Gateway.
- Location: `factory-core/src/`
- Contains: Hono app, REST API route handlers, service classes, Drizzle ORM schema.
- Depends on: Hono, Drizzle ORM, Cloudflare D1 (SQLite), Cloudflare KV, GitHub API, Resend email, Gemini 2.5 Flash via Cloudflare AI Gateway.
- Used by: Deployed rank-and-rent sites (lead forms), internal orchestration.

**Service Layer (main app):**
- Purpose: Encapsulates all Gemini API calls used by the frontend.
- Location: `src/services/`
- Contains:
  - `src/services/gemini.ts` — `generatePplPlan`, `researchNiche`, `generateSiteContent`, `analyzeCloudflareSite`
  - `src/services/geminiScout.ts` — `brainstormServices`, `estimateCpc`, mass market scouting pipeline functions

**Service Layer (factory-core):**
- Purpose: Encapsulates external API integrations behind reusable classes.
- Location: `factory-core/src/services/`
- Contains:
  - `factory-core/src/services/ai.ts` — `AiService` class (Cloudflare AI Gateway → Gemini 2.5 Flash)
  - `factory-core/src/services/github.ts` — `GitHubService` class (repo-from-template, file creation)
  - `factory-core/src/services/email.ts` — `EmailService` class (Resend API, verification emails)
  - `factory-core/src/services/prompts.ts` — `PromptService` class (locale/avatar-aware prompt builder)
  - `factory-core/src/services/geo.ts` — Geographic targeting helpers

**Data Layer (factory-core):**
- Purpose: Defines the SQLite schema and is accessed directly in route handlers via Drizzle.
- Location: `factory-core/src/db/schema.ts`
- Contains: `renters`, `projects`, `leads`, `factorySettings` tables.
- Used by: `factory-core/src/api/leads.ts`, `factory-core/src/api/projects.ts`

**Firebase Integration (main app):**
- Purpose: Centralises Firebase initialisation, Auth helpers, Firestore client, and permission-denied error normalisation.
- Location: `src/lib/firebase.ts`
- Contains: `db`, `auth`, `googleProvider`, `signInWithGoogle`, `signOut`, `handleFirestoreError`.

## Data Flow

**Intelligence Analysis (PPL Deep Dive):**

1. Operator enters niche + city in `src/App.tsx` → `handleAnalyzeIntelligence`.
2. `generatePplPlan(niche, city)` in `src/services/gemini.ts` calls Gemini (`gemini-3-flash-preview`) with Google Search grounding enabled.
3. Parsed JSON is stored in state (`setPplPlan`) and persisted to Firestore `opportunities` collection via `addDoc`.
4. UI re-renders with plan data; Firestore `onSnapshot` listener also reflects the new document.

**Mass Scout Flow:**

1. Operator selects Italian cities in `src/components/MassScout.tsx`.
2. `handleStartAnalysis` calls sequential steps from `src/services/geminiScout.ts`:
   - `brainstormServices` → `estimateCpc` → demand analysis → SERP intelligence → opportunity ranking.
3. Each step updates the step status in local state (`updateStep`). Final `Opportunity[]` array is stored in `finalReport` state.
4. No Firestore persistence for mass scout results (in-memory only).

**Site Deployment (factory-core):**

1. `POST /api/projects/:id/deploy` retrieves project from Cloudflare D1 via Drizzle.
2. `GitHubService.createProjectRepo` clones `StudioPuraLuce/astro-base` template.
3. `GitHubService.createFile` writes a project config JSON into the new repo.
4. GitHub Actions CI (on the template repo) builds and deploys to Cloudflare Pages automatically.

**Lead Intake (factory-core):**

1. Public lead form on a deployed site `POST /api/leads`.
2. Honeypot field checked; Zod schema validates the payload.
3. Lead written to D1 with `doiStatus: 'pending'`.
4. `EmailService` sends a double-opt-in verification email via Resend.
5. On `/verify?token=...`, `doiStatus` is updated to `'verified'` and an alert email is sent to the operator.

**Cloudflare Site Import (main app):**

1. Operator provides a Cloudflare Pages URL.
2. `GET /api/scrape-site?url=...` (Express server) fetches the HTML, bypassing browser CORS.
3. `analyzeCloudflareSite(html, url)` calls Gemini to extract niche/city/services/SEO rating.
4. Analysed data stored in Firestore `sites` collection.

**State Management:**
- All top-level application state lives in `src/App.tsx` using React `useState`.
- Firestore collections (`opportunities`, `sites`, `leads`) are synced in real-time via `onSnapshot` listeners in `useEffect`.
- `src/components/MassScout.tsx` manages its own local state (steps, cities, report).
- No Redux, Zustand, or React Context is used.

## Key Abstractions

**Firestore Collections (main app):**
- Purpose: Primary persistence layer for the operator dashboard.
- Schema defined in: `firebase-blueprint.json`
- Collections: `opportunities`, `sites`, `leads`
- Rules: `firestore.rules`

**Drizzle Schema (factory-core):**
- Purpose: Strongly-typed SQLite schema for Cloudflare D1.
- Defined in: `factory-core/src/db/schema.ts`
- Tables: `renters`, `projects`, `leads`, `factorySettings`

**PPL Template:**
- Purpose: Reusable component blueprint for high-conversion Pay-Per-Lead landing pages.
- Location: `src/lib/templates/GenericPPLTemplate.ts`
- Pattern: Exported constant object (`GenericPPLTemplate`) with theme tokens and ordered component list.

**Hono App (factory-core):**
- Purpose: Cloudflare Worker entry point composing all route modules.
- Location: `factory-core/src/index.ts`
- Pattern: `app.route('/api/leads', leadsApi)` — routes are modular Hono instances imported as sub-apps.

**AiService (factory-core):**
- Purpose: Abstraction over Cloudflare AI Gateway → Gemini 2.5 Flash.
- Location: `factory-core/src/services/ai.ts`
- Pattern: Class instantiated per-request with config pulled from `c.env` Worker bindings.

## Entry Points

**Main App (development):**
- Location: `server.ts`
- Triggers: `npm run dev` → `tsx server.ts`
- Responsibilities: Starts Express on port 3000, attaches Vite as middleware, registers all `/api/*` routes.

**Main App (production):**
- Location: `server.ts` + `dist/` (built by Vite)
- Triggers: `npm run build` then `node server.ts` with `NODE_ENV=production`
- Responsibilities: Serves static `dist/` and handles all `/api/*` routes.

**SPA Entry:**
- Location: `src/main.tsx`
- Triggers: Loaded as module by `index.html`
- Responsibilities: Mounts `<App />` under React StrictMode.

**factory-core Worker:**
- Location: `factory-core/src/index.ts`
- Triggers: `wrangler dev` (local) or `wrangler deploy` (Cloudflare)
- Responsibilities: Exports Hono app as default, routes requests to `leadsApi`, `projectsApi`, `generateApi`.

## Error Handling

**Strategy:** Mostly try/catch with `console.error` + user-facing `alert()` in the SPA; structured HTTP error responses (`c.json({ error }, status)`) in factory-core.

**Patterns:**
- `src/lib/firebase.ts` — `handleFirestoreError` normalises `permission-denied` errors into a structured JSON error thrown as `Error`.
- `factory-core/src/api/leads.ts` — Zod `safeParse` returns 400 with `errors` array on validation failure.
- `src/services/geminiScout.ts` — `parseSafeJson` has a fallback regex extractor to handle dirty Gemini text responses.
- Express server routes catch errors and return `res.status(500).json({ error: e.message })`.

## Cross-Cutting Concerns

**Logging:** `console.error` throughout; no structured logging framework.
**Validation:** Zod used in factory-core (`factory-core/src/api/leads.ts`); no validation library used in the main app (raw form inputs).
**Authentication:** Firebase Auth with Google provider (`src/lib/firebase.ts`). The main app gates all UI behind `onAuthStateChanged`. factory-core has no auth layer on its public lead endpoint (intentional for form submissions).
