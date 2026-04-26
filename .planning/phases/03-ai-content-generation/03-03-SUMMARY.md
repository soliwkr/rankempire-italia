---
phase: 03-ai-content-generation
plan: 03
subsystem: api
tags:
  - nodejs-script
  - seed-orchestrator
  - sequential-calls
  - dev-vars
  - cli-tool

# Dependency graph
requires:
  - phase: 03-02
    provides: "POST /api/generate/seed-project/:projectId?type=X endpoint with D1 upsert and Bearer auth"
provides:
  - "factory-core/scripts/seed-project.ts — CLI orchestrator for 5 sequential seed calls"
  - "Pattern: .dev.vars reading for Node.js scripts in factory-core"
affects:
  - "Phase 4 wizard: same 5 endpoint calls, tipo-per-tipo"

# Tech tracking
tech-stack:
  added:
    - "Node.js ESM script with tsx runner"
    - "fileURLToPath for __dirname in ESM context"
  patterns:
    - "Read API_SECRET from .dev.vars (not process.env) — same pattern as test-ai-real.ts"
    - "Sequential await per ogni tipo (no Promise.all) — evita timeout e rispetta CF-02"
    - "Process.exit(1) on missing credentials — fail-fast with clear error message"

key-files:
  created:
    - "factory-core/scripts/seed-project.ts"
  modified: []

key-decisions:
  - "Script chiama l'endpoint 5 volte in sequenza, non in parallelo — coerente con D-03"
  - "SERVICES e ZONES hardcoded come costanti — documentato come da modificare per ogni progetto (Phase 4 leggerà da configJson)"
  - "API_SECRET letto da .dev.vars, non da process.env — Pitfall 5 rispettato"

patterns-established:
  - "Pattern: scripts Node.js in factory-core leggono .dev.vars con split('\\n').forEach"
  - "Pattern: ESM __dirname via fileURLToPath(import.meta.url)"

requirements-completed:
  - FACT-02

# Metrics
duration: 10min
completed: 2026-04-26
---

# Phase 3 Plan 03: Script Orchestratore seed-project.ts

**CLI Node.js orchestrator calling 5 seed endpoint types sequentially with .dev.vars auth reading and idempotent upsert — Phase 3 E2E smoke test checkpoint pending human verification**

## Performance

- **Duration:** ~10 min (Task 1 auto) + checkpoint (Task 2 human-verify in attesa)
- **Started:** 2026-04-26T15:21:00Z
- **Completed:** 2026-04-26T15:31:03Z (Task 1); Task 2 in attesa verifica umana
- **Tasks:** 1/2 auto-completato; 1 checkpoint bloccante
- **Files modified:** 1

## Accomplishments

- Creato `factory-core/scripts/seed-project.ts` — punto di ingresso CLI per la generazione completa di ~105 pagine
- Implementate 5 chiamate sequenziali a `seedType()` per: homepage, services, zones, service_zones, blog
- Lettura `API_SECRET` da `.dev.vars` (stesso pattern di `test-ai-real.ts`) — Pitfall 5 rispettato
- Script accetta `projectId` come argomento CLI, `avatar` opzionale (default: `in-pain`)
- Output stampa conteggio pagine per ogni tipo + comando verifica D1 al termine

## Task Commits

1. **Task 1: Creare scripts/seed-project.ts** - `9416e03` (feat)
2. **Task 2: Smoke test E2E** - checkpoint:human-verify — in attesa verifica umana

**Plan metadata:** vedi commit docs post-checkpoint

## Files Created/Modified

- `factory-core/scripts/seed-project.ts` — CLI orchestrator per le 5 chiamate sequenziali al seed endpoint

## Decisions Made

- Script in ESM (`import` syntax) con `fileURLToPath` per compatibilità con il runtime factory-core
- `SERVICES` e `ZONES` hardcoded come costanti documentate — da modificare per ogni progetto (Phase 4 leggerà da D1 configJson come specificato nel CONTEXT.md)
- `API_SECRET` letto da `.dev.vars`, non da variabili d'ambiente del processo — allineato a Pitfall 5 del RESEARCH.md

## Deviations from Plan

Nessuna — `factory-core/scripts/test-ai-real.ts` non esisteva nel worktree ma il piano forniva il pattern completo direttamente nell'action del Task 1. Implementazione identica a quanto specificato nel piano.

## Known Stubs

Nessuno — lo script è funzionalmente completo. Le costanti `SERVICES` e `ZONES` sono segnaposto intenzionali documentati per essere modificati dall'operatore per ogni progetto specifico. Non costituiscono stub che impediscono il funzionamento.

## Checkpoint Status

**Task 2 (Smoke test E2E)** è un `checkpoint:human-verify` con gate `blocking`.

Pre-requisiti per la verifica:
1. Trovare progetto valido in D1: `npx wrangler d1 execute factory-db --local --command "SELECT id, niche, location FROM projects LIMIT 5;"`
2. Avviare wrangler dev: `cd factory-core && npx wrangler dev`
3. Verificare `.dev.vars` contiene `API_SECRET` e `GOOGLE_AI_API_KEY`
4. Modificare `SERVICES` e `ZONES` in `seed-project.ts` per il progetto selezionato
5. Eseguire: `npx tsx scripts/seed-project.ts {PROJECT_ID} in-pain`
6. Verificare conteggi D1 (attesi: homepage=1, service≥5, zone≥5, service_zone≥25, blog≥3)
7. Verificare idempotenza eseguendo lo script una seconda volta

## Threat Flags

Nessuna nuova superficie di sicurezza introdotta. Lo script legge `.dev.vars` (già in `.gitignore`) e chiama endpoint locale già protetto da Bearer token (T-03-03-01 e T-03-03-02 documentati nel threat_model del piano — entrambi `accept`).

## Self-Check

**Files created:**
- `factory-core/scripts/seed-project.ts` — verificato esistente

**Commits verified:**
- `9416e03` — feat(03-03): create scripts/seed-project.ts orchestrator

**Self-Check: PASSED** (Task 1 completo; Task 2 checkpoint bloccante — non eseguibile automaticamente)

---
*Phase: 03-ai-content-generation*
*Completed: 2026-04-26 (Task 1); Task 2 pending human verification*
