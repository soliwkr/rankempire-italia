# Phase 2: Astro Template Completion - Research

**Researched:** 2026-04-25
**Domain:** Astro 6.x static site generation, schema.org JSON-LD, @astrojs/sitemap, Cloudflare Pages build
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Config Structure (site.config.json)**
- D-01: `site.config.json` contiene tutti i campi necessari al build time: `projectId`, `niche`, `city`, `services[]`, `zones[]`, `avatar`, `factoryApi`, `slug`, `domain`, `gmbPlaceId` (null in ghost), `ga4MeasurementId` (null in ghost), `businessName` (null in ghost), `phone` (null in ghost), `address` (null in ghost), `geo` (null in ghost)
- D-02: Astro importa `site.config.json` direttamente da `src/data/site.config.json`. Phase 4 inietta questo file nel repo via GitHub API al momento del deploy.
- D-03: I campi null vengono valorizzati con una rebuild al momento dell'onboarding del renter. Nessun placeholder inventato.
- D-04: GBP SAB è supportato per renter reali. Nessun GBP creato in fase ghost (violazione ToS Google).

**Content Data Contract**
- D-05: Phase 3 scrive il contenuto in tabella D1 `pages`: `id`, `projectId`, `slug`, `type`, `title`, `body` (HTML), `faq` (JSON array), `meta` (JSON: description, canonical)
- D-06: Astro fetcha `GET /api/sites/:projectId/pages` da factory-core al build time — un singolo endpoint. Nessuna chiamata AI al build time.
- D-07: `getStaticPaths()` enumera route da `config.services[]` × `config.zones[]` e associa ogni route al contenuto D1. Se il contenuto non esiste, la build fallisce con errore chiaro (non pagina vuota).

**URL Routing Pattern**
- D-08: Struttura nested con hub pages: `/` (Homepage), `/[service]/` (Service hub), `/[service]/[zone]/` (Leaf page service×zone, ~72), `/zone/[zone]/` (Zone hub), `/blog/` (Blog index), `/blog/[slug]/` (Blog post)
- D-09: Interlinking bidirezionale obbligatorio su ogni leaf page (service hub padre, zone hub padre, sorelle stessa zona, sorelle stesso servizio)

**Schema.org @graph**
- D-10: Pattern `@graph` completo — ogni pagina emette un grafo con entità collegate, non un singolo tipo isolato
- D-11: In fase ghost, `LocalBusiness` emette solo campi disponibili. Campi null (`name`, `telephone`, `address`, `geo`) **omessi** dal JSON-LD — mai placeholder inventati
- D-12: Quando `gmbPlaceId` valorizzato, rebuild arricchisce `LocalBusiness` con dati completi (Phase 7)
- D-13: Nodo `Service` su ogni pagina service×zone e service hub con `areaServed: { @type: "City", name: "[zona]" }` e `provider: { @id: "[domain]/#organization" }`
- D-14: `FAQPage` su homepage e pagine servizio — domande/risposte da campo `faq[]` del contenuto D1
- D-15: `BreadcrumbList` su ogni pagina, costruito dinamicamente dalla struttura URL

**Google APIs**
- D-16: Places API deferred a Phase 7. In Phase 2 il template ha solo lo slot, non fa chiamate.
- D-17: Contenuto locale prodotto da Gemini in Phase 3 — Places API non richiesta al build time.

### Claude's Discretion
- Integrazione specifica per sitemap (`@astrojs/sitemap`)
- Struttura dei file Astro: layout, componenti, naming convention
- Design/CSS del template (placeholder visivo accettabile)
- Schema `@type` specifico per ogni nicchia (mapping niche → schema type)
- Formato esatto della tabella `pages` in D1 (Phase 2 si basa sul contratto minimo di D-05)

### Deferred Ideas (OUT OF SCOPE)
- Places API per landmarks italiani — Phase 7
- AggregateRating da GMB reviews reali — Phase 7+
- pSEO keyword variations aggiuntive — Phase 3+
- Lead form attivo — Phase 6
- GA4 tracking tag injection — Phase 7
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SITE-01 | Ogni sito ha routing Astro completo: homepage, pagine servizio, pagine zona, pagine programmatiche servizio×zona (~72), blog | D-08: file structure con `[service]/index.astro`, `[service]/[zone].astro`, `zone/[zone].astro`, `blog/index.astro`, `blog/[slug].astro` — tutti usano `getStaticPaths()` |
| SITE-02 | Ogni sito include structured data schema.org LocalBusiness + FAQPage | D-10 a D-15: componente `SchemaGraph.astro` con pattern `@graph`, ghost-mode null-omission, nodo Service, FAQPage, BreadcrumbList |
| SITE-03 | Ogni sito genera automaticamente sitemap.xml e robots.txt al build | `@astrojs/sitemap` 3.7.2 + endpoint `robots.txt.ts` — patterns verificati da docs ufficiali |
| SITE-04 | Ogni sito fetcha il contenuto da factory-core Worker D1 al build time (zero Directus/VPS) | D-06: top-level `await fetch()` nel frontmatter Astro — pattern verificato da docs ufficiali Astro 6.x |
</phase_requirements>

---

## Summary

Phase 2 completa il template Astro rank-rent trasformandolo da uno scheletro con chiamate AI dirette in un sistema di build statico che: (1) legge la configurazione da `src/data/site.config.json`, (2) fetcha tutto il contenuto pre-generato da un singolo endpoint factory-core D1, (3) genera staticamente ~74+ pagine con routing nested completo, (4) inietta schema.org @graph valido in ogni pagina, e (5) produce automaticamente sitemap.xml e robots.txt.

Il codice esistente nel template ha problemi fondamentali da correggere: `index.astro` chiama direttamente `/api/generate/content` con una POST al build time (violazione di D-06 — chiamata AI al build), `astro.config.mjs` legge `config.json` invece di `site.config.json`, `SEO.astro` emette un singolo `@type` isolato invece del pattern @graph. L'intera logica di routing dinamico è assente — esistono solo una homepage e componenti di supporto.

Il lavoro si articola in cinque aree: (A) nuovo endpoint factory-core `GET /api/sites/:id/pages`, (B) ristrutturazione del template con routing completo, (C) componente SchemaGraph Astro statico, (D) integrazione sitemap + robots.txt, (E) correzione astro.config.mjs per leggere `site.config.json` con il dominio corretto come `site:`.

**Primary recommendation:** Strutturare il lavoro in 5 piani sequenziali: endpoint D1 → config + data fetching → routing pages → schema.org component → sitemap + robots.txt.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Routing statico (~74 pagine) | Frontend Server (Astro build) | — | `getStaticPaths()` esegue solo al build time; nessun JS runtime |
| Fetch contenuto D1 | Frontend Server (Astro build) | API / Backend (factory-core) | Astro fetcha factory-core al build, factory-core interroga D1 |
| Schema.org @graph JSON-LD | Frontend Server (Astro build) | — | Output statico nel `<head>` HTML; nessun client-side rendering |
| Sitemap.xml + robots.txt | Frontend Server (Astro build) | — | `@astrojs/sitemap` genera i file durante `astro build` |
| Configurazione sito | Frontend Server (Astro build) | — | JSON importato staticamente; nessun runtime read |
| Endpoint `/api/sites/:id/pages` | API / Backend (factory-core Worker) | Database / Storage (D1) | Nuovo endpoint Hono da creare in factory-core; legge tabella `pages` D1 |
| Interlinking bidirezionale | Frontend Server (Astro build) | — | Link calcolati da `config.services[]` × `config.zones[]` nel template |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | 6.1.9 [VERIFIED: npm registry] | Framework SSG, routing, build pipeline | Già installato nel template; output statico su Cloudflare Pages |
| tailwindcss | 4.0.x [VERIFIED: package.json] | Utility CSS | Già integrato via `@tailwindcss/vite` |
| @astrojs/sitemap | 3.7.2 [VERIFIED: npm registry] | Genera sitemap.xml automaticamente al build | Integration ufficiale Astro, zero config per siti statici |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/vite | 4.0.x [VERIFIED: package.json] | Plugin Vite per Tailwind 4 | Già installato; non modificare |
| vitest | 4.1.5 [VERIFIED: package.json] | Test runner | Per unit test della logica di schema e routing |
| hono | latest in factory-core | Nuovo endpoint `/api/sites/:id/pages` | Pattern già usato in factory-core |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@astrojs/sitemap` | Generare sitemap manualmente | `@astrojs/sitemap` gestisce trailing slash, changefreq, lastmod automaticamente — non reinventare |
| JSON import diretto per config | `import.meta.env` + VITE define | JSON import è più semplice e leggibile; `astro.config.mjs` già usa `readFileSync` ma va corretta la logica |
| Top-level await fetch in ogni pagina | Libreria di caching | Fetch singolo per tutti i contenuti (D-06) — un array condiviso è sufficiente per questo uso; caching non necessario al build time |

**Installation (solo nuova dipendenza):**
```bash
cd rankame/templates/astro-base && npm install @astrojs/sitemap
```

**Version verification:** astro@6.1.9 confermato live su npm registry (2026-04-25). `@astrojs/sitemap@3.7.2` confermato. `vitest@4.1.5` confermato.

---

## Architecture Patterns

### System Architecture Diagram

```
site.config.json (src/data/)
       │
       ▼
astro.config.mjs ─── legge domain → site: "https://[domain]"
       │
       ▼
astro build
       │
       ├── getStaticPaths() [ogni pagina dinamica]
       │        │
       │        ▼
       │   fetch("${config.factoryApi}/api/sites/${config.projectId}/pages")
       │        │
       │        ▼
       │   factory-core Worker ── D1 SELECT * FROM pages WHERE project_id = ?
       │        │
       │        ▼
       │   PageContent[] { slug, type, title, body, faq, meta }
       │        │
       │        ▼
       │   map content → { params, props } per ogni route
       │
       ├── [/] index.astro ─── type: "homepage"
       ├── [service]/index.astro ─── type: "service"
       ├── [service]/[zone].astro ─── type: "service_zone" (~72 pagine)
       ├── zone/[zone].astro ─── type: "zone"
       ├── blog/index.astro ─── type: "blog_index"
       └── blog/[slug].astro ─── type: "blog"
              │
              ▼ (ogni pagina)
       Layout.astro
         ├── <head>
         │     ├── <meta name="description">
         │     ├── <link rel="canonical">
         │     ├── <link rel="sitemap">
         │     └── SchemaGraph.astro → <script type="application/ld+json">
         │           { "@context": "schema.org", "@graph": [
         │               LocalBusiness (campi non-null only),
         │               Service (su pagine service/service_zone),
         │               FAQPage (su homepage/service),
         │               BreadcrumbList (su tutte le pagine)
         │           ]}
         └── <body> → Hero + Content + Interlinking + ContactForm (placeholder)
              │
              ▼
       astro build output/
         ├── index.html
         ├── [service]/index.html
         ├── [service]/[zone]/index.html
         ├── zone/[zone]/index.html
         ├── blog/index.html
         ├── blog/[slug]/index.html
         ├── sitemap-index.xml  ← @astrojs/sitemap
         ├── sitemap-0.xml      ← @astrojs/sitemap
         └── robots.txt         ← src/pages/robots.txt.ts
```

### Recommended Project Structure

```
rankame/templates/astro-base/
├── astro.config.mjs          # aggiornato: site da config.domain, sitemap integration
├── src/
│   ├── data/
│   │   └── site.config.json  # iniettato da Phase 4 (path esatto richiesto)
│   ├── lib/
│   │   └── fetchPages.ts     # utility: fetch + cache + fail-fast se content mancante
│   ├── types/
│   │   └── site.ts           # SiteConfig, PageContent, FaqItem interfaces
│   ├── pages/
│   │   ├── index.astro                    # Homepage (type: homepage)
│   │   ├── robots.txt.ts                  # robots.txt dinamico
│   │   ├── [service]/
│   │   │   ├── index.astro                # Service hub (type: service)
│   │   │   └── [zone].astro               # Leaf page service×zone (type: service_zone)
│   │   ├── zone/
│   │   │   └── [zone].astro               # Zone hub (type: zone)
│   │   └── blog/
│   │       ├── index.astro                # Blog index (type: blog_index)
│   │       └── [slug].astro               # Blog post (type: blog)
│   ├── layouts/
│   │   └── Layout.astro       # esteso con SEO meta + SchemaGraph slot
│   └── components/
│       ├── SchemaGraph.astro  # NUOVO: pattern @graph completo (sostituisce SEO.astro per LD+JSON)
│       ├── SEO.astro          # semplificato: solo meta tag (no LD+JSON)
│       ├── Breadcrumb.astro   # NUOVO: breadcrumb visuale + dati per BreadcrumbList
│       ├── InternalLinks.astro # NUOVO: interlinking bidirezionale (D-09)
│       ├── Hero.astro         # esistente — invariato
│       ├── ServiceGrid.astro  # esistente — invariato
│       └── ContactForm.astro  # esistente — placeholder invariato
│   └── styles/
│       └── global.css         # invariato
```

### Pattern 1: Config Loading e Site URL Dinamico

**What:** `astro.config.mjs` legge `site.config.json` e usa `config.domain` come `site:` per la sitemap
**When to use:** Sempre — la sitemap richiede un URL assoluto

```javascript
// Source: https://docs.astro.build/en/guides/integrations-guide/sitemap
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let siteConfig = { domain: 'example.com', niche: 'Default', city: 'City' };
try {
  const configPath = resolve('./src/data/site.config.json');
  siteConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
} catch (e) {
  console.warn('site.config.json non trovato, uso default');
}

export default defineConfig({
  site: `https://${siteConfig.domain}`,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### Pattern 2: Config Import e Fetch Centralizzato

**What:** `src/lib/fetchPages.ts` esegue un singolo fetch al build time e restituisce tutti i contenuti. Fail-fast se l'endpoint non risponde o un contenuto è mancante per una route.
**When to use:** Importato da ogni pagina dinamica in `getStaticPaths()`

```typescript
// Source: https://docs.astro.build/en/guides/data-fetching (top-level await)
// src/lib/fetchPages.ts
import siteConfig from '../data/site.config.json';

export interface PageContent {
  id: string;
  projectId: string;
  slug: string;
  type: 'homepage' | 'service' | 'zone' | 'service_zone' | 'blog';
  title: string;
  body: string;
  faq: Array<{ question: string; answer: string }>;
  meta: { description: string; canonical: string };
}

let _cache: PageContent[] | null = null;

export async function fetchAllPages(): Promise<PageContent[]> {
  if (_cache) return _cache;
  const res = await fetch(
    `${siteConfig.factoryApi}/api/sites/${siteConfig.projectId}/pages`
  );
  if (!res.ok) {
    throw new Error(
      `[build] factory-core /api/sites/${siteConfig.projectId}/pages returned ${res.status} — aborting build`
    );
  }
  const data = await res.json() as { pages: PageContent[] };
  _cache = data.pages;
  return _cache;
}

export function requirePage(pages: PageContent[], slug: string): PageContent {
  const page = pages.find(p => p.slug === slug);
  if (!page) {
    throw new Error(
      `[build] Contenuto D1 mancante per slug "${slug}" — eseguire Phase 3 prima della build`
    );
  }
  return page;
}
```

### Pattern 3: getStaticPaths() con Fail-Fast

**What:** Ogni pagina dinamica usa `config.services[]` e `config.zones[]` per enumerare route, poi associa il contenuto D1 o fallisce esplicitamente
**When to use:** Tutte le pagine dinamiche (service hub, zone hub, leaf, blog)

```astro
---
// Source: https://docs.astro.build/en/reference/routing-reference
// src/pages/[service]/[zone].astro
import Layout from '../../layouts/Layout.astro';
import siteConfig from '../../data/site.config.json';
import { fetchAllPages, requirePage } from '../../lib/fetchPages';
import type { PageContent } from '../../lib/fetchPages';
import SchemaGraph from '../../components/SchemaGraph.astro';

export async function getStaticPaths() {
  const pages = await fetchAllPages();
  const paths = [];
  for (const service of siteConfig.services) {
    for (const zone of siteConfig.zones) {
      const slug = `${service}/${zone}`;
      const content = requirePage(pages, slug); // throws se mancante
      paths.push({
        params: { service, zone },
        props: { content, service, zone }
      });
    }
  }
  return paths;
}

const { content, service, zone } = Astro.props as {
  content: PageContent;
  service: string;
  zone: string;
};
---
```

### Pattern 4: SchemaGraph.astro — Pattern @graph Statico

**What:** Componente Astro che emette `@graph` completo. Traduce la logica di `client-mgc-reparation/components/SchemaManager.tsx` in build-time Astro statico (no `useEffect`, no `window`).
**When to use:** In ogni pagina, passando `pageType` e dati dalla props del contenuto

```astro
---
// src/components/SchemaGraph.astro
// Ispirato a: client-mgc-reparation/components/SchemaManager.tsx
// Differenza chiave: statico — nessun useEffect, nessun window.location

import siteConfig from '../data/site.config.json';

interface FaqItem { question: string; answer: string; }
interface BreadcrumbItem { name: string; url: string; }

interface Props {
  pageType: 'homepage' | 'service' | 'zone' | 'service_zone' | 'blog' | 'blog_post';
  serviceSlug?: string;
  zoneSlug?: string;
  faqs?: FaqItem[];
  breadcrumbs: BreadcrumbItem[];
}

const { pageType, serviceSlug, zoneSlug, faqs = [], breadcrumbs } = Astro.props;
const siteUrl = `https://${siteConfig.domain}`;

const graph: any[] = [];

// 1. LocalBusiness — emette solo campi non-null (D-11)
const nicheTypeMap: Record<string, string> = {
  'ristrutturazioni': 'HomeAndConstructionBusiness',
  'idraulico': 'Plumber',
  'elettricista': 'Electrician',
  'pulizie': 'HousePainter',
  // ... estendibile in Claude's Discretion
};
const localBusinessType = nicheTypeMap[siteConfig.niche] ?? 'LocalBusiness';

const localBusiness: any = {
  '@type': localBusinessType,
  '@id': `${siteUrl}/#organization`,
  url: siteUrl,
  areaServed: siteConfig.zones.map(zone => ({
    '@type': 'City',
    name: zone
  }))
};

// Campi opzionali — omessi se null (mai placeholder)
if (siteConfig.businessName) localBusiness.name = siteConfig.businessName;
if (siteConfig.phone) localBusiness.telephone = siteConfig.phone;
if (siteConfig.address) {
  localBusiness.address = {
    '@type': 'PostalAddress',
    ...siteConfig.address,
    addressCountry: 'IT'
  };
}
if (siteConfig.geo) {
  localBusiness.geo = { '@type': 'GeoCoordinates', ...siteConfig.geo };
}
graph.push(localBusiness);

// 2. Service node (D-13) — su service e service_zone
if (serviceSlug && (pageType === 'service' || pageType === 'service_zone')) {
  graph.push({
    '@type': 'Service',
    serviceType: serviceSlug.replace(/-/g, ' '),
    provider: { '@id': `${siteUrl}/#organization` },
    areaServed: zoneSlug
      ? { '@type': 'City', name: zoneSlug }
      : siteConfig.zones.map(z => ({ '@type': 'City', name: z }))
  });
}

// 3. FAQPage (D-14) — su homepage e service
if (faqs.length > 0 && (pageType === 'homepage' || pageType === 'service')) {
  graph.push({
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer }
    }))
  });
}

// 4. BreadcrumbList (D-15) — tutte le pagine
graph.push({
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((crumb, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: crumb.name,
    item: crumb.url
  }))
});

const schema = {
  '@context': 'https://schema.org',
  '@graph': graph
};
---

<script type="application/ld+json" set:html={JSON.stringify(schema)} />
```

### Pattern 5: robots.txt Dinamico

**What:** File TypeScript endpoint Astro che genera robots.txt con URL sitemap corretta
**When to use:** Una volta, come `src/pages/robots.txt.ts`

```typescript
// Source: https://docs.astro.build/en/guides/integrations-guide/sitemap
// src/pages/robots.txt.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapURL.href}`);
};
```

### Anti-Patterns to Avoid

- **Chiamata POST `/api/generate/content` al build time:** L'`index.astro` attuale chiama l'endpoint AI generativo. Da sostituire con fetch GET all'endpoint `/api/sites/:id/pages` (D-06). Le chiamate AI appartengono a Phase 3, non al build del template.
- **`import.meta.env.SITE_CONFIG` come stringa JSON da Vite define:** Il template attuale serializza la config in `astro.config.mjs` e la inietta via Vite define. Da sostituire con import JSON diretto di `site.config.json` [VERIFIED: docs.astro.build/en/guides/imports].
- **`config.json` invece di `site.config.json`:** L'`astro.config.mjs` attuale legge `./src/data/config.json`. Phase 4 inietta `src/data/site.config.json` — path diverso (D-02).
- **Pagina vuota su contenuto mancante:** `getStaticPaths()` deve usare `requirePage()` con throw esplicito — mai fallback a stringa vuota o placeholder.
- **`@type` singolo in `SEO.astro` esistente:** L'attuale `SEO.astro` emette `{ "@context": ..., "@type": ... }` isolato. Sostituire con `SchemaGraph.astro` per il pattern `@graph`.
- **`window.location` nel SchemaGraph:** La reference React usa `window.location.origin` in `useEffect`. In Astro statico usare `siteUrl` dalla config — nessun accesso DOM.
- **Params non-stringa in `getStaticPaths`:** Astro 6 richiede che tutti i `params` siano stringhe. [VERIFIED: docs.astro.build/en/guides/upgrade-to/v6]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Generazione sitemap.xml | Costruire manualmente XML con lista URL | `@astrojs/sitemap` | Gestisce sitemap multi-file, `lastmod`, `changefreq`, trailing slash, filtering; si integra automaticamente con `getStaticPaths()` |
| robots.txt con URL sitemap | File statico hardcoded | `src/pages/robots.txt.ts` endpoint | URL sitemap usa `Astro.site` che viene dalla config — non hardcodarla |
| Cache fetch al build | Libreria cache esterna | Variabile modulo `_cache` in `fetchPages.ts` | `getStaticPaths()` viene chiamata più volte nello stesso processo di build; la var modulo persiste tra le chiamate |
| Serializzazione JSON-LD | Template string manuale | `JSON.stringify(schema)` + `set:html` | Astro garantisce escaping corretto; `set:html` bypassa la sanitizzazione HTML per JSON-LD |

**Key insight:** `@astrojs/sitemap` funziona automaticamente su build statici — rileva tutte le pagine generate da `getStaticPaths()` senza configurazione aggiuntiva, purché `site:` sia impostato in `astro.config.mjs`.

---

## Common Pitfalls

### Pitfall 1: astro.config.mjs legge il file sbagliato

**What goes wrong:** La build Cloudflare Pages non trova `src/data/config.json` (nome vecchio) e usa il default, producendo una sitemap con `https://example.com` invece del dominio reale.
**Why it happens:** Il file iniettato da Phase 4 si chiama `site.config.json` (D-02), ma l'`astro.config.mjs` attuale legge `config.json`.
**How to avoid:** Aggiornare `astro.config.mjs` per leggere `./src/data/site.config.json`. Aggiungere fallback che logga chiaramente in errore.
**Warning signs:** URL nella sitemap è `https://example.com`; `astro.site` ritorna undefined.

### Pitfall 2: Fetch API non disponibile in Cloudflare Pages build environment

**What goes wrong:** `fetch()` in `getStaticPaths()` potrebbe fallire su ambienti di build se fetch globale non è disponibile.
**Why it happens:** Node.js < 18 non ha fetch globale. Node 22 (confermato sull'ambiente locale) ce l'ha. Cloudflare Pages usa Node 18+ by default.
**How to avoid:** Node 22.22.2 è confermato localmente [VERIFIED: `node --version`]. Cloudflare Pages supporta Node 18+ su tutti i piani. Nessuna polyfill necessaria. [ASSUMED: Cloudflare Pages environment specifico — non verificato direttamente]
**Warning signs:** `ReferenceError: fetch is not defined` nei log di build.

### Pitfall 3: @astrojs/sitemap non rileva pagine dinamiche

**What goes wrong:** La sitemap è generata ma contiene solo la homepage.
**Why it happens:** `@astrojs/sitemap` traccia le pagine che Astro conosce al build time. Se `getStaticPaths()` fallisce silenziosamente (invece di throwsare), le pagine non vengono registrate.
**How to avoid:** Usare `requirePage()` con throw esplicito — se la build riesce, la sitemap è completa. Verificare il count di URL nella sitemap dopo la build.
**Warning signs:** Sitemap con < 5 URL su un progetto con 8+ servizi e 9+ zone.

### Pitfall 4: Campi null nel JSON-LD provocano invalidazione da Google

**What goes wrong:** Google Search Console segnala errori di structured data su campi vuoti o con valore `null` nel JSON-LD.
**Why it happens:** Emettere `"name": null` o `"telephone": ""` in JSON-LD è un valore non valido per schema.org.
**How to avoid:** Il pattern D-11 richiede di **omettere** i campi null. In `SchemaGraph.astro` usare `if (siteConfig.businessName) localBusiness.name = ...` — mai assegnare il campo se il valore è falsy.
**Warning signs:** GSC mostra "missing required field" o "invalid value" per LocalBusiness.

### Pitfall 5: `getStaticPaths()` scope isolation

**What goes wrong:** Errore `getStaticPaths() ran multiple times` o variabile esterna non accessibile dentro `getStaticPaths()`.
**Why it happens:** Astro esegue `getStaticPaths()` in scope isolato. Non può accedere a variabili definite fuori dal frontmatter della stessa pagina. [VERIFIED: docs.astro.build/en/reference/routing-reference]
**How to avoid:** Import `fetchAllPages` e `siteConfig` direttamente nel frontmatter della pagina (non passarli come argomenti). La cache modulo in `fetchPages.ts` funziona perché è un modulo condiviso tra tutte le pagine della build.
**Warning signs:** `TypeError: ... is not defined` dentro `getStaticPaths()`.

### Pitfall 6: Interlinking bidirezionale con URL non-normalizzati

**What goes wrong:** Link interni puntano a `/ristrutturazioni-interni/formia` invece di `/ristrutturazioni-interni/formia/` — mismatch trailing slash causa redirect 301 su Cloudflare Pages.
**Why it happens:** Astro di default genera `index.html` nelle sottocartelle (trailing slash). Se i link non hanno trailing slash, Cloudflare Pages redirige.
**How to avoid:** Usare sempre trailing slash nei link interni generati da `InternalLinks.astro`. Aggiungere `trailingSlash: 'always'` in `astro.config.mjs` [ASSUMED — comportamento default Cloudflare Pages da verificare].
**Warning signs:** Redirect 301 nei log di browser su link interni.

---

## Code Examples

### Endpoint factory-core: GET /api/sites/:id/pages

```typescript
// Source: factory-core/src/api/projects.ts (pattern Hono esistente)
// Nuovo file: factory-core/src/api/sites.ts
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { pages } from '../db/schema'; // nuova tabella da aggiungere

type Bindings = { DB: D1Database };
const api = new Hono<{ Bindings: Bindings }>();

api.get('/:projectId/pages', async (c) => {
  const db = drizzle(c.env.DB);
  const projectId = c.req.param('projectId');
  const allPages = await db.select().from(pages).where(eq(pages.projectId, projectId)).all();
  if (allPages.length === 0) {
    return c.json({ error: 'No content found for project' }, 404);
  }
  return c.json({ pages: allPages });
});

export default api;
```

### Schema D1 — nuova tabella `pages`

```typescript
// Source: rankame/factory-core/src/db/schema.ts (pattern esistente)
// Da aggiungere a factory-core/src/db/schema.ts
export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  slug: text('slug').notNull(),
  type: text('type').notNull(), // 'homepage'|'service'|'zone'|'service_zone'|'blog'
  title: text('title').notNull(),
  body: text('body').notNull(),         // HTML
  faq: text('faq').notNull().default('[]'),   // JSON string
  meta: text('meta').notNull().default('{}'), // JSON string
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
```

### robots.txt.ts

```typescript
// Source: https://docs.astro.build/en/guides/integrations-guide/sitemap
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${sitemapURL.href}`
  );
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Astro `import.meta.env` per JSON config via Vite define | JSON import diretto: `import config from '../data/site.config.json'` | Astro 2.0+ | Più semplice, type-safe, nessun casting necessario |
| Schema.org tipo singolo `{ "@type": "LocalBusiness" }` | Pattern `@graph` con entità collegate | Schema.org best practices 2020+ | Google preferisce il grafo; permette cross-referencing tra entità |
| Astro 5.x | Astro 6.x (breaking: params devono essere stringhe) | 2025 | `getStaticPaths()` params non accetta più numeri |

**Deprecated/outdated:**
- `import.meta.env.SITE_CONFIG` via Vite define: il pattern attuale in `astro.config.mjs` è workaround legacy — JSON import diretto è lo standard corrente.
- `SEO.astro` con tipo singolo: da deprecare o ridurre a soli meta tag; la logica JSON-LD va in `SchemaGraph.astro`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cloudflare Pages usa Node 18+ nell'environment di build, quindi `fetch` globale è disponibile senza polyfill | Pitfall 2 | La build fallirebbe con `ReferenceError: fetch is not defined` — fix: aggiungere `node-fetch` o verificare la versione Node in `wrangler.toml` |
| A2 | Il comportamento default di trailing slash su Cloudflare Pages Pages è redirigere `/path` → `/path/` quando esiste `path/index.html` | Pitfall 6 | Nessun impatto sulla build; solo possibili 301 redirect in produzione |
| A3 | Il mapping niche → schema.org `@type` (es. `ristrutturazioni` → `HomeAndConstructionBusiness`) è corretto per schema.org italiano | SchemaGraph Pattern | JSON-LD valido ma con @type subottimale; non blocca indexing |
| A4 | factory-core (progetto root `/factory-core/`) è il target del nuovo endpoint — non `rankame/factory-core/` (che sembra una copia) | Endpoint Pattern | Modifiche nel progetto sbagliato — verificare quale Worker è in produzione |

**Note A4:** Il repository contiene due copie di factory-core: `/factory-core/` (root) e `/rankame/factory-core/`. L'URL di produzione nei test è `https://factory-core.soliwkr.workers.dev`. Il `wrangler.toml` si trova in `/rankame/factory-core/` — questo suggerisce che `/rankame/factory-core/` sia il progetto deployato. Il planner deve verificare quale dei due aggiornare.

---

## Open Questions

1. **Quale factory-core è deployato in produzione?**
   - What we know: `/factory-core/` e `/rankame/factory-core/` contengono entrambi codice simile; il `wrangler.toml` è solo in `/rankame/factory-core/`
   - What's unclear: Phase 1 ha modificato `/factory-core/` — queste modifiche sono state deployate?
   - Recommendation: Il planner deve aggiungere il nuovo endpoint `GET /api/sites/:id/pages` al factory-core che ha `wrangler.toml` (presumibilmente `/rankame/factory-core/`) E aggiornare lo schema D1 nello stesso progetto.

2. **Endpoint `/api/sites/:id/pages` deve essere pubblico o autenticato?**
   - What we know: Phase 1 ha aggiunto Bearer auth su tutti gli endpoint non-pubblici
   - What's unclear: Il build di Astro su Cloudflare Pages può passare un Bearer token? Come viene configurato?
   - Recommendation: L'endpoint deve essere **pubblico** (o autenticato con un token fisso nella config). Le build di Cloudflare Pages non hanno gestione secrets complessa per fetch al build time senza variabili d'ambiente. Alternativa: aggiungere `FACTORY_API_TOKEN` come env var nel progetto Cloudflare Pages. Il planner deve decidere.

3. **Il nodo `Service` richiede un nome leggibile per `serviceType` o va bene lo slug?**
   - What we know: `serviceSlug` è in formato kebab-case (es. `ristrutturazioni-interni`)
   - What's unclear: Schema.org preferisce testo leggibile per `serviceType`
   - Recommendation: Usare `.replace(/-/g, ' ')` come soluzione minima. Phase 3 potrebbe fornire un campo `title` per il servizio nella struttura dati — preferibile se disponibile.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build locale astro | ✓ | v22.22.2 | — |
| npm | Package install | ✓ | 10.9.7 | — |
| `@astrojs/sitemap` | SITE-03 | ✗ (non installato) | — | Nessun fallback — da installare |
| Astro 6.x | Tutte le route | ✓ | 6.1.9 (in package.json) | — |
| factory-core Worker | SITE-04 | ✓ (URL configurato) | production | Test locale con mock |
| D1 tabella `pages` | SITE-04 | ✗ (non ancora creata) | — | Phase 3 la crea; Wave 0 crea schema stub |

**Missing dependencies con no fallback:**
- `@astrojs/sitemap` — da installare come prima task del Wave 1
- Tabella D1 `pages` — da aggiungere allo schema in factory-core come parte di questa fase

**Missing dependencies con fallback:**
- Contenuto D1 effettivo (Phase 3 non ancora completata) — per testare la build, usare un endpoint mock locale o hardcodare dati di test in `fetchPages.ts`

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.5 (installato in package.json astro-base) |
| Config file | nessuno — Wave 0 crea `vitest.config.ts` |
| Quick run command | `cd rankame/templates/astro-base && npx vitest run` |
| Full suite command | `cd rankame/templates/astro-base && npx vitest run --reporter=verbose` |

**Nota:** `astro build` è la validazione primaria per SITE-01, SITE-03, SITE-04. Test unitari coprono logica isolata (SchemaGraph, fetchPages).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SITE-01 | Route enumerate da config.services × config.zones | unit | `npx vitest run tests/routing.test.ts` | ❌ Wave 0 |
| SITE-01 | Build completa senza errori con mock content | smoke | `cd rankame/templates/astro-base && npx astro build` | ❌ richiede content mock |
| SITE-02 | SchemaGraph omette campi null in ghost mode | unit | `npx vitest run tests/schema-graph.test.ts` | ❌ Wave 0 |
| SITE-02 | SchemaGraph include nodo Service su service_zone | unit | `npx vitest run tests/schema-graph.test.ts` | ❌ Wave 0 |
| SITE-02 | JSON-LD è JSON valido e contiene @graph | unit | `npx vitest run tests/schema-graph.test.ts` | ❌ Wave 0 |
| SITE-03 | sitemap-index.xml presente dopo build | smoke | `ls rankame/templates/astro-base/dist/sitemap-index.xml` | ❌ post-build check |
| SITE-03 | robots.txt presente e contiene URL sitemap | smoke | `grep "sitemap" rankame/templates/astro-base/dist/robots.txt` | ❌ post-build check |
| SITE-04 | fetchAllPages() fetcha URL corretto | unit | `npx vitest run tests/fetch-pages.test.ts` | ❌ Wave 0 |
| SITE-04 | requirePage() lancia errore su slug mancante | unit | `npx vitest run tests/fetch-pages.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd rankame/templates/astro-base && npx vitest run`
- **Per wave merge:** `cd rankame/templates/astro-base && npx vitest run --reporter=verbose`
- **Phase gate:** Build smoke test (`npx astro build`) green + full vitest suite green

### Wave 0 Gaps

- [ ] `rankame/templates/astro-base/vitest.config.ts` — config vitest per progetto Astro
- [ ] `rankame/templates/astro-base/tests/fetch-pages.test.ts` — copre SITE-04 (fetch, requirePage)
- [ ] `rankame/templates/astro-base/tests/schema-graph.test.ts` — copre SITE-02 (null omission, @graph structure)
- [ ] `rankame/templates/astro-base/tests/routing.test.ts` — copre SITE-01 (path enumeration)
- [ ] Mock `site.config.json` per i test (fixture con dati esempio)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — build statico, nessun login |
| V3 Session Management | no | N/A — build statico |
| V4 Access Control | parziale | Endpoint `/api/sites/:id/pages` — vedi Open Question 2 |
| V5 Input Validation | sì | Validare `PageContent[]` risposta API — schema check con `zod` o guard TypeScript |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for Astro SSG + factory-core Fetch

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JSON-LD injection (body HTML da D1 iniettato in `set:html`) | Tampering | `set:html` bypassa sanitizzazione Astro — il campo `body` HTML viene renderizzato direttamente. Phase 3 genera il body, quindi il rischio è interno. Documentare che il body non deve contenere `<script>` tag. |
| Fetch build-time verso URL non verificato | Spoofing | `factoryApi` viene da `site.config.json` iniettato da Phase 4 — nessuna input utente. Rischio accettabile per v1. |
| Sitemap rivela struttura URL completa | Information Disclosure | Rischio accettato — la sitemap è intenzionalmente pubblica per SEO |

---

## Project Constraints (from CLAUDE.md)

Le seguenti direttive dal `rankame/CLAUDE.md` si applicano a questa fase:

- **Stack obbligatorio:** Astro (il CLAUDE.md dice "5.x" ma il package.json ha 6.x installato — usare 6.x come installato), Tailwind 4.0, Cloudflare Workers, Hono, Cloudflare D1 con Drizzle ORM
- **Output infrastrutturale:** Cloudflare Pages (build statico)
- **GSD Workflow:** Ogni fase deve soddisfare i success criteria di ROADMAP.md prima di procedere
- **Pattern build:** `astro build` è il comando di build standard — non modificare lo stack

**Discrepanza da segnalare al planner:** Il CLAUDE.md dice "Astro 5.x" ma `package.json` ha `astro: "^6.1.8"` e npm registry mostra 6.1.9 come latest. Usare 6.x come base effettiva installata.

---

## Sources

### Primary (HIGH confidence)
- `/websites/astro_build_en` (Context7) — `getStaticPaths()`, JSON import, fetch build-time, `set:html`, output static, params string requirement in v6
- `docs.astro.build/en/guides/integrations-guide/sitemap` (Context7) — `@astrojs/sitemap` config, robots.txt.ts pattern, sitemap URL in head
- `docs.astro.build/en/guides/data-fetching` (Context7) — top-level await fetch in frontmatter
- `npm view astro version` — versione 6.1.9 confermata (2026-04-25)
- `npm view @astrojs/sitemap version` — versione 3.7.2 confermata (2026-04-25)

### Secondary (MEDIUM confidence)
- `client-mgc-reparation/components/SchemaManager.tsx` (codebase) — pattern @graph reference implementation (React runtime → tradotto in Astro static)
- `rankame/templates/astro-base/` (codebase) — stato attuale del template da modificare
- `rankame/factory-core/src/db/schema.ts` (codebase) — pattern Drizzle per nuova tabella `pages`
- `factory-core/src/api/projects.ts` (codebase) — pattern Hono per nuovo endpoint

### Tertiary (LOW confidence)
- A1-A4 nell'Assumptions Log — non verificate con fonti esterne

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — versioni verificate su npm registry
- Architecture: HIGH — patterns verificati da Context7 docs ufficiali Astro
- Pitfalls: MEDIUM — la maggior parte derivata dal codice esistente analizzato; A1/A2 non verificate
- Schema.org patterns: HIGH — basati su MGC reference implementation + schema.org spec

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (stack stabile; Astro 6.x è una major release recente)
