---
phase: 03
plan: 01
subsystem: ai-content-generation
tags:
  - database
  - schema
  - testing
  - tdd
  - uniqueIndex
  - D1
dependency:
  requires: []
  provides:
    - "uniqueIndex pages(project_id, slug) in D1 local"
    - "Test stubs RED for seed.test.ts (FACT-02-a/b/c/f)"
    - "Test stubs RED for prompts.test.ts (FACT-02-d/e)"
  affects:
    - "factory-core/src/db/schema.ts"
    - "factory-core/.wrangler/ (D1 local database)"
    - "factory-core/src/api/seed.test.ts"
    - "factory-core/src/services/prompts.test.ts"
tech_stack:
  added:
    - "drizzle-orm/sqlite-core: uniqueIndex helper"
  patterns:
    - "TDD RED phase: test stubs importing non-existent modules"
    - "Raw SQL D1 schema migration (idempotent CREATE INDEX)"
    - "Mock bindings pattern (DB, GOOGLE_AI_API_KEY, etc.)"
key_files:
  created:
    - "factory-core/src/api/seed.test.ts"
    - "factory-core/src/services/prompts.test.ts"
  modified:
    - "factory-core/src/db/schema.ts"
decisions:
  - "Used raw SQL (npx wrangler d1 execute) instead of drizzle-kit push to avoid interactive TTY requirement"
  - "Test stubs intentionally import non-existent seed.ts and sanitizeHtml to trigger proper RED state"
  - "Mock DB passed as { DB: {} as any } in test bindings to match leads.test.ts pattern"
metrics:
  duration: "15 minutes"
  completed_date: "2026-04-26"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 3 Plan 01: Database Schema Foundation + TDD Red Stubs

**One-liner:** Added uniqueIndex to pages table for upsert safety + created RED test stubs for seed API and PromptService validation — blocking dependencies for 03-02 GREEN implementation.

## Summary

Wave 0 — foundational tasks for Phase 3 execution. This plan completed two sequential tasks:

### Task 1: uniqueIndex on pages(project_id, slug)
- Modified `factory-core/src/db/schema.ts` to add `uniqueIndex('pages_project_slug_uniq')` helper import and applied it to the `pages` table definition
- Applied the index to the local D1 database via raw SQL: `CREATE UNIQUE INDEX IF NOT EXISTS pages_project_slug_uniq ON pages(project_id, slug)`
- Verified TypeScript compilation with `wrangler deploy --dry-run` — no errors
- **Why blocking:** Upsert operations in 03-02 require this index to prevent duplicate (project_id, slug) pairs in the database

### Task 2: TDD RED Test Stubs
Created two test files in RED state (tests fail on missing implementations, not syntax):

1. **seed.test.ts** — 4 test cases covering FACT-02-a/b/c/f:
   - Validation: missing `type` parameter → 400
   - Validation: invalid `type` → 400
   - Not found: non-existent projectId → 404
   - Error handling: finishReason ≠ STOP → 500 (placeholder for 03-02)
   - Intentionally imports `./seed` which doesn't exist yet → proper RED state

2. **prompts.test.ts** — test stubs for 5 new PromptService methods + sanitizeHtml:
   - Tests: generateHomepagePrompt, generateServicesPrompt, generateServiceZonesPrompt, generateBlogPrompt (FACT-02-d)
   - Tests: sanitizeHtml removing `<script>`, `<iframe>`, inline event handlers (FACT-02-e)
   - Intentionally imports `sanitizeHtml` from `../api/seed` (not exported yet) → proper RED state
   - Uses `(service as any)` to bypass TypeScript type checking on non-existent methods (Nyquist compliance)

## Execution Notes

- **TDD Gate Compliance:** RED phase completed. Tests fail on:
  - `src/api/seed.test.ts`: "Cannot find module './seed'" (expected)
  - `src/services/prompts.test.ts`: "Cannot find module '../api/seed'" (expected)
  - No TypeScript syntax errors detected — only missing imports (correct RED state)
  
- **Schema Migration:** Used raw SQL `CREATE UNIQUE INDEX IF NOT EXISTS` instead of drizzle-kit to avoid interactive TTY requirement during CI/CD

- **Mock Pattern:** Test bindings follow leads.test.ts pattern: `{ DB: {} as any, GOOGLE_AI_API_KEY: 'test', ... }`

## Must-Have Verification

| Truth | Status | Evidence |
|-------|--------|----------|
| La tabella pages ha un unique index su (project_id, slug) applicato al DB locale | PASS | `SELECT name FROM sqlite_master WHERE type='index' AND name='pages_project_slug_uniq'` returns 1 row |
| onConflictDoUpdate su (projectId, slug) non lancia errore SQLite | PENDING | Schema prepared; implementation tested in 03-02 GREEN |
| sanitizeHtml rimuove <script>, <iframe> e handler inline da qualsiasi stringa HTML | PENDING | Test stub created; implementation in 03-02 GREEN |
| I test RED di seed.test.ts e prompts.test.ts esistono e falliscono per mancanza dell'implementazione, non per errori di sintassi | PASS | Both files fail on module import errors, no syntax errors |

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Commit | Message |
|--------|---------|
| `77fe378` | feat(03-01): add uniqueIndex to pages table (project_id, slug) |
| `11c4de1` | test(03-01): add RED test stubs for seed API and PromptService |

## Next Steps (03-02)

- Implement GREEN phase: create `factory-core/src/api/seed.ts` with proper request handling and validation
- Implement GREEN phase: add 5 new PromptService methods (generateHomepagePrompt, etc.)
- Implement GREEN phase: export `sanitizeHtml` function with DOMPurify or similar HTML sanitization library
- Run `npx vitest run src/api/seed.test.ts src/services/prompts.test.ts` — all tests should pass in GREEN

## Self-Check

All created files verified to exist:
- `/home/soliwkr/Work/Codice/rankempire-italia/factory-core/src/api/seed.test.ts` — ✓ exists
- `/home/soliwkr/Work/Codice/rankempire-italia/factory-core/src/services/prompts.test.ts` — ✓ exists
- `/home/soliwkr/Work/Codice/rankempire-italia/factory-core/src/db/schema.ts` — ✓ modified (uniqueIndex added)

All commits verified:
- `77fe378` — ✓ found in git log
- `11c4de1` — ✓ found in git log

**Self-Check: PASSED**
