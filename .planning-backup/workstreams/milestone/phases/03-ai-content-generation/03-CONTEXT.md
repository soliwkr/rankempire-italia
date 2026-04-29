# Phase 3: AI Content Generation - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Aggiungere a factory-core un endpoint `POST /api/generate/seed-project/:projectId` che legge il progetto da D1 (niche, city, services, zones, avatar), genera contenuto italiano localizzato con Gemini 2.5 Flash e scrive le pagine nella tabella D1 `pages`. L'endpoint è invocato tipo-per-tipo da uno script Node.js. Nessun UI, nessun wizard — quello è Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Orchestrazione & Timeout

- **D-01:** Endpoint `POST /api/generate/seed-project/:projectId?type={tipo}` — un tipo per chiamata. Ogni chiamata al Worker fa esattamente 1 call Gemini, scrive il batch su D1, ritorna. Nessun rischio timeout.
- **D-02:** Tipi validi: `homepage`, `services`, `zones`, `service_zones`, `blog`. Il parametro `type` è obbligatorio.
- **D-03:** Uno script Node.js (`scripts/seed-project.ts`) chiama l'endpoint 5 volte in sequenza, una per tipo. Per Phase 4, il wizard chiamerà gli stessi endpoint tipo-per-tipo.
- **D-04:** Ogni write su D1 è un **upsert** (INSERT OR REPLACE) basato su `(project_id, slug)` — idempotente. Rieseguire lo script sovrascrive il contenuto esistente senza errori.

### Struttura Prompt per Tipo

- **D-05:** Il `PromptService` attuale genera solo la struttura homepage (`{hero, services, seo}`). Phase 3 estende `PromptService` con metodi dedicati per ogni tipo:
  - `generateHomepagePrompt(project, avatar)` → 1 pagina
  - `generateServicesPrompt(project, avatar)` → N pagine (una per servizio)
  - `generateZonesPrompt(project, avatar)` → N pagine (una per zona)
  - `generateServiceZonesPrompt(project, avatar)` → N×M pagine (servizio × zona)
  - `generateBlogPrompt(project, avatar)` → K pagine (AI decide quante e su quali argomenti)
- **D-06:** Ogni prompt Gemini ritorna un **JSON array** di pagine con questa struttura:
  ```json
  [
    {
      "slug": "ristrutturazioni-interni-formia",
      "type": "service_zone",
      "title": "Ristrutturazioni Interni a Formia",
      "body": "<p>HTML generato...</p>",
      "faq": [{"question": "...", "answer": "..."}],
      "meta": {"description": "...", "canonical": "/ristrutturazioni-interni/formia/"}
    }
  ]
  ```
- **D-07:** Il campo `body` contiene HTML semantico (`<p>`, `<h2>`, `<ul>`, `<strong>`) — nessun `<script>` o `<iframe>`. Il prompt include questa istruzione esplicitamente.

### Blog Post

- **D-08:** Numero e argomenti decisi da Gemini in base a niche + city context. Floor roadmap: ≥3. Gemini può generarne 5-7 se trova argomenti naturali per il settore (guide locali, FAQ settoriali, confronti servizi). Non hardcodare un numero fisso.
- **D-09:** I blog post seguono lo stesso avatar del progetto (in-pain, skeptic, bundler) ma con tono più informativo/educativo. Gemini riceve l'avatar come contesto di voce, non come urgenza.

### Integrazione D1

- **D-10:** L'endpoint legge il progetto da D1 (`SELECT * FROM projects WHERE id = ?`) per ottenere niche, city, avatar. Le services e zones vengono lette da una nuova colonna JSON `config` su projects (o passate nel request body — da decidere in planning). **Claude's discretion** su quale dei due approcci.
- **D-11:** Dopo ogni batch Gemini, scrive immediatamente su D1 prima di procedere al tipo successivo — così se lo script viene interrotto, le pagine già generate sono salvate.

### Sicurezza

- **D-12:** L'endpoint `/api/generate/seed-project` è **protetto da Bearer token** (già nel middleware `protectedApp`). Non pubblico.
- **D-13:** Il `body` HTML è generato esclusivamente da Gemini seguendo il prompt strutturato — non contiene input utente diretto. Il commento in schema.ts (`// body è HTML generato esclusivamente da Phase 3`) si applica qui.

### Claude's Discretion

- Design interno di `PromptService` (class methods vs functions, parametri esatti)
- Gestione errori Gemini (retry strategy per singola call)
- Formato esatto dei prompt per ogni tipo (struttura, lunghezza, istruzioni specifiche)
- Come passare services/zones al Worker (colonna JSON su projects vs request body)
- Naming dei file di script

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema D1 e contratto dati
- `factory-core/src/db/schema.ts` — Tabelle `projects` e `pages` con tutti i campi. `pages.body` è HTML, `pages.faq` è JSON string, `pages.meta` è JSON string.
- `rankame/templates/astro-base/src/lib/fetchPages.ts` — Contratto `PageContent` che Phase 3 deve soddisfare al 100%: `{id, projectId, slug, type, title, body, faq, meta}`

### AI Service esistente
- `factory-core/src/services/ai.ts` — `AiService` con metodo `generateContent(prompt, jsonMode)`. Usa `gemini-2.5-flash` via Cloudflare AI Gateway. Riusare senza modifiche.
- `factory-core/src/services/prompts.ts` — `PromptService` attuale (solo homepage). Phase 3 estende questa classe.

### Endpoint esistente da non rompere
- `factory-core/src/api/generate.ts` — `POST /api/generate/content` esistente (genera 1 pagina, non scrive su D1). Non modificare — aggiungere nuovo endpoint separato.
- `factory-core/src/index.ts` — Mount `protectedApp.route('/api/generate', generateApi)` — il nuovo seed endpoint va nello stesso router.

### Roadmap e requisiti
- `.planning/ROADMAP.md` §Phase 3 — Success criteria: homepage+services(≥5)+zones(≥5)+service_zone(≥50)+blog(≥3), avatar voice, italiano naturale, no timeout

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AiService` (`factory-core/src/services/ai.ts`): Pronto all'uso. Accetta `generateContent(prompt, jsonMode=true)` per output JSON strutturato. Non modificare.
- `PromptService` (`factory-core/src/services/prompts.ts`): Estendere con nuovi metodi per tipo. La struttura avatar (in-pain, skeptic, bundler) e le istruzioni Gary Halbert sono già qui.
- Drizzle ORM + D1 pattern già consolidato in `api/projects.ts` e `api/sites.ts` — riusare lo stesso pattern per insert/upsert su `pages`.

### Established Patterns
- Hono router con `Bindings` type: pattern già consolidato — ogni nuovo endpoint segue la stessa struttura
- Bearer token auth: già nel middleware `protectedApp` — il nuovo endpoint lo eredita automaticamente
- D1 query pattern: `const db = drizzle(c.env.DB)` + `db.insert(pages).values(...)` — già usato in Phase 2

### Integration Points
- Il nuovo endpoint si aggiunge a `factory-core/src/api/generate.ts` (nuovo route nello stesso file, es. `api.post('/seed-project/:projectId', ...)`)
- Oppure nuovo file `factory-core/src/api/seed.ts` montato su `/api/generate` — Claude's discretion
- Lo script `scripts/seed-project.ts` vive in `factory-core/scripts/` (directory già esistente con altri script)

</code_context>

<specifics>
## Specific Ideas

- "Non voglio hardcodare il numero di blog post — che lo decida l'AI in base al contesto" → blog count è AI-determined con floor ≥3
- "Se vale la pena fare upgrade Workers, lo facciamo" → per ora non necessario (1 call Gemini per request = sotto 5s). Upgrade è opzione aperta se Phase 4 richiede più parallelismo.
- Approcci considerati e scartati: single mega-prompt (rischio token limit), Cloudflare Queues (overkill per v1), script Node.js puro senza Worker (non triggerable dal wizard futuro)

</specifics>

<deferred>
## Deferred Ideas

- Rigenerazione selettiva di un singolo tipo (es. solo blog) — utile ma non richiesto da Phase 3. Phase 4+ può aggiungere `?type=blog` al wizard.
- Parallelizzazione delle call Gemini con `Promise.all` — possibile ottimizzazione, ma sequential è più semplice e sicuro per v1.
- Caching del contenuto generato (evitare rigenerare se già esistente) — utile in produzione, non in scope Phase 3.

</deferred>

---

*Phase: 03-ai-content-generation*
*Context gathered: 2026-04-26*
