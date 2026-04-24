# Technology Stack

**Analysis Date:** 2026-04-24

## Languages

**Primary:**
- TypeScript 5.8.2 - Full application (server and client)
- JavaScript (transpiled) - Runtime execution

**Secondary:**
- JSON - Configuration and schema definitions
- CSS - Styling via Tailwind

## Runtime

**Environment:**
- Node.js (ES2022 target, ESNext modules)

**Package Manager:**
- npm 
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.0.0 - Frontend UI and components
- Express 4.21.2 - Backend HTTP server and API routes
- Vite 6.2.0 - Build tool and dev server

**UI & Styling:**
- Tailwind CSS 4.1.14 - Utility-first CSS framework
- @tailwindcss/vite 4.1.14 - Vite plugin for Tailwind
- Lucide React 0.546.0 - Icon library

**Animation & Motion:**
- Motion (Framer Motion) 12.23.24 - React animation library

**Content & Rendering:**
- React Markdown 10.1.0 - Markdown parsing and rendering

**Data Visualization:**
- Recharts 3.8.1 - Chart and graph components

**Development:**
- @vitejs/plugin-react 5.0.4 - React Fast Refresh for Vite
- tsx 4.21.0 - TypeScript execution for Node scripts

## Key Dependencies

**Critical:**
- firebase 12.12.1 - Backend services (Firestore database, Authentication, Storage)
- @google/genai 1.29.0 - Google Generative AI (Gemini API) integration
- googleapis 171.4.0 - Google APIs client (Search Console, Google Analytics 4, Analytics Admin)
- google-auth-library 10.6.2 - Google authentication and JWT handling

**Infrastructure:**
- express - HTTP server framework
- dotenv 17.2.3 - Environment variable loading
- autoprefixer 10.4.21 - CSS vendor prefixing
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 3.5.0 - Tailwind CSS class merging utility

**Type Definitions:**
- @types/express 4.17.21 - Express TypeScript definitions
- @types/node 22.14.0 - Node.js TypeScript definitions

## Configuration

**Environment:**
- `.env` file (see `.env.example` for required variables)
- 9 critical environment variables required:
  - `GEMINI_API_KEY` - Google Generative AI API key
  - `APP_URL` - Application deployment URL
  - `CLOUDFLARE_API_TOKEN` - Cloudflare Pages deployment
  - `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
  - `META_WA_CLIENT_ID` - Meta WhatsApp Business API credentials
  - `META_WA_ACCESS_TOKEN` - Meta WhatsApp access token
  - `VOIP_API_KEY` - VoIP provider API key
  - `VOIP_API_SECRET` - VoIP provider secret
  - `GOOGLE_SERVICE_ACCOUNT_JSON` - Google Cloud service account credentials (JSON string)

**Build:**
- `vite.config.ts` - Vite build configuration
  - React plugin enabled
  - Tailwind CSS plugin enabled
  - Path alias `@/*` maps to project root
  - Environment variable injection for `GEMINI_API_KEY`
  - HMR configurable via `DISABLE_HMR` env var

**TypeScript:**
- `tsconfig.json` - Compiler options
  - Target: ES2022
  - Module: ESNext with bundler resolution
  - JSX: react-jsx
  - Path alias: `@/*` → `./*`
  - Decorators enabled (experimental)

**Linting:**
- TypeScript compiler used for type checking (no ESLint config detected)
- Run: `npm run lint` (executes `tsc --noEmit`)

## Platform Requirements

**Development:**
- Node.js with npm
- TypeScript 5.8.2 or compatible
- Tailwind CSS 4.x support
- Modern browser with ES2022 support

**Production:**
- Node.js runtime for Express server (`server.ts`)
- Cloud environment with Vite build output (`dist/` directory)
- Environment variables must be injected at runtime
- Cloudflare Pages as deployment target (optional)
- Google Cloud project with service account credentials
- Firebase project with Firestore database
- Gemini API access

---

*Stack analysis: 2026-04-24*
