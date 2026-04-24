# Architecture

**Analysis Date:** 2026-04-24

## Pattern Overview

**Overall:** Full-stack Isomorphic JavaScript/TypeScript application with monolithic UI-driven architecture combining client-side React frontend, server-side Express backend, and AI-powered backend services using Google Gemini API.

**Key Characteristics:**
- UI-first architecture: React (19.0.0) with Vite (6.2.0) bundler handling all navigation and state management
- Express (4.21.2) server provides middleware and API routing for third-party integrations
- AI integration via Google Gemini 3-Flash and 3.1-Pro APIs with grounded web search capabilities
- Real-time data persistence using Firebase Firestore with reactive subscriptions
- Hybrid development: Vite dev server with Express middleware for serving in both dev and production modes

## Layers

**Presentation / UI Layer:**
- Purpose: Render interactive UI components and manage user interactions
- Location: `src/` directory (React/TSX files)
- Contains: React components, hooks, styling (Tailwind CSS), icon systems (Lucide), animations (Motion)
- Depends on: Services layer (Gemini/Firestore), shared utility functions, type definitions
- Used by: User browser, accessed via `index.html` entry point

**Services Layer:**
- Purpose: Encapsulate API calls, AI reasoning, and business logic for market intelligence and data analysis
- Location: `src/services/` directory
- Contains: 
  - `gemini.ts` - AI prompt engineering and structured generation (PPL plans, site content, niche research)
  - `geminiScout.ts` - Multi-step market scouting pipeline with Google Search grounding
- Depends on: Google Gemini API client (`@google/genai`), type definitions
- Used by: App.tsx, MassScout.tsx component

**Integration Layer:**
- Purpose: Manage external API authentication and client initialization
- Location: `src/lib/firebase.ts`
- Contains: Firebase app initialization, auth helpers (Google OAuth), Firestore client setup, error handling utilities
- Depends on: Firebase SDK, Firebase configuration file
- Used by: App.tsx for auth state management and real-time database subscriptions

**Data / Backend Layer:**
- Purpose: Provide server-side APIs for Google integrations, file operations, and future webhook handling
- Location: `server.ts` (root level)
- Contains:
  - Health check endpoints (`/api/health`)
  - Google APIs setup (`/api/google/setup-asset` - Search Console and GA4 property creation)
  - Site scraping proxy (`/api/scrape-site` - CORS bypass)
  - Deployment triggers (`/api/deploy/cloudflare` - placeholder)
  - Proof package generation (`/api/proof/generate` - placeholder)
- Depends on: Express.js, Google APIs client library (`googleapis`), dotenv for secrets
- Used by: Frontend making HTTP requests, served via Express on port 3000

**Configuration & Build Layer:**
- Purpose: Define compilation, bundling, and environment configuration
- Location: Root level files
- Contains:
  - `tsconfig.json` - TypeScript compiler configuration (ES2022 target, JSX support, path aliases)
  - `vite.config.ts` - Vite bundler configuration (React plugin, Tailwind integration, dev server HMR)
  - `package.json` - Dependencies and npm scripts
  - `firebase-applet-config.json` - Firebase credentials (non-secret JSON config)
  - `.env.example` - Environment variable template (secrets reference only)
- Depends on: Node.js tooling
- Used by: Build process, development server, production deployment

## Data Flow

**Authentication Flow:**

1. User clicks "Accedi con Google" button in App.tsx
2. Google OAuth popup triggered via `signInWithGoogle()` from `src/lib/firebase.ts`
3. Firebase Auth manages session; `onAuthStateChanged()` hook subscribes to user state
4. User object updates React state in `App.tsx`; authenticated content renders
5. User can sign out via `signOut()` button, clearing session

**Market Intelligence Analysis Flow (Single PPL):**

1. User enters niche + city in Intelligence tab UI (App.tsx)
2. Clicks "Analizza Opportunità Grounded"
3. `generatePplPlan(niche, city)` called from `src/services/gemini.ts`
4. Gemini API receives structured prompt with system instruction
5. Gemini uses `googleSearch` tool to ground analysis in real SERP/competitor data
6. Response formatted as JSON matching PPL battle plan schema
7. Results displayed in UI with keyword tables, profit projections, ad copy examples
8. Data saved to Firestore `opportunities` collection with `serverTimestamp()`

**Mass Scouting Analysis Flow:**

1. User selects Italian cities in geotarget panel (MassScout.tsx)
2. Clicks "Avvia Mass Scouting"
3. Five-step pipeline begins:
   - Step 1: `brainstormServices()` - Generates 50 local service categories via Gemini
   - Step 2: `estimateCpc()` - Estimates CPC costs for top 20 services using Google Search grounding
   - Step 3: `analyzeDemand()` - Identifies growth trends; filters declining sectors
   - Step 4: `analyzeCompetition()` - Scans real SERPs for weak competitors, slow sites, low GMB ratings across selected cities
   - Step 5: Sorts opportunities by `potentialRentValue`, returns top 10
4. Each step updates UI progress indicator
5. Final report displayed with opportunity cards (service name, city, profit projection, action button)

**Site Import Flow (Cloudflare):**

1. User clicks "Importa da Cloudflare" button
2. Prompts for Cloudflare Pages URL
3. Frontend calls `/api/scrape-site` endpoint (Express server)
4. Server fetches HTML content, bypasses CORS, returns raw HTML
5. Frontend calls `analyzeCloudflareSite(html, url)` from `src/services/gemini.ts`
6. Gemini extracts niche, city, services, SEO rating from HTML
7. Results saved to Firestore `sites` collection

**Google Assets Setup Flow:**

1. User clicks "Setup Google APIs" on a site card
2. Frontend POST to `/api/google/setup-asset` with domain
3. Server validates environment variables (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_ANALYTICS_ACCOUNT_ID`)
4. Server parses private key from environment
5. Creates JWT auth client with Google APIs
6. Calls Search Console API to add site
7. Calls Analytics Admin API to create GA4 property and web data stream
8. Returns results to frontend; user sees confirmation/error alert

**Real-time Data Synchronization:**

1. App.tsx uses `onSnapshot()` subscriptions (from `firebase/firestore`) for three collections: `opportunities`, `sites`, `leads`
2. Each subscription listens for real-time document changes
3. On create/update/delete, Firebase calls callback with snapshot
4. React state updated immediately
5. UI re-renders with fresh data
6. Unsubscribe functions cleanup on component unmount

**State Management:**

- React local state (useState) handles:
  - Active tab navigation (`activeTab`)
  - UI input fields (niche, city, search filters)
  - Loading and analysis states (`isAnalyzing`, `loading`)
  - Generated content (PPL plans, opportunities)
  - Form submissions (import URL prompts)
- Firebase Firestore serves as single source of truth for persistent data:
  - `opportunities` collection: PPL analysis results
  - `sites` collection: Managed properties with SEO ratings, rental status
  - `leads` collection: Contact leads and CRM data
- No centralized state management library (Redux/Zustand); all state either local or Firebase-driven

## Key Abstractions

**PPL Battle Plan Generator:**
- Purpose: Create comprehensive pay-per-lead marketing strategies grounded in real market data
- Examples: `src/services/gemini.ts` - `generatePplPlan()` function
- Pattern: Prompt-driven AI generation with structured JSON output; uses Google Search grounding to avoid hallucination

**Nexus Mass Scoping Engine:**
- Purpose: Automate discovery of high-value service/location combinations across Italian markets
- Examples: `src/services/geminiScout.ts` with five-step pipeline
- Pattern: Sequential AI calls with schema-driven responses; parallelizable via batch API calls

**Site Import & Analysis:**
- Purpose: Reverse-engineer Cloudflare-hosted sites to extract SEO and niche metadata
- Examples: `analyzeCloudflareSite()` in `src/services/gemini.ts`
- Pattern: HTML scraping proxy + Gemini vision/extraction

**Firebase Real-time Sync:**
- Purpose: Keep UI in sync with backend database without polling
- Examples: Subscriptions in App.tsx `useEffect()`
- Pattern: onSnapshot listeners with cleanup

## Entry Points

**Client Entry Point:**
- Location: `index.html` (root level)
- Triggers: Browser loads application
- Responsibilities: Define HTML shell, load React root element, bootstrap main.tsx

**React Entry Point:**
- Location: `src/main.tsx`
- Triggers: Called from index.html script tag
- Responsibilities: Mount React app into DOM via `createRoot().render()`

**App Component (Root Router):**
- Location: `src/App.tsx`
- Triggers: Mounted by main.tsx
- Responsibilities:
  - Manage authentication state
  - Subscribe to Firestore real-time updates (opportunities, sites, leads)
  - Render tab navigation (dashboard, intelligence, sites, crm, settings)
  - Orchestrate all major UI flows
  - Handle API calls to Express server

**Server Entry Point:**
- Location: `server.ts` (root level)
- Triggers: `npm run dev` or production startup
- Responsibilities:
  - Initialize Express app
  - Configure middleware (JSON, URL encoding)
  - Define API routes for Google integrations, scraping, deployment
  - Integrate Vite middleware (dev mode) or serve static dist/ (production)
  - Listen on port 3000

## Error Handling

**Strategy:** Multi-layered error handling with user-friendly alerts and console logging for debugging.

**Patterns:**

**Firebase/Firestore Errors:**
- Caught in `handleFirestoreError()` utility from `src/lib/firebase.ts`
- Checks for `permission-denied` code; throws detailed error object with auth context
- UI catches and displays alert to user

**Gemini API Errors:**
- Try/catch in service functions (`src/services/gemini.ts`, `src/services/geminiScout.ts`)
- JSON parsing errors handled with fallback extraction regex
- App.tsx catches and alerts user: "Errore durante l'analisi. Verifica la API Key e riprova."

**Network/Fetch Errors:**
- API calls (e.g., `/api/scrape-site`) wrapped in try/catch
- Server-side errors returned as JSON `{ error: "message" }`
- Frontend checks response for `.error` field; throws custom Error for catch blocks

**Google APIs Server Errors:**
- `server.ts` routes check for missing environment variables upfront
- JWT auth failures caught and returned as 500 with "Failed to authenticate or initialize Google APIs"
- Individual API calls (Search Console, Analytics) wrapped in try/catch with result objects

## Cross-Cutting Concerns

**Logging:** 
- Console logging via `console.error()` and `console.log()` in services and components
- No structured logging library; outputs to browser/server console
- Errors logged before user alert for debugging

**Validation:**
- Environment variable validation in `server.ts` before API calls
- Client-side button disable states prevent invalid submissions (e.g., missing niche/city)
- Firestore rules via `firestore.rules` file define backend access control

**Authentication:**
- Google OAuth 2.0 via Firebase Auth
- Session persisted in `auth.currentUser`
- `onAuthStateChanged()` automatically re-authenticates on page reload
- User UID stored in Firestore documents for data isolation

---

*Architecture analysis: 2026-04-24*
