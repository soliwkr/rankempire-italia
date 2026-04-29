---
phase: 04-deploy-pipeline
plan: 05
subsystem: factory-core
tags: [deploy, github, cloudflare-pages, idempotency, state-machine]
dependency_graph:
  requires: [04-03-github-pages-services, 04-04-drizzle-schema-update]
  provides: [04-05-idempotent-deploy-endpoint]
  affects: [factory-core/src/api/projects.ts, factory-core/src/index.ts]
tech-stack: [Hono, Drizzle, GitHub API, Cloudflare Pages API]
key-files:
  - factory-core/src/api/projects.ts
  - factory-core/src/index.ts
decisions:
  - D-10: Ordine obbligatorio: createRepoFromTemplate -> db.update(repo_created) -> waitForRepo per garantire idempotency se interrotto.
  - D-12: Idempotency check: status 'live' ritorna 409 con link esistenti.
  - D-07: site.config.json iniettato con full SiteConfig (14 campi).
metrics:
  duration: 15m
  completed_date: 2026-04-27
---

# Phase 04 Plan 05: Deploy Endpoint Rewrite Summary

## Objective
Implementazione del deploy endpoint `POST /api/projects/:id/deploy` con state machine idempotente, retry loop per GitHub e iniezione configurazione SiteConfig.

## Key Changes

### 1. Bindings Update (`factory-core/src/index.ts`)
- Aggiunte le env var necessarie per la deploy pipeline:
  - `GITHUB_TEMPLATE_OWNER`
  - `GITHUB_TEMPLATE_REPO`
  - `CF_API_TOKEN`
  - `FACTORY_API_URL`
- Il type `Bindings` è ora allineato con i requisiti del deployer.

### 2. Deploy Endpoint Rewrite (`factory-core/src/api/projects.ts`)
- **State Machine a 3 step**:
  1. `pending` -> `repo_created`: Creazione repository GitHub.
  2. `repo_created` -> `pages_linked`: Iniezione `src/data/site.config.json`.
  3. `pages_linked` -> `deploying`: Creazione progetto Cloudflare Pages.
- **Idempotency (D-10, D-12)**:
  - L'ordine delle operazioni GitHub garantisce che il record D1 sia aggiornato *prima* di entrare nel loop di attesa (`waitForRepo`). Se il loop fallisce, il prossimo tentativo riprenderà dallo stato `repo_created`.
  - Se lo status è `live`, viene restituito 409 con i link già esistenti.
- **Config Injection (D-07, D-08)**:
  - Generazione di `site.config.json` con tutti i campi richiesti (projectId, niche, city, services, zones, avatar, factoryApi, slug, etc.).
  - `services`, `zones` e `avatar` sono estratti dal corpo della richiesta HTTP.
- **Security Mitigations**:
  - Validazione UUID per il parametro `id`.
  - Validazione regex `/^[a-z0-9-]+$/` per lo slug del progetto per prevenire injection in nomi repo e progetti Pages.

## Verification Results

### 1. TypeScript Compilation
`npx wrangler deploy --dry-run` eseguito con successo in `factory-core`.

### 2. Logic Checks
- [x] **Idempotency**: Verificato check `status === 'live'` -> 409.
- [x] **D-10 Order**: Verificato `db.update(repo_created)` precede `waitForRepo`.
- [x] **SiteConfig**: Verificata presenza di tutti i campi (ga4, factoryApi, etc.).
- [x] **Input Validation**: Verificati check UUID e slug format.
- [x] **Sleep Hack**: Assente (sostituito da `github.waitForRepo` con retry loop).

## Deviations from Plan
Nessuna - il piano è stato eseguito esattamente come scritto.

## Self-Check: PASSED
- [x] Created files exist: `factory-core/src/api/projects.ts`, `factory-core/src/index.ts`
- [x] Commits exist: `e7ed9d7`, `7d29761`
