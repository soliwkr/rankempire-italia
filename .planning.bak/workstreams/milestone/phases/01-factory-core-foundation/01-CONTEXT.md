# Phase 1: Factory-Core Foundation - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Il Worker factory-core è sicuro, usa i model identifier Gemini corretti, ha uno schema D1 completo (colonna email nei leads), e ha il corretto VERIFICATION_BASE_URL di produzione — in modo che tutte le fasi successive costruiscano su una base funzionante.

Fix in scope: auth middleware, verifica modelli Gemini, migrazione D1 email, aggiornamento wrangler.toml. Nessuna nuova funzionalità.

</domain>

<decisions>
## Implementation Decisions

### Autenticazione

- **D-01:** Usare il middleware `bearerAuth()` built-in di Hono per proteggere gli endpoint non-pubblici. Secret in env var (`API_SECRET` o equivalente).
- **D-02:** Endpoint pubblici (nessun Bearer richiesto): `POST /api/leads` e `GET /verify/:token`. Tutti gli altri endpoint (generate, projects, deploy) richiedono il token.
- **D-03:** Applicare il middleware sia su `rankame/factory-core` che su root `factory-core/` — entrambi vanno fixati.

### Scope Codebase

- **D-04:** Fix applicati a **entrambi** i factory-core: `rankame/factory-core/` (canonico) e root `factory-core/`. Stesso set di modifiche su entrambi.
- **D-05:** La dashboard React (`src/services/gemini.ts`, `src/services/geminiScout.ts`) usa ancora `gemini-3-flash-preview` — **fuori scope per Fase 1**. Il success criteria riguarda solo factory-core.
- **D-06:** `rankame/factory-core` già usa `gemini-2.5-flash` correttamente in `services/ai.ts`. Verificare che entrambi i factory-core usino questo modello — nessun fix atteso su rankame, potenziale fix su root.

### Schema D1

- **D-07:** Aggiungere colonna `email TEXT` alla tabella `leads` tramite workflow Drizzle: aggiornare `schema.ts` e poi `drizzle-kit generate` per creare il file migrazione SQL.
- **D-08:** Email salvata in plaintext — necessario per il flusso DOI (Resend ha bisogno dell'indirizzo per inviare la mail di verifica).
- **D-09:** La migrazione deve applicarsi clean (nuova migration file dopo le esistenti 0000, 0001, 0002).

### Configurazione Env

- **D-10:** `VERIFICATION_BASE_URL` in `wrangler.toml` va impostato a `https://factory-core.soliwkr.workers.dev/verify` (non localhost). Applicare su entrambi i factory-core.

### Claude's Discretion

- Nome esatto della env var per il Bearer secret (`API_SECRET`, `FACTORY_API_KEY`, o simile)
- Struttura esatta del middleware Hono (route group vs app-level con eccezioni)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirement di fase

- `.planning/ROADMAP.md` §Phase 1 — Goal, success criteria, e requirement FACT-06

### Codebase target

- `rankame/factory-core/src/index.ts` — Entry point Hono, dove applicare il middleware auth
- `rankame/factory-core/src/api/leads.ts` — Endpoint pubblico POST /api/leads (nessun auth)
- `rankame/factory-core/src/db/schema.ts` — Schema Drizzle, dove aggiungere colonna email
- `rankame/factory-core/wrangler.toml` — Env vars, VERIFICATION_BASE_URL da aggiornare
- `rankame/factory-core/migrations/` — Migrazioni esistenti (0000, 0001, 0002)
- `factory-core/src/index.ts` — Root factory-core (stesso set di fix)
- `factory-core/wrangler.toml` — Root factory-core wrangler config

### Hono middleware

- No external docs — usare `bearerAuth()` dalla libreria Hono built-in

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `rankame/factory-core/src/services/ai.ts` — AiService già usa `gemini-2.5-flash` con Cloudflare AI Gateway. Nessun fix necessario qui.
- Migrazioni Drizzle esistenti (0000–0002) — usare come template per la nuova migrazione email.

### Established Patterns

- Framework: **Hono** su Cloudflare Workers — usare middleware Hono nativo per l'auth.
- ORM: **Drizzle** con D1 — schema changes tramite `drizzle-kit generate`, non SQL manuale.
- Entrambi i factory-core hanno struttura identica (`src/api/`, `src/db/`, `src/services/`).

### Integration Points

- Il middleware Bearer auth va applicato a livello di app/route group in `src/index.ts`.
- La colonna email in `leads` è già attesa dall'API (`leads.ts` riceve `email` dal body ma non la persiste attualmente).
- `VERIFICATION_BASE_URL` è consumato da `services/email.ts` per costruire i link DOI.

</code_context>

<specifics>
## Specific Ideas

- URL production confermato dall'utente: `https://factory-core.soliwkr.workers.dev`
- Il `POST /api/leads` ha già un honeypot check e validazione Zod — nessun cambiamento a quella logica.

</specifics>

<deferred>
## Deferred Ideas

- Fix `src/services/gemini.ts` e `src/services/geminiScout.ts` (dashboard React, modello `gemini-3-flash-preview`) — Fase successiva
- Consolidamento/eliminazione del root `factory-core/` a favore del solo `rankame/factory-core/` — decisione architetturale da prendere dopo Fase 2

</deferred>

---

*Phase: 01-factory-core-foundation*
*Context gathered: 2026-04-24*
