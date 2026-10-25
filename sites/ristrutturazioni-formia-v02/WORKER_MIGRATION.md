# Ristrutturazioni Formia — Worker migration (staging)
**Owner:** RankEmpire CPL Italia / SOLIWKR | **Source:** preview v0.3 `8f7f5a6` | **PR:** migration/rf-worker-20261025.

## Architettura
- Sito multipagina esistente in `site/`: contenuti statici già versionati (nessun rebuild che riporti la v0.3 alla v0.2).
- `wrangler.jsonc`: **un Cloudflare Worker** `ristrutturazioni-formia-web` con Static Assets `./site`.
- `src/index.mjs`: Worker read-only che inoltra a `ASSETS`, preserva 404 e applica header **noindex/nofollow** a ogni risposta. Nessuna API, CRM, lead intake, cookies o dati personali dei preventivi.
- `tests/worker.test.mjs`: verifiche deterministiche su headers, 404, robots, static assets, health e metodi HTTP.

**Questa è una migrazione della superficie web; non riattivare la factory legacy, D1 lead o DOI.** La CTA affiliata e i consensi del dominio non sono ancora abilitati; lo stato resta PREVIEW. La cartella si chiama storicamente `ristrutturazioni-formia-v02`, ma contiene i file v0.3 verificati.

## CORREZIONE ARCHITETTURALE — 25/10/2026 (owner)
**NON collegare Workers Builds al repository `soliwkr/rankempire-italia` come soluzione definitiva o provvisoria di runtime.** Lo staging in questa cartella era un errore di instradamento: RankEmpire è la factory di ricerca/scoring/produzione; ogni sito pubblicato deve avere **un repository indipendente Astro + un Worker indipendente + un dominio indipendente**. Questa PR è un **pacchetto sorgente di transizione da esportare**, NON la sorgente definitiva da collegare alla build del Worker.

### Fatti verificati
- La documentazione storica in `.planning/phases/02-astro-template-completion/` e `CLAUDE.md` identifica il template ufficiale come `astro-rank-rent` / `rankame/templates/astro-base` e afferma che **i siti rimangono in repo separati**.
- **TEMPLATE UFFICIALE RECUPERATO**: il Worker Cloudflare `factory-core` ha configurazione `GITHUB_TEMPLATE_OWNER=StudioPuraLuce` e `GITHUB_TEMPLATE_REPO=astro-rank-rent` (soltanto variabili pubbliche, nessun secret letto). Il repository GitHub `StudioPuraLuce/astro-rank-rent` è accessibile con permessi amministrativi, `is_template=true`, contiene Astro `^6.1.8`, `astro.config.mjs`, `src/pages/`, componenti e test. Il vecchio percorso `soliwkr/astro-rank-rent` era **owner sbagliato**, NON repo perso. `rankame` resta gitlink legacy incompleto nel repo factory.
- Il vecchio Astro è orientato al **rank-and-rent** (schema LocalBusiness/Service, lead proprietari D1, service×zone massivo). Il modello attuale CPL editoriale richiede **adattamento esplicito**: Organization/Article/Breadcrumb appropriati, no provider di servizi fittizio, nessun form lead first-party/DOI/renter, nessuna doorway page.
- Il Worker isolato `ristrutturazioni-formia-web` esiste nell'account Cloudflare, ma **non è deployato**; una repo connection GitHub per RankEmpire è stata registrata, **senza trigger Build**. Non proseguire con la selezione token/branch RankEmpire per questo Worker.

### Sequenza corretta — sito 1
1. **Partire dal template ufficiale [StudioPuraLuce/astro-rank-rent](https://github.com/StudioPuraLuce/astro-rank-rent)** ora verificato. Adattarlo prima al publisher CPL: eliminare `<ContactForm>`/factory D1, schema LocalBusiness/Service fantasma, service×zone massivo senza contenuto originale, e workflow deploy Pages. Conservare componenti SEO realmente appropriati e layout Astro. Il pacchetto di conversione v0.3→Astro consegnato all'owner è un handoff intermedio, **non** dichiarare build Astro verificata (npm registry non raggiungibile).
2. Creare un repository dedicato al sito, proposto `soliwkr/ristrutturazioniformia`, dopo aver verificato unicità del nome. Il connettore GitHub attualmente disponibile **non espone `create_repository`**: creare la repo nel GitHub autorizzato o mediante un canale di provisioning che supporti realmente l'azione, non dichiararla creata in anticipo.
3. Spostare nello **stesso repository del sito** la v0.3 editoriale, i 10 URL preservati, le risorse/test e il Worker, convertendo gli asset in pagine/layout Astro solo dove offre vantaggio e preservando SEO/link. Non perdere screenshot/evidenze; evitare bootstrap vuoto che cancella pagine già pronte.
4. Il repository del sito contiene `astro.config.mjs`, `package.json`, `src/pages/`, `src/layouts/`, `src/components/`, `wrangler.jsonc`, `tests/`. Build `npm run build && npm test`; Worker `ristrutturazioni-formia-web` pubblica **solo gli asset generati in `dist/`**, non l'output legacy `site/`.
5. Collegare **la repo dedicata** a Cloudflare Workers Builds per il Worker già creato, preferendo connessione esistente per l'account ma con trigger specifico **su repo del sito** e token dedicato. **Nessun trigger per repo factory.** Verificare ID commit/build, Worker URL, noindex, 10 pagine, 404, cookie e click outbound.
6. Solo con QA e gate owner, predisporre il rilascio indicizzabile e l'eventuale trasferimento di `ristrutturazioniformia.it` da Pages a Worker. Preservare Pages come rollback finché la migrazione non è verificata.

### Cosa resta utile di questa PR
`site/`, `src/index.mjs` e i test sono uno snapshot tecnico funzionante in preview, **non la struttura canonica Astro**. Non cancellare lo snapshot né mergiarlo nel `main` della factory. Non collegare dominio, DNS, token o deploy. La nuova PR nel repository dedicato dovrà diventare la fonte vera della produzione.

## Gate prima del dominio
1. Verificare il primo build ID e URL Worker: `/_health` OK, 10 pagine, 404 reali, risposte `X-Robots-Tag: noindex`, menu mobile, simulatore, accessibilità, performance. Validare che preview riceva asset esistenti.
2. Inventariare URL indicizzati e relativi redirect Pages → Worker; non perdere URL, sitemap, GSC.
3. Approvare copy, contenuti e stime, identità Internet Marketing Secrets, informative privacy/cookie/CMP specifiche del dominio, tracciamento e partner CPL. Nessun contenuto falso né lead test.
4. **Solo con GO esplicito**: preparare una release distinta che rimuova `noindex` dal Worker, dalle pagine, `_headers` e `robots.txt`; rigeneri `sitemap.xml` e verifichi tutti gli URL.
5. Migrare i domini `ristrutturazioniformia.it` e `www` dal precedente Cloudflare Pages al Worker con piano di rollback (conservare Pages/ultimo deployment, annotare bindings/domini prima del cambio). **Non cancellare Pages né toccare DNS ora**. Una modifica di custom domain può richiedere di scollegarlo dalla configurazione Pages precedente: verificare gli effetti prima di agire.
6. Verificare con richieste HTTP pubbliche dominio, redirects, SSL, canonical, analytics post-consenso, outbound referral. Misurare lead **approvati** dal partner, non solo clic.

## Separazione da SOLIWKR
- **Fonte tecnica transitoria:** questa cartella nel repository RankEmpire. **Fonte definitiva obbligatoria:** nuovo repository del sito, non questa factory.
- **Coda unica e gate:** [SOL-43](https://hq.soliwkr.pro/SOL/issues/SOL-43).
- **Migrazione proposta:** questo ramo/PR; nessun merge su main della factory, nessun deploy, costo o cambiamento al dominio implicitamente autorizzato.
