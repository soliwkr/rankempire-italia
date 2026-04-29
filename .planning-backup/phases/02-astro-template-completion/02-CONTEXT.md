# Phase 2: Astro Template Completion - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Il template Astro rank-rent ha routing completo per tutti i tipi di pagina (homepage, service hub, zone hub, service×zone leaf ~72 pagine, blog), schema.org @graph (LocalBusiness + Service + FAQPage + BreadcrumbList), sitemap.xml e robots.txt auto-generati, e fetcha tutto il contenuto da factory-core D1 al build time — zero Directus, zero VPS.

</domain>

<decisions>
## Implementation Decisions

### Config Structure (site.config.json)

- **D-01:** `site.config.json` contiene tutti i campi necessari al build time:
  ```json
  {
    "projectId": "...",
    "niche": "ristrutturazioni",
    "city": "formia",
    "services": ["ristrutturazioni-interni", "rifacimento-bagno"],
    "zones": ["formia", "gaeta", "minturno"],
    "avatar": "in-pain",
    "factoryApi": "https://factory-core.soliwkr.workers.dev",
    "slug": "ristrutturazioni-formia",
    "domain": "ristrutturazioniformia.it",
    "gmbPlaceId": null,
    "ga4MeasurementId": null,
    "businessName": null,
    "phone": null,
    "address": null,
    "geo": null
  }
  ```
- **D-02:** Astro importa `site.config.json` direttamente da `src/data/site.config.json`. Phase 4 inietta questo file nel repo via GitHub API al momento del deploy.
- **D-03:** I campi `businessName`, `phone`, `address`, `geo`, `gmbPlaceId`, `ga4MeasurementId` sono `null` in fase ghost. Vengono valorizzati con una rebuild al momento dell'onboarding del renter.
- **D-04:** GBP SAB (Service Area Business — business che serve un'area senza indirizzo fisico) è supportato e legittimo per i renter reali. `gmbPlaceId` viene inserito nel config al momento dell'onboarding. **Nessun GBP creato in fase ghost** — non esiste ancora un business reale dietro, violazione ToS Google.

### Content Data Contract

- **D-05:** Phase 3 scrive il contenuto pre-generato in una nuova tabella D1 `pages` con almeno: `id`, `projectId`, `slug`, `type` (homepage/service/zone/service_zone/blog), `title`, `body` (HTML), `faq` (JSON array `[{question, answer}]`), `meta` (JSON: description, canonical).
- **D-06:** Astro fetcha `GET /api/sites/:projectId/pages` da factory-core al build time — un singolo endpoint che restituisce tutto il contenuto del sito. Nessuna chiamata AI al build time.
- **D-07:** `getStaticPaths()` enumera le route da `config.services[]` × `config.zones[]` e associa ogni route al contenuto corrispondente recuperato da D1. Se il contenuto per una route non esiste ancora in D1 (Phase 3 non ancora eseguita), la build fallisce con errore chiaro — non con pagina vuota.

### URL Routing Pattern

- **D-08:** Struttura nested con hub pages — massimizza interlinking interno:
  - `/` → Homepage
  - `/[service]/` → Service hub (lista di tutte le zone per quel servizio)
  - `/[service]/[zone]/` → Leaf page service×zone (~72 pagine)
  - `/zone/[zone]/` → Zone hub (lista di tutti i servizi disponibili in quella zona)
  - `/blog/` → Blog index
  - `/blog/[slug]/` → Blog post
- **D-09:** Interlinking bidirezionale obbligatorio su ogni leaf page:
  - ↑ Link al service hub padre
  - ↑ Link al zone hub padre
  - → Link alle pagine sorelle nella stessa zona (altri servizi a Gaeta)
  - → Link alle pagine sorelle nello stesso servizio (stessa servizio in altre zone)
  - Blog post linkano alle leaf page rilevanti (autorità contestuale)

### Schema.org @graph

- **D-10:** Pattern `@graph` completo, ispirato a MGC Reparation `SchemaManager.tsx`. Ogni pagina emette un grafo con entità collegate, non un singolo tipo isolato.
- **D-11:** In **fase ghost**, `LocalBusiness` emette solo i campi disponibili — `@type` specifico per la nicchia (es. `HomeAndConstructionBusiness`, `Plumber`), `url`, `areaServed`. I campi null (`name`, `telephone`, `address`, `geo`) vengono **omessi** dal JSON-LD emesso — mai placeholder inventati.
- **D-12:** Quando `gmbPlaceId` è valorizzato nel config, il rebuild arricchisce `LocalBusiness` con: `name`, `telephone`, `address` (PostalAddress), `geo` (GeoCoordinates), `openingHoursSpecification`, `aggregateRating` (da GMB/Places API — gestito in Phase 7).
- **D-13:** `Service` node presente su ogni pagina service×zone e service hub, con `areaServed: { @type: "City", name: "[zona]" }` e `provider: { @id: "[domain]/#organization" }`.
- **D-14:** `FAQPage` presente su homepage e pagine servizio — domande/risposte provengono dal campo `faq[]` del contenuto D1.
- **D-15:** `BreadcrumbList` su ogni pagina, costruito dinamicamente dalla struttura URL.

### Google APIs

- **D-16:** Places API per landmarks locali italiani (equivalente di `enriched_locations.json` di MGC) → **deferred a Phase 7** insieme a GSC e GA4. In Phase 2 il template ha solo lo slot, non fa chiamate.
- **D-17:** Il contenuto locale (riferimenti a frazioni, quartieri, luoghi di riferimento) viene prodotto da Gemini in Phase 3 — non richiede Places API al build time per Phase 2.

### Claude's Discretion

- Integrazione specifica per sitemap (`@astrojs/sitemap`)
- Struttura dei file Astro: layout, componenti, naming convention
- Design/CSS del template (non è focus di Phase 2 — placeholder visivo accettabile)
- Schema `@type` specifico per ogni nicchia (mapping niche → schema type)
- Formato esatto della tabella `pages` in D1 (Phase 3 definisce i campi esatti, Phase 2 si basa sul contratto minimo descritto in D-05)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements di fase
- `.planning/ROADMAP.md` §Phase 2 — Goal, success criteria (SITE-01/02/03/04)
- `.planning/REQUIREMENTS.md` §SITE-01, SITE-02, SITE-03, SITE-04

### Template esistente da completare
- `rankame/templates/astro-base/src/pages/index.astro` — homepage attuale (da riscrivere con D1 fetch)
- `rankame/templates/astro-base/src/layouts/Layout.astro` — layout base (da estendere con schema @graph)
- `rankame/templates/astro-base/src/components/SEO.astro` — componente SEO base (da estendere)
- `rankame/templates/astro-base/package.json` — Astro 6.x + Tailwind 4.0 confermati

### Reference schema @graph
- `client-mgc-reparation/components/SchemaManager.tsx` — reference implementation del pattern @graph (LocalBusiness + Service + FAQPage + BreadcrumbList + AggregateRating)
- `client-mgc-reparation/data/pseo_content.json` — reference per struttura dati pSEO (slug, keyword, city, answer)
- `client-mgc-reparation/types/pSEO.ts` — reference per type FAQContent con localData

### Factory-core D1 (per contratto API)
- `rankame/factory-core/src/db/schema.ts` — schema D1 attuale (base per nuova tabella `pages`)
- `rankame/factory-core/src/api/projects.ts` — pattern endpoint esistente (modello per nuovo GET /api/sites/:id/pages)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `rankame/templates/astro-base/src/components/SEO.astro` — genera `<script type="application/ld+json">`, da estendere per supportare il `@graph` completo invece di tipo singolo
- `rankame/templates/astro-base/src/layouts/Layout.astro` — layout base con `<head>`, da arricchire con meta SEO estesi e slot per schema
- `rankame/templates/astro-base/src/components/ContactForm.astro` — form di contatto esistente (placeholder per il lead form di Phase 6)

### Established Patterns
- **Astro 6.x** — `getStaticPaths()` per route dinamiche, `import.meta.env` per env vars, fetch API nativa per chiamate al build time
- **Tailwind 4.0** — utility classes, nessuna config file separata (inline in CSS)
- **Config injection**: Phase 4 usa `GitHubService.createFile()` per iniettare `src/data/site.config.json` nel repo — il template deve leggere da questo path esatto
- `rankame/factory-core/src/api/projects.ts` — pattern Hono per API endpoint: `const api = new Hono<{ Bindings: Bindings }>()`, export default

### Integration Points
- **Input**: `src/data/site.config.json` (injettato da Phase 4) — letto da ogni pagina Astro
- **Input**: `GET /api/sites/:projectId/pages` (creato in Phase 3) — fetcha contenuto D1 al build time
- **Output**: build statico su Cloudflare Pages — ogni pagina è HTML statico, zero JS runtime
- **Future slot**: `config.gmbPlaceId` → Phase 7 Places API enrichment → rebuild con LocalBusiness completo
- **Future slot**: `config.ga4MeasurementId` → Phase 7 GA4 tag injection

</code_context>

<specifics>
## Specific Ideas

- Pattern @graph da `client-mgc-reparation/components/SchemaManager.tsx` — usare esattamente quella struttura di entità collegate, tradotta in Astro component statico (non React useEffect)
- pSEO variations per keyword (come MGC `pseo_content.json`) — Phase 3 genera già le variazioni, Phase 2 deve avere le route pronte per accoglierle (slug extra sotto `/[service]/[zone]-[keyword-variation]/`)
- SAB GBP per renter reali: `gmbPlaceId` in config, schema.org `areaServed` senza `streetAddress` — pronto per renter contractors che operano in zona senza sede fisica

</specifics>

<deferred>
## Deferred Ideas

- Places API per landmarks italiani (frazioni, quartieri, POI) — Phase 7 insieme a GSC/GA4
- AggregateRating da GMB reviews reali — Phase 7+ dopo onboarding renter
- pSEO keyword variations aggiuntive (es. `/ristrutturazioni-interni/gaeta-preventivo/`) — da valutare in Phase 3 quando si definisce la struttura del contenuto generato
- Lead form attivo (Phase 6) — in Phase 2 il ContactForm è placeholder visivo
- GA4 tracking tag injection (Phase 7) — slot nel config già presente, implementazione rimandata

</deferred>

---

*Phase: 02-astro-template-completion*
*Context gathered: 2026-04-25*
