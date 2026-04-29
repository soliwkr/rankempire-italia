---
phase: 02-astro-template-completion
plan: 04
subsystem: astro-template
tags: [astro, pages, routing, schema-org, rank-rent, getStaticPaths, D1]

# Dependency graph
requires:
  - phase: 02-03-core-utilities
    provides: "fetchPages, buildSchemaGraph, buildPaths, componenti Astro, Layout esteso"
  - phase: 02-01-sites-api
    provides: "Endpoint GET /api/sites/:projectId/pages che le pagine interrogano al build time"
provides:
  - "index.astro: homepage D1-driven senza anti-pattern env/AI"
  - "[service]/index.astro: service hub con getStaticPaths da siteConfig.services"
  - "zone/[zone].astro: zone hub con getStaticPaths da siteConfig.zones"
  - "[service]/[zone].astro: leaf page ~72 pagine con buildServiceZonePaths + InternalLinks bidirezionale"
  - "blog/index.astro: blog index con lista post filtrati (graceful empty state)"
  - "blog/[slug].astro: blog post con getStaticPaths che restituisce [] se nessun post"
affects:
  - 02-05-sitemap-robots (usa le route create qui per sitemap auto-generata)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "getStaticPaths con fetchAllPages + requirePage: fail-fast chiaro se contenuto D1 mancante"
    - "buildServiceZonePaths: enumerazione services × zones con throw su slug mancante"
    - "blog/[slug].astro restituisce [] da getStaticPaths se nessun post — build non crasha"
    - "SchemaGraph nel slot head: ogni pagina emette @graph JSON-LD corretto per il suo tipo"
    - "InternalLinks su hub e leaf: interlinking bidirezionale calcolato build-time"
    - "Threat comment T-02-09: commento esplicito su Fragment set:html in ogni pagina con body D1"

key-files:
  created:
    - "rankame/templates/astro-base/src/pages/[service]/index.astro"
    - "rankame/templates/astro-base/src/pages/zone/[zone].astro"
    - "rankame/templates/astro-base/src/pages/[service]/[zone].astro"
    - "rankame/templates/astro-base/src/pages/blog/index.astro"
    - "rankame/templates/astro-base/src/pages/blog/[slug].astro"
  modified:
    - "rankame/templates/astro-base/src/pages/index.astro (riscritto: rimossi import.meta.env.SITE_CONFIG e /api/generate)"

key-decisions:
  - "ContactForm usa siteConfig.slug come projectName — il campo slug del config identifica il progetto"
  - "Blog index usa fetchAllPages + filter type=blog senza requirePage — non crasha se zero post"
  - "Threat comment T-02-09 aggiunto su ogni pagina con Fragment set:html per tracciabilita' audit"

requirements-completed:
  - SITE-01
  - SITE-04

# Metrics
duration: "~30 minuti"
completed: 2026-04-25
---

# Phase 2 Plan 04: Pagine Astro — routing completo con fetch D1, SchemaGraph e interlinking

**6 pagine Astro create/riscritte con fetch D1 build-time, SchemaGraph su ogni pagina, interlinking bidirezionale su leaf pages — routing SITE-01 completo senza anti-pattern env/AI.**

## Performance

- **Duration:** ~30 minuti
- **Started:** 2026-04-25
- **Completed:** 2026-04-25
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- index.astro riscritto: eliminati `import.meta.env.SITE_CONFIG` e chiamate `/api/generate`, sostituiti con `fetchAllPages` + `requirePage` da D1
- `[service]/index.astro` creato: `getStaticPaths` da `siteConfig.services`, SchemaGraph type=service, InternalLinks, Breadcrumb
- `zone/[zone].astro` creato: `getStaticPaths` da `siteConfig.zones`, SchemaGraph type=zone, InternalLinks, Breadcrumb
- `[service]/[zone].astro` creato: `buildServiceZonePaths` per ~72 leaf pages, SchemaGraph type=service_zone, InternalLinks bidirezionale (service + zone)
- `blog/index.astro` creato: lista post filtrati con graceful empty state ("Articoli in arrivo.")
- `blog/[slug].astro` creato: `getStaticPaths` restituisce `[]` se nessun post (Phase 3 non eseguita) — build non crasha
- `npx vitest run`: 15/15 test ancora GREEN dopo tutte le modifiche

## Task Commits

Commit nel sub-repo `rankame/templates/astro-base/` (repo git separato):

1. **Task 1: homepage riscritta, service hub, zone hub** — `db81301` (feat)
2. **Task 2: leaf service×zone, blog index, blog post** — `e80aad8` (feat)

## Files Created/Modified

- `src/pages/index.astro` — Riscritto: rimossi anti-pattern SITE_CONFIG e /api/generate. Aggiunto fetchAllPages, requirePage, SchemaGraph type=homepage, ContactForm.
- `src/pages/[service]/index.astro` — Nuovo: getStaticPaths da siteConfig.services, requirePage per slug servizio, SchemaGraph type=service, InternalLinks type=service, Breadcrumb, ContactForm.
- `src/pages/zone/[zone].astro` — Nuovo: getStaticPaths da siteConfig.zones, requirePage per slug "zone/[zone]", SchemaGraph type=zone, InternalLinks type=zone, Breadcrumb, ContactForm.
- `src/pages/[service]/[zone].astro` — Nuovo: buildServiceZonePaths per ~72 pagine leaf, SchemaGraph type=service_zone, InternalLinks type=service_zone con currentService + currentZone, Breadcrumb, ContactForm.
- `src/pages/blog/index.astro` — Nuovo: fetchAllPages filtrato type=blog, SchemaGraph type=blog, lista post con link a /blog/[slug]/, graceful empty state.
- `src/pages/blog/[slug].astro` — Nuovo: getStaticPaths filtra type=blog, ritorna [] se vuoto, SchemaGraph type=blog_post, Breadcrumb con titolo post.

## Deviations from Plan

Nessuna — il piano e' stato eseguito esattamente come scritto. I commit db81301 e e80aad8 nel sub-repo corrispondono ai Task 1 e Task 2 del piano.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: tampering (commentato) | src/pages/index.astro, [service]/index.astro, zone/[zone].astro, [service]/[zone].astro, blog/[slug].astro | body e' HTML raw da D1 — commento T-02-09 esplicito in ogni file, Phase 3 responsabile sanitizzazione prima scrittura D1 |

## Known Stubs

`blog/index.astro` e `blog/[slug].astro` mostrano stato vuoto / zero pagine se Phase 3 non e' stata eseguita. Questo e' intenzionale e documentato nel piano — Phase 3 scrive il contenuto blog in D1, dopodicche' un rebuild genera le pagine blog. Non e' un stub bloccante per SITE-01.

## Self-Check

- src/pages/index.astro: FOUND
- src/pages/[service]/index.astro: FOUND
- src/pages/zone/[zone].astro: FOUND
- src/pages/[service]/[zone].astro: FOUND
- src/pages/blog/index.astro: FOUND
- src/pages/blog/[slug].astro: FOUND
- `grep import.meta.env.SITE_CONFIG src/pages/` → 0 match: PASSED
- `grep api/generate src/pages/` → 0 match: PASSED
- `grep fetchAllPages|buildServiceZonePaths src/pages/` → 14 match: PASSED
- Commit db81301: FOUND in sub-repo git log
- Commit e80aad8: FOUND in sub-repo git log
- `npx vitest run`: 15 passed (3 files) — exit 0: PASSED

## Self-Check: PASSED

---
*Phase: 02-astro-template-completion*
*Completed: 2026-04-25*
