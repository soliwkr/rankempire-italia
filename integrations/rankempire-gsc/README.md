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
