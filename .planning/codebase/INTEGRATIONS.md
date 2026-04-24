# External Integrations

**Analysis Date:** 2026-04-24

## APIs & External Services

**Google Cloud APIs:**
- Google Generative AI (Gemini) - AI-powered research and content generation
  - SDK/Client: `@google/genai` 1.29.0
  - Auth: `GEMINI_API_KEY` environment variable
  - Model: `gemini-3-flash-preview`
  - Features: Grounded web search integration, JSON schema validation

- Google Search Console - Domain verification and indexing monitoring
  - SDK/Client: `googleapis` 171.4.0 with `google.webmasters` client
  - Auth: Google Service Account JWT (via `google-auth-library`)
  - Scope: `https://www.googleapis.com/auth/webmasters`
  - Endpoint: `/api/google/setup-asset` (POST) in `server.ts`

- Google Analytics 4 - Site performance tracking
  - SDK/Client: `googleapis` 171.4.0 with `google.analyticsadmin` client
  - Auth: Google Service Account JWT
  - Scope: `https://www.googleapis.com/auth/analytics.edit`
  - Operations: Create properties, data streams, configure measurement
  - Endpoint: `/api/google/setup-asset` (POST) in `server.ts`

**Google Business Services:**
- Google Drive - Proof package PDF storage (planned via `/api/proof/generate`)
- Google Workspace/Drive Admin - Content management

**AI & Content Generation:**
- Gemini API integration points in codebase:
  - `src/services/gemini.ts` - Core AI operations:
    - `generatePplPlan()` - PPL (Pay Per Lead) strategy with competitor analysis
    - `researchNiche()` - Italian niche opportunity research
    - `analyzeCloudflareSite()` - HTML content analysis for lead value
    - `generateSiteContent()` - Italian-optimized site copy generation
  - `src/services/geminiScout.ts` - Mass opportunity scouting
  - Uses Google Search tool for grounded analysis (not simulated data)

**Meta (WhatsApp Business API):**
- WhatsApp messaging integration (configured but not yet implemented)
  - Auth: `META_WA_CLIENT_ID` and `META_WA_ACCESS_TOKEN` env vars
  - Use case: Lead communication (planned feature)

## Data Storage

**Databases:**
- Firebase Firestore - Primary document database
  - Connection: `firebase` 12.12.1 SDK
  - Database ID: `ai-studio-54d0ce8d-6c36-4138-a9c7-40f9cb6e1d96`
  - Project ID: `soliwkr`
  - Auth: Google OAuth via Firebase Auth
  - Client initialization: `src/lib/firebase.ts`

**Firestore Collections & Schema:**
- `opportunities` - AI-researched niche opportunities
  - Fields: `niche`, `city`, `keywords`, `difficulty`, `searchVolume`, `estRevenue`, `aiAnalysis`, `createdAt`
  - Access rules: Signed-in users can read/create/update/delete

- `sites` - Rank and Rent website projects
  - Fields: `name`, `niche`, `city`, `domain`, `status` (enum: draft/published/rented), `contentId`, `ownerId`, `clientEmail`, `monthlyRent`, `createdAt`
  - Access rules: Users can read all, update/delete only own sites (`ownerId == request.auth.uid`)

- `leads` - Lead generation results from deployed sites
  - Fields: `siteId`, `customerName`, `customerEmail`, `customerPhone`, `message`, `status` (enum: new/contacted/qualified/closed), `createdAt`
  - Access rules: Signed-in can read/update/delete; public can create

**Firestore Security Rules:**
- File: `firestore.rules`
- Default: Deny all access
- Authentication helper: `isSignedIn()` checks `request.auth != null`
- Ownership validation: `isOwner(userId)` for update/delete operations
- ID validation: `isValidId(id)` ensures alphanumeric + hyphens + underscores (max 128 chars)
- Note: Lead creation is public (unauthenticated users can submit)

**Firebase Storage:**
- Bucket: `soliwkr.firebasestorage.app`
- Use case: Storing generated PDFs and site assets
- Client: Firebase SDK

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication with Google OAuth
  - Implementation: `src/lib/firebase.ts`
  - Provider: `GoogleAuthProvider` from Firebase
  - Sign-in method: `signInWithPopup(auth, googleProvider)`
  - Sign-out method: `firebaseSignOut(auth)`
  - Current user tracking: `onAuthStateChanged()` listener

**Google Service Account Auth:**
- JWT-based authentication for server-side Google APIs
- Environment variables needed:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY` or `GOOGLE_SERVICE_ACCOUNT_JSON`
  - `GOOGLE_ANALYTICS_ACCOUNT_ID`
- Implementation: `server.ts` line 51-57
- Key parsing: Handles both raw private key and full JSON credential formats

## Monitoring & Observability

**Error Tracking:**
- Console logging for development (no external error tracking configured)
- Firebase-specific error handling: `handleFirestoreError()` in `src/lib/firebase.ts`
  - Catches permission-denied errors
  - Returns user auth context in error messages

**Logs:**
- Console-based logging in development
- Server: `console.error()` and `console.log()` in `server.ts`
- Client: Browser console via React/JavaScript

**Health Check:**
- Endpoint: `GET /api/health` (Express route in `server.ts`)
- Response: `{ status: "ok" }`

## CI/CD & Deployment

**Hosting:**
- Cloudflare Pages (primary deployment target)
  - API tokens: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` env vars
  - Deployment trigger: `/api/deploy/cloudflare` (POST) in `server.ts`
  - Build artifact: `dist/` directory from Vite

- Express server deployment
  - Server file: `server.ts` (runs on port 3000)
  - Development: `npm run dev` (runs via tsx)
  - Production: Vite builds to `dist/`, server serves SPA

**Build Process:**
- `npm run build` - Vite production build (outputs to `dist/`)
- `npm run preview` - Local preview of production build
- `npm run clean` - Remove build artifacts
- `npm run dev` - Development server with Vite HMR

## Environment Configuration

**Required env vars:**
1. `GEMINI_API_KEY` - Google Generative AI API key (critical)
2. `APP_URL` - Base URL for the application (used in OAuth callbacks)
3. `CLOUDFLARE_API_TOKEN` - Cloudflare deployment automation
4. `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account reference
5. `META_WA_CLIENT_ID` - Meta/WhatsApp Business API
6. `META_WA_ACCESS_TOKEN` - Meta authentication token
7. `VOIP_API_KEY` - VoIP provider API key (placeholder)
8. `VOIP_API_SECRET` - VoIP provider secret (placeholder)
9. `GOOGLE_SERVICE_ACCOUNT_JSON` - Google Cloud service account (JSON string)

**Optional env vars:**
- `NODE_ENV` - Set to "production" for production deployment
- `DISABLE_HMR` - Set to "true" to disable Hot Module Replacement in Vite

**Secrets location:**
- `.env` file (local development, never committed)
- Environment variables injected at runtime in production
- AI Studio: Secrets panel for `GEMINI_API_KEY` injection

## Webhooks & Callbacks

**Incoming:**
- `/api/google/setup-asset` (POST) - Receives domain, configures Google Search Console and GA4
- `/api/deploy/cloudflare` (POST) - Triggers Cloudflare deployment
- `/api/scrape-site` (GET) - Receives URL, returns scraped HTML (CORS bypass)
- `/api/proof/generate` (POST) - Placeholder for PDF generation and Drive upload

**Outgoing:**
- Firebase/Firestore writes from client
- Google APIs calls from server:
  - Search Console site addition
  - GA4 property and stream creation
  - Web scraping via fetch API (for Cloudflare Pages)
- OAuth callbacks to `APP_URL` (configured in Firebase console)

**Data Flow for Site Setup:**
1. Client triggers site import via URL
2. Server scrapes HTML via `/api/scrape-site`
3. Gemini AI analyzes HTML content and extracts niche/services
4. Results stored in Firestore `sites` collection
5. Optional: `/api/google/setup-asset` configures monitoring

## Integration Points Summary

**Client-Side (React/Browser):**
- Firebase Auth (Google OAuth)
- Firestore real-time listeners
- Gemini API calls (via Vite env injection)
- Lucide icons, Motion animations, Recharts visualization

**Server-Side (Express/Node):**
- Google APIs (Search Console, Analytics, Auth)
- Web scraping (fetch API)
- Firestore operations
- Cloudflare deployment triggers
- Environment variable validation and parsing

---

*Integration audit: 2026-04-24*
