# Phase 3: AI Content Generation - Research

**Researched:** 2026-04-26
**Domain:** Gemini 2.5 Flash JSON output, Cloudflare Workers limits, Drizzle ORM D1 upsert, Italian programmatic SEO
**Confidence:** HIGH (stack verificato via codice esistente + docs ufficiali)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Endpoint `POST /api/generate/seed-project/:projectId?type={tipo}` — un tipo per chiamata Worker
- **D-02:** Tipi validi: `homepage`, `services`, `zones`, `service_zones`, `blog`
- **D-03:** Script Node.js `scripts/seed-project.ts` chiama l'endpoint 5 volte in sequenza
- **D-04:** Write su D1 è upsert (`INSERT OR REPLACE` / `onConflictDoUpdate`) su `(project_id, slug)` — idempotente
- **D-05:** `PromptService` esteso con 5 metodi tipo-specifici: `generateHomepagePrompt`, `generateServicesPrompt`, `generateZonesPrompt`, `generateServiceZonesPrompt`, `generateBlogPrompt`
- **D-06:** Ogni prompt Gemini ritorna JSON array `[{slug, type, title, body, faq, meta}]`
- **D-07:** Campo `body` contiene HTML semantico — no `<script>`, no `<iframe>`
- **D-08:** Blog count AI-determined, floor ≥3
- **D-09:** Blog post seguono avatar con tono informativo/educativo
- **D-10:** Services/zones lette da colonna `configJson` su projects OPPURE passate nel request body — Claude's discretion
- **D-11:** Write su D1 dopo ogni batch Gemini, prima di procedere al tipo successivo
- **D-12:** Endpoint protetto da Bearer token via `protectedApp` middleware (già esistente)
- **D-13:** Body HTML generato solo da Gemini, non da input utente — sanitizzazione applicata prima della scrittura

### Claude's Discretion

- Design interno di `PromptService` (class methods vs functions, parametri esatti)
- Gestione errori Gemini (retry strategy per singola call)
- Formato esatto dei prompt per ogni tipo (struttura, lunghezza, istruzioni specifiche)
- Come passare services/zones al Worker (colonna JSON su projects vs request body)
- Naming dei file di script

### Deferred Ideas (OUT OF SCOPE)

- Rigenerazione selettiva di un singolo tipo
- Parallelizzazione call Gemini con `Promise.all`
- Caching del contenuto generato
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FACT-02 | Il sistema genera ~105 pagine di contenuto SEO italiano tramite Gemini 2.5 Flash con copywriting avatar-based (in-pain, skeptic, bundler — Gary Halbert methodology) | Verificato: AiService esistente, pattern PromptService estendibile, schema D1 pages compatibile con contratto PageContent |
</phase_requirements>

---

## Summary

Phase 3 aggiunge un endpoint `POST /api/generate/seed-project/:projectId?type=X` a factory-core che genera contenuto SEO italiano per tutti e 5 i tipi di pagina usando Gemini 2.5 Flash, poi scrive i risultati sulla tabella D1 `pages`. La decisione architetturale chiave — un tipo per chiamata Worker — risolve completamente il rischio timeout: una singola chiamata Gemini che ritorna ~5-20 pagine (anche per `service_zones` se si usa la strategia "un Gemini call per servizio") completa abbondantemente entro i limiti di Cloudflare Workers.

Il rischio tecnico principale è la **troncatura silente di Gemini 2.5 Flash**: quando un output JSON array è troppo grande (es. 60+ pagine in un singolo prompt), il modello può smettere di generare con `finish_reason: STOP` senza segnalare errori, producendo un JSON invalido. La mitigazione raccomandata è chunking per servizio nel tipo `service_zones` — una call Gemini per servizio con tutte le sue zone — riducendo ogni output a ~5-10 pagine per call.

La scrittura su D1 usa `onConflictDoUpdate` di Drizzle ORM su chiave `(project_id, slug)` in un singolo batch insert per tipo, pattern già collaudato nel codebase.

**Raccomandazione primaria:** Per `service_zones`, fare N call Gemini (una per servizio) anziché una singola mega-call. Tutte le altre chiamate (homepage, services, zones, blog) rientrano facilmente nei limiti con una sola call.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Generazione contenuto AI | API / Backend (Worker) | — | Gemini API key non esposta al client; il Worker è l'unico a fare fetch verso Cloudflare AI Gateway |
| Persistenza pagine D1 | Database / Storage (D1) | API / Backend | Drizzle ORM + D1 è il pattern già in uso; il Worker scrive, il sito Astro legge a build time |
| Orchestrazione 5 tipi | Script Node.js (esterno) | — | Per Phase 3 è uno script; in Phase 4 il wizard chiamerà gli stessi endpoint |
| Routing endpoint | API / Backend (Hono) | — | Nuovo route dentro `generateApi`, già montato su `protectedApp` |
| Sanitizzazione HTML | API / Backend (Worker) | — | Prima della write D1, il Worker verifica che body non contenga `<script>` — responsabilità esplicita di Phase 3 (vedi schema.ts commento) |

---

## Stack Analysis

### Core (tutto già nel progetto, nessuna nuova dipendenza richiesta)

| Libreria | Versione verificata | Scopo | Note |
|----------|--------------------|----|------|
| `hono` | 4.12.14 | Router HTTP, nuovo route nel generateApi | Già in uso — pattern consolidato |
| `drizzle-orm` | 0.45.2 | Upsert batch su D1 | Già in uso — `onConflictDoUpdate` disponibile |
| `@cloudflare/workers-types` | 4.20260422.1 | Tipi D1Database, env bindings | Già in uso |
| `zod` | 4.3.6 | Validazione schema output Gemini (opzionale ma consigliato) | Già installato |
| `vitest` | 4.1.5 | Test framework — pattern esistente in `leads.test.ts` | Già configurato |

[VERIFIED: factory-core/package.json]

### Servizi esistenti riutilizzabili senza modifica

| Servizio | File | Come si usa |
|----------|------|-------------|
| `AiService` | `src/services/ai.ts` | `generateContent(prompt, schema?)` — ritorna JSON se schema passato, testo altrimenti. Non modificare. |
| `PromptService` | `src/services/prompts.ts` | Estendere con 5 nuovi metodi — la struttura avatar e il sistema Gary Halbert sono già presenti |
| Bearer auth middleware | `src/index.ts` | `protectedApp` eredita automaticamente — il nuovo endpoint non richiede codice auth aggiuntivo |

[VERIFIED: codebase grep]

### Nessuna installazione necessaria

```bash
# Nessun nuovo package da installare — tutto già presente in factory-core/package.json
```

---

## Critical Findings

### CF-01: Cloudflare Workers — Limite CPU vs Wall-Clock (CRITICO)

**Cosa conta come CPU time:** Solo il tempo in cui il CPU esegue attivamente codice JavaScript. Il tempo passato ad attendere la risposta di Gemini (network I/O) **non consuma CPU budget**.

**Limiti ufficiali (piano Paid):**
- CPU time default: **30 secondi** per HTTP request
- CPU time massimo configurabile: **5 minuti** (da marzo 2025, opt-in via `cpu_ms` in wrangler.toml)
- Wall-clock time: **illimitato** finché il client è connesso
- Subrequest timeout: nessun limite fisso per HTTP request

[VERIFIED: developers.cloudflare.com/workers/platform/limits, changelog 2025-03-25]

**Implicazione per Phase 3:** Una call Gemini che impiega 10-30 secondi di wall-clock consuma pochissimo CPU time (solo parse del JSON, insert Drizzle). Il rischio timeout è **effettivamente zero** con la strategia un-tipo-per-call. Non è necessario configurare `cpu_ms` elevato.

**Limite D1 queries per invocazione:** 1000 (piano Paid). Con ~100 pagine inserite come batch in un unico statement (`insert().values(array)`), si usa 1 query. Ampiamente dentro i limiti.

[VERIFIED: developers.cloudflare.com/d1/platform/limits]

---

### CF-02: Gemini 2.5 Flash — Token Output e Troncatura Silente (CRITICO)

**Limite output token:** 65.536 token per call. [CITED: datastudios.org, docs ufficiali Google]

**Stima token per pagina SEO italiana:** Una pagina con body HTML ~600 parole + FAQ 3 domande + meta ≈ 800-1000 token. Quindi:
- homepage (1 pagina): ~1000 token → sicuro
- services (5-10 pagine): ~5000-10000 token → sicuro
- zones (5-10 pagine): ~5000-10000 token → sicuro
- **service_zones (50-100 pagine in una call): ~50.000-100.000 token → A RISCHIO**
- blog (3-7 pagine): ~5000-10000 token → sicuro

**Il bug della troncatura silente (NOTO, BUG ATTIVO):**
Gemini 2.5 Flash può smettere di generare a metà output con `finish_reason: STOP` senza segnalare errori. Il risultato è un JSON invalido (array non chiuso) che causa `JSON.parse` error nell'`AiService`. Il bug è stato segnalato su Google Developer Forum con casi a 724 output token (ben sotto il limite) e risulta ancora attivo in 2026.

[CITED: discuss.ai.google.dev/t/truncated-response-issue-with-gemini-2-5-flash-preview/81258]

**Ulteriore problema:** Quando `finish_reason: MAX_TOKENS`, la response con JSON strutturato ritorna `null` per il testo, non il JSON parziale. Non è possibile "riprendere" da dove si è fermato.

[CITED: github.com/googleapis/python-genai/issues/1039]

**Mitigation obbligatoria per `service_zones`:**
Fare **N call Gemini separate** (una per servizio), ognuna delle quali genera tutte le pagine per le zone di quel servizio. Con 10 servizi × 10 zone = 10 call da 10 pagine ciascuna (≈10.000 token/call) — ampiamente dentro i limiti, nessun rischio troncatura.

**Detection obbligatoria per tutti i tipi:**
Verificare `result.candidates[0].finishReason` prima di fare `JSON.parse`. Se non è `STOP`, trattare come errore e ritornare 500 al caller (lo script Node.js riproverà).

---

### CF-03: D1 Upsert — Schema mancante per conflitto `(project_id, slug)`

**Situazione attuale:** La tabella `pages` in `schema.ts` NON ha un unique index su `(project_id, slug)`. L'upsert con `onConflictDoUpdate({ target: [pages.projectId, pages.slug] })` richiede questo indice, altrimenti Drizzle/SQLite non sa quale constraint usare.

[VERIFIED: factory-core/src/db/schema.ts]

**Soluzione richiesta (Wave 0):** Aggiungere `uniqueIndex('pages_project_slug_uniq').on(pages.projectId, pages.slug)` allo schema e applicare una migration D1 (locale + remote).

**Alternativa senza unique index:** `DELETE FROM pages WHERE project_id = ? AND type = ?` seguito da `INSERT` standard. Più semplice ma non atomico — accettabile per uno script sequenziale che non gira in parallelo.

La decisione D-04 del CONTEXT.md dice "upsert basato su `(project_id, slug)`" — quindi la migration è necessaria.

---

### CF-04: AiService — `generateContent(prompt, schema?)` firma attuale

Il secondo parametro è `schema?: any` ma viene usato solo come flag booleano: se truthy, imposta `responseMimeType: 'application/json'` e fa `JSON.parse(textContent)`. Non passa un JSON Schema a Gemini.

[VERIFIED: factory-core/src/services/ai.ts]

**Implicazione:** Gemini riceve solo `responseMimeType: 'application/json'` — questo attiva il JSON mode ma non vincolante su uno schema specifico. Il modello è libero di inventare campi extra o omettere campi. Per Phase 3, il prompt deve descrivere lo schema in modo molto esplicito (con esempio JSON) e la validazione Zod dopo il parse è raccomandata.

**Non è necessario modificare `AiService`** — il piano deve estendere `PromptService` con prompt molto precisi che includano l'esempio JSON completo.

---

## Implementation Approach

### Approccio D-10: Services/Zones — Raccomandazione

**Raccomandazione (Claude's discretion):** Passare services e zones nel **request body** (non `configJson` su projects).

Motivazione:
- Lo script Node.js conosce già services e zones (li ha configurati quando ha creato il progetto)
- Non richiede una migration aggiuntiva per aggiungere colonne a `projects`
- Più flessibile: permette di rigenerare solo alcuni servizi in future chiamate
- La colonna `configJson` su `projects` esiste già (`text('config_json')`) — può essere usata in futuro se serve

**Schema request body:**
```typescript
// POST /api/generate/seed-project/:projectId?type=service_zones
{
  "services": ["idraulico", "termoidraulico"],
  "zones": ["Formia", "Gaeta", "Minturno"],
  "avatar": "in-pain"
}
```

---

### Pattern Upsert D1 — Drizzle onConflictDoUpdate

```typescript
// Source: drizzle.team/docs/guides/upsert (VERIFIED)
// Richiede: unique index su (project_id, slug)
await db
  .insert(pages)
  .values(pageRows)  // array di oggetti
  .onConflictDoUpdate({
    target: [pages.projectId, pages.slug],
    set: {
      title: sql`excluded.title`,
      body: sql`excluded.body`,
      faq: sql`excluded.faq`,
      meta: sql`excluded.meta`,
    },
  });
```

**Pattern alternativo (senza unique index — delete + insert):**
```typescript
// Atomico abbastanza per script sequenziale
await db.delete(pages)
  .where(and(eq(pages.projectId, projectId), eq(pages.type, type)));
await db.insert(pages).values(pageRows);
```

---

### Chunking per service_zones

```
Per service_zones:
  Per ogni servizio in services[]:
    1. Chiama generateServiceZonesPrompt(service, zones, project, avatar)
    2. 1 call Gemini → array di M pagine (una per zona)
    3. Verifica finishReason === 'STOP'
    4. Inserisci batch su D1
  Fine loop
```

Questo genera N call Gemini totali (N = numero servizi) anziché 1 mega-call. Con 10 servizi, lo script `seed-project.ts` chiama l'endpoint `service_zones` 10 volte invece di 1 — oppure il Worker fa il loop internamente. La seconda opzione (Worker fa il loop) è più semplice per lo script ma richiede attenzione alla latenza totale (wall-clock, non CPU).

**Raccomandazione:** Il Worker fa il loop interno per `service_zones`. Lo script chiama una volta sola con `?type=service_zones` e il Worker itera sui servizi. Wall-clock 30-60s totale (N × ~3-5s per call Gemini) — nessun problema perché wall-clock è illimitato su HTTP.

---

### Sanitizzazione HTML (D-13 obbligatoria)

Prima di ogni write D1, il Worker deve rimuovere tag pericolosi dal campo `body`. Approccio minimo senza dipendenze esterne:

```typescript
// Regex basilare — sufficiente per body da Gemini (non da input utente)
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');  // rimuove event handlers inline
}
```

Non serve una libreria completa (DOMPurify richiede DOM API non disponibile in Workers) perché la fonte è Gemini, non input utente. Il commento in `schema.ts` conferma questa responsabilità.

---

### Detection troncatura Gemini

```typescript
// Aggiungere in AiService o nel caller — OBBLIGATORIO
const candidate = result.candidates?.[0];
const finishReason = candidate?.finishReason;

if (finishReason !== 'STOP' && finishReason !== undefined) {
  throw new Error(`Gemini output incompleto: finishReason=${finishReason}`);
}

// Ulteriore check: il JSON parsato è un array non vuoto?
const parsed = JSON.parse(textContent);
if (!Array.isArray(parsed) || parsed.length === 0) {
  throw new Error('Gemini ha ritornato array vuoto o non-array');
}
```

---

## Italian SEO Content — Struttura Raccomandata per i Prompt

### Anatomia di una pagina service_zone ottimale

Per il SEO locale italiano, ogni pagina `service_zone` deve includere:

- **H1:** "{Servizio} a {Zona}" — keyword principale nella prima frase
- **H2:** Benefici specifici per il contesto locale (citare zona/quartiere almeno 2-3 volte nel body)
- **H2:** Processo/Come funziona
- **H2:** Perché scegliere noi
- **FAQ:** 3-5 domande tipiche del segmento (es. "Quanto costa un idraulico a Formia?")
- **Meta description:** ≤160 caratteri, include keyword + città + CTA
- **Lunghezza body:** 400-700 parole — sufficiente per indicizzazione, non così lungo da gonfiare i token

[CITED: outranking.io/blog/guide-to-local-seo-in-italy, jonathanseo.com/articles/how-to-do-seo-in-italy-in-2024]

### Istruzioni prompt critiche per output affidabile

1. **Includere un esempio JSON completo** nel prompt — Gemini segue esempi molto meglio dei testi descrittivi
2. **Specificare "Ritorna SOLO il JSON array, nessun testo prima o dopo"** — previene preamble che rompe il parse
3. **Specificare lunghezza body** — "Il campo body deve contenere 400-600 parole in HTML semantico" — evita risposte troppo corte o troppo lunghe
4. **Specificare tag HTML permessi** — `<p>, <h2>, <h3>, <ul>, <li>, <strong>` — evita tag non desiderati
5. **Citare zone e città in modo organico** — non stuffing, ma integrazione naturale nel testo (max 2-3% keyword density)

### Keyword density raccomandato italiano

- Keyword principale (es. "idraulico Formia"): 1-2% (≈4-8 occorrenze in 400 parole)
- Varianti semantiche (es. "idraulico a Formia", "impianti idraulici Formia"): distribuite nel testo
- "vicino a me" non hardcodare — Google capisce la prossimità dal contesto geografico

[CITED: outranking.io/blog/guide-to-local-seo-in-italy]

---

## Validation Architecture

**nyquist_validation: true** — sezione obbligatoria.

### Test Framework

| Proprietà | Valore |
|-----------|--------|
| Framework | vitest 4.1.5 |
| Config file | `factory-core/vitest.config.ts` (da verificare — potrebbe essere inline in package.json) |
| Quick run | `cd factory-core && npx vitest run src/api/ --reporter=verbose` |
| Full suite | `cd factory-core && npx vitest run --reporter=verbose` |

[VERIFIED: factory-core/package.json `"test": "vitest"`]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Comando | File esiste? |
|--------|----------|-----------|---------|-------------|
| FACT-02-a | Endpoint ritorna 400 se `type` mancante | unit | `vitest run src/api/seed.test.ts` | No — Wave 0 |
| FACT-02-b | Endpoint ritorna 400 se `type` invalido | unit | `vitest run src/api/seed.test.ts` | No — Wave 0 |
| FACT-02-c | Endpoint ritorna 404 se `projectId` non esiste | unit | `vitest run src/api/seed.test.ts` | No — Wave 0 |
| FACT-02-d | PromptService genera prompt con avatar corretto | unit | `vitest run src/services/prompts.test.ts` | No — Wave 0 |
| FACT-02-e | sanitizeHtml rimuove `<script>` tags | unit | `vitest run src/services/prompts.test.ts` | No — Wave 0 |
| FACT-02-f | finishReason check lancia errore su non-STOP | unit | `vitest run src/api/seed.test.ts` | No — Wave 0 |
| FACT-02-g | Upsert D1 è idempotente (no duplicate slug) | integration | Script smoke test manuale | No — Wave 0 |

### Pattern test da seguire (da leads.test.ts)

```typescript
// Source: factory-core/src/api/leads.test.ts [VERIFIED]
import { describe, it, expect } from 'vitest';
import api from './seed';

describe('POST /api/generate/seed-project/:projectId', () => {
  it('should return 400 if type is missing', async () => {
    const res = await api.request('/seed-project/proj-1', {
      method: 'POST',
      body: JSON.stringify({}),
    }, { DB: {} as any, GOOGLE_AI_API_KEY: 'test' } as any);
    expect(res.status).toBe(400);
  });
});
```

### Wave 0 Gaps

- [ ] `factory-core/src/api/seed.test.ts` — covers FACT-02-a, b, c, f
- [ ] `factory-core/src/services/prompts.test.ts` — covers FACT-02-d, e
- [ ] Migration D1: unique index su `(project_id, slug)` per upsert
- [ ] `factory-core/vitest.config.ts` — verificare se esiste (script `test: vitest` funziona senza)

---

## Common Pitfalls

### Pitfall 1: Mega-call service_zones con 50+ pagine

**Cosa va storto:** Una singola call Gemini che chiede 50-100 pagine in un JSON array supera il limite pratico di output affidabile (~20-30 pagine) e/o incontra il bug di troncatura silente.

**Perché succede:** Gemini 2.5 Flash ha `finish_reason: STOP` anche quando il JSON è troncato. `JSON.parse` lancia un errore, l'endpoint ritorna 500, lo script si ferma.

**Come evitarlo:** Loop per servizio — N call Gemini da M pagine ciascuna. Il Worker itera `for (const service of services)` internamente.

**Warning signs:** Il JSON parsato ha meno elementi di `services.length × zones.length`.

---

### Pitfall 2: `onConflictDoUpdate` senza unique index

**Cosa va storto:** Drizzle lancia un errore SQLite "no such constraint" al momento dell'insert.

**Perché succede:** `pages` non ha un unique index su `(project_id, slug)` nello schema attuale.

**Come evitarlo:** Aggiungere `uniqueIndex` allo schema + migration in Wave 0 **oppure** usare delete-then-insert.

**Warning signs:** `D1_ERROR: UNIQUE constraint failed` ma constraint non definita → in realtà `SqliteError: no such table: constraint`.

---

### Pitfall 3: `AiService.generateContent` non espone `finishReason`

**Cosa va storto:** Il caller non può verificare `finishReason` perché `AiService` ritorna solo `textContent` (o il parsed JSON).

**Perché succede:** L'implementazione attuale fa `JSON.parse(textContent)` e lancia errore solo se il parse fallisce — ma se Gemini ritorna un JSON valido troncato (es. array chiuso a metà), il parse potrebbe riuscire su un array incompleto.

**Come evitarlo:** Il seed endpoint deve verificare che l'array ha la dimensione attesa (es. per `service_zones`: `parsed.length >= zones.length`). Oppure passare il raw `result` alla validazione prima del parse.

**Warning signs:** D1 ha meno pagine di quelle attese dopo la generazione.

---

### Pitfall 4: Body HTML con preamble di testo

**Cosa va storto:** Gemini antepone testo come "Ecco il JSON richiesto:" prima del `[`, rompendo `JSON.parse`.

**Perché succede:** Anche con `responseMimeType: 'application/json'`, il modello a volte aggiunge commenti.

**Come evitarlo:** Includere nel prompt "Ritorna SOLAMENTE il JSON array, senza alcun testo prima o dopo." + estrarre il JSON con regex come fallback: `const match = text.match(/\[[\s\S]*\]/); if (match) return JSON.parse(match[0]);`.

---

### Pitfall 5: Script Node.js che usa `tsx` + env vars non configurate

**Cosa va storto:** Lo script `scripts/seed-project.ts` chiama l'endpoint con Bearer token — se `API_SECRET` non è in `.dev.vars`, le richieste ritornano 401.

**Perché succede:** Wrangler serve il Worker locale con `.dev.vars` — ma lo script Node.js deve passare il token manualmente.

**Come evitarlo:** Lo script legge `API_SECRET` da `.env` (non da `.dev.vars` Wrangler) via `process.env`. Documentare nel piano che serve un `.env` locale per lo script.

---

## Environment Availability

| Dipendenza | Richiesta da | Disponibile | Versione | Fallback |
|------------|-------------|-------------|---------|---------|
| `wrangler` (dev locale) | Test endpoint locale | Verificato in package.json | 4.84.1 | — |
| `vitest` | Test suite | Verificato in package.json | 4.1.5 | — |
| D1 local (Wrangler SQLite) | Test write D1 | Verificato (.wrangler/ dir esiste) | embedded | — |
| Gemini API Key | Call AI reale | `.dev.vars` (non in git) | — | Mock in unit test |
| `tsx` | Eseguire script Node.js | Verificato in devDependencies | 4.21.0 | `ts-node` |

[VERIFIED: factory-core/package.json, factory-core/.dev.vars (esiste, non letto)]

---

## Security Domain

**security_enforcement: enabled** (default).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Bearer token via `protectedApp` middleware — già implementato e ereditato |
| V3 Session Management | no | Stateless endpoint, nessuna sessione |
| V4 Access Control | no | Endpoint admin-only, nessun RBAC necessario per Phase 3 |
| V5 Input Validation | yes | Validare `type` (enum), `projectId` (formato), `services`/`zones` (array di stringhe) |
| V6 Cryptography | no | Nessuna operazione crittografica |

### Known Threat Patterns

| Pattern | STRIDE | Mitigazione Standard |
|---------|--------|---------------------|
| Prompt injection via services/zones | Tampering | Non includere input utente direttamente nel prompt senza escaping; services e zones sono array di stringhe brevi, non HTML |
| XSS via body HTML scritto su D1 | Tampering | Sanitizzazione obbligatoria prima della write (D-13) — `<script>` e event handler rimossi |
| Auth bypass su endpoint seed | Elevation of Privilege | `protectedApp` middleware già in place — nessuna action richiesta |
| Sovrascrittura contenuto di altri progetti | Tampering | Verifica che `projectId` esiste prima di scrivere — ritornare 404 se non trovato |

---

## Assumptions Log

| # | Claim | Sezione | Rischio se sbagliato |
|---|-------|---------|---------------------|
| A1 | Il progetto usa il piano Paid di Cloudflare Workers (CPU limit 30s default, wall-clock illimitato) | CF-01 | Se piano Free: CPU limit 10ms — endpoint fallirebbe. Verificare wrangler.toml `compatibility_flags`. |
| A2 | `vitest.config.ts` non esiste come file separato (usa default) | Validation Architecture | Se esiste con config speciale, i test path potrebbero differire |
| A3 | `.dev.vars` contiene `GOOGLE_AI_API_KEY` per test reali | Environment Availability | Se mancante, i test E2E richiedono mock espliciti |

---

## Open Questions

1. **Unique index su `pages(project_id, slug)` — migration o delete-then-insert?**
   - Cosa sappiamo: CONTEXT.md dice "upsert basato su `(project_id, slug)`" — implicita migration
   - Cosa non è chiaro: Se `configJson` su projects già contiene dati o se va popolato prima del seed
   - Raccomandazione: Aggiungere unique index in Wave 0 (drizzle-kit generate + wrangler d1 migrations apply)

2. **Loop service_zones nel Worker o nello script Node.js?**
   - Cosa sappiamo: Wall-clock illimitato, CPU time non consumato durante I/O
   - Cosa non è chiaro: Se preferire logica nel Worker (semplifica lo script) o nello script (più trasparente)
   - Raccomandazione: Loop nel Worker — lo script chiama 5 endpoint totali (uno per tipo), il Worker gestisce il chunking interno per service_zones

3. **`configJson` su projects — formato e when populated?**
   - Cosa sappiamo: Colonna esiste (`text('config_json')` in schema.ts), ma nessun codice la popola attualmente
   - Raccomandazione: Usare request body per services/zones (D-10 Claude's discretion) — evita dipendenza da dato che potrebbe non esistere

---

## Sources

### Primary (HIGH confidence)
- [factory-core/src/services/ai.ts] — AiService implementazione verificata
- [factory-core/src/db/schema.ts] — Schema D1 verificato
- [factory-core/package.json] — Versioni dipendenze verificate
- [developers.cloudflare.com/workers/platform/limits] — CPU/wall-clock limits verificati
- [developers.cloudflare.com/changelog/post/2025-03-25-higher-cpu-limits] — Aggiornamento 5min CPU limit marzo 2025
- [developers.cloudflare.com/d1/platform/limits] — D1 query limits verificati
- [drizzle.team/docs/guides/upsert] — Pattern onConflictDoUpdate verificato

### Secondary (MEDIUM confidence)
- [discuss.ai.google.dev/t/truncated-response-issue-with-gemini-2-5-flash-preview/81258] — Bug troncatura silente Gemini 2.5 Flash, confermato da thread community
- [shareuhack.com/en/posts/gemini-2-5-flash-developer-guide-2026] — Production pitfalls Gemini 2.5 Flash
- [github.com/googleapis/python-genai/issues/1039] — MAX_TOKENS ritorna null per JSON strutturato

### Tertiary (LOW confidence)
- [outranking.io/blog/guide-to-local-seo-in-italy] — Struttura SEO locale italiana 2025
- [datastudios.org/post/google-gemini-2-5-flash-context-window-token-limits] — 65.536 output token limit (da verificare con docs ufficiali Google)

---

## Metadata

**Confidence breakdown:**
- Stack (AiService, Drizzle, Hono): HIGH — verificato direttamente dal codebase
- Cloudflare Workers limits: HIGH — verificato da docs ufficiali + changelog 2025
- Gemini JSON reliability / troncatura: MEDIUM — da bug report community e forum Google (bug attivo, non docs ufficiali)
- Italian SEO patterns: MEDIUM — da fonti secondarie, principi consolidati

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (limiti Cloudflare stabili; comportamento Gemini potrebbe cambiare con aggiornamenti modello)

---

## RESEARCH COMPLETE
