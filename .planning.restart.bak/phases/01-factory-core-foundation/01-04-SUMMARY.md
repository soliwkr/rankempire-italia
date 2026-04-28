---
phase: 01-factory-core-foundation
plan: "04"
subsystem: auth
tags: [hono, bearer-auth, email, resend, doi, cloudflare-workers]

requires:
  - phase: 01-factory-core-foundation
    provides: "Middleware bearerAuth e EmailService già presenti — fix applicati sopra"

provides:
  - "bearerAuth middleware con return esplicito in protectedApp (CR-01)"
  - "EmailService costruito con verificationBaseUrl valido (CR-02)"
  - "Compilazione TypeScript/wrangler senza errori"

affects: [fasi-successive, api-protette, doi-email-flow]

tech-stack:
  added: []
  patterns:
    - "Hono v4: i middleware devono restituire esplicitamente la Promise (`return middleware(c, next)`)"
    - "EmailConfig richiede tutti i campi obbligatori al momento della costruzione"

key-files:
  created: []
  modified:
    - factory-core/src/index.ts
    - factory-core/src/api/leads.ts

key-decisions:
  - "async wrapper + return esplicito per bearerAuth — garantisce che Hono v4 non bypassi il gate di auth"
  - "verificationBaseUrl passato da binding Cloudflare, non hard-coded — coerente con il pattern Bindings già in uso"

patterns-established:
  - "Middleware Hono v4: usare `async (c, next) => { return middleware()(c, next); }` per garantire il return"
  - "Costruttori di servizi: passare tutti i campi richiesti dall'interfaccia al momento della costruzione"

requirements-completed:
  - FACT-06

duration: 10min
completed: "2026-04-25"
---

# Phase 01-04: Gap Closure CR-01 + CR-02 Summary

**bearerAuth middleware reso non-bypassabile e URL di verifica DOI corretti prima che le fasi successive costruiscano sulla Fase 1**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-25T00:00:00Z
- **Completed:** 2026-04-25T00:10:00Z
- **Tasks:** 3 (2 fix + 1 verifica compilazione)
- **Files modified:** 2

## Accomplishments
- CR-01: `protectedApp.use` ora ritorna esplicitamente la Promise di `bearerAuth` — le route `/api/projects` e `/api/generate` non sono più bypassabili
- CR-02: `new EmailService(...)` riceve `verificationBaseUrl: c.env.VERIFICATION_BASE_URL` — il link DOI è ora `https://...?token=<uuid>` anziché `undefined?token=<uuid>`
- Wrangler dry-run completato con successo (exit 0, nessun errore TypeScript)

## Task Commits

1. **CR-01: return esplicito al middleware bearerAuth** - `7dcce26` (fix)
2. **CR-02: verificationBaseUrl al costruttore EmailService** - `d3dbc1a` (fix)
3. **Verifica compilazione TypeScript** - (inline, nessun file modificato)

## Files Created/Modified
- `factory-core/src/index.ts` — middleware `protectedApp.use` con `async` wrapper e `return` esplicito
- `factory-core/src/api/leads.ts` — `new EmailService({ ..., verificationBaseUrl: c.env.VERIFICATION_BASE_URL })`

## Decisions Made
- Usato `async (c, next) => { return ... }` invece di rimuovere il wrapper inline: più leggibile e conforme al pattern Hono v4
- Nessuna modifica ad altri file: il piano specificava di toccare solo le due righe identificate

## Deviations from Plan
None — piano eseguito esattamente come scritto.

## Issues Encountered
- `npx tsc --noEmit` ha fallito perché TypeScript non è una dipendenza diretta del progetto (wrangler usa esbuild). Usato `wrangler deploy --dry-run` come previsto dal piano come alternativa — exit 0 confermato.

## User Setup Required
None — nessuna configurazione esterna richiesta. `VERIFICATION_BASE_URL` era già presente nel binding wrangler.

## Next Phase Readiness
- Fase 1 ora completamente corretta e sicura
- Gap CR-01 e CR-02 chiusi — VERIFICATION.md può essere aggiornata
- Pronta per pianificazione Fase 2

---
*Phase: 01-factory-core-foundation*
*Completed: 2026-04-25*
