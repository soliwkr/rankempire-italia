# Testing Patterns

**Analysis Date:** 2026-04-24

## Test Framework

**Runner:**
- Not configured — no test runner is present in this project

**Assertion Library:**
- Not configured

**Config files:**
- No `jest.config.*`, `vitest.config.*`, or any test runner config found

**Run Commands:**
```bash
# No test script defined in package.json
# "scripts" contains only: dev, build, preview, clean, lint
```

## Current State

No tests exist in this codebase. The `src/` directory contains zero `.test.*` or `.spec.*` files. The only test files found in the repository are inside `factory-core/node_modules/` (third-party dependency test files — not project tests).

## What Exists Instead of Tests

**Type checking** serves as the sole automated code quality gate:
```bash
npm run lint   # runs: tsc --noEmit
```
This catches TypeScript type errors but does not verify runtime behavior.

## Test Coverage Gaps

**All application logic is untested.** Key risk areas:

**`src/services/gemini.ts`:**
- `generatePplPlan` — parses freeform Gemini JSON; fragile if model output format changes
- `researchNiche`, `analyzeCloudflareSite`, `generateSiteContent` — all `JSON.parse` without validation
- No schema validation after parse; callers receive `any`

**`src/services/geminiScout.ts`:**
- `parseSafeJson` — fallback regex extraction; untested edge cases
- `estimateCpc`, `analyzeDemand`, `analyzeCompetition` — chained multi-step pipeline with no unit tests at any stage
- `analyzeCompetition` uses a different model (`gemini-3.1-pro-preview`) than the others — model mismatch untested

**`src/lib/firebase.ts`:**
- `handleFirestoreError` — error serialisation logic untested
- `testConnection()` called at module load time with no test isolation

**`src/App.tsx`:**
- `handleAnalyzeIntelligence` — async event handler with Firestore write; untested
- `handleImportCloudflare` — fetch + AI analysis + Firestore write chain; untested

**`server.ts`:**
- `/api/google/setup-asset` — JWT auth + GSC + GA4 API calls; untested
- `/api/scrape-site` — CORS proxy endpoint; untested
- No integration tests for any Express routes

## Recommended Testing Approach (if tests are added)

**Framework recommendation:**
- Vitest — compatible with Vite's ESM setup and `vite.config.ts`; no additional bundler config needed

**Install:**
```bash
npm install -D vitest @vitest/ui happy-dom
```

**Config (add to `vite.config.ts` or separate `vitest.config.ts`):**
```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
  },
});
```

**Recommended test file locations:**
- Co-locate with source: `src/services/gemini.test.ts`, `src/lib/firebase.test.ts`
- Or separate: `src/__tests__/`

**Priority test targets (highest risk → lowest):**

1. `parseSafeJson` in `src/services/geminiScout.ts` — pure function, easy to unit test:
```typescript
// Example pattern
import { describe, it, expect } from 'vitest';
// parseSafeJson needs to be exported first
describe('parseSafeJson', () => {
  it('strips markdown code fences and parses JSON', () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(parseSafeJson(input)).toEqual({ key: 'value' });
  });
  it('falls back to regex extraction on malformed JSON', () => {
    const input = 'Some text {"key": "value"} more text';
    expect(parseSafeJson(input)).toEqual({ key: 'value' });
  });
});
```

2. `handleFirestoreError` in `src/lib/firebase.ts` — pure error-transform logic, easy to isolate

3. Express route handlers in `server.ts` — use `supertest` for HTTP-level integration tests

**Mocking approach (for Gemini API calls):**
```typescript
import { vi } from 'vitest';
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({ text: '{"services": ["idraulico"]}' }),
    },
  })),
}));
```

**Mocking approach (for Firebase):**
```typescript
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'test-id' }),
  collection: vi.fn(),
}));
```

## Test Types

**Unit Tests:**
- Not present. Recommended for: service functions in `src/services/`, utility helpers (`parseSafeJson`, `handleFirestoreError`, `cn`)

**Integration Tests:**
- Not present. Recommended for: Express API routes in `server.ts`

**E2E Tests:**
- Not used. No Playwright, Cypress, or similar configured.

**Component Tests:**
- Not present. React component testing would require `@testing-library/react` with Vitest

---

*Testing analysis: 2026-04-24*
