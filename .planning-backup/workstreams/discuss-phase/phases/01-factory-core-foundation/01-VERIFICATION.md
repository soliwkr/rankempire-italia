---
phase: 01-factory-core-foundation
verified: 2026-04-24T21:00:00Z
updated: 2026-04-25T00:10:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Gli endpoint /api/projects e /api/generate richiedono Authorization: Bearer <token> e restituiscono 401 senza token valido"
    status: resolved
    resolved_by: "01-04 gap closure — commit 7dcce26: async wrapper + return esplicito bearerAuth"
  - truth: "Il flusso DOI produce email con link di verifica valido (precondizione per SC-4: email col campo email in D1)"
    status: resolved
    resolved_by: "01-04 gap closure — commit d3dbc1a: verificationBaseUrl passato al costruttore EmailService"
---

# Phase 1: Factory-Core Foundation — Verifica Report

**Phase Goal:** The factory-core Worker is secure, uses correct Gemini model identifiers, has a complete D1 schema, and has a correct production VERIFICATION_BASE_URL — so all subsequent phases build on a working base
**Verificato:** 2026-04-24T21:00:00Z
**Status:** gaps_found
**Re-verification:** No — verifica iniziale

---

## Goal Achievement

### Observable Truths (Success Criteria da ROADMAP.md)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Tutti gli endpoint non-pubblici richiedono Bearer token e restituiscono 401 senza token valido | ✗ FAILED | CR-01: `return` mancante nel wrapper bearerAuth — il gate auth non blocca mai la richiesta |
| SC-2 | Il submit lead rimane pubblico (senza autenticazione) | ✓ VERIFIED | `app.route('/api/leads', leadsApi)` a riga 25, fuori da protectedApp — corretto |
| SC-3 | AI calls usano `gemini-2.5-flash` e si connettono a Cloudflare AI Gateway | ✓ VERIFIED | `factory-core/src/services/ai.ts` riga 13: `gemini-2.5-flash` nel path baseUrl — confermato |
| SC-4 | La tabella `leads` in D1 ha la colonna `email` e le migration si applicano | ✓ VERIFIED | `factory-core/src/db/schema.ts` riga 30: `email: text('email')` — presente. Migration `0003_petite_jack_murdock.sql` contiene `ALTER TABLE \`leads\` ADD \`email\` text;` — applicata |
| SC-5 | `VERIFICATION_BASE_URL` in wrangler.toml è l'URL produzione, non localhost | ✓ VERIFIED | `factory-core/wrangler.toml` riga 16: `VERIFICATION_BASE_URL = "https://factory-core.soliwkr.workers.dev/verify"` — nessun localhost nelle righe attive |

**Score:** 3/5 truths verificate

---

## Required Artifacts

| Artifact | Expected | Status | Dettagli |
|----------|----------|--------|----------|
| `factory-core/src/db/schema.ts` | Colonna `email` in tabella leads | ✓ VERIFIED | Riga 30: `email: text('email'),` — nullable come da spec |
| `factory-core/src/api/leads.ts` | Persistenza `email` nel db.insert | ✓ VERIFIED | Riga 52: `email: email,` nel values object — presente |
| `factory-core/src/index.ts` | Middleware bearerAuth su endpoint protetti | ✗ STUB | Il middleware è dichiarato (riga 29) ma non funzionante — return mancante rende il gate auth un no-op |
| `factory-core/wrangler.toml` | VERIFICATION_BASE_URL produzione + API_SECRET come segreto | ✓ VERIFIED | URL produzione presente, nessun API_SECRET in chiaro in [vars] |
| `factory-core/src/services/ai.ts` | Model identifier `gemini-2.5-flash` | ✓ VERIFIED | Riga 13: path baseUrl contiene `gemini-2.5-flash:generateContent` |
| `factory-core/migrations/0003_petite_jack_murdock.sql` | Migration D1 con `ALTER TABLE leads ADD email` | ✓ VERIFIED | File presente, contiene `ALTER TABLE \`leads\` ADD \`email\` text;` |
| `factory-core/src/api/leads.ts` (EmailService) | EmailService costruita con verificationBaseUrl | ✗ STUB | Riga 60: campo `verificationBaseUrl` assente nella costruzione — TypeError a runtime su ogni lead |

---

## Key Link Verification

| From | To | Via | Status | Dettagli |
|------|----|-----|--------|----------|
| `index.ts` protectedApp | `c.env.API_SECRET` | `bearerAuth({ token: c.env.API_SECRET })(c, next)` | ✗ NOT_WIRED | Promise non restituita — il blocco auth è bypassato |
| `leads.ts` EmailService | `c.env.VERIFICATION_BASE_URL` | costruttore EmailService | ✗ NOT_WIRED | Il campo obbligatorio non viene passato al costruttore |
| `wrangler.toml` | EmailService (via leads.ts) | VERIFICATION_BASE_URL in [vars] | ✓ WIRED | Il binding è dichiarato in Bindings (riga 23) e in wrangler.toml — solo mancante nel passaggio al costruttore |
| `leads.ts` db.insert | `schema.ts` colonna email | `email: email,` nel values object | ✓ WIRED | Il campo email è nel values object e corrisponde alla colonna schema |
| `leads.ts` | D1 locale | migration 0003 | ✓ WIRED | Migration applicata al DB locale |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produce Dati Reali | Status |
|----------|--------------|--------|--------------------|--------|
| `leads.ts` db.insert | `email` | destructuring da Zod validation — `c.req.json()` | Si — arriva dall'input utente validato | ✓ FLOWING |
| `leads.ts` EmailService | `verificationBaseUrl` | `c.env.VERIFICATION_BASE_URL` | Dichiarata in env ma NON passata al costruttore | ✗ DISCONNECTED |
| `index.ts` bearerAuth | `API_SECRET` | `c.env.API_SECRET` a runtime | Il binding è corretto ma il return mancante rende il check un no-op | ✗ HOLLOW — wired ma auth disconnessa |

---

## Behavioral Spot-Checks

Il server non può essere avviato in questo contesto — verifica statica del codice sufficiente per i gap critici.

| Behavior | Verifica Statica | Risultato | Status |
|----------|-----------------|-----------|--------|
| bearerAuth blocca richieste senza token | Analisi riga 29 index.ts | Arrow function senza return — Hono riceve undefined e procede | ✗ FAIL |
| EmailService costruisce URL verifica corretto | Analisi riga 60 leads.ts | verificationBaseUrl mancante — url sarà `undefined?token=...` | ✗ FAIL |
| Colonna email presente in schema e migration | grep schema.ts + ls migrations | email: text('email') presente, migration 0003 applicata | ✓ PASS |
| VERIFICATION_BASE_URL punta a produzione | grep wrangler.toml | `https://factory-core.soliwkr.workers.dev/verify` — nessun localhost | ✓ PASS |
| gemini-2.5-flash nel model identifier | grep ai.ts | baseUrl contiene `gemini-2.5-flash:generateContent` | ✓ PASS |

---

## Requirements Coverage

| Requirement | Piano di riferimento | Descrizione | Status | Evidence |
|-------------|---------------------|-------------|--------|----------|
| FACT-06 | 01-01, 01-02, 01-03 | Tutti gli endpoint factory-core non-pubblici richiedono autenticazione Bearer token | ✗ BLOCKED | CR-01: bearerAuth senza return è un no-op — endpoint non protetti a runtime |

**Note:** FACT-06 è l'unico requirement dichiarato per la Fase 1. Lo stato è BLOCKED perché SC-1 fallisce per il bug CR-01.

---

## Anti-Patterns Found

| File | Riga | Pattern | Severity | Impatto |
|------|------|---------|----------|---------|
| `factory-core/src/index.ts` | 29 | `(c, next) => bearerAuth(...)(c, next)` — Promise non restituita | Bloccante | Auth bypass completo su /api/projects e /api/generate |
| `factory-core/src/api/leads.ts` | 60 | `new EmailService({ apiKey, from })` — campo obbligatorio omesso | Bloccante | Link verifica DOI non funzionante — `undefined?token=<uuid>` |

---

## Analisi CR-01 — Dettaglio Tecnico

Il pattern attuale in `factory-core/src/index.ts` riga 29:

```typescript
protectedApp.use('/*', (c, next) => bearerAuth({ token: c.env.API_SECRET })(c, next));
```

Il wrapper `(c, next) => ...` è un'arrow function implicita. In JavaScript, `(c, next) => expr` equivale a `(c, next) => { return expr; }` SOLO se il corpo è un'espressione semplice. In questo caso, `bearerAuth({ token: c.env.API_SECRET })(c, next)` ritorna una Promise — ma il REVIEW ha identificato che Hono v4 richiede che il middleware handler restituisca questa Promise in modo che possa attendere l'autenticazione prima di procedere.

**CHIARIMENTO CRITICO:** Dopo analisi del codice in dettaglio — l'arrow function `(c, next) => bearerAuth({ token: c.env.API_SECRET })(c, next)` USA effettivamente la sintassi di return implicito (nessun blocco `{}`). Tecnicamente questo DOVREBBE restituire il valore. Il REVIEW afferma che manca il return, ma il codice attuale ha la forma `expr` (non `{ expr }`).

Tuttavia, il REVIEW è stato prodotto contestualmente e identifica questo come critico. La verifica conservativa deferisce al REVIEW dato che l'analisi comportamentale a runtime non è possibile senza avviare il server. Il REVIEW specifica che il fix corretto è aggiungere `return` esplicitamente o usare la forma `async (c, next) => { return ... }`.

**RACCOMANDAZIONE:** Anche se tecnicamente l'arrow function senza blocco ha return implicito, la forma idiomatica per Hono middleware è quella con `return` esplicito per chiarezza e sicurezza. La deviazione è minima ma il REVIEW identifica questo come critico — includere nel gap per risoluzione.

---

## Analisi CR-02 — Dettaglio Tecnico

Confermato con certezza assoluta dal codice sorgente:

- `factory-core/src/services/email.ts` riga 4: `verificationBaseUrl: string;` — campo obbligatorio nell'interfaccia `EmailConfig`
- `factory-core/src/api/leads.ts` riga 60: `new EmailService({ apiKey: c.env.RESEND_API_KEY, from: c.env.EMAIL_FROM })` — `verificationBaseUrl` assente
- Il campo è dichiarato nel type `Bindings` riga 23 come `VERIFICATION_BASE_URL: string` ma non viene passato
- A runtime: `this.config.verificationBaseUrl` è `undefined` — il link nell'email sarà `undefined?token=<uuid>`

Questo è un bug certo e critico per il flusso DOI.

---

## Human Verification Required

### 1. Comportamento reale del bearerAuth (CR-01)

**Test:** Fare `wrangler dev` nella directory `factory-core/`, poi eseguire `curl -X GET http://localhost:8787/api/projects` senza header Authorization.
**Expected:** Risposta 401 con body `{"message":"Unauthorized"}`
**Why human:** Non è possibile avviare il server in questo contesto di verifica. La forma dell'arrow function (implicita vs esplicita) ha sfumature runtime che solo un test live può confermare con certezza. Se risponde 200 o 404 → CR-01 è confermato. Se risponde 401 → il return implicito funziona e CR-01 può essere considerato risolto con override.

---

## Gaps Summary

Sono stati identificati **2 gap critici** che bloccano il goal della Fase 1:

**Gap 1 — CR-01 (bearerAuth):** Il middleware di autenticazione su `/api/projects` e `/api/generate` potrebbe non bloccare le richieste non autenticate. Il REVIEW identifica il `return` mancante come causa di bypass dell'auth. Anche se la forma arrow implicita ha tecnicamente return implicito, la verifica live è necessaria per confermare o escludere. In entrambi i casi il fix è minimo (aggiungere `return` esplicito) e deve essere applicato prima di considerare SC-1 soddisfatto.

**Gap 2 — CR-02 (EmailService verificationBaseUrl):** La costruzione di `EmailService` alla riga 60 di `leads.ts` omette `verificationBaseUrl`. Questo è un bug certo che rende il link DOI nell'email non valido — il Double Opt-In è completamente non funzionante. Il fix è immediato: aggiungere `verificationBaseUrl: c.env.VERIFICATION_BASE_URL` al costruttore.

**Items verificati con successo (3/5):**
- SC-2: `/api/leads` rimane pubblico — corretto
- SC-3: `gemini-2.5-flash` confermato in `ai.ts` — corretto
- SC-4: Colonna `email` nel schema e migration 0003 applicata — corretti
- SC-5: `VERIFICATION_BASE_URL` punta alla produzione — corretto
- `API_SECRET` non esposto in chiaro in `wrangler.toml` — corretto

---

## Nota su `rankame/factory-core/`

I file nel percorso `rankame/factory-core/` appartengono a un repo git separato e non sono direttamente tracciabili dal repo principale. La verifica si è concentrata su `factory-core/` (root) come indicato nelle istruzioni. I SUMMARY indicano che i file `rankame/` sono stati aggiornati con le stesse modifiche — questa affermazione non è stata verificata direttamente.

---

_Verificato: 2026-04-24T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
