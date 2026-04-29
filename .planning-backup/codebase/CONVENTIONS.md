# Coding Conventions

**Analysis Date:** 2026-05-14

## Naming Patterns

**Files:**
- kebab-case for everything (e.g., `cloudflare-pages.test.ts`, `seed.test.ts`).

**Functions:**
- camelCase for logic functions (e.g., `makeMockD1`).
- PascalCase for React-like components (if present).

**Variables:**
- camelCase for standard variables.
- PascalCase for imported schema modules or constants representing tables.

**Types:**
- PascalCase for interfaces/types (standard TS).

## Code Style

**Formatting:**
- Generally consistent with standard Prettier defaults (implied).

**Linting:**
- Not strictly enforced by detected configuration (no `.eslintrc` or `biome.json` in root). Standard TypeScript rules applied by editor/compiler.

## Import Organization

**Order:**
1. External modules (`hono`, `drizzle-orm`, `vitest`).
2. Internal relative imports (e.g., `../db/schema`, `./sites`).

## Error Handling

**Patterns:**
- HTTP responses in Hono routers return status codes (200, 404, 500) with JSON error payloads.
- Schema defaults are defined in Drizzle table schemas (e.g., `faq: text('faq').default('[]')`).

## Logging

**Framework:**
- `console` for standard logging.

## Function Design

**Size:**
- Modular approach: small, testable functions for API logic and data manipulation.

**Parameters:**
- Hono handlers typically inject `env` context (e.g., `DB` binding) as the third argument.

## Module Design

**Exports:**
- Named exports for schemas and utilities.
- Default exports for Hono API routers.

---

*Convention analysis: 2026-05-14*
