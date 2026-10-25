# Rank Empire — Google Search Console operator (READ ONLY)

Questo modulo utilizza **il progetto Google Cloud di Rank Empire già esistente**, non ne crea un altro.

## Obiettivo
Cloudflare Worker isolato `rankempire-gsc-operator` che può:
- elencare le proprietà Search Console visibili al Service Account;
- interrogare Search Analytics (query/pagine/date/dispositivi ecc.) con scopo OAuth `webmasters.readonly`;
- offrire readiness verificata all'orchestratore SOLIWKR.

**Non** registra nuove proprietà, non modifica Search Console, non invia sitemap e non gestisce Google Business Profile. Nessuna chiave privata è conservata nel repository.

## Prerequisiti (da verificare prima dell'attivazione)
1. In Google Cloud selezionare **lo storico progetto Rank Empire** e verificare che la Search Console API sia abilitata.
2. Recuperare l'identità del Service Account ruotato (o crearne uno dedicato nello **stesso progetto**), senza riutilizzare chiavi revocate.
3. Aggiungere l'indirizzo e-mail del Service Account come utente con accesso almeno limitato alle proprietà desiderate in **Google Search Console**. I ruoli IAM di GCP da soli non concedono l'accesso alle proprietà Search Console.
4. Su Cloudflare Worker `rankempire-gsc-operator`, configurare due segreti **tramite dashboard o Wrangler**:
   - `GSC_SERVICE_ACCOUNT`: JSON della chiave del Service Account attualmente valida, come SECRET (non testo pubblico).
   - `SEO_OPERATOR_API_SECRET`: password API casuale di almeno 32 caratteri, come SECRET.
   - Facoltativo: variabile `RANKEMPIRE_PROJECT_ID` con ID ufficiale del progetto per impedire l'uso involontario di un account di un progetto diverso.
5. Non pubblicare mai il JSON, la chiave privata, token OAuth o secret nei ticket, nei commit e nelle conversazioni.

## Sicurezza
- Scope Google `https://www.googleapis.com/auth/webmasters.readonly` soltanto.
- Ogni rotta dati richiede `Authorization: Bearer <SEO_OPERATOR_API_SECRET>`; senza segreti tutte le rotte private rispondono 503.
- Nessun cookie, CORS permissivo, salvataggio locale di query o password.
- La firma RS256 viene eseguita via Web Crypto direttamente nel Worker.
- Le proprietà e le autorizzazioni restano quelle esplicitamente assegnate al Service Account.

## API, dopo attivazione
- `GET /health`: solo verifica del codice, **non** conferma accesso GCP.
- `GET /v1/ready`: scambia token ed elenca il numero di proprietà accessibili.
- `GET /v1/properties`: URL e livello di permesso delle proprietà accessibili.
- `POST /v1/search-analytics`: JSON `{"siteUrl":"sc-domain:example.com","startDate":"2026-09-01","endDate":"2026-09-30","dimensions":["query","page"],"rowLimit":100}`.

È necessario verificare l'API con un Service Account autorizzato su una proprietà reale. Fino a quel momento **Google non è collegato**.

## Limiti dell'integrazione
Non si garantisce indicizzazione, ranking o copertura esaustiva di tutte le query: l'API restituisce dati aggregati e può omettere query a bassa frequenza. Per SEO/AEO è un sensore, non un fattore di posizionamento.

## Separazione
Non modificare `factory-core` o la sua D1 per integrare questo operatore. L'implementazione è separata e può essere collegata ad AIOS quando autenticazione e proprietà saranno state verificate.

## Estensione Serper — SERP Italia (draft, non distribuita)

**Fail closed:** anche con `SERPER_API_KEY` già configurata, la rotta risponde `503 serper_disabled` finché la variabile **`SERPER_ENABLED='true'`** non viene impostata *esplicitamente* dopo il gate owner. Nessun credito Serper è consumato dalla sola presenza della key o dal merge del codice. In caso di rollback/pausa impostare `SERPER_ENABLED='false'`.

Questa estensione resta **nello stesso Worker** `rankempire-gsc-operator`. Non crea un'altra infrastruttura. La chiave `SERPER_API_KEY` deve stare in Cloudflare **Secret** e non compare mai in sorgenti, log o issue. La sua presenza è stata verificata come binding il 24/10/2026; questo non equivale a una chiamata Serper riuscita. La configurazione corrente del Worker non espone il subdomain pubblico; mantenerla privata. In caso di futura esposizione usare Cloudflare Access o rete privata e l'attuale autorizzazione Bearer (non ridurre i controlli).

### Contratto unico e limitato

`POST /v1/serp`, con **lo stesso** `Authorization: Bearer <SEO_OPERATOR_API_SECRET>` delle API GSC e `Content-Type: application/json`. JSON ammesso: `{"q":"costo rifacimento bagno piccolo"}`. Query manuale, una sola richiesta Serper /search, `gl=it`, `hl=it`, `num=10`. Nessuna batch, crawler, cron, query parametrizzata da URL, tracking utenze o ricerca in automatico. Il limite locale è 512 caratteri JSON; la query max 140 caratteri. Errore generico senza corpo upstream o key leak; 429 upstream diventa 429. Nessun accesso diretto del browser all'API Serper.

**Output:** `query`, `source=serper`, `organic[]` con position/title/url/snippet limitati, indicazione che si tratta di **SERP snapshot e NON dati di volume di ricerca**. Non inferire punteggi SEO o ranking sicuri. Confrontare intent, autorevolezza, copertura e originalità manualmente. I volumi provengono da Keyword Planner e devono riportare data/fonte; GSC mostra dati di proprietà accessibili e non misura tutto il mercato.

### Test e gate di attivazione

Test deterministici senza credenziali e senza API calls:

```bash
node --test integrations/rankempire-gsc/tests/serper.test.mjs
```

**Prima di qualsiasi deploy**: review CTO e QA, verificare che gli endpoint GSC precedenti restino protetti, permessi e route, credits quota Serper, conteggio invocazioni e rollback, autorizzazione esplicita all'aggiornamento Worker condiviso. Non lanciare automaticamente query: anche una prova Serper può consumare credito. Nessuna modifica è stata applicata al Worker live con questo commit. Il blocco Cloudflare Pages 403 della preview Formia è **indipendente** da Serper.
