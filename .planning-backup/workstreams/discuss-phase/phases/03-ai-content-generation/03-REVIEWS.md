---
phase: 3
reviewers: [opencode]
reviewed_at: 2026-04-26T15:20:00Z
plans_reviewed: [03-01-PLAN.md, 03-02-PLAN.md, 03-03-PLAN.md]
notes: Gemini CLI quota esaurita (reset ~22h). OpenCode unico reviewer disponibile.
---

# Cross-AI Plan Review — Phase 3

## OpenCode Review

# Phase 3 Plan Review

## Summary

The three plans cover a reasonable implementation path: foundation (unique index + test stubs) → core implementation (PromptService + endpoint) → orchestration (seed script + E2E verification). The plans acknowledge the D-01 through D-13 decisions and map them to tasks. However, there are several architecture and dependency issues that need clarification before execution, particularly around the AiService duplication and the sanitized HTML import path.

## Strengths

- **Good TDD discipline**: Plan 01 correctly creates RED test stubs before implementation
- **CF-02 mitigation**: Plan 02 includes the loop-per-service pattern to avoid token limits
- **Idempotency design**: The unique index + onConflictDoUpdate approach enables safe re-runs
- **Error handling**: finishReason validation + regex fallback for JSON preamble extraction
- **Sequential orchestration**: Plan 03 follows D-03 decision exactly (5 sequential calls)

## Concerns

### HIGH Severity

1. **AiService Duplication** — Plan 02 duplicates the fetch logic from `ai.ts` in a custom `callGemini` function. The plan acknowledges this ("non usa AiService.generateContent() perché non espone finishReason") but doesn't refactor AiService to expose it. This creates redundant code and diverges from the "reuse, don't duplicate" principle in canonical refs.

   **Suggested fix**: Extend `AiService.generateContent()` to optionally return the raw result with finishReason, or create a shared helper that both can import, rather than duplicating the fetch + parse logic in seed.ts.

2. **sanitizeHtml Import Path** — Plan 01's test imports `sanitizeHtml` from `'../api/seed'` but the function lives in `prompts.ts` (created in Plan 02 Task 1). The re-export dependency is backwards—tests should import from the source, not a re-export that depends on another module being implemented first.

   **Suggested fix**: Either export `sanitizeHtml` directly from `prompts.ts` and update tests to import from there, or clarify the re-export chain explicitly in Plan 02's action section.

### MEDIUM Severity

3. **Avatar Source Ambiguity** — D-10 states "services e zones nel request body" but doesn't clarify if avatar should also be in request body or read from project config. Plan 02 accepts avatar from request body, but project.niche already exists in D1—why not store avatar in the project row and avoid passing it every time?

   **Suggested fix**: Document the decision in Plan 02: for Phase 3, avatar comes from request body; for Phase 4+, read from project config in D1.

4. **Services/Zones Flow in Plan 03** — Plan 03 hardcodes SERVICES and ZONES as constants requiring manual edit per project. This works but contradicts the "Config-driven" principle in other phases. The plan acknowledges "Phase 4 leggerà da configJson" but it should either read from D1 now or document the expected behavior in Phase 4.

   **Suggested fix**: Either read services/zones from project.configJson in D1 now, or add explicit TODO comment that this needs Phase 4 update.

5. **Verification Commands Use `cd`** — Plan 01's verify section uses `cd /path && command` instead of the `workdir` parameter specified in tool docs. Minor style issue.

### LOW Severity

6. **Test Import Path for prompts.test.ts** — The test imports `{ sanitizeHtml } from '../api/seed'` but this module doesn't exist in Plan 01 (RED stub phase). Correct for RED, but should be documented more explicitly.

7. **TypeScript dry-run check** — Plan 01 suggests `npx wrangler deploy --dry-run` but consider adding explicit `npx tsc --noEmit`.

8. **finishReason undefined handling** — Plan 02 checks `finishReason && finishReason !== 'STOP'` but if finishReason is undefined it might skip the check incorrectly. Should explicitly check `candidate?.finishReason === 'STOP'` instead.

## Suggestions

1. **Add explicit verification for unique index on D1** — Add a test that attempts a duplicate insert and verifies it fails.
2. **Document the re-export chain** — Add a clear note in Plan 02: "prompts.ts exports sanitizeHtml → seed.ts re-exports → prompts.test.ts imports from prompts.ts (not seed)".
3. **Add error boundary for Gemini rate limits** — Explicit handling for 429 in Plan 02.
4. **Include API_SECRET in verification check** — Ensure RED tests include auth validation or note it's inherited from protectedApp.
5. **Verify idempotency explicitly in Plan 03** — Add explicit assertion in script output showing before/after counts.

## Risk Assessment

**Overall Risk: MEDIUM**

- The duplicate AiService logic is a maintainability risk (HIGH if not addressed)
- The test import path dependency creates a fragile chain
- The manual verification step in Plan 03 depends on human judgment
- The unique index application via raw SQL may have D1/SQLite compatibility edge cases

The plans are executable and achieve Phase 3 goals if HIGH concerns are addressed.

---

*Review generated 2026-04-26*

---

## Consensus Summary

*(Solo un reviewer disponibile — Gemini quota esaurita)*

### Agreed Strengths

- TDD discipline solida (RED stubs → GREEN implementation)
- Idempotency design con unique index + onConflictDoUpdate
- CF-02 mitigation (loop per service_zones)
- Gestione errori finishReason + regex fallback

### Agreed Concerns (HIGH priority)

1. **[HIGH] AiService duplication** — `callGemini` in seed.ts duplica logica di `ai.ts`. Estendere AiService invece di duplicare.
2. **[HIGH] sanitizeHtml import path** — tests importano da `../api/seed` ma la funzione vive in `prompts.ts`. Chain di re-export va documentata esplicitamente.

### Issues da investigare

- Avatar source: request body vs D1 (da chiarire in Plan 02)
- Services/zones hardcoded in Plan 03 script (vs config-driven Phase 4)
- finishReason undefined edge case
