---
phase: 02-astro-template-completion
plan: 03
subsystem: astro-template
tags: [astro, typescript, schema-org, vitest, tdd, rank-rent, sitemap]

# Dependency graph
requires:
  - phase: 02-02-test-infrastructure
    provides: "3 file di test RED per fetchPages, buildSchemaGraph, routing — attendono codice di produzione"
  - phase: 02-01-sites-api
    provides: "Endpoint GET /api/sites/:projectId/pages che fetchPages.ts interroga al build time"
provides:
  - "fetchPages.ts: fetchAllPages + requirePage con cache e fail-fast (SITE-04)"
  - "buildSchemaGraph.ts: funzione pura @graph JSON-LD con ghost mode null-omission (SITE-02)"
  - "buildPaths.ts: buildServiceZonePaths per enumerazione getStaticPaths (SITE-01)"
  - "src/types/site.ts: SiteConfig, FaqItem, PageContent, BreadcrumbItem"
  - "src/data/site.config.json: configurazione dev locale (ristrutturazioni-formia)"
  - "astro.config.mjs: legge site.config.json dinamicamente, integra sitemap, rimuove Vite define"
  - "SchemaGraph.astro, Breadcrumb.astro, InternalLinks.astro: componenti riutilizzabili"
  - "Layout.astro esteso: canonical, sitemap link, slot head"
affects:
  - 02-04-pages (usa fetchPages + buildSchemaGraph + Layout nelle pagine Astro)
  - 02-05-sitemap-robots (usa sitemap() integration aggiunta qui)

# Tech tracking
tech-stack:
  added:
    - "@astrojs/sitemap ^3.7.2 (integrazione sitemap automatica Astro)"
  patterns:
    - "Ghost mode: campi null omessi con conditional assignment (if config.x) non assegnati a null"
    - "JSON import statico: le pagine importano site.config.json direttamente, no Vite define"
    - "set:html per JSON-LD: bypassa sanitizzazione Astro per script application/ld+json"
    - "Funzioni pure testabili: buildSchemaGraph e buildServiceZonePaths estratti da componenti Astro"
    - "Threat comment T-02-06: commento esplicito in fetchPages.ts su body HTML raw"

key-files:
  created:
    - "rankame/templates/astro-base/src/lib/fetchPages.ts"
    - "rankame/templates/astro-base/src/lib/buildSchemaGraph.ts"
    - "rankame/templates/astro-base/src/lib/buildPaths.ts"
    - "rankame/templates/astro-base/src/types/site.ts"
    - "rankame/templates/astro-base/src/data/site.config.json"
    - "rankame/templates/astro-base/src/components/SchemaGraph.astro"
    - "rankame/templates/astro-base/src/components/Breadcrumb.astro"
    - "rankame/templates/astro-base/src/components/InternalLinks.astro"
  modified:
    - "rankame/templates/astro-base/astro.config.mjs (sostituito: sitemap, lettura dinamica config, rimosso Vite define)"
    - "rankame/templates/astro-base/package.json (aggiunto @astrojs/sitemap)"
    - "rankame/templates/astro-base/src/layouts/Layout.astro (canonical, sitemap link, slot head)"

key-decisions:
  - "fetchPages.ts usa import statico JSON invece di env var — coerente con approccio build-time del template"
  - "buildSchemaGraph usa conditional assignment per ghost mode — mai name: null, ma assenza totale del campo"
  - "buildServiceZonePaths lancia errore con hint 'Phase 3' su slug mancante — fail-fast chiaro per CI"
  - "InternalLinks.astro calcola link sorelle al build time da siteConfig — nessuna chiamata runtime"
  - "Sub-repo git separato: tutti i commit vanno in rankame/templates/astro-base, non nel repo radice"

patterns-established:
  - "Pattern ghost mode: if (config.field) obj.field = config.field — campo assente, non null"
  - "Pattern JSON-LD: <script type=application/ld+json set:html={JSON.stringify(schema)} />"
  - "Pattern fetch centralizzato: un solo fetchAllPages() + requirePage() per slug, usato da tutte le pagine"
  - "Pattern slot head: Layout.astro espone <slot name=head /> per iniezione SchemaGraph nel head"

requirements-completed:
  - SITE-02
  - SITE-04

# Metrics
duration: completato in sessione precedente (wave 2 esecuzione)
completed: 2026-04-25
---

# Phase 2 Plan 03: Astro Template Core — fetchPages, buildSchemaGraph, buildPaths, componenti riutilizzabili

**Layer di astrazione TypeScript completa del template Astro: utility fetch D1, @graph JSON-LD con ghost mode null-omission, routing paths, 3 componenti (SchemaGraph/Breadcrumb/InternalLinks), Layout esteso — tutti i 15 test vitest diventano verdi.**

## Performance

- **Duration:** completato in wave 2 (esecuzione precedente)
- **Started:** 2026-04-25
- **Completed:** 2026-04-25
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- astro.config.mjs riscritto: lettura dinamica site.config.json, integrazione sitemap(), rimosso anti-pattern Vite define
- 3 utility TypeScript pure create: fetchPages (fetch D1 + fail-fast), buildSchemaGraph (@graph con ghost mode), buildPaths (services x zones)
- 3 componenti Astro creati: SchemaGraph (JSON-LD con set:html), Breadcrumb (nav accessibile), InternalLinks (link interni build-time)
- Layout.astro esteso con canonical, sitemap link, slot head
- Tutti i 15 test vitest passano (3 file: fetch-pages, schema-graph, routing) — gate GREEN completato

## Task Commits

Commit nel sub-repo `rankame/templates/astro-base/` (repo git separato):

1. **Task 1: fetchPages, buildPaths, site.config.json, types, astro.config.mjs** - `1ca1780` (feat)
2. **Task 2: buildSchemaGraph, SchemaGraph.astro, Breadcrumb.astro, InternalLinks.astro, Layout.astro** - `b7ff691` (feat)

## Files Created/Modified

- `rankame/templates/astro-base/src/lib/fetchPages.ts` - Fetch centralizzato con fetchAllPages (URL D1) e requirePage (fail-fast con hint Phase 3). Commento threat T-02-06 su body HTML raw.
- `rankame/templates/astro-base/src/lib/buildSchemaGraph.ts` - Funzione pura @graph JSON-LD: LocalBusiness (ghost mode), Service node, FAQPage, BreadcrumbList. nicheTypeMap per tipo schema corretto.
- `rankame/templates/astro-base/src/lib/buildPaths.ts` - buildServiceZonePaths: services x zones con params stringa e throw su slug mancante
- `rankame/templates/astro-base/src/types/site.ts` - Interfacce: SiteConfig, FaqItem, PageContent, BreadcrumbItem
- `rankame/templates/astro-base/src/data/site.config.json` - Config dev locale ghost mode (ristrutturazioni-formia, nullable a null)
- `rankame/templates/astro-base/src/components/SchemaGraph.astro` - JSON-LD emitter con set:html (bypassa sanitizzazione)
- `rankame/templates/astro-base/src/components/Breadcrumb.astro` - Nav breadcrumb accessibile (aria-label, aria-current)
- `rankame/templates/astro-base/src/components/InternalLinks.astro` - Link sorelle calcolati build-time da siteConfig
- `rankame/templates/astro-base/src/layouts/Layout.astro` - Esteso: canonical condizionale, sitemap-index.xml link, slot name="head"
- `rankame/templates/astro-base/astro.config.mjs` - Riscritto: readFileSync site.config.json, site dinamico, sitemap(), rimosso Vite define
- `rankame/templates/astro-base/package.json` - Aggiunto @astrojs/sitemap ^3.7.2

## Deviations from Plan

Nessuna — il piano e' stato eseguito esattamente come scritto. I commit 1ca1780 e b7ff691 nel sub-repo corrispondono ai Task 1 e Task 2 del piano.

## TDD Gate Compliance

**Gate RED:** Commit `89dabbb` e `7918b8e` (piano 02-02) — gate RED presente con test fallenti per "Cannot find module".
**Gate GREEN:** Commit `1ca1780` e `b7ff691` (questo piano) — gate GREEN completato, tutti i 15 test passano.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: tampering (mitigato) | src/lib/fetchPages.ts | body e' HTML raw da D1 — commento T-02-06 esplicito, Phase 3 responsabile sanitizzazione prima scrittura D1 |

## Known Stubs

Nessuno — tutte le utility sono implementate con logica reale. site.config.json contiene dati dev locali (intenzionale: Phase 4 sovrascrive al deploy).

## Self-Check

- fetchPages.ts: FOUND
- buildSchemaGraph.ts: FOUND
- buildPaths.ts: FOUND
- site.config.json: FOUND
- SchemaGraph.astro: FOUND
- Breadcrumb.astro: FOUND
- InternalLinks.astro: FOUND
- Layout.astro modificato: FOUND (canonical, sitemap, slot head verificati)
- Commit 1ca1780: FOUND in sub-repo git log
- Commit b7ff691: FOUND in sub-repo git log
- `npx vitest run`: 15 passed (3 files) — exit 0

## Self-Check: PASSED

---
*Phase: 02-astro-template-completion*
*Completed: 2026-04-25*
