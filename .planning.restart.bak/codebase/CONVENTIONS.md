# Coding Conventions

**Analysis Date:** 2026-04-24

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` — e.g., `MassScout.tsx`, `App.tsx`
- Services (pure logic): camelCase `.ts` — e.g., `gemini.ts`, `geminiScout.ts`
- Library/utility modules: camelCase `.ts` — e.g., `firebase.ts`
- Type definition files: camelCase `.ts` — e.g., `types.ts`
- Templates: PascalCase `.ts` — e.g., `GenericPPLTemplate.ts`

**Functions:**
- Event handlers: `handle` prefix, camelCase — e.g., `handleAnalyzeIntelligence`, `handleImportCloudflare`, `handleStartAnalysis`
- Exported service functions: camelCase — e.g., `generatePplPlan`, `researchNiche`, `analyzeCloudflareSite`, `brainstormServices`
- Utility/helper functions defined inside files: camelCase — e.g., `parseSafeJson`, `cn`, `classNameMerge`

**Variables and State:**
- React state: camelCase noun or noun phrase — e.g., `isAnalyzing`, `finalReport`, `selectedCities`, `pplPlan`
- Boolean state: `is`/`has` prefix — e.g., `isAnalyzing`, `importingCf`
- Constants: `UPPER_SNAKE_CASE` for module-level constants — e.g., `ITALIAN_CITIES`, `SYSTEM_INSTRUCTION`

**Types and Interfaces:**
- Interfaces: PascalCase — e.g., `AnalysisStep`, `FirestoreErrorInfo`, `ServiceCpc`, `Opportunity`
- Enums: PascalCase name, UPPER_SNAKE_CASE values — e.g., `StepStatus.PENDING`, `StepStatus.RUNNING`
- Type aliases: PascalCase — e.g., `ClassValue`

## Code Style

**Formatting:**
- No dedicated Prettier config detected; TypeScript compiler enforced via `tsc --noEmit` (`lint` script in `package.json`)
- No ESLint config detected

**Linting:**
- Only TypeScript type-checking: `tsc --noEmit`
- No ESLint or Biome configured

**TypeScript Config:**
- Target: `ES2022`, module: `ESNext`, JSX: `react-jsx`
- Path alias `@/*` mapped to project root (`./`)
- `allowJs: true` — JavaScript files accepted
- `skipLibCheck: true` — third-party declaration issues suppressed
- `noEmit: true` — Vite handles transpilation

## Import Organization

**Order (observed pattern):**
1. React and React hooks (`react`, `react-dom`)
2. Third-party UI/animation libraries (`motion/react`, `lucide-react`, `clsx`, `tailwind-merge`)
3. Internal lib modules (e.g., `./lib/firebase`)
4. Internal services (e.g., `./services/gemini`)
5. Internal components (e.g., `./components/MassScout`)
6. Internal types (e.g., `../types`)
7. JSON/data imports (e.g., `../geotargets.json`)

**Path Aliases:**
- `@/*` → project root, configured in `tsconfig.json` and `vite.config.ts`
- In practice, files use relative imports (`./`, `../`) rather than the `@` alias

## Error Handling

**Client-side Patterns:**
- Try/catch with `console.error` + `alert()` for user-visible errors in event handlers (`App.tsx`)
- Error state variable (`const [error, setError] = useState<string | null>(null)`) used in `MassScout.tsx`
- Errors displayed inline via conditional JSX (rose-coloured alert box)
- Catch blocks typed as `e: any` — no structured error typing on caught values

**Server-side Patterns:**
- Express handlers use try/catch; inner API calls also wrapped individually (see `/api/google/setup-asset`)
- Errors logged with `console.error` then sent as `res.status(5xx).json({ error: string })`
- `instanceof Error` guard before reading `.message` (see `/api/scrape-site`)

**Firebase Error Helper:**
- `handleFirestoreError` in `src/lib/firebase.ts` serialises `permission-denied` errors into a JSON-structured `Error`; rethrows all others

**JSON Parsing:**
- `parseSafeJson` in `src/services/geminiScout.ts` strips markdown code fences before parsing; falls back to regex extraction if initial parse fails
- Gemini responses always guarded with `|| '{}'` before `JSON.parse`

## Logging

**Framework:** `console` (no logging library)

**Patterns:**
- `console.error(e)` in every catch block — both client and server
- No `console.log` or `console.info` in business logic paths
- Server startup logged via `console.log` in `startServer()`

## Comments

**When to Comment:**
- Block comments (`// ----`) used to section service files — e.g., `// ADVANCED PPL PLAN GENERATOR`
- Inline comments explain non-obvious decisions — e.g., `// Truncated per limiti di context`, `// HMR is disabled in AI Studio`
- JSDoc/TSDoc: Not used

**UI Comments:**
- JSX sections marked with HTML comments (`{/* Header Navigation */}`, `{/* Stats Sidebar */}`) to orient within large render blocks

## Function Design

**Size:**
- Service functions are single-responsibility and short (< 30 lines of business logic)
- `App.tsx` contains a monolithic component (~670 lines) with all tab views inline — not split into sub-components

**Parameters:**
- Service functions accept primitives (strings, arrays) and return typed promises
- Optional parameters use TypeScript optional syntax: `gmbUrl?: string`

**Return Values:**
- All async service functions return `JSON.parse(...)` output, untyped (`any`)
- Event handlers return `void`; async handlers may `return` early on validation failure

## Module Design

**Exports:**
- Services use named `export const` / `export async function` — no default exports from service files
- Components use `export function` for named export (`MassScout`) and `export default function` for the root component (`App`)
- Library modules export named functions and constants (`db`, `auth`, `signInWithGoogle`, etc.)

**Barrel Files:**
- Not used — each file is imported directly by path

## Utility Helpers

**`cn` / `classNameMerge` (Tailwind class merging):**
- `cn` defined inline in `src/App.tsx` using `clsx` + `tailwind-merge`
- `classNameMerge` defined inline in `src/components/MassScout.tsx` — same implementation, duplicated
- No shared utility module for this helper; each file declares its own

## Type Safety

**Observed weaknesses:**
- `any[]` used for Firestore document arrays (`opportunities`, `sites`, `leads` state in `App.tsx`)
- Caught errors typed as `e: any` in most catch blocks
- Gemini service return types are `any` (result of `JSON.parse`)
- `e: any` cast used explicitly in some handlers: `catch (e: any)`

---

*Convention analysis: 2026-04-24*
