---
phase: 02-astro-template-completion
plan: 02
subsystem: testing
tags: [vitest, astro, typescript, tdd, schema-org, rank-rent]

# Dependency graph
requires: []
provides:
  - "vitest.config.ts configurato per ambiente node nel template Astro base"
  - "Fixture site.config.json ghost mode con dati italiani (ristrutturazioni formia)"
  - "Test RED per fetchAllPages e requirePage (SITE-04)"
  - "Test RED per buildSchemaGraph null-omission e pattern @graph (SITE-02)"
  - "Test RED per buildServiceZonePaths services × zones (SITE-01)"
affects:
  - 02-03-astro-template (implementa codice di produzione per far diventare verdi i test)
  - 02-04-schema-graph (implementa buildSchemaGraph.ts)
  - 02-05-sitemap-robots (infrastruttura di test riutilizzabile)

# Tech tracking
tech-stack:
  added:
    - "vitest 4.1.5 (già in package.json, ora configurato con vitest.config.ts)"
  patterns:
    - "TDD RED-GREEN-REFACTOR: test scritti prima del codice di produzione"
    - "Fixture JSON per mock config D-01 ghost mode"
    - "vi.stubGlobal('fetch', ...) per mockare fetch nelle unit test Vitest"
    - "@ts-expect-error per import di moduli non ancora creati"

key-files:
  created:
    - "rankame/templates/astro-base/vitest.config.ts"
    - "rankame/templates/astro-base/tests/fixtures/site.config.json"
    - "rankame/templates/astro-base/tests/fetch-pages.test.ts"
    - "rankame/templates/astro-base/tests/schema-graph.test.ts"
    - "rankame/templates/astro-base/tests/routing.test.ts"
  modified: []

key-decisions:
  - "Il repository rankame/templates/astro-base ha il proprio .git separato — i commit vanno nel sub-repo, non nel repo radice"
  - "vitest environment: 'node' (non jsdom) — i test verificano logica TypeScript pura, nessun DOM necessario"
  - "I test importano da src/lib/ con @ts-expect-error — i file non esistono ancora (RED state intenzionale)"
  - "buildSchemaGraph estratto come funzione pura da testare senza runtime Astro"
  - "buildServiceZonePaths estratto come funzione pura per testare routing senza Astro.getStaticPaths()"

patterns-established:
  - "Pattern test RED: import con @ts-expect-error su moduli futuri, test falliscono per 'Cannot find module'"
  - "Pattern fixture: site.config.json in tests/fixtures/ riutilizzato da tutti i test della fase"
  - "Pattern mock fetch: vi.stubGlobal('fetch', vi.fn().mockResolvedValue({...})) per test isolati"

requirements-completed:
  - SITE-01
  - SITE-02
  - SITE-04

# Metrics
duration: 2min
completed: 2026-04-25
---

# Phase 2 Plan 02: Test Infrastructure (TDD RED) Summary

**Infrastruttura vitest con 3 file di test RED che coprono fetchPages (SITE-04), buildSchemaGraph null-omission (SITE-02), e routing services x zones (SITE-01) — tutti falliscono per 'Cannot find module' in attesa del codice di produzione del Piano 03.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-25T11:07:47Z
- **Completed:** 2026-04-25T11:10:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Configurazione vitest.config.ts per ambiente node senza DOM
- Fixture site.config.json D-01 ghost mode con dati italiani reali (ristrutturazioni formia, 2 servizi, 3 zone)
- 3 file di test RED copertura completa: fetchPages (SITE-04), buildSchemaGraph (SITE-02), routing paths (SITE-01)
- Verifica stato RED: `npx vitest run` fallisce con "Cannot find module" su tutti e 3 i file — comportamento TDD atteso

## Task Commits

Commit nel sub-repo `rankame/templates/astro-base/` (repo git separato):

1. **Task 1: vitest.config.ts + fixture site.config.json** - `7918b8e` (test)
2. **Task 2: Test RED per fetchPages, schemaGraph, routing** - `89dabbb` (test)

## Files Created/Modified

- `rankame/templates/astro-base/vitest.config.ts` - Config vitest: environment node, include tests/**/*.test.ts
- `rankame/templates/astro-base/tests/fixtures/site.config.json` - Mock config D-01 ghost mode (projectId, niche, city, services[2], zones[3], tutti i nullable a null)
- `rankame/templates/astro-base/tests/fetch-pages.test.ts` - Test SITE-04: fetchAllPages URL corretto, requirePage restituisce pagina/lancia errore con slug+hint 'Phase 3'
- `rankame/templates/astro-base/tests/schema-graph.test.ts` - Test SITE-02: ghost mode null omission (name, telephone), @context/@graph, BreadcrumbList, Service node, FAQPage presenza/assenza
- `rankame/templates/astro-base/tests/routing.test.ts` - Test SITE-01: services.length × zones.length paths, params come stringhe, throw su slug mancante

## Decisions Made

- **Sub-repo separato:** La directory `rankame/` ha il proprio .git (esclusa da .gitignore del repo radice). I commit vanno nel sub-repo `rankame/templates/astro-base/`.
- **Nessun DOM:** environment 'node' in vitest — logica TypeScript pura, nessuna dipendenza da browser API.
- **Funzioni pure estratte:** Il piano specifica di testare `buildSchemaGraph` e `buildServiceZonePaths` come funzioni pure TypeScript invece di componenti Astro — pattern corretto per unit test veloci senza runtime Astro.

## Deviations from Plan

Nessuna — piano eseguito esattamente come scritto.

## Issues Encountered

- **Sub-repo discovery:** `rankame/` ha .git separato (non era evidente dal git status del repo radice). Risolto committando direttamente nel sub-repo `rankame/templates/astro-base/`. Nessun impatto sul contenuto del piano.

## User Setup Required

Nessuno — nessuna configurazione esterna necessaria. I test sono in stato RED intenzionale finché il Piano 03 non crea il codice di produzione.

## TDD Gate Compliance

**Gate RED:** Commit `7918b8e` e `89dabbb` in sub-repo sono entrambi di tipo `test(...)` — gate RED presente.
**Gate GREEN:** Pendente — il Piano 03 deve creare `src/lib/fetchPages.ts`, `src/lib/buildSchemaGraph.ts`, `src/lib/buildPaths.ts` per far diventare verdi i test.

## Known Stubs

Nessuno — questo piano crea solo file di test. Nessun codice di produzione con stub.

## Next Phase Readiness

- Infrastruttura di test pronta: `npx vitest run` funziona (fallisce per module not found — RED atteso)
- Piano 03 può implementare `src/lib/fetchPages.ts` e far diventare verdi i test fetch-pages
- Piano 03/04 può implementare `src/lib/buildSchemaGraph.ts` e far diventare verdi i test schema-graph
- Piano 03 può implementare `src/lib/buildPaths.ts` e far diventare verdi i test routing

---
*Phase: 02-astro-template-completion*
*Completed: 2026-04-25*
