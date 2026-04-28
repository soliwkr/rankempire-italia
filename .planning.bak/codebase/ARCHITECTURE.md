<!-- refreshed: 2025-01-13 -->
# Architecture

**Analysis Date: 2025-01-13**

## System Overview

The repository is a monorepo containing multiple independent sub-projects related to SEO tools, programmatic content generation, and Telegram automation. Each subdirectory in `rankame/` or the root level (e.g., `factory-core`) represents a distinct service or utility.

```text
┌─────────────────────────────────────────────────────────────┐
│                      Monorepo Root                          │
├──────────────────┬──────────────────┬───────────────────────┤
│   `factory-core/`│ `rankame/`       │ `tools/`              │
│  (API/DB Core)   │ (App Collections)│ (Agent/Skill libs)    │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Services / Storage                │
│         (Postgres/Drizzle, Cloudflare Workers/Pages)        │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Path |
|-----------|----------------|------|
| `factory-core` | Backend API, Database schema (Drizzle), migrations. | `factory-core/` |
| `rankame/puraluce-seotool` | Next.js SEO content generation tool. | `rankame/puraluce-seotool/` |
| `rankame/telegram-ranketogram` | Telegram automation service. | `rankame/telegram-ranketogram/` |
| `tools/local-business-builder` | Agent-based skill/template library. | `tools/local-business-builder/` |

## Pattern Overview

**Overall:** Modular, multi-service architecture. Each subdirectory functions as an independent package or project, likely using shared configuration or infrastructure where required.

**Key Characteristics:**
- Independent lifecycles per project.
- Heavy reliance on Cloudflare ecosystem (Wrangler, Workers).
- Data management via Drizzle ORM.

## Architectural Constraints

- **Deployment:** Each service is intended to be deployed independently (e.g., to Cloudflare or Vercel).
- **Coupling:** Low coupling between core modules, but high duplication of project structure (e.g., each has `package.json`).

## Cross-Cutting Concerns

- **Logging:** Basic logging exists (`backend.log`).
- **Database:** PostgreSQL accessed through `drizzle-orm`.
- **Infrastructure:** Managed via `wrangler.toml` for Cloudflare Workers.

---

*Architecture analysis: 2025-01-13*
