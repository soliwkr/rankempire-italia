# Phase 4: Deploy Pipeline - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Endpoint `POST /projects/:id/deploy` che, dato un projectId, esegue la pipeline completa: (1) crea GitHub repo da template Astro, (2) inietta `site.config.json` con tutta la SiteConfig, (3) crea + collega il progetto Cloudflare Pages via API. Stato persistito su D1 ad ogni step — pipeline idempotente e riprendibile in caso di failure parziale. Nessun sleep hack. Nessun UI, nessun wizard — quello è Phase 10.

</domain>

<decisions>
## Implementation Decisions

### Cloudflare Pages Creation

- **D-01:** Il Worker chiama direttamente la **Cloudflare Pages API** (`POST /accounts/{CF_ACCOUNT_ID}/pages/projects`) via fetch. Token: `CF_API_TOKEN` (Cloudflare global token con Pages:Edit + Account:Read, stesso usato per `wrangler deploy`). Env var in wrangler.toml: `CF_API_TOKEN`.
- **D-02:** Nome Pages project: `rr-{slug}` — stesso naming del repo GitHub. URL pubblico: `rr-{slug}.pages.dev`.
- **D-03:** Singola POST `/pages/projects` con `source.config` incluso (GitHub repo owner/name/branch) + `deployment_configs.production.env_vars: { FACTORY_API_URL }`. Una call crea il project, configura build e setta env var.
- **D-04:** Build config Pages: `build_command: "npm run build"`, `destination_dir: "dist"`, root dir: `""` (root del repo).

### GitHub Template Repository

- **D-05:** Template Astro (in `rankame/templates/astro-base/`) va pushato su GitHub come **Template Repository** in `StudioPuraLuce/astro-rank-rent`. Phase 4 include un task dedicato per questo push + abilitazione flag `is_template`.
- **D-06:** Env var nel Worker: `GITHUB_TEMPLATE_OWNER=StudioPuraLuce`, `GITHUB_TEMPLATE_REPO=astro-rank-rent`. Rimpiazza `templateOwner: 'StudioPuraLuce'` hardcoded in `github.ts`.

### Config Injection (FACT-05)

- **D-07:** Iniettare il file `src/data/site.config.json` (path esatto che il template Astro importa) con il **full SiteConfig**:
  ```json
  {
    "projectId": "...",
    "niche": "...",
    "city": "...",
    "services": [...],
    "zones": [...],
    "avatar": "...",
    "factoryApi": "https://factory-core.soliwkr.workers.dev",
    "slug": "...",
    "domain": null,
    "gmbPlaceId": null,
    "ga4MeasurementId": null,
    "businessName": null,
    "phone": null,
    "address": null,
    "geo": null
  }
  ```
  Campi nullable a null al deploy — si popolano nei Phase successivi (Phase 5 domain, Phase 7 GA4/GSC, client onboarding futuro).
- **D-08:** `factoryApi` usa la env var `FACTORY_API_URL` del Worker (non hardcoded). `services[]` e `zones[]` vengono passati nel **request body** del deploy endpoint (coerente con Phase 3 seed-project).

### GitHub Retry Loop (FACT-03)

- **D-09:** Sostituire `sleep(2000)` con retry loop su `GET /repos/{owner}/{repo}`: max **10 tentativi** con **500ms di intervallo** (totale max ~5s). Se il repo risponde 200, procedi con `createFile`. Compatibile con Cloudflare Workers (no `setTimeout` → usa `new Promise(resolve => setTimeout(resolve, 500))` in loop).
- **D-10:** Se retry loop esaurisce i 10 tentativi: salva status `repo_created` su D1 e ritorna **503** con messaggio descrittivo. Il deploy endpoint può essere richiamato per riprendere dall'ultimo step.

### Deploy State Machine (D1)

- **D-11:** Status D1 per `projects.status`: `pending → repo_created → pages_linked → deploying → live`. Ogni step salva il proprio risultato su D1 prima di procedere al successivo.
- **D-12:** Idempotenza: se deploy viene richiamato su un progetto già parzialmente processato, riprende dall'ultimo step completato (check status D1 ad inizio endpoint). Se status è `live`, ritorna **409** con `pages_url` e `github_repo_url` già esistenti.

### D1 Schema Migration

- **D-13:** Nuova migration aggiunge 3 colonne nullable a `projects`:
  - `github_repo_url TEXT` — URL del repo GitHub creato
  - `pages_project_name TEXT` — nome del CF Pages project (per API calls future, es. Phase 5 custom domain)
  - `pages_url TEXT` — URL pubblico `.pages.dev` del sito

### FACT-01 Scope (Backend Only)

- **D-14:** Phase 4 implementa solo il **backend deploy endpoint** (`POST /projects/:id/deploy`). Il wizard multi-step UI (FACT-01) è Phase 10. Phase 4 non tocca la UI.

### Claude's Discretion

- Struttura interna di `CloudflarePagesService` (nuovo service o helper standalone)
- Gestione errori specifici CF Pages API (409 project exists, 422 validation, 401 token)
- Formato esatto della chiamata `POST /pages/projects` (alcuni campi CF Pages API sono documentati in modo incompleto — Claude gestisce i fallback)
- Strategia di retry per la CF Pages API call stessa (se diversa da GitHub)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema D1 e contratto dati
- `factory-core/src/db/schema.ts` — Tabella `projects` con tutti i campi attuali. Phase 4 aggiunge migration con 3 nuove colonne (github_repo_url, pages_project_name, pages_url).
- `rankame/templates/astro-base/src/types/site.ts` — Interfaccia `SiteConfig` — ESATTO contratto da rispettare nel file iniettato `site.config.json`.
- `rankame/templates/astro-base/src/data/site.config.json` — Esempio reale con tutti i campi popolati. Usare come reference per la struttura iniettata.

### Servizi esistenti da estendere/riusare
- `factory-core/src/services/github.ts` — `GitHubService` con `createProjectRepo` + `createFile`. Phase 4 modifica `createProjectRepo` per usare env var invece di hardcode, e aggiunge il retry loop (D-09).
- `factory-core/src/api/projects.ts` — `POST /:id/deploy` esistente (con sleep hack). Phase 4 riscrive questo endpoint con state machine + CF Pages creation.

### Template Astro
- `rankame/templates/astro-base/` — Directory completa del template da pushare su `StudioPuraLuce/astro-rank-rent`. Leggere `astro.config.mjs` per build config (npm run build → dist/).
- `rankame/templates/astro-base/src/lib/fetchPages.ts` — Legge `siteConfig.factoryApi` + `siteConfig.projectId` per fetch contenuti. Conferma che `factoryApi` e `projectId` siano presenti in site.config.json.

### Roadmap e requisiti
- `.planning/ROADMAP.md` §Phase 4 — Success criteria (FACT-01, FACT-03, FACT-04, FACT-05): repo creato, config iniettata, Pages linked, no sleep hacks.
- `.planning/REQUIREMENTS.md` §FACT-03, FACT-04, FACT-05 — Requisiti atomici da soddisfare.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GitHubService` (`factory-core/src/services/github.ts`): già funzionante. `createProjectRepo` crea repo da template via GitHub API. `createFile` inietta file. Estendere con retry loop e env var.
- `projects.ts` `POST /:id/deploy`: scheletro del deploy endpoint esiste già — state machine D1, CF Pages creation e retry loop vanno aggiunti sopra questa struttura.
- Drizzle ORM pattern con D1 — già consolidato in tutti gli endpoint. `db.update(projects).set({...}).where(eq(projects.id, id))` per aggiornare status ad ogni step.
- Bearer token auth: già nel middleware `protectedApp` — il deploy endpoint lo eredita automaticamente.

### Established Patterns
- Hono + Bindings type: pattern consolidato — `CF_API_TOKEN`, `FACTORY_API_URL`, `GITHUB_TEMPLATE_OWNER`, `GITHUB_TEMPLATE_REPO` vanno aggiunti a `Bindings`.
- Env var da wrangler.toml: tutte le variabili sensibili tramite `[vars]` + secrets via `wrangler secret put`.
- Error response pattern: `c.json({ error: '...', details: err.message }, 5xx)` — coerente con tutti gli altri endpoint.

### Integration Points
- Il deploy endpoint vive in `factory-core/src/api/projects.ts` (già mountato su `/api/projects` in `index.ts`)
- Nuovo `CloudflarePagesService` in `factory-core/src/services/` (analogia con `GitHubService`)
- La migration D1 va in `factory-core/migrations/` come nuovo file `000X_add_deploy_columns.sql`

</code_context>

<specifics>
## Specific Ideas

- "Come fa ad essere atomico?" → risposta: state machine D1 — ogni step scrive il suo risultato prima di procedere, pipeline riprendibile senza rollback distruttivi
- "Il GitHub + Cloudflare Pages che poi posso passare al cliente, funziona ancora?" → sì: operatore possiede tutta l'infrastruttura, cliente ottiene solo custom domain (Phase 5). Modello rank-and-rent — cliente "affitta", non possiede.
- Env var da aggiungere a wrangler.toml e .dev.vars: `CF_API_TOKEN`, `FACTORY_API_URL`, `GITHUB_TEMPLATE_OWNER=StudioPuraLuce`, `GITHUB_TEMPLATE_REPO=astro-rank-rent`

</specifics>

<deferred>
## Deferred Ideas

- Custom domain assignment (Phase 5 — CF Pages API custom_domains endpoint)
- GA4/GSC auto-create (Phase 7 — popolano ga4MeasurementId in site.config.json via GitHub API update)
- Cloudflare Queues per pipeline asincrona (considerato, scartato — overkill per v1, aggiungibile se Phase 4 supera 30s timeout Worker)
- Wizard multi-step UI (Phase 10 — orchestra seed-project + deploy in sequenza)

</deferred>

---

*Phase: 04-deploy-pipeline*
*Context gathered: 2026-04-26*
