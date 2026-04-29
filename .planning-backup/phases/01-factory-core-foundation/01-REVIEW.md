---
phase: 01-factory-core-foundation
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - factory-core/src/db/schema.ts
  - factory-core/src/api/leads.ts
  - factory-core/src/index.ts
  - factory-core/wrangler.toml
  - rankame/factory-core/src/index.ts
  - rankame/factory-core/wrangler.toml
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
---

# Fase 01: Report di Code Review

**Revisionato:** 2026-04-24
**Profondita:** standard
**File Revisionati:** 6
**Stato:** issues_found

---

## Sommario

Sono stati revisionati i file core della Factory: schema del database (Drizzle/D1), router principale (Hono), API leads (DOI flow), e i file di configurazione Wrangler per entrambi i path (`factory-core/` e `rankame/factory-core/`).

Il codice e complessivamente ben strutturato. I segreti non sono hardcoded in chiaro in `wrangler.toml`. Tuttavia sono emersi **due problemi critici**: il middleware `bearerAuth` e' cablato in modo difettoso — le route protette sono di fatto non protette — e l'istanza di `EmailService` in `leads.ts` viene costruita senza il campo obbligatorio `verificationBaseUrl`, causando una `TypeError` a runtime su ogni richiesta DOI.

---

## Problemi Critici

### CR-01: Middleware `bearerAuth` non funzionante — route protette accessibili senza token

**File:** `factory-core/src/index.ts:29` | `rankame/factory-core/src/index.ts:29`

**Problema:**
Il middleware viene passato come funzione non invocata a `.use()`. Il pattern attuale e':

```typescript
protectedApp.use('/*', (c, next) => bearerAuth({ token: c.env.API_SECRET })(c, next));
```

Questo crea una nuova istanza di middleware ad ogni richiesta ma — critico — la firma del wrapper `(c, next) => bearerAuth(...)(c, next)` non restituisce la Promise risultante in modo che Hono possa bloccare la catena. In Hono v4, `bearerAuth({ token })` restituisce un `MiddlewareHandler`. Quando viene invocato come `bearerAuth(...)(c, next)`, il `return` mancante davanti all'invocazione interna significa che il middleware wrapper risolve `undefined` e Hono procede al prossimo handler **senza attendere l'esito dell'autenticazione**. Le route `/api/projects` e `/api/generate` sono di fatto aperte a chiunque.

**Fix:**
```typescript
// Opzione 1 (raccomandata): registrare il middleware direttamente
// Nota: bearerAuth accetta token statico, non una funzione — serve lazy evaluation
protectedApp.use('/*', (c, next) => {
  return bearerAuth({ token: c.env.API_SECRET })(c, next);
});

// Opzione 2 (piu' idiomatica con Hono v4):
protectedApp.use('/*', async (c, next) => {
  const middleware = bearerAuth({ token: c.env.API_SECRET });
  return middleware(c, next);
});
```

La correzione minima e' aggiungere `return` prima della chiamata `bearerAuth(...)(c, next)`. Senza di esso la Promise viene ignorata e il gate auth non blocca mai la richiesta.

---

### CR-02: `EmailService` costruita senza `verificationBaseUrl` — TypeError a runtime su ogni lead

**File:** `factory-core/src/api/leads.ts:60`

**Problema:**
L'interfaccia `EmailConfig` (definita in `services/email.ts`) richiede tre campi obbligatori:
```typescript
export interface EmailConfig {
  apiKey: string;
  from: string;
  verificationBaseUrl: string;  // OBBLIGATORIO
}
```

Ma in `leads.ts` la costruzione dell'istanza omette `verificationBaseUrl`:
```typescript
const emailService = new EmailService({ apiKey: c.env.RESEND_API_KEY, from: c.env.EMAIL_FROM });
```

A runtime, `this.config.verificationBaseUrl` sara' `undefined`. Il link di verifica generato diventa `undefined?token=<uuid>`. L'email DOI contiene un URL non valido, rendendo il Double Opt-In completamente non funzionante. TypeScript dovrebbe segnalare questo come errore di compilazione — se non lo fa, il progetto ha un problema nella configurazione `strict` del compiler.

**Fix:**
```typescript
const emailService = new EmailService({
  apiKey: c.env.RESEND_API_KEY,
  from: c.env.EMAIL_FROM,
  verificationBaseUrl: c.env.VERIFICATION_BASE_URL,
});
```

`VERIFICATION_BASE_URL` e' gia' dichiarata nel tipo `Bindings` (riga 23) e presente in `wrangler.toml`, quindi e' immediatamente disponibile.

---

## Avvertimenti

### WR-01: Il tipo `Bindings` in `leads.ts` dichiara `VERIFICATION_BASE_URL` ma non la usa

**File:** `factory-core/src/api/leads.ts:23`

**Problema:**
Il tipo `Bindings` locale include `VERIFICATION_BASE_URL: string` (riga 23), ma la binding non viene mai letta da `c.env`. Questo e' un sintomo diretto del bug CR-02: la dichiarazione e' corretta ma l'utilizzo e' mancante.

**Fix:** Correggere CR-02 — il binding verra' automaticamente utilizzato.

---

### WR-02: Route protette montate con prefisso ambiguo — rischio di shadowing

**File:** `factory-core/src/index.ts:30-33` | `rankame/factory-core/src/index.ts:30-33`

**Problema:**
Le route protette vengono definite su `protectedApp` con percorsi assoluti (`/api/projects`, `/api/generate`) e poi montate su `app` tramite `app.route('/', protectedApp)`. In Hono, il path passato a `.route()` viene usato come prefisso. Montare su `'/'` significa che `protectedApp` riceve il path completo invariato.

Il problema e' che la route `/api/leads` e' registrata **prima** su `app` (pubblica), e il middleware `bearerAuth` su `protectedApp` usa `'/*'` — un pattern che in teoria cattura anche `/api/leads/*` se le richieste arrivano attraverso `protectedApp`. Il comportamento attuale e' corretto solo perche' `app.route('/api/leads', leadsApi)` e' registrata direttamente su `app` e viene matchata prima. Tuttavia il pattern e' fragile: qualsiasi riorganizzazione dell'ordine di registrazione potrebbe bloccare le route pubbliche o esporre quelle protette.

**Fix (struttura piu' robusta):**
```typescript
// Separare nettamente i namespace
app.route('/api/leads', leadsApi);                     // pubblico

const adminRouter = new Hono<{ Bindings: Bindings }>();
adminRouter.use('/*', (c, next) => {
  return bearerAuth({ token: c.env.API_SECRET })(c, next);
});
adminRouter.route('/projects', projectsApi);
adminRouter.route('/generate', generateApi);

app.route('/api/admin', adminRouter);                  // protetto sotto /api/admin/*
```

---

### WR-03: Endpoint `GET /verify` non ha rate limiting ne' invalidazione del token post-verifica

**File:** `factory-core/src/api/leads.ts:66-79`

**Problema:**
Il token di verifica DOI non viene invalidato dopo l'uso. La query `db.update(leads).set({ doiStatus: 'verified' }).where(eq(leads.verificationToken, token))` aggiorna il record ma lascia `verificationToken` invariato. Lo stesso URL di verifica puo' essere rieseguito infinite volte (idempotente per i dati, ma potenzialmente problematico per replay attacks o analytics errate). Inoltre non c'e' alcun controllo sul `doiStatus` attuale: un lead gia' verificato riceve una risposta `200` identica a uno che si verifica per la prima volta.

**Fix:**
```typescript
// Verificare che il lead sia ancora in stato 'pending'
const existing = await db.select().from(leads)
  .where(eq(leads.verificationToken, token))
  .limit(1);

if (existing.length === 0) return c.text('Token non valido', 404);
if (existing[0].doiStatus === 'verified') return c.text('Email gia verificata', 200);

await db.update(leads)
  .set({ doiStatus: 'verified', status: 'active', verificationToken: null })
  .where(eq(leads.verificationToken, token));
```

---

## Informazioni

### IN-01: Schema `leads` — campi `name`, `email`, `phone` nullable senza validazione a livello DB

**File:** `factory-core/src/db/schema.ts:29-31`

**Problema:**
I campi `name`, `email` e `phone` della tabella `leads` sono definiti senza `.notNull()`, rendendoli nullable nel database. Lo schema Zod in `leads.ts` li marca come obbligatori (riga 11-13: `name: z.string().min(2)`, `email: z.string().email()`, `phone: z.string().regex(...)`), quindi in pratica non arriveranno mai null via API. Ma e' possibile inserire lead con questi campi vuoti da strumenti diretti sul DB (wrangler d1 execute, migration scripts, test fixtures) senza che il DB protesti.

**Suggerimento:** Aggiungere `.notNull()` a `name`, `email`, `phone` nello schema Drizzle per allineare la constraint DB con la validazione applicativa.

---

### IN-02: `VERIFICATION_BASE_URL` in `wrangler.toml` punta alla produzione — nessun override locale

**File:** `factory-core/wrangler.toml:16` | `rankame/factory-core/wrangler.toml:16`

**Problema:**
```toml
VERIFICATION_BASE_URL = "https://factory-core.soliwkr.workers.dev/verify"
```

In sviluppo locale (`wrangler dev`), le email di verifica contengono link che puntano al worker di produzione invece di `http://localhost:8787/api/leads/verify`. Questo non e' un problema di sicurezza, ma rende difficile testare il DOI flow localmente senza modificare il toml o avere un `.dev.vars` con l'override.

**Suggerimento:** Aggiungere a `.dev.vars` (che e' gia' menzionato nei commenti del toml):
```
VERIFICATION_BASE_URL=http://localhost:8787/api/leads/verify
```
E documentarlo nel README di setup locale.

---

_Revisionato: 2026-04-24_
_Revisore: Claude (gsd-code-reviewer)_
_Profondita: standard_
