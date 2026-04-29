---
phase: 01-factory-core-foundation
plan: "02"
subsystem: auth
tags: [hono, bearer-auth, cloudflare-workers, wrangler, gemini]

# Dependency graph
requires: []
provides:
  - "bearerAuth middleware su /api/projects e /api/generate in entrambi i factory-core"
  - "API_SECRET nel type Bindings Hono per type-safety runtime"
  - "VERIFICATION_BASE_URL aggiornato a produzione (factory-core.soliwkr.workers.dev)"
  - "Conferma esplicita gemini-2.5-flash in entrambi i factory-core/src/services/ai.ts (D-06)"
affects: [02-content-pipeline, 03-lead-pipeline, deploy-pipeline]

# Tech tracking
tech-stack:
  added: [hono/bearer-auth]
  patterns:
    - "Route group protetto con sub-app Hono (protectedApp) — bearer token letto da c.env a runtime"
    - "Segreti Wrangler documentati come commenti in wrangler.toml, mai come chiavi [vars]"

key-files:
  created: []
  modified:
    - "rankame/factory-core/src/index.ts"
    - "rankame/factory-core/wrangler.toml"
    - "factory-core/src/index.ts"
    - "factory-core/wrangler.toml"

key-decisions:
  - "Route group protetto separato (protectedApp) invece di middleware a livello app — mantiene /api/leads pubblico senza eccezioni esplicite"
  - "API_SECRET letto da c.env a runtime via lambda inline — compatibile con Cloudflare env binding"
  - "Task 3 no-op confermato: entrambi i factory-core/src/services/ai.ts usavano già gemini-2.5-flash"
  - "rankame/ è un repo git separato — commits eseguiti in entrambi i repo (principale + rankame/)"

patterns-established:
  - "Hono bearer auth: protectedApp.use('/*', (c, next) => bearerAuth({ token: c.env.API_SECRET })(c, next))"
  - "Segreti Wrangler: commento # VARNAME is secret, set via .dev.vars or 'wrangler secret put' — mai in [vars]"

requirements-completed: [FACT-06]

# Metrics
duration: 15min
completed: 2026-04-24
---

# Phase 1 Plan 02: Bearer Auth e Config Produzione Summary

**Hono bearerAuth middleware su /api/projects e /api/generate con API_SECRET da env Cloudflare, VERIFICATION_BASE_URL aggiornato a produzione, gemini-2.5-flash confermato in entrambi i factory-core**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-24T19:20:00Z
- **Completed:** 2026-04-24T19:35:00Z
- **Tasks:** 3 (2 con modifiche, 1 no-op confermato)
- **Files modificati:** 4

## Accomplishments

- Factory-core protetto: /api/projects e /api/generate richiedono Bearer token; /api/leads e /health rimangono pubblici (FACT-06)
- VERIFICATION_BASE_URL aggiornato da localhost a https://factory-core.soliwkr.workers.dev/verify in entrambi i wrangler.toml
- API_SECRET documentato come segreto Wrangler (non esposto in [vars] plaintext) in entrambi i wrangler.toml
- D-06 verificato esplicitamente: entrambi i factory-core/src/services/ai.ts usano gemini-2.5-flash (nessuna modifica necessaria)

## Task Commits

Ogni task committato atomicamente nei due repo (principale e rankame/):

1. **Task 1: bearerAuth middleware** - `b00166b` (repo principale, factory-core/src/index.ts) + `853cf71` (repo rankame, factory-core/src/index.ts)
2. **Task 2: VERIFICATION_BASE_URL produzione** - `d022a60` (repo principale, factory-core/wrangler.toml) + `b85300c` (repo rankame, factory-core/wrangler.toml)
3. **Task 3: verifica gemini-2.5-flash** - nessun commit (file gia' corretto, no-op confermato)

## Files Created/Modified

- `rankame/factory-core/src/index.ts` - Aggiunto bearerAuth su route group protetto, API_SECRET nel type Bindings
- `factory-core/src/index.ts` - Stesso set di modifiche (copia identica)
- `rankame/factory-core/wrangler.toml` - VERIFICATION_BASE_URL a produzione, commento API_SECRET
- `factory-core/wrangler.toml` - Stesso set di modifiche (copia identica)

## Decisions Made

- Route group separato (protectedApp) invece di middleware globale con eccezioni: piu' leggibile, /api/leads rimane fuori senza logica di esclusione.
- API_SECRET letto via lambda inline `(c, next) => bearerAuth({ token: c.env.API_SECRET })(c, next)` perche' il token e' disponibile solo a runtime dal contesto Cloudflare, non al momento della definizione del middleware.
- rankame/ e' un repo git separato — entrambi i repo sono stati aggiornati e committati separatamente.

## Deviations from Plan

### Osservazione Architetturale (non deviazione)

**rankame/ e' un repository git separato**
- **Trovato durante:** Task 1 (tentativo di committare rankame/factory-core/src/index.ts nel repo principale)
- **Issue:** `git add rankame/factory-core/src/index.ts` non funzionava — rankame/ ha la propria directory .git
- **Azione:** Commits eseguiti separatamente in `/rankame` (cd rankame && git commit) e nel repo principale
- **Impatto:** Nessuno sulla correttezza — entrambi i file modificati e committati correttamente

---

**Total deviations:** 0 auto-fix rule violations. 1 osservazione architetturale gestita inline.
**Impact on plan:** Nessuno — piano eseguito secondo specifiche.

## Issues Encountered

- Git non riusciva ad agire su file dentro rankame/ dal repo principale perche' e' un repo annidato (non submodule). Risolto committando direttamente nel repo rankame.

## User Setup Required

**API_SECRET deve essere configurato come segreto Wrangler prima del deploy:**

```bash
# Per rankame/factory-core
cd rankame/factory-core
wrangler secret put API_SECRET

# Per factory-core (root)
cd factory-core
wrangler secret put API_SECRET
```

Per sviluppo locale, aggiungere a `.dev.vars` (non versionato):
```
API_SECRET=<token-segreto>
```

## Known Stubs

Nessuno — il piano non introduce funzionalita' UI o dati placeholder.

## Next Phase Readiness

- factory-core e' ora protetto: endpoint operativi richiederanno il Bearer token
- VERIFICATION_BASE_URL punta alla produzione — i link DOI inviati via Resend sono corretti
- gemini-2.5-flash confermato in entrambi i factory-core — le chiamate AI funzioneranno in produzione
- Piano 01-03 (schema D1 + migrazione email) puo' procedere indipendentemente

## Self-Check: PASSED

- FOUND: rankame/factory-core/src/index.ts (bearerAuth presente)
- FOUND: factory-core/src/index.ts (bearerAuth presente)
- FOUND: rankame/factory-core/wrangler.toml (VERIFICATION_BASE_URL produzione)
- FOUND: factory-core/wrangler.toml (VERIFICATION_BASE_URL produzione)
- FOUND: 01-02-SUMMARY.md
- Commit b00166b (repo principale, Task 1) - verificato
- Commit 853cf71 (repo rankame, Task 1) - verificato
- Commit d022a60 (repo principale, Task 2) - verificato
- Commit b85300c (repo rankame, Task 2) - verificato

---
*Phase: 01-factory-core-foundation*
*Completed: 2026-04-24*
