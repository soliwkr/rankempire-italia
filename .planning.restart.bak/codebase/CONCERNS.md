# Codebase Concerns

**Analysis Date:** 2026-04-24

## Security Considerations

**Credential Files Committed to Repository:**
- Risk: Google Cloud service account key, OAuth client secret, and GMB token are committed as plain files in the repository.
- Files:
  - `client-mgc-reparation/gcloud-key.json` (2.4KB service account key)
  - `client-mgc-reparation/client_secret.json` (415B OAuth client secret)
  - `client-mgc-reparation/gmb_token.json` (499B OAuth refresh token)
- Current mitigation: `.gitignore` does NOT explicitly exclude these files (only `.env*` is excluded). These files could be exposed in git history.
- Recommendations: Rotate all affected GCP credentials immediately. Add these filenames to `.gitignore`. Use environment variables or secret managers instead.

**Firebase Config Committed as Plain JSON:**
- Risk: Firebase project ID, API key, App ID, and Firestore database ID are committed in a tracked JSON file.
- Files: `firebase-applet-config.json`
- Current mitigation: Firebase security rules exist (`firestore.rules`) and provide some access control.
- Recommendations: Move the Firebase config to environment variables. The API key in this file (`AIzaSy...`) should be domain-restricted in Firebase Console.

**Sensitive Metadata in `.env.example`:**
- Risk: `.env.example` contains real GCP service account email, client ID, certificate URL, and partial key structure that reveals the actual service account identity.
- Files: `.env.example`
- Current mitigation: It is documented as an example, but the real account identifiers are embedded.
- Recommendations: Replace all real identifiers in `.env.example` with generic placeholders.

**No Authentication on Factory Core API:**
- Risk: All API routes in `factory-core` (`/api/projects`, `/api/leads`, `/api/generate`) are publicly accessible with no authentication middleware. Any unauthenticated party can trigger GitHub repo creation, AI content generation, or project deployments.
- Files: `factory-core/src/index.ts`, `factory-core/src/api/projects.ts`, `factory-core/src/api/generate.ts`
- Current mitigation: None. Only a honeypot check exists on lead submission.
- Recommendations: Add an API key or Bearer token authentication middleware at the Hono router level before shipping to production.

**Unauthenticated Scraping Proxy Endpoint:**
- Risk: `/api/scrape-site` in `server.ts` is a Server-Side Request Forgery (SSRF) vector. It accepts an arbitrary URL and fetches it on behalf of the server with no validation, allowlist, or authentication.
- Files: `server.ts` (lines 123-137)
- Current mitigation: None.
- Recommendations: Validate the URL against an allowlist of known domains or at minimum require authentication before accepting scrape requests.

**Overly Permissive Firestore Rules for Leads:**
- Risk: The `leads` collection allows public writes (`allow create: if true`). Any unauthenticated actor can write arbitrary data to the leads collection.
- Files: `firestore.rules` (line 31)
- Current mitigation: The intent is for public lead submission from landing pages, but the rule is completely unrestricted.
- Recommendations: Add rate-limiting via Firestore field constraints or require basic field presence. Consider adding a CAPTCHA layer in the client before submission.

**Unvalidated `project_id` on Lead Submission:**
- Risk: The lead submission endpoint in `factory-core` accepts `project_id` from the request body and inserts it directly without verifying the project exists before writing to DB. Only a UUID format check is performed.
- Files: `factory-core/src/api/leads.ts`
- Current mitigation: Foreign key constraint at DB level will reject invalid UUIDs, but the error is not handled gracefully.
- Recommendations: Look up the project before inserting the lead and return a meaningful error.

**GitHub Token Stored in `factorySettings` Table:**
- Risk: The DB schema has a `github_token_secret` text column in `factory_settings`. If DB is exposed, the GitHub token leaks.
- Files: `factory-core/src/db/schema.ts` (line 42)
- Current mitigation: Token is also available as a Cloudflare Worker binding secret, which is the proper approach.
- Recommendations: Remove the `github_token_secret` column from the `factory_settings` table; rely exclusively on environment bindings.

---

## Tech Debt

**Hardcoded Production URL in Deployed Code:**
- Issue: `factoryApi` URL is hardcoded as `'https://factory-core.soliwkr.workers.dev'` inside the deploy endpoint handler with a `// TODO` comment.
- Files: `factory-core/src/api/projects.ts` (line 67)
- Impact: Deployed Worker always points to the production worker URL; staging/testing environments will call production.
- Fix approach: Read this from a Cloudflare Worker environment variable binding.

**Hardcoded GitHub Template Owner/Repo:**
- Issue: `templateOwner: 'StudioPuraLuce'` and `templateRepo: 'astro-base'` are hardcoded literals rather than config or env vars.
- Files: `factory-core/src/api/projects.ts` (lines 53-54)
- Impact: Changing template requires a code deploy rather than a config change.
- Fix approach: Store these in `wrangler.toml` `[vars]` or read from `factorySettings` DB table.

**Fragile 2-Second Sleep Before GitHub File Write:**
- Issue: A `setTimeout(resolve, 2000)` delay is used to wait for GitHub to initialize a new repo before writing `config.json`.
- Files: `factory-core/src/api/projects.ts` (lines 70-72)
- Impact: Race condition — the delay may not be sufficient under load; if GitHub initializes faster the 2s is wasted.
- Fix approach: Implement a retry loop with exponential backoff polling the repo contents endpoint.

**Email Not Persisted in Leads Table:**
- Issue: The `leads` table schema has no `email` column. The email is validated in the Zod schema and used to send the verification email but is never stored in the DB. If the verification email bounces or needs resending, the email address is lost.
- Files: `factory-core/src/db/schema.ts`, `factory-core/src/api/leads.ts`, `factory-core/migrations/`
- Impact: Cannot resend verification emails; lost contact data; email is not available for CRM follow-up.
- Fix approach: Add an `email` column to `leads` in a new migration and persist it alongside the other fields.

**`VERIFICATION_BASE_URL` Defaults to Localhost in Production Config:**
- Issue: `wrangler.toml` sets `VERIFICATION_BASE_URL = "http://localhost:8787/verify"`. If this var is not overridden in the Cloudflare dashboard, all verification email links point to localhost.
- Files: `factory-core/wrangler.toml`
- Impact: All DOI verification emails will have broken links in production.
- Fix approach: Set `VERIFICATION_BASE_URL` as a production secret via `wrangler secret put` and document this requirement.

**Stale Model Names in `src/services/gemini.ts`:**
- Issue: All four API calls in the main app use `model: "gemini-3-flash-preview"` and one uses `model: "gemini-3.1-pro-preview"`. These model IDs do not exist — the correct identifiers are `gemini-2.0-flash` / `gemini-2.5-flash` / `gemini-2.5-pro`. All API calls will fail at runtime.
- Files: `src/services/gemini.ts` (lines 49, 72, 109, 143), `src/services/geminiScout.ts` (lines 31, 55, 70, 85)
- Impact: The entire Intelligence tab and Mass Scout feature are non-functional in production.
- Fix approach: Update all model names to valid Gemini API identifiers.

**`factorySettings` Table Has Unused `githubTokenSecret` Column:**
- Issue: The schema stores a `github_token_secret` text field in the DB, but the deployed code reads the GitHub token exclusively from `c.env.GITHUB_TOKEN` (a Cloudflare binding). The DB column is never written or read by application code.
- Files: `factory-core/src/db/schema.ts` (line 42)
- Impact: Misleading schema; potential future confusion about where the token lives.
- Fix approach: Remove the column in a new migration or add explicit code comments clarifying it is legacy.

**`/api/deploy/cloudflare` Endpoint is a Stub:**
- Issue: The endpoint at `server.ts` line 117 always returns `{ status: "deploy_triggered" }` without performing any actual operation.
- Files: `server.ts` (lines 117-121)
- Impact: The "Importa da Cloudflare" UI flow silently does nothing on the deploy trigger.
- Fix approach: Implement with Cloudflare Pages API or remove and replace UI button with correct flow.

**`/api/proof/generate` Endpoint is a Stub:**
- Issue: Endpoint always returns `{ status: "pdf_generated_and_uploaded" }` with no implementation.
- Files: `server.ts` (lines 140-145)
- Impact: "Crea Proof Package" button in Sites tab does nothing.
- Fix approach: Implement PDF generation (puppeteer/pdfkit) and Google Drive upload, or remove the button until ready.

**Legacy Migration Script References External Path:**
- Issue: `migrate-legacy.ts` has a hardcoded absolute-like path pointing to a sibling project directory (`../../telegram-ranketogram/...`) that does not exist in this repository.
- Files: `factory-core/scripts/migrate-legacy.ts` (line 5)
- Impact: The migration script cannot be executed by any developer without that sibling repo at the exact path.
- Fix approach: Document the dependency or bundle the data file in the repository.

**SQL Injection Risk in Migration Script:**
- Issue: The migration script builds SQL INSERT commands using string interpolation from JSON data fields (`p.name`, `p.niche`, etc.) without escaping.
- Files: `factory-core/scripts/migrate-legacy.ts` (line 22)
- Impact: Any single-quoted value in the legacy data will break the SQL statement. Malicious data could escape the query.
- Fix approach: Use parameterized queries via the Drizzle ORM instead of raw SQL strings via `execSync`.

---

## Performance Bottlenecks

**Sequential AI Calls in MassScout with No Concurrency Control:**
- Problem: `geminiScout.ts` performs multiple AI calls in sequence per city across multiple services. There is no concurrency limit or request batching.
- Files: `src/services/geminiScout.ts`, `src/components/MassScout.tsx`
- Cause: The analysis pipeline calls brainstorm → estimateCpc → estimateDemand → analyzeSERPs → generateRecommendations in series.
- Improvement path: Parallelize independent calls (e.g., per-city analysis); add a rate limiter to respect Gemini API quotas.

**Firestore `onSnapshot` on Three Full Collections Without Filters:**
- Problem: Three real-time listeners are opened on entire `opportunities`, `sites`, and `leads` collections with no query filters.
- Files: `src/App.tsx` (lines 99-102)
- Cause: `onSnapshot(collection(db, 'opportunities'), ...)` without `.where()` clause fetches all documents.
- Improvement path: Add `.where('ownerId', '==', user.uid)` filters to scope reads per user; add pagination for large collections.

---

## Fragile Areas

**AI Response JSON Parsing Without Schema Validation:**
- Files: `src/services/gemini.ts`, `src/services/geminiScout.ts`, `factory-core/src/services/ai.ts`
- Why fragile: All three AI service files parse AI output with bare `JSON.parse()` and direct property access. If the model returns unexpected structure, the app throws an unhandled exception or silently renders `undefined` values throughout the UI.
- Safe modification: Wrap all AI response parsing in Zod schema validation; add fallback values for optional fields.
- Test coverage: No tests cover malformed AI response scenarios.

**Kanban Drag-and-Drop is UI-Only:**
- Files: `src/App.tsx` (lines 542-586)
- Why fragile: The Kanban board filters sites by `kanbanStatus` field, but this field is never set when sites are created or updated. All sites will always appear in the "Nuovi Progetti / Leads" column with no ability to move them. The drag zone exists only as a visual placeholder.
- Safe modification: Implement Firestore `updateDoc` calls on drag-end events to persist `kanbanStatus`; use a proper dnd library (e.g., `@dnd-kit`).
- Test coverage: None.

**Dashboard KPI Stats are Hardcoded Placeholders:**
- Files: `src/App.tsx` (lines 220-230)
- Why fragile: "12.4K", "↑ 18%", "42", "+5 qst sett.", "8.4%" are static string literals in JSX, not derived from any data source.
- Safe modification: Connect to real GSC/GA4 data or remove until backend data is available.
- Test coverage: None.

---

## Missing Critical Features

**No Rate Limiting on AI Endpoints:**
- Problem: Both the `/api/generate/content` endpoint (factory-core) and the main app's Gemini service calls have no rate limiting.
- Blocks: Production deployment — an unprotected endpoint can drain API quotas and billing.

**No Authentication on `/api/google/setup-asset`:**
- Problem: The Google Setup Asset endpoint is exposed with no auth check. Anyone who can reach the server can create GA4 properties and add domains to Google Search Console using the service account.
- Blocks: Safe production deployment.

**No Error Boundary in React App:**
- Problem: There are no React `ErrorBoundary` components wrapping the main application. An AI parsing failure or Firestore error in a component will crash the entire UI.
- Files: `src/main.tsx`, `src/App.tsx`
- Blocks: Production stability.

---

## Test Coverage Gaps

**No Tests for the Main Application (`src/`):**
- What's not tested: All Gemini service calls, Firebase integration, UI components, MassScout flow.
- Files: Entire `src/` directory has zero test files.
- Risk: Regressions in AI integration or Firestore interactions go undetected.
- Priority: High

**No Tests for `factory-core/src/api/projects.ts`:**
- What's not tested: The deploy endpoint, GitHub repo creation with the real flow, DB state transitions, the 2-second race condition workaround.
- Files: `factory-core/src/api/projects.ts` — no corresponding `.test.ts` file.
- Risk: Deploy logic can regress silently; the setTimeout race condition is never exercised.
- Priority: High

**No Tests for `factory-core/src/api/generate.ts`:**
- What's not tested: AI content generation endpoint, error handling for AI failures, missing field validation.
- Files: `factory-core/src/api/generate.ts` — no corresponding `.test.ts` file.
- Risk: The AI generation pipeline can break without detection.
- Priority: Medium

**`client-mgc-reparation` Has No Tests at All:**
- What's not tested: Wizard form flow, CRM webhook submission, lead capture, i18n content rendering.
- Files: Entire `client-mgc-reparation/` directory has no test files.
- Risk: Form submission logic and GHL webhook integration can silently break.
- Priority: Medium

---

## Dependencies at Risk

**`@google/genai` Version ~1.29.0 with Non-Existent Model Names:**
- Risk: The SDK is current but the model identifiers used throughout the codebase (`gemini-3-flash-preview`, `gemini-3.1-pro-preview`) do not correspond to any real Gemini API models. All AI calls fail at runtime.
- Impact: Intelligence tab, MassScout, and all content generation features are completely broken.
- Migration plan: Audit all `model:` references and replace with valid identifiers (e.g., `gemini-2.0-flash-exp`, `gemini-2.5-flash`).

**`deliberately_test/` Directory Contains Multiple Unintegrated Prototypes:**
- Risk: Six standalone Vite apps in `deliberately_test/` each have their own `package.json` but share no code with the main application. They represent divergent experiments that may become a maintenance burden.
- Impact: No direct breakage, but they pollute the repository and create confusion about which implementation is canonical.
- Migration plan: Archive or remove prototypes that have been superseded by `factory-core` and the main app.

---

*Concerns audit: 2026-04-24*
