# Codebase Structure

**Analysis Date:** 2026-04-24

## Directory Layout

```
rankempire-italia/                    # Monorepo root
├── src/                              # Main React SPA source
│   ├── App.tsx                       # Root component, all tab views, global state
│   ├── main.tsx                      # React DOM entry point
│   ├── index.css                     # Tailwind base styles
│   ├── types.ts                      # Shared TypeScript types & enums (SPA)
│   ├── geotargets.json               # Italian city list for city pickers
│   ├── components/
│   │   └── MassScout.tsx             # Nexus mass market scouting UI component
│   ├── lib/
│   │   ├── firebase.ts               # Firebase init, Auth, Firestore helpers
│   │   └── templates/
│   │       └── GenericPPLTemplate.ts # PPL landing page component blueprint
│   └── services/
│       ├── gemini.ts                 # Gemini API: PPL plan, niche research, site content, CF analysis
│       └── geminiScout.ts            # Gemini API: mass scouting pipeline (brainstorm→CPC→SERP)
├── factory-core/                     # Cloudflare Worker backend (separate sub-project)
│   ├── package.json                  # Independent dependencies (Hono, Drizzle, Vitest)
│   ├── wrangler.toml                 # Cloudflare Worker config (D1, KV, vars)
│   ├── drizzle.config.ts             # Drizzle Kit migration config
│   ├── tsconfig.json                 # Separate TS config (Cloudflare Workers types)
│   ├── migrations/                   # Drizzle-generated D1 SQL migrations
│   └── src/
│       ├── index.ts                  # Hono app entry, route mounting
│       ├── api/
│       │   ├── leads.ts              # POST /api/leads, GET /api/leads/verify
│       │   ├── leads.test.ts         # Vitest tests for leads API
│       │   ├── projects.ts           # GET/POST /api/projects, POST /api/projects/:id/deploy
│       │   └── generate.ts           # POST /api/generate/content
│       ├── db/
│       │   └── schema.ts             # Drizzle SQLite schema: renters, projects, leads, factorySettings
│       ├── services/
│       │   ├── ai.ts                 # AiService class (Cloudflare AI Gateway → Gemini 2.5 Flash)
│       │   ├── ai.test.ts            # Vitest tests for AiService
│       │   ├── email.ts              # EmailService class (Resend API)
│       │   ├── email.test.ts         # Vitest tests for EmailService
│       │   ├── github.ts             # GitHubService class (repo-from-template, file writes)
│       │   ├── github.test.ts        # Vitest tests for GitHubService
│       │   ├── prompts.ts            # PromptService class (avatar/locale-aware prompts)
│       │   └── geo.ts                # Geographic targeting helpers
│       └── types/                    # Type definitions for factory-core
├── client-mgc-reparation/            # Standalone client project (React SPA, separate package.json)
│   ├── App.tsx
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   ├── src/
│   ├── types/
│   └── utils/
├── deliberately_test/                # Legacy/experimental test sub-projects (multiple nested apps)
│   ├── genai-ppl-kwplan-generator/
│   ├── googleai-ppla-campaign-generator/
│   ├── ppl-jack-ConversionCommandCenter/
│   ├── pronto-clone-/
│   ├── rank-rent-factory/
│   └── RankRentFactory/
├── server.ts                         # Express + Vite dev server, proxy API routes
├── index.html                        # SPA HTML shell
├── vite.config.ts                    # Vite config (React, Tailwind, GEMINI_API_KEY injection)
├── tsconfig.json                     # Root TS config (src/ only, bundler resolution)
├── package.json                      # Root package (SPA + Express deps)
├── package-lock.json                 # Root lockfile
├── firestore.rules                   # Firestore security rules
├── firebase-applet-config.json       # Firebase project config (non-secret, committed)
├── firebase-blueprint.json           # Firestore entity schemas (documentation)
├── .env.example                      # Required env var reference (do not read .env)
├── .gitignore
├── metadata.json                     # App metadata
├── comuni_datradurreinitaliano.csv   # Source CSV of Italian municipalities
├── BUSINESS_PLAN.md                  # Project business plan documentation
├── GOOGLE_CLOUD_SETUP.md             # GCP setup guide
└── NEXT_SESSION_PLAN.md              # Session planning notes
```

## Directory Purposes

**`src/`:**
- Purpose: All source code for the main React SPA (Imperio SEO operator dashboard).
- Contains: One root component (`App.tsx`), extracted UI components, service wrappers, Firebase lib, templates.
- Key files: `src/App.tsx` (entire SPA state and tab routing), `src/lib/firebase.ts` (Firestore/Auth), `src/services/gemini.ts` (AI pipeline)

**`src/components/`:**
- Purpose: Extracted React components too large to inline in `App.tsx`.
- Contains: One component currently: `MassScout.tsx` (the 5-step market scouting UI).
- Key files: `src/components/MassScout.tsx`

**`src/lib/`:**
- Purpose: Infrastructure/integration utilities (non-UI, non-feature).
- Contains: Firebase initialisation, template blueprints.
- Key files: `src/lib/firebase.ts`, `src/lib/templates/GenericPPLTemplate.ts`

**`src/services/`:**
- Purpose: All Gemini AI API calls for the frontend, grouped by use case.
- Contains: Named export functions, not classes.
- Key files: `src/services/gemini.ts`, `src/services/geminiScout.ts`

**`factory-core/`:**
- Purpose: Completely independent Cloudflare Worker project. The production backend for site-factory operations.
- Contains: Its own dependencies, migrations, tests, and wrangler deployment config.
- Key files: `factory-core/src/index.ts`, `factory-core/src/db/schema.ts`, `factory-core/wrangler.toml`

**`factory-core/src/api/`:**
- Purpose: Route handlers, one file per resource.
- Contains: Hono sub-app instances exported as default.
- Pattern: Each file creates `const api = new Hono<{ Bindings: Bindings }>()` and exports it.

**`factory-core/src/services/`:**
- Purpose: Business logic and external API integration, encapsulated as classes.
- Contains: `AiService`, `GitHubService`, `EmailService`, `PromptService`, `geo` helpers.

**`factory-core/src/db/`:**
- Purpose: Drizzle ORM schema definition for Cloudflare D1.
- Contains: Table definitions only; no query helpers. Queries are written inline in route handlers.

**`factory-core/migrations/`:**
- Purpose: SQL migration files generated by `drizzle-kit generate`.
- Generated: Yes. Committed: Yes.

**`client-mgc-reparation/`:**
- Purpose: A separate client project (MGC Reparation PPL site management). Standalone React SPA with its own `package.json`.
- Note: This is a distinct sub-application, not shared code. Contains `gcloud-key.json` and `gmb_token.json` credential files.

**`deliberately_test/`:**
- Purpose: Scratch/experimental sub-projects. Contains multiple nested React/Node apps used for prototyping features before integration.
- Not part of the main application or factory-core.

## Key File Locations

**Entry Points:**
- `server.ts`: Express server that serves both the SPA and the `/api/*` proxy routes
- `src/main.tsx`: React DOM `createRoot` entry point
- `index.html`: SPA HTML shell loaded by Vite
- `factory-core/src/index.ts`: Cloudflare Worker entry point (Hono app)

**Configuration:**
- `vite.config.ts`: Vite plugins, `GEMINI_API_KEY` env injection, `@` path alias
- `tsconfig.json`: Root TypeScript config (includes `src/` only)
- `factory-core/tsconfig.json`: Separate config for Cloudflare Workers targets
- `factory-core/wrangler.toml`: Cloudflare bindings (D1, KV, env vars)
- `firebase-applet-config.json`: Firebase project config
- `firestore.rules`: Firestore security rules (3 collections: opportunities, sites, leads)

**Core Logic:**
- `src/App.tsx`: All tab views (dashboard, intelligence, sites, CRM, settings), global state, Firestore subscriptions
- `src/services/gemini.ts`: 4 core AI functions for the SPA
- `src/services/geminiScout.ts`: 5-step mass scouting pipeline
- `factory-core/src/db/schema.ts`: Single source of truth for D1 database structure

**Testing:**
- `factory-core/src/api/leads.test.ts`: Lead API tests
- `factory-core/src/services/ai.test.ts`: AiService unit tests
- `factory-core/src/services/email.test.ts`: EmailService unit tests
- `factory-core/src/services/github.test.ts`: GitHubService unit tests

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `MassScout.tsx`, `App.tsx`)
- Service/lib modules: `camelCase.ts` (e.g., `firebase.ts`, `gemini.ts`, `geminiScout.ts`)
- Template constants: `PascalCase.ts` (e.g., `GenericPPLTemplate.ts`)
- Test files: co-located with source, suffix `.test.ts` (e.g., `leads.test.ts`, `ai.test.ts`)
- API route handlers: `camelCase.ts` named after the resource (e.g., `leads.ts`, `projects.ts`, `generate.ts`)

**Directories:**
- Lowercase plural for grouping by type: `components/`, `services/`, `lib/`, `api/`, `db/`, `types/`
- Sub-project directories: kebab-case or descriptive (e.g., `factory-core/`, `client-mgc-reparation/`)

## Where to Add New Code

**New SPA tab / feature:**
- Primary code: `src/App.tsx` (add tab ID to nav array, add `activeTab === 'your-tab'` render block)
- If component is large (>150 lines): extract to `src/components/YourFeature.tsx`

**New Gemini AI function:**
- If used by the SPA: `src/services/gemini.ts` (add named export async function)
- If for mass scouting pipeline: `src/services/geminiScout.ts`
- If used in factory-core Worker: `factory-core/src/services/prompts.ts` (prompt builder) + `factory-core/src/services/ai.ts` (call via AiService)

**New factory-core API endpoint:**
- New resource: create `factory-core/src/api/yourResource.ts` with `new Hono<{ Bindings: Bindings }>()` pattern
- Register: `app.route('/api/yourResource', yourResourceApi)` in `factory-core/src/index.ts`
- Add tests: `factory-core/src/api/yourResource.test.ts`

**New factory-core service class:**
- Location: `factory-core/src/services/yourService.ts`
- Pattern: Class with constructor accepting config object, async methods.
- Tests: `factory-core/src/services/yourService.test.ts`

**New Drizzle table:**
- Add to: `factory-core/src/db/schema.ts`
- Generate migration: `npm run db:generate` in `factory-core/`
- Apply locally: `npm run db:migrate` in `factory-core/`

**New Firestore collection (main app):**
- Add rules: `firestore.rules`
- Document schema: `firebase-blueprint.json`
- Add TypeScript type: `src/types.ts`
- Add `onSnapshot` listener: `src/App.tsx` (inside the `useEffect` that depends on `[user]`)

**Shared utilities (SPA):**
- CSS class merging: use `cn()` function (defined inline in `src/App.tsx`) or `classNameMerge()` (in `src/components/MassScout.tsx`) — both combine `clsx` + `tailwind-merge`.
- No shared `utils/` directory in the SPA; keep simple helpers co-located.

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents, codebase maps, and phase plans.
- Generated: No (human/agent authored).
- Committed: Yes.

**`.agent/`:**
- Purpose: Agent SDK skills, workflows, and templates used by the GSD toolchain.
- Generated: No.
- Committed: Yes.

**`factory-core/migrations/`:**
- Purpose: Drizzle Kit generated SQL migration files for D1.
- Generated: Yes (`npm run db:generate`).
- Committed: Yes.

**`factory-core/.wrangler/`:**
- Purpose: Local Wrangler state (local D1 databases, KV state).
- Generated: Yes.
- Committed: No.

---

*Structure analysis: 2026-04-24*
