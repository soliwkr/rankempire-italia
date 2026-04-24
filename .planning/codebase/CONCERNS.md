# Codebase Concerns

**Analysis Date:** 2026-04-24

## Tech Debt

**Incomplete API Key Validation:**
- Issue: Empty fallback API key exposes missing configuration silently
- Files: `src/services/gemini.ts` (line 3)
- Impact: API calls fail at runtime without clear error messages. Users get vague "failed to analyze" alerts instead of actionable feedback
- Fix approach: Add explicit validation on app startup that throws if `GEMINI_API_KEY` is missing or empty, with clear error message to user

**Unsafe JSON Parsing in API Responses:**
- Issue: Multiple functions rely on `JSON.parse()` directly on AI model responses without guaranteed structure validation
- Files: `src/services/gemini.ts` (lines 56-58), `src/services/geminiScout.ts` (lines 49, 63, 78, 98)
- Impact: If Gemini API changes response format or returns unexpected JSON, app crashes with cryptic parse errors instead of handling gracefully
- Fix approach: Implement strict schema validation using a runtime validator (e.g., Zod) on all API responses before parsing. Add try-catch with meaningful error logging

**Hardcoded Fallback Values in ContentContext:**
- Issue: Fallback data is hardcoded instead of fetched from configuration
- Files: `client-mgc-reparation/contexts/ContentContext.tsx` (lines 105-114)
- Impact: If business info fails to load, users see placeholder phone/address/hours instead of recognizing the issue. Business contact information must be accurate
- Fix approach: Implement proper loading states with user feedback rather than silent fallbacks. Add validation that critical business data is not empty before rendering

## Known Bugs

**Firebase Silent Permission Failures:**
- Symptoms: User operations fail silently when Firestore rules deny access; error thrown but not propagated to UI
- Files: `src/lib/firebase.ts` (lines 27-48)
- Trigger: User attempts to create/update/delete documents when `user.uid` doesn't match ownership rules
- Workaround: Check browser console for error details; currently alerts don't display permission errors clearly

**Map Data Truncation in Site Analysis:**
- Symptoms: Site HTML analysis truncates at 15KB, losing content below the fold for detailed pages
- Files: `src/services/gemini.ts` (line 105)
- Trigger: Importing Cloudflare Pages sites with long HTML content
- Workaround: For now, analysis works for typical sites under 15KB; complex sites may have incomplete niche detection

**Missing Error Recovery in Mass Scout:**
- Symptoms: If any step in mass analysis fails mid-pipeline, subsequent steps don't execute but UI doesn't clearly indicate which step failed
- Files: `src/components/MassScout.tsx` (lines 61-103)
- Trigger: Network timeout or API rate limit during brainstorm, CPC estimation, or competition analysis
- Workaround: Check console logs for error details; restart analysis

## Security Considerations

**API Key Exposure via Build Output:**
- Risk: Vite config exposes `GEMINI_API_KEY` to client-side bundle via `define` option
- Files: `vite.config.ts` (lines 10-12)
- Current mitigation: Relies on environment variable isolation at build time
- Recommendations: 
  - Remove `define` for sensitive keys; instead, proxy API calls through backend (`server.ts`)
  - Create `/api/gemini` endpoint that authenticates requests server-side
  - Set `GEMINI_API_KEY` only in server environment, never send to client

**Unvalidated External URL Fetch:**
- Risk: `/api/scrape-site` endpoint fetches any URL without validation; could scrape internal networks or trigger SSRF
- Files: `server.ts` (lines 123-137)
- Current mitigation: None
- Recommendations:
  - Add URL validation: whitelist domain patterns, block private IP ranges (`127.0.0.1`, `10.0.0.0/8`, etc.)
  - Implement request timeout and response size limits
  - Log all scrape requests for audit trail
  - Rate limit endpoint per user/IP

**Service Account Key Exposure Risk:**
- Risk: `.env.example` contains complete mock service account JSON structure, users may paste real credentials into version control
- Files: `.env.example` (line 25)
- Current mitigation: File in `.gitignore` (assumed)
- Recommendations:
  - Add inline warning comment above service account line: "**NEVER commit real credentials**"
  - Implement git pre-commit hook to scan for `-----BEGIN PRIVATE KEY-----` patterns
  - Use dedicated secrets management (e.g., Google Cloud Secret Manager, 1Password)

**Unencrypted Google Drive/GSC Integration:**
- Risk: Google API credentials passed in plaintext from client to server; no TLS enforcement documented
- Files: `server.ts` (lines 28-114)
- Current mitigation: Assumes HTTPS in production (not enforced in code)
- Recommendations:
  - Add explicit HTTPS-only middleware in production mode
  - Document that app MUST run over HTTPS
  - Use signed JWTs for client-to-server API calls instead of raw credential exchange

**Missing CORS Configuration:**
- Risk: No CORS headers defined; could allow unintended cross-origin API access
- Files: `server.ts` (no CORS middleware)
- Current mitigation: None
- Recommendations:
  - Add explicit CORS configuration with allowed origins
  - Restrict `/api/` routes to same-origin or configured frontends only

## Performance Bottlenecks

**Synchronous JSON Parsing in Hot Path:**
- Problem: `parseSafeJson()` in geminiScout is called synchronously during AI response processing; if parsing fails, entire analysis step blocks
- Files: `src/services/geminiScout.ts` (lines 15-27)
- Cause: Fallback regex matching (`text.match(/\{[\s\S]*\}/)`) is O(n) and runs on large API responses
- Improvement path: 
  - Cache regex pattern outside function
  - Implement async parsing with streaming for large responses
  - Add telemetry to track parsing failures rate

**Unbounded Geotargets Array:**
- Problem: Loading full Italian cities list (1000+) into React state causes re-renders to lag
- Files: `src/components/MassScout.tsx` (line 33)
- Cause: No virtualization or lazy loading of city list
- Improvement path:
  - Implement virtual scrolling (e.g., `react-window`) for city list
  - Add debounce to city search input
  - Paginate city selection instead of loading all at once

**No Caching of Gemini API Responses:**
- Problem: Identical niche + city queries re-run full analysis instead of returning cached results
- Files: `src/App.tsx` (line 39), entire gemini service module
- Cause: No response memoization or client-side cache layer
- Improvement path:
  - Implement simple localStorage cache with TTL (e.g., 1 hour)
  - Add cache invalidation on user intent (explicit refresh button)
  - Track cache hit rate for analytics

## Fragile Areas

**Gemini API Model Versioning:**
- Files: `src/services/gemini.ts` (lines 49, 71, 109), `src/services/geminiScout.ts` (lines 31, 54, 70, 85)
- Why fragile: Multiple hardcoded model names (`gemini-3-flash-preview`, `gemini-3.1-pro-preview`) that could break if Google deprecates versions without warning
- Safe modification: Create a `MODEL_CONFIG` constant at module level; add model version fallback logic
- Test coverage: No tests for API contract; would need mock responses to catch model deprecation early

**Firebase Real-Time Listener Memory Leaks:**
- Files: `src/App.tsx` (lines 97-103)
- Why fragile: Three `onSnapshot` listeners created but cleanup relies on component unmounting; if user repeatedly opens/closes tabs, listeners may accumulate
- Safe modification: Add explicit unsubscribe in cleanup function; wrap listeners in try-catch
- Test coverage: No integration tests for listener lifecycle; manually verify in DevTools memory profiler

**Hardcoded GMB Category in GA4 Setup:**
- Files: `server.ts` (line 82)
- Why fragile: `industryCategory: "BUSINESS_AND_INDUSTRIAL"` hardcoded; doesn't match actual business niche (could be "PROFESSIONAL_SERVICES", "HEALTH_CARE", etc.)
- Safe modification: Accept `industryCategory` as query parameter; validate against Google's allowed list before sending
- Test coverage: No validation tests for API request payloads

**Untyped Firestore Document Structure:**
- Files: `src/App.tsx` (lines 41-46, 68-79, 99-101)
- Why fragile: Storing arbitrary objects (`plan`, `services`, etc.) without schema; if shape changes, queries/rendering breaks
- Safe modification: Define strict interfaces for each collection (`OpportunitiesDoc`, `SitesDoc`, `LeadsDoc`); add runtime validation on read
- Test coverage: No tests validating Firestore write/read contracts

## Scaling Limits

**Single App Server for All Google API Operations:**
- Current capacity: Single `server.ts` instance handles GSC, GA4, Analytics Admin API calls synchronously
- Limit: Under 10 concurrent users, average request latency is acceptable; beyond that, queue backs up
- Scaling path:
  - Extract Google API operations to separate service/queue (e.g., Bull queue with Redis)
  - Implement async request processing with job tracking
  - Add status polling endpoint so clients don't block

**Firestore Concurrent Write Limit:**
- Current capacity: Default Firestore allows ~1500 writes/sec per database
- Limit: If multiple users simultaneously create sites/opportunities, writes will throttle after ~50 concurrent users
- Scaling path:
  - Implement client-side batch writes to reduce frequency
  - Add Firestore rate limiting middleware
  - Monitor write throughput; upgrade to dedicated database if approaching limit

**Local City Geotarget Array in Memory:**
- Current capacity: Full Italian city list (1000+ entries) loaded into React state per session
- Limit: With 1000+ concurrent users, city list arrays consume visible heap; potential OOM on low-memory clients
- Scaling path:
  - Move city list to server API endpoint (`/api/geotargets`)
  - Implement pagination: `?page=1&limit=50`
  - Client caches paginated results with automatic prefetch

## Dependencies at Risk

**@google/genai SDK Version Pinning:**
- Risk: SDK is in preview (`1.29.0`); breaking API changes between minor versions likely
- Impact: App breaks if SDK internal interfaces change; no fallback model support
- Migration plan:
  - When SDK reaches stable (1.0+), update to latest stable
  - Implement abstraction layer for AI provider to support fallback (e.g., OpenAI GPT-4 as backup)
  - Add integration tests that verify model response contracts

**Express Server Without Security Middleware:**
- Risk: No helmet, rate limiting, or request validation; vulnerable to common attacks
- Impact: DoS via `/api/scrape-site`, header injection via API payloads
- Migration plan:
  - Add `helmet` for security headers
  - Add `express-rate-limit` to endpoints
  - Implement request body size limits
  - Add input validation middleware (e.g., joi)

## Missing Critical Features

**No Offline Mode or Service Worker:**
- Problem: App is entirely dependent on network; brief connection loss = all functionality unavailable
- Blocks: Using app in spotty connectivity areas (common for field service workers)

**No Audit Log for Business Data Changes:**
- Problem: Firestore listeners can't track who changed what when; no accountability for lead/site data mutations
- Blocks: Enterprise adoption; GDPR compliance requires change tracking

**No A/B Testing or Experimentation Framework:**
- Problem: Can't test different PPL strategies or UI variations without manual database manipulation
- Blocks: Data-driven optimization of ranking/revenue projections

## Test Coverage Gaps

**Untested Gemini Response Parsing:**
- What's not tested: JSON parsing fallback logic; regex matching on malformed API responses
- Files: `src/services/geminiScout.ts` (lines 15-27), `src/services/gemini.ts` (lines 56-58)
- Risk: Silent failures if API returns non-JSON or invalid schema
- Priority: High - direct user-facing feature

**No Integration Tests for Firestore Rules:**
- What's not tested: Firebase security rule enforcement; permission-denied errors not caught during development
- Files: `src/lib/firebase.ts` (error handling), Firestore rules file
- Risk: App assumes write access; rules violations only discovered in production
- Priority: High - data security

**No E2E Tests for Google API Setup:**
- What's not tested: `/api/google/setup-asset` endpoint flow; GSC add, GA4 property creation, data stream creation
- Files: `server.ts` (lines 28-114)
- Risk: API contract breaks silently; users unable to set up sites
- Priority: High - critical workflow

**MassScout Component Logic Not Unit Tested:**
- What's not tested: Step progression, city toggle logic, error state handling
- Files: `src/components/MassScout.tsx`
- Risk: UI bugs in analysis flow discovered late
- Priority: Medium

---

*Concerns audit: 2026-04-24*
