---
phase: 04-deploy-pipeline
plan: "01"
subsystem: factory-core/db
tags: [schema, migration, drizzle, d1, wrangler, deploy-pipeline]
dependency_graph:
  requires: []
  provides:
    - "D1 schema projects: 3 colonne nullable deploy (githubRepoUrl, pagesProjectName, pagesUrl)"
    - "Migration SQL 0004 Drizzle Kit pronta per wrangler d1 migrations apply"
    - "wrangler.toml [vars] con GITHUB_TEMPLATE_OWNER, GITHUB_TEMPLATE_REPO, FACTORY_API_URL"
  affects:
    - "factory-core/src/db/schema.ts — contratto dati per CloudflarePagesService (04-02)"
    - "factory-core/wrangler.toml — env bindings disponibili al Worker runtime (04-03+)"
tech_stack:
  added: []
  patterns:
    - "Drizzle Kit migration format: ALTER TABLE con statement-breakpoint inline"
    - "wrangler.toml [vars] per non-sensitive config, commento per secrets"
key_files:
  created:
    - factory-core/migrations/0004_add_deploy_columns.sql
  modified:
    - factory-core/src/db/schema.ts
    - factory-core/wrangler.toml
decisions:
  - "CF_API_TOKEN non inserito in [vars] — solo commento; mitigazione T-04-01-01"
  - "3 colonne nullable (nessun NOT NULL) — coerente con domain e configJson già esistenti"
  - "statement-breakpoint inline (stesso formato 0003) — non su riga separata"
metrics:
  duration: "~10 minuti"
  completed_date: "2026-04-27"
  tasks_completed: 3
  tasks_total: 3
---

# Phase 04 Plan 01: Schema D1 e Config Deploy Pipeline Summary

**One-liner:** 3 colonne nullable deploy aggiunte a projects D1 (githubRepoUrl, pagesProjectName, pagesUrl), migration Drizzle Kit 0004 creata, wrangler.toml aggiornato con env var template GitHub e API URL.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Aggiungere 3 colonne nullable a schema.ts | d995656 | factory-core/src/db/schema.ts |
| 2 | Creare migration SQL 0004_add_deploy_columns.sql | ad8a5c4 | factory-core/migrations/0004_add_deploy_columns.sql |
| 3 | Aggiungere env var deploy pipeline a wrangler.toml | ce88320 | factory-core/wrangler.toml |

## What Was Built

Preparazione dell'infrastruttura dati e configurazione per la deploy pipeline di Phase 4:

1. **schema.ts** — Tabella `projects` ora ha 3 nuove colonne nullable con naming convention corretto (camelCase TS / snake_case SQL):
   - `githubRepoUrl: text('github_repo_url')` — URL del repo GitHub clonato dal template
   - `pagesProjectName: text('pages_project_name')` — nome del progetto Cloudflare Pages
   - `pagesUrl: text('pages_url')` — URL pubblico del sito deployato

2. **0004_add_deploy_columns.sql** — Migration Drizzle Kit con 3 `ALTER TABLE projects ADD` in formato standard (statement-breakpoint inline), pronta per `wrangler d1 migrations apply`.

3. **wrangler.toml** — Blocco `[vars]` aggiornato con:
   - `GITHUB_TEMPLATE_OWNER = "StudioPuraLuce"` — owner del template repo
   - `GITHUB_TEMPLATE_REPO = "astro-rank-rent"` — nome del template repo
   - `FACTORY_API_URL = "https://factory-core.soliwkr.workers.dev"` — URL production Worker
   - `CF_API_TOKEN` documentato solo come commento (secret, non in chiaro)

## Deviations from Plan

None - piano eseguito esattamente come scritto.

## Threat Model Compliance

| Threat ID | Status | Note |
|-----------|--------|------|
| T-04-01-01 | MITIGATED | CF_API_TOKEN assente da [vars] — solo commento. Verificato con grep gate |
| T-04-01-02 | ACCEPTED | .dev.vars non esiste nel worktree — confermato fuori da git tracking |
| T-04-01-03 | ACCEPTED | Migration Drizzle Kit è idempotente via tracking automatico wrangler |

## Known Stubs

None — nessun stub introdotto. Dati schema sono strutturali, non presentation layer.

## Self-Check: PASSED

- factory-core/src/db/schema.ts: FOUND (3 colonne verificate con grep -c = 3)
- factory-core/migrations/0004_add_deploy_columns.sql: FOUND (contenuto corretto)
- factory-core/wrangler.toml: FOUND (3 vars in [vars], CF_API_TOKEN solo commento)
- Commit d995656: FOUND
- Commit ad8a5c4: FOUND
- Commit ce88320: FOUND
