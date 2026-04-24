# Testing Patterns

**Analysis Date:** 2026-04-24

## Test Framework

**Runner:**
- Not detected: No test framework configured (no Jest, Vitest, or other test runners)
- No test configuration files found (`jest.config.ts`, `vitest.config.ts`, etc.)
- No test dependencies in `package.json`

**Assertion Library:**
- Not applicable (no testing framework)

**Run Commands:**
```bash
npm run lint              # TypeScript type checking (tsc --noEmit)
npm run build             # Vite build
npm run dev               # Development server with tsx
npm run preview           # Preview build output
```

**Current Testing Status:**
- No automated tests implemented
- Code relies on TypeScript type checking as primary safety mechanism
- Manual testing required via development server

## Test File Organization

**Location:**
- Not applicable; no test files exist in codebase
- No dedicated `__tests__` or `tests/` directories found

**Naming:**
- Not applicable; no test naming convention established

**Structure:**
- Not applicable

## Test Structure

**Suite Organization:**
- Not established; no test suites present

**Patterns:**
- No setup/teardown patterns implemented
- No assertion patterns defined

## Mocking

**Framework:**
- Not applicable (no testing framework)

**Patterns:**
- Manual mocking through dependency injection is feasible but not currently used
- API mocking would need to be handled via fetch mocking libraries

**What to Mock:**
- Not yet established

**What NOT to Mock:**
- Not yet established

## Fixtures and Factories

**Test Data:**
- Not applicable; no test fixtures exist
- Example data exists in source: `geotargets.json` imported in `MassScout.tsx` for city data
- Mock/placeholder data hardcoded in UI (e.g., KPI values in dashboard component)

**Location:**
- Data files: `src/geotargets.json`
- Configuration: `firebase-applet-config.json` (not in repo; environment-sourced)

## Coverage

**Requirements:**
- Not enforced; no coverage thresholds configured

**View Coverage:**
- Not applicable (no test runner configured)

## Test Types

**Unit Tests:**
- Not implemented
- Candidates for testing: 
  - `src/services/gemini.ts` functions (API response parsing, prompt generation)
  - `src/services/geminiScout.ts` functions (JSON parsing, data transformation)
  - `src/lib/firebase.ts` error handling functions

**Integration Tests:**
- Not implemented
- Candidates:
  - Firebase authentication flow
  - Gemini API integration with response handling
  - Firestore CRUD operations

**E2E Tests:**
- Not implemented
- Would benefit from testing:
  - User login flow
  - Analysis workflow (Intelligence tab → results display)
  - Site import from Cloudflare
  - Lead management operations

## Common Patterns

**Async Testing:**
- Not yet established (no test framework)
- Current pattern in components: async handlers wrapped in try-catch blocks

Example from `App.tsx`:
```typescript
const handleAnalyzeIntelligence = async () => {
  if (!niche || !city) return;
  setIsAnalyzing(true);
  setPplPlan(null);
  try {
    const plan = await generatePplPlan(niche, city);
    setPplPlan(plan);
    await addDoc(collection(db, 'opportunities'), {
      niche,
      city,
      plan,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error(e);
    alert('Errore durante l\'analisi. Verifica la API Key e riprova.');
  }
  setIsAnalyzing(false);
};
```

**Error Testing:**
- No error testing framework in place
- Current pattern: console.error logging and user alert feedback
- Example from `firebase.ts`:
```typescript
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
```

## Testing Recommendations

**Immediate Needs:**
1. Add Vitest or Jest for unit testing async service functions
2. Configure React Testing Library for component tests
3. Add test files co-located with source or in `src/__tests__` directory
4. Set up CI/CD to run tests on pull requests

**High-Priority Test Areas:**
1. **`src/services/gemini.ts`** - JSON parsing and prompt generation
   - Test safe JSON parsing with various response formats
   - Validate prompt construction with different input parameters
2. **`src/services/geminiScout.ts`** - API response handling and data transformation
   - Test schema-compliant responses
   - Test fallback handling for missing fields
3. **`src/lib/firebase.ts`** - Error handling and auth flows
   - Test permission-denied error handling
   - Test auth state changes

**Component Testing:**
- `MassScout.tsx` - Test city selection, analysis workflow state transitions
- `App.tsx` - Test tab navigation, authentication state, data loading

---

*Testing analysis: 2026-04-24*
