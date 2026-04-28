# Testing Patterns

**Analysis Date:** 2026-05-14

## Test Framework

**Runner:**
- `vitest`
- Config: `factory-core/vitest.config.ts`

**Assertion Library:**
- Built-in `expect` (Vitest).

**Run Commands:**
```bash
npm test              # (Assumed)
```

## Test File Organization

**Location:**
- Co-located with source code (`src/api/sites.test.ts`).

**Naming:**
- `*.test.ts`.

## Test Structure

**Suite Organization:**
```typescript
describe('component name', () => {
  it('does something', async () => {
    // ...
  });
});
```

## Mocking

**Framework:** 
- Manual mocking/Stubbing (e.g., `makeMockD1` helper).

**Patterns:**
- Mocking D1Database bindings by simulating the `prepare().bind().raw()` chain used by Drizzle ORM.

## Coverage

**Requirements:** 
- Not detected.

## Test Types

**Unit Tests:**
- Schema validation, data transformations.

**Integration Tests:**
- API router behavior with mocked database (`factory-core/src/tests/integration/`).

**E2E Tests:**
- Workflow-level automation tests (`factory-core/src/tests/e2e/`).

## Common Patterns

**Async Testing:**
- Tests are `async` and use `await` to trigger Hono requests.

**Error Testing:**
- Asserting expected status codes (404, 500) and JSON responses.

---

*Testing analysis: 2026-05-14*
