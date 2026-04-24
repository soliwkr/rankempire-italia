# Codebase Structure

**Analysis Date:** 2026-04-24

## Directory Layout

```
rankempire-italia/
├── src/                          # React frontend source code
│   ├── main.tsx                  # React app entry point (mounts App component)
│   ├── App.tsx                   # Root component (router, auth, Firestore subscriptions)
│   ├── index.css                 # Global Tailwind + custom CSS
│   ├── types.ts                  # Shared TypeScript interfaces (Opportunity, StepStatus, etc.)
│   ├── geotargets.json           # Italian city geotarget data for mass scouting
│   ├── components/
│   │   └── MassScout.tsx          # Mass market scouting UI with 5-step pipeline visualization
│   ├── lib/
│   │   └── firebase.ts            # Firebase init, auth, Firestore client, error handling
│   ├── services/
│   │   ├── gemini.ts              # PPL plan generation, site analysis, content generation
│   │   └── geminiScout.ts         # Market intelligence pipeline (brainstorm → rank opportunities)
│   └── templates/
│       └── GenericPPLTemplate.ts  # (Reserved) Template for PPL plan structure
├── server.ts                      # Express server with API routes (Google APIs, scraping)
├── index.html                     # HTML entry point (loads React root div)
├── package.json                   # Dependencies (React, Vite, Firebase, Gemini, Tailwind, etc.)
├── package-lock.json              # Locked dependency versions
├── tsconfig.json                  # TypeScript compiler configuration
├── vite.config.ts                 # Vite bundler & dev server config
├── firebase-applet-config.json    # Firebase project credentials (non-secret JSON)
├── firestore.rules                # Firestore security rules
├── firebase-blueprint.json        # (Blueprint) Firestore schema definitions
├── .env.example                   # Environment variable template (secrets reference only)
├── .gitignore                     # Git ignore patterns
├── README.md                      # Project documentation
├── metadata.json                  # Project metadata
└── .planning/                     # GSD documentation and planning (orchestrator-managed)
    └── codebase/                  # Architecture/tech stack analysis documents
```

## Directory Purposes

**src/ - React Frontend Source:**
- Purpose: All client-side code bundled by Vite
- Contains: Components, services, styles, type definitions, Firebase client initialization
- Key files: `App.tsx` (root), `main.tsx` (entry point), `types.ts` (shared types)

**src/components/ - Reusable React Components:**
- Purpose: Encapsulated UI components with local state management
- Contains: `MassScout.tsx` - standalone component for mass market opportunity discovery
- Key files: `MassScout.tsx` with internal step visualization and opportunity rendering

**src/lib/ - Shared Libraries & Utilities:**
- Purpose: Singleton clients and utility functions used across components
- Contains: Firebase app initialization, authentication helpers, Firestore subscriptions, error utilities
- Key files: `firebase.ts` - Firebase Auth, Firestore, and custom error handling

**src/services/ - Business Logic & API Integration:**
- Purpose: Encapsulate external API calls and AI reasoning logic
- Contains: Gemini API prompting, structured response generation, market intelligence algorithms
- Key files:
  - `gemini.ts` - Single niche PPL plan generation, site import analysis, content generation
  - `geminiScout.ts` - Mass scouting pipeline with Google Search grounding

**src/templates/ - Blueprint Templates:**
- Purpose: (Reserved for future) Reusable response schemas and prompt templates
- Contains: `GenericPPLTemplate.ts` (currently unused)
- Note: Consider moving structured schemas here as codebase grows

**Root Level - Configuration & Server:**
- Purpose: Build config, runtime config, server entry point
- Contains:
  - `server.ts` - Express server with API routes
  - `tsconfig.json` - TypeScript compilation settings
  - `vite.config.ts` - Frontend bundler configuration
  - `package.json` - Dependencies and scripts
  - `firebase-applet-config.json` - Firebase credentials (non-secret JSON config)
  - `firestore.rules` - Database security rules

**Firebase Configuration Files:**
- `firebase-applet-config.json` - Contains non-secret Firebase config (project ID, auth domain, database URL)
- `firebase-blueprint.json` - (Informational) Describes expected Firestore collection structure
- `.env.example` - Shows required secret env vars (SERVICE ACCOUNT KEY, ANALYTICS ID, etc.)

## Key File Locations

**Entry Points:**
- `index.html`: Browser entry point; loads React root element and main.tsx
- `src/main.tsx`: React app bootstrap; mounts App component into DOM
- `src/App.tsx`: Application root; manages tabs, auth, all UI flows
- `server.ts`: Express server entry point; handles API routes and middleware

**Configuration:**
- `tsconfig.json`: TypeScript compiler options (target: ES2022, path aliases `@/*` → root)
- `vite.config.ts`: Frontend bundler setup (React plugin, Tailwind, dev server HMR, path alias)
- `package.json`: npm dependencies and scripts (`dev`, `build`, `preview`, `lint`, `clean`)
- `firebase-applet-config.json`: Firebase project config (loaded in `src/lib/firebase.ts`)

**Core Logic:**
- `src/services/gemini.ts`: AI-driven PPL plan generation and site analysis
- `src/services/geminiScout.ts`: Multi-step market intelligence pipeline
- `src/lib/firebase.ts`: Firebase client initialization and authentication
- `server.ts`: Backend API routes (Google APIs, site scraping, deployment hooks)

**UI Components:**
- `src/App.tsx`: Main application component; renders all tabs and flows
- `src/components/MassScout.tsx`: Market scouting UI with step visualization and opportunity cards
- `src/index.css`: Global styles (Tailwind imports)

**Testing:**
- No test files found; testing infrastructure not yet implemented

**Type Definitions:**
- `src/types.ts`: Shared TypeScript interfaces (StepStatus, AnalysisStep, ServiceCpc, ServiceTrend, Opportunity)

## Naming Conventions

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `MassScout.tsx`, `App.tsx`)
- Services & utilities: camelCase with `.ts` extension (e.g., `gemini.ts`, `firebase.ts`)
- Config files: kebab-case or specific names (e.g., `vite.config.ts`, `tsconfig.json`)
- Data files: lowercase with descriptive names (e.g., `geotargets.json`, `metadata.json`)

**Directories:**
- src subdirectories: lowercase plural when holding multiple items (e.g., `components/`, `services/`, `lib/`)
- Config directories: lowercase with hyphens for multi-word (e.g., `.planning/`)

**TypeScript Identifiers:**

**Functions:**
- Service functions: camelCase, verb-action prefix (e.g., `generatePplPlan()`, `estimateCpc()`, `analyzeDemand()`)
- Component functions: PascalCase (React convention) (e.g., `MassScout()`, `App()`)
- Utility functions: camelCase (e.g., `cn()` for className merge, `handleFirestoreError()`)

**Variables:**
- React state: camelCase (e.g., `pplPlan`, `isAnalyzing`, `selectedCities`)
- Component props: PascalCase for types, camelCase for instances
- Constants: UPPER_SNAKE_CASE for global constants (e.g., `SYSTEM_INSTRUCTION`, `ITALIAN_CITIES`)

**Types:**
- Interfaces: PascalCase with I prefix optional, typically no prefix in this codebase (e.g., `Opportunity`, `ServiceCpc`, `AnalysisStep`, `FirestoreErrorInfo`)
- Enums: PascalCase (e.g., `StepStatus` with UPPER_CASE values like `PENDING`, `RUNNING`)

**CSS/Tailwind:**
- Class names: Tailwind utilities only; no custom classes observed
- Component styling: Inline className attributes with clsx/twMerge utility helpers

## Where to Add New Code

**New Feature (Market Intelligence Focus):**
- Primary code: `src/services/gemini.ts` or new file `src/services/gemini[Feature].ts`
- UI for feature: Add new tab in `src/App.tsx` or new component in `src/components/`
- Tests: Create `src/services/gemini[Feature].test.ts` (testing infra needed)
- Example: New "Competitor Analysis" feature would go in `src/services/geminiCompetitor.ts`

**New Component/Module (UI):**
- Implementation: `src/components/[ComponentName].tsx`
- Styling: Use Tailwind utilities inline in className attributes
- State management: Use React hooks (useState, useEffect, useCallback) for local state
- External data: Use Firebase subscriptions or fetch calls to server

**Utilities & Helpers:**
- Shared helpers: `src/lib/` directory
- Example: New Firebase query helpers → `src/lib/firebase[Feature].ts`
- Example: New validation utilities → `src/lib/validators.ts`

**API Routes (Backend):**
- New endpoints: Add route handlers to `server.ts`
- Pattern: `app.post('/api/[feature]/[action]', async (req, res) => { ... })`
- Example: New Google Sheets integration → Add POST `/api/google/sync-sheets` to `server.ts`

**Type Definitions:**
- Shared types: Add to `src/types.ts`
- Component-specific types: Define in component file above component function

**Firebase Collections:**
- New collection: Reference in `src/lib/firebase.ts` (e.g., `collection(db, 'newCollection')`)
- Query subscriptions: Add `onSnapshot()` in App.tsx useEffect
- Schema documentation: Update `firebase-blueprint.json`

## Special Directories

**node_modules/ - Dependencies:**
- Purpose: Installed npm packages (React, Firebase, Gemini SDK, Tailwind, Vite, etc.)
- Generated: Yes (created by `npm install`)
- Committed: No (.gitignore)

**.planning/codebase/ - Architecture Documentation:**
- Purpose: GSD-managed codebase maps (this file, ARCHITECTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md)
- Generated: Yes (by `/gsd-map-codebase` agent)
- Committed: Yes (tracked in git)
- Note: Read-only reference for other GSD agents; do not manually edit

**.env / .env.local - Environment Variables:**
- Purpose: Runtime secrets and configuration (API keys, database URLs, service account credentials)
- Generated: No (manually created from .env.example)
- Committed: No (.gitignore protects secrets)
- Note: Must be present locally for development; declare required vars in .env.example

**dist/ - Production Build Output:**
- Purpose: Compiled JavaScript, CSS, and assets for deployment
- Generated: Yes (by `vite build`)
- Committed: No (created at build time, ignored by git)
- Contains: Minified frontend bundles, static assets

**firebase-applet-config.json - Firebase Config:**
- Purpose: Non-secret Firebase project configuration (project ID, auth domain, database URL)
- Generated: No (copied from Firebase Console)
- Committed: Yes (safe to track; no credentials contained)
- Note: Do not confuse with service account JSON key (which goes in .env)

**.git / .gitignore - Version Control:**
- Purpose: Git repository metadata and ignore patterns
- Contains: .gitignore specifies: node_modules/, dist/, .env files, IDE config
- Committed: Yes (git metadata essential for collaboration)

---

*Structure analysis: 2026-04-24*
