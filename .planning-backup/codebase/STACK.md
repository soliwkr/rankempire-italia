# Technology Stack

**Analysis Date:** 2025-05-14

## Languages

**Primary:**
- TypeScript - Core logic, APIs, and tests.

## Runtime

**Environment:**
- Cloudflare Workers (runtime target specified in `factory-core/wrangler.toml`).

**Package Manager:**
- npm (lockfile `factory-core/package-lock.json` present).

## Frameworks

**Core:**
- Hono ^4.12.15 - Web framework for API routes and middleware.

**Database/ORM:**
- Drizzle ORM ^0.45.2 - ORM used with D1 SQLite.

**Testing:**
- Vitest ^4.1.5 - Test runner and assertion library.

## Key Dependencies

**Critical:**
- `zod` ^4.3.6 - Schema validation for API payloads.
- `google-auth-library` ^10.6.2 - Google API authentication.

## Configuration

**Environment:**
- Configured via `wrangler.toml` in `factory-core/`.
- Local variables handled in `factory-core/.dev.vars`.

**Build:**
- `wrangler.toml` defines worker configuration, D1 bindings, and KV namespaces.

## Platform Requirements

**Production:**
- Cloudflare Workers (D1, KV, Pages).

---

*Stack analysis: 2025-05-14*
