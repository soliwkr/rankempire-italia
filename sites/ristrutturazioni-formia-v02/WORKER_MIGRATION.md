# Ristrutturazioni Formia — Worker migration (staging)
**Owner:** RankEmpire CPL Italia / SOLIWKR | **Source:** preview v0.3 `8f7f5a6` | **PR:** migration/rf-worker-20261025.

## Architettura
- Sito multipagina esistente in `site/`: contenuti statici già versionati (nessun rebuild che riporti la v0.3 alla v0.2).
- `wrangler.jsonc`: **un Cloudflare Worker** `ristrutturazioni-formia-web` con Static Assets `./site`.
- `src/index.mjs`: Worker read-only che inoltra a `ASSETS`, preserva 404 e applica header **noindex/nofollow** a ogni risposta. Nessuna API, CRM, lead intake, cookies o dati personali dei preventivi.
- `tests/worker.test.mjs`: verifiche deterministiche su headers, 404, robots, static assets, health e metodi HTTP.

**Questa è una migrazione della superficie web; non riattivare la factory legacy, D1 lead o DOI.** La CTA affiliata e i consensi del dominio non sono ancora abilitati; lo stato resta PREVIEW. La cartella si chiama storicamente `ristrutturazioni-formia-v02`, ma contiene i file v0.3 verificati.

## GitHub → Worker, SENZA Pages
Cloudflare supporta [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) da GitHub e [Static Assets](https://developers.cloudflare.com/workers/static-assets/). La connessione Git/Worker deve essere autenticata e approvata: **non viene creata automaticamente da questo commit**.

Configurare in Cloudflare **Workers & Pages → Create Worker → Connect to Git** (o collegare il Worker esistente) con:
- **Repository:** `soliwkr/rankempire-italia` (staging nel repository esistente; repository dedicato per ogni asset quando sarà possibile crearlo senza duplicati).
- **Production branch del solo Worker:** `migration/rf-worker-20261025` — *non* `main` di RankEmpire; non collegare ancora il dominio.
- **Root directory:** `sites/ristrutturazioni-formia-v02`.
- **Build command:** `npm test` (fallisce prima del deploy se i controlli non passano).
- **Deploy command:** `npx wrangler deploy` (richiede permessi **Workers Scripts Edit**, non Pages Write).
- **Name must match** `ristrutturazioni-formia-web` in Wrangler. Se è necessario scegliere un altro nome, allineare entrambi PRIMA della connessione.

È possibile eseguire `npm test` localmente senza nessuna API key. Per il primo deploy da Cloudflare Builds servono la connessione GitHub all'account e le autorizzazioni Workers pertinenti. Non copiare token/API keys in GitHub, issue o chat. L'URL workers.dev risultante sarà una **preview pubblicamente accessibile ma esclusa dall'indicizzazione** (noindex + robots disallow). La preview non equivale a GO produzione.

## Gate prima del dominio
1. Verificare il primo build ID e URL Worker: `/_health` OK, 10 pagine, 404 reali, risposte `X-Robots-Tag: noindex`, menu mobile, simulatore, accessibilità, performance. Validare che preview riceva asset esistenti.
2. Inventariare URL indicizzati e relativi redirect Pages → Worker; non perdere URL, sitemap, GSC.
3. Approvare copy, contenuti e stime, identità Internet Marketing Secrets, informative privacy/cookie/CMP specifiche del dominio, tracciamento e partner CPL. Nessun contenuto falso né lead test.
4. **Solo con GO esplicito**: preparare una release distinta che rimuova `noindex` dal Worker, dalle pagine, `_headers` e `robots.txt`; rigeneri `sitemap.xml` e verifichi tutti gli URL.
5. Migrare i domini `ristrutturazioniformia.it` e `www` dal precedente Cloudflare Pages al Worker con piano di rollback (conservare Pages/ultimo deployment, annotare bindings/domini prima del cambio). **Non cancellare Pages né toccare DNS ora**. Una modifica di custom domain può richiedere di scollegarlo dalla configurazione Pages precedente: verificare gli effetti prima di agire.
6. Verificare con richieste HTTP pubbliche dominio, redirects, SSL, canonical, analytics post-consenso, outbound referral. Misurare lead **approvati** dal partner, non solo clic.

## Separazione da SOLIWKR
- **Fonte tecnica:** questa cartella nel repository RankEmpire (eventuale estrazione futura in repository dedicato).
- **Coda unica e gate:** [SOL-43](https://hq.soliwkr.pro/SOL/issues/SOL-43).
- **Migrazione proposta:** questo ramo/PR; nessun merge su main della factory, nessun deploy, costo o cambiamento al dominio implicitamente autorizzato.
