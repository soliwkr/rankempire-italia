# Phase 4: Deploy Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 04-deploy-pipeline
**Areas discussed:** Cloudflare Pages creation, Config injection schema, GitHub retry loop, Deploy flow scope, Template repo GitHub, Build config Pages, D1 schema migration, Idempotenza deploy

---

## Cloudflare Pages Creation

| Option | Description | Selected |
|--------|-------------|----------|
| API Cloudflare diretta | POST /accounts/{id}/pages/projects via fetch. Serve CF_API_TOKEN. | ✓ |
| GitHub Actions nel template | Template ha wrangler.toml + CI workflow. Worker non chiama Pages API. | |
| Solo GitHub repo | Phase 4 crea solo repo. Pages creato manualmente dopo. | |

**User's choice:** API Cloudflare diretta
**Notes:** Utente ha chiesto atomicità — risposta: state machine D1 rende la pipeline riprendibile. Ha anche chiesto se il setup "funziona ancora per il cliente" — confermato: modello rank-and-rent, cliente ottiene solo custom domain (Phase 5), non accesso diretto a Cloudflare.

---

## CF_API_TOKEN

| Option | Description | Selected |
|--------|-------------|----------|
| Stesso token CF | CF_API_TOKEN con Pages:Edit + Account:Read. Stesso di wrangler deploy. | ✓ |
| Token dedicato per Pages | Scope ristretto solo Pages:Edit. | |
| Tu decidi | Claude sceglie pattern più comune. | |

**User's choice:** Stesso token CF

---

## Nome Pages Project

| Option | Description | Selected |
|--------|-------------|----------|
| rr-{slug} | Uguale al nome repo GitHub. URL: rr-{slug}.pages.dev. | ✓ |
| {slug} senza prefisso | URL più pulito ma rischio conflitti. | |
| Tu decidi | Claude usa rr-{slug}. | |

**User's choice:** rr-{slug}

---

## Linking GitHub → Pages

| Option | Description | Selected |
|--------|-------------|----------|
| POST /pages/projects con source.config | Singola call. | ✓ |
| Due chiamate separate | Crea + PATCH source. | |
| Tu decidi | Claude usa approccio più efficiente. | ✓ (delegato) |

**User's choice:** Tu decidi → Claude usa singola POST con source.config

---

## Config Injection Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Full config: tutti i campi SiteConfig | Niche, city, services, zones, avatar, factoryApi, slug, domain (null), + nullable fields. | ✓ (da template) |
| Solo niche, city, factoryApi | Config minimale. | |
| Come Phase 2 già definisce | Leggere fetchPages.ts e astro.config.mjs. | |

**User's choice:** "quel che credi meglio" — Claude ha letto il template e usa il full SiteConfig schema da `rankame/templates/astro-base/src/types/site.ts`.

---

## GitHub Retry Loop

| Option | Description | Selected |
|--------|-------------|----------|
| Retry loop su GET /repos/{owner}/{repo} | Poll fino a 200, max 10 tentativi × 500ms. | ✓ |
| Retry su createFile direttamente | Backoff esponenziale su createFile. | |
| Tu decidi | Claude sceglie pattern robusto. | |

**User's choice:** Retry loop su GET /repos/{owner}/{repo}

---

## Timeout del Retry Loop

| Option | Description | Selected |
|--------|-------------|----------|
| 503 + stato D1 preservato | Status 'repo_created', ritorna 503. Re-deploy può riprendere. | ✓ (delegato) |
| 500 + rollback | Cancella repo, torna 'pending'. | |
| Tu decidi | Claude usa 503 + D1 state. | ✓ |

**User's choice:** Tu decidi → 503 + D1 state preservato

---

## Deploy Flow Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Solo infra: repo + config + Pages | Seeding già fatto prima via seed-project. Phase 10 orchestra. | ✓ |
| Deploy + auto-seed in sequenza | Una sola call, ma rischio timeout Worker. | |
| Deploy + seed in background | Via CF Queue/DO. Infra extra non in scope. | |

**User's choice:** Solo infra

---

## Services/Zones source

| Option | Description | Selected |
|--------|-------------|----------|
| Request body (come seed-project) | Coerente con Phase 3. | ✓ (delegato) |
| Letti da config_json in D1 | Meno round-trip ma dipendenza su config_json popolato. | |
| Tu decidi | Claude usa request body per coerenza. | ✓ |

**User's choice:** Tu decidi → request body

---

## Template Repo GitHub

| Option | Description | Selected |
|--------|-------------|----------|
| StudioPuraLuce/astro-rank-rent | Org già esistente. Env var GITHUB_TEMPLATE_OWNER=StudioPuraLuce. | ✓ |
| soliwkr/astro-rank-rent | Account personale. | |

**User's choice:** StudioPuraLuce/astro-rank-rent
**Notes:** Template NON era ancora su GitHub — `StudioPuraLuce/astro-base` non esiste. Phase 4 include task per push + abilitazione flag `is_template`.

---

## Build Config Pages

| Option | Description | Selected |
|--------|-------------|----------|
| Incluse nella POST /pages/projects | deployment_configs con env_vars in singola call. | ✓ |
| Separatamente dopo | PATCH separato. | |
| Tu decidi | | |

**User's choice:** Incluse nella POST (singola call)

---

## Env Var Sito

| Option | Description | Selected |
|--------|-------------|----------|
| Solo FACTORY_API_URL | Sufficiente per Phase 4 build. GA4 ecc. nei Phase successivi. | ✓ |
| Anche SITE_ENV e altre | Variabili aggiuntive. | |

**User's choice:** Solo FACTORY_API_URL

---

## D1 Schema Migration

| Option | Description | Selected |
|--------|-------------|----------|
| github_repo_url + pages_project_name + pages_url | Tutte nullable. pages_project_name necessario per CF Pages API future (Phase 5). | ✓ |
| Solo github_repo_url + pages_url | Manca pages_project_name per Phase 5. | |

**User's choice:** Tutti e 3 i campi

---

## Idempotenza Deploy

| Option | Description | Selected |
|--------|-------------|----------|
| Riprendi da dove si era fermato | Check status D1 ad inizio. Se 'live' → 409. | ✓ |
| Sempre 409 se esiste qualcosa | Blocca sempre, richiede reset manuale. | |
| Sempre ricomincia da zero | Distruttivo. | |

**User's choice:** Riprendi da dove si era fermato

---

## Claude's Discretion

- Struttura interna di `CloudflarePagesService` (nuovo service o helper standalone)
- Gestione errori specifici CF Pages API (409/422/401)
- Formato esatto POST /pages/projects (campo per campo — API docs CF incompleti)
- Retry strategy per CF Pages API call
- Services/zones nel request body (delegato da utente — coerente con Phase 3)
- Timeout retry → 503 (delegato)

## Deferred Ideas

- Custom domain assignment → Phase 5
- GA4/GSC auto-create → Phase 7 (popola ga4MeasurementId in site.config.json)
- CF Queues per pipeline asincrona → considerato, scartato per v1
- Wizard multi-step UI → Phase 10
