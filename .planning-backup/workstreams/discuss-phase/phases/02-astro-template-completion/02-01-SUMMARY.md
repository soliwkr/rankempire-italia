---
plan: 02-01
phase: 02-astro-template-completion
status: complete
completed: 2026-04-25
---

# Piano 02-01: Schema D1 `pages` + Endpoint Pubblico `/api/sites`

## Obiettivo

Aggiunto la tabella D1 `pages` allo schema Drizzle e creato l'endpoint pubblico `GET /api/sites/:projectId/pages` in factory-core — il contratto API che il template Astro usa al build time.

## Cosa è stato fatto

### Task 1: Schema + Router Hono
- Aggiunta tabella `pages` a `factory-core/src/db/schema.ts` con 9 campi (id, project_id, slug, type, title, body, faq, meta, created_at) e FK verso `projects`
- Creato `factory-core/src/api/sites.ts` — router Hono con `GET /:projectId/pages`, risponde 200 con array o 404 su progetto non trovato

### Task 2: Mount + Schema Push
- Aggiunto import e mount pubblico di `sitesApi` in `factory-core/src/index.ts` (sezione endpoint pubblici, prima di `protectedApp`)
- Schema D1 `pages` applicato al DB locale via `wrangler d1 execute --local`

## Verifiche

- `wrangler deploy --dry-run` → exit 0 ✓
- Tabella `pages` presente nel DB locale ✓
- `sitesApi` montato come endpoint pubblico (non protetto) ✓
- Pattern identico a `projects.ts` e `leadsApi` ✓

## Artefatti creati

| File | Cosa fornisce |
|------|---------------|
| `factory-core/src/db/schema.ts` | Tabella `pages` Drizzle ORM con tutti i 9 campi |
| `factory-core/src/api/sites.ts` | Endpoint `GET /api/sites/:projectId/pages` |
| `factory-core/src/index.ts` | Mount pubblico `app.route('/api/sites', sitesApi)` |

## Self-Check: PASSED

Tutti i must_haves verificati:
- ✓ Endpoint GET /api/sites/:projectId/pages risponde 200 con array di pagine
- ✓ Endpoint risponde 404 quando non ci sono pagine per il projectId
- ✓ Tabella D1 `pages` con tutte le colonne richieste
- ✓ Endpoint pubblico — nessun Bearer token richiesto
