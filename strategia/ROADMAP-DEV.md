# ROADMAP-DEV.md
### Piano di sviluppo — luglio 2026 → oltre il trasloco
### Basato su E2E-AUDIT del 24/07 (102/106 test, flusso lead completo e wired)

> **Vincolo di contesto:** trasloco a Monte San Biagio a fine settembre. Fino ad allora
> l'obiettivo non è vendere ma **accumulare asset che maturano nel tempo**. Da ottobre,
> con lo studio montato, si passa all'acquisizione (`OUTREACH.md`).
>
> **Criterio di completamento, valido per ogni voce:** un lavoro è "fatto" solo se è
> **deployato e produce dati osservabili**. Codice che non gira non conta.

---

## Stato di partenza (dall'audit)

**Funziona E2E:** crea progetto → genera contenuti AI → deploy su Workers → assegna dominio
(DNS + GSC + GA4) → pagine pubbliche → lead con doppio opt-in → notifica Telegram → CMS
renter con auth JWT → upload media R2 → dashboard stats.

**Non blocca la vendita ma manca:** SERP tracking, PDF proof package, threshold outreach,
Kanban, KPI reali da GSC/GA4, wizard UI.

**Debiti tecnici noti:** 4 test rotti (setup, non produzione), `VERIFICATION_BASE_URL`
possibile mismatch, nessun rate limiting sul form lead, `project_id` non validato,
`CloudflarePagesService` dead code, creazione renter solo via D1.

---

# FASE A — Accumulo (ora → 30 settembre)

Obiettivo: **asset online che producono dati**, non funzionalità nuove.

## A1. Time-series cercasa ⏱️ PRIORITÀ ASSOLUTA

**Perché prima di tutto:** è l'unico asset il cui valore dipende dal tempo trascorso e che
**non è recuperabile a posteriori**. Fermo dal 2 luglio = tre settimane di storia perse per
sempre. Costa mezz'ora e lavora da solo mentre fai i pacchi.

- [ ] Diagnosticare perché il cron di `cercasa-scraper` è fermo (scheduled trigger? quota
      RapidAPI? errore silenzioso?)
- [ ] Riattivare e verificare che scriva davvero (controllo `last_seen_at` dopo 24h)
- [ ] **Correggere la normalizzazione città**: oggi tutti gli annunci finiscono `city='Formia'`
      anche se il worker interroga 16 zone Idealista. Mappare a micro-zona reale
- [ ] Aggiungere alert (Telegram) se il cron non gira per >48h — un asset silenziosamente
      fermo è peggio di uno assente
- [ ] Tabella `market_stats` aggregata separata da `listings` grezzi (i siti leggono le
      statistiche, mai gli annunci — cfr. vincolo legale sui portali)

**Fatto quando:** 7 giorni consecutivi di scrape con dati per micro-zona in D1.

## A2. Debiti tecnici bloccanti (mezza giornata)

Da chiudere prima di mettere siti online, perché toccano il percorso del lead.

- [ ] **`VERIFICATION_BASE_URL`**: verificare il mismatch `/verify` vs `/api/leads/verify`.
      Se sbagliato, il link del doppio opt-in non funziona → **ogni lead si perde**
- [ ] **Validare `project_id`** sull'inserimento lead (oggi si accettano lead orfani)
- [ ] **Rate limiting** sul form lead (oggi spammabile)
- [ ] Rimuovere `CloudflarePagesService` (dead code dopo lo switch a Workers)

## A3. Primo sito online: ristrutturazioniformia.it

**Perché questo per primo:** dominio già indicizzato (335 impression, posizione media 6,9,
home a 5,28), 12 operatori attivi a Formia = mercato contendibile. Ha già autorità: non
serve costruirla, serve riempirlo.

**Blocco qualità — non va online finché:**
- [ ] Rimosse recensioni inventate e prova sociale simulata ("Luigi da Gaeta — poco fa")
- [ ] Rimossa scarsità falsa ("solo 3 posti rimasti per marzo")
- [ ] Rimossi telefono 800 123 456, P.IVA XXXXXXXXXX, immagini `via.placeholder.com`
- [ ] Cambiato il brand "Edilpro" — è un'azienda reale (rivenditore edile, lungomare Caboto, Gaeta)

Poi:
- [ ] Rigenerare i contenuti dalla factory (avatar `in-pain`, quality gate attivo)
- [ ] Form lead → `POST /api/leads` con DOI
- [ ] Verificare che GSC riceva la sitemap

**Fatto quando:** online, senza falsi, form testato end-to-end con un lead reale in D1.

## A4. Secondo sito: agenziaimmobiliareformia.it

- [ ] Deploy (repo `aif` già pronto, D1 `aif-leads` già creato e migrato)
- [ ] Dominio + GSC + sitemap
- [ ] Blocco Listino alimentato da `market_stats` (dipende da A1)
- [ ] Form lead attivo

**Nota:** questo sito ha un moat che gli altri non hanno — il time-series. Ma le pagine
frazione **non vanno pubblicate** finché A1 non fornisce dati per micro-zona: senza dati
differenzianti sarebbero doorway pages.

## A5. Traccia i risultati (continuo, 5 min/settimana)

- [ ] GSC su entrambi i domini, sitemap inviate
- [ ] Cloudflare Web Analytics attivo (no GA4, no cookie banner)
- [ ] Query settimanale sul contatore lead

---

## ✅ Obiettivi verificabili al 30 settembre

- [ ] Cron cercasa attivo ininterrotto, ≥60 giorni di time-series per micro-zona
- [ ] `ristrutturazioniformia.it` online, ripulito, in GSC
- [ ] `agenziaimmobiliareformia.it` online, in GSC
- [ ] Form lead funzionanti su entrambi, DOI verificato end-to-end
- [ ] ≥1 lead reale loggato in D1 (basta uno: dimostra che il circuito è chiuso)
- [ ] Nessun contenuto falso su nessun sito pubblicato

Se queste caselle sono verdi, a ottobre l'outreach parte da **un contatore, non da una
promessa**.

---

# FASE B — Monetizzazione (ottobre → dicembre)

Da fare **dopo il trasloco**, quando puoi seguire un cliente.

## B1. Proof package (Fase 8 roadmap) — il pezzo che vende
`proof_sent_at` e `notifyProofReady` esistono già. Manca il PDF.

- [ ] Generazione PDF: lead consegnati, keyword posizionate, chiamate tracciate
- [ ] Threshold outreach: trigger a 12 lead / 60 giorni (oggi solo "primo lead")
- [ ] Template email/WhatsApp di accompagnamento (cfr. `OUTREACH.md`)

## B2. Tripla firma completa
- [ ] Numero telefonico dedicato per sito (call tracking)
- [ ] Parametro di provenienza persistente
- [ ] Report attribuzione per l'inquilino

## B3. Gestione renter
- [ ] Endpoint creazione renter (oggi solo via D1 diretta)
- [ ] Endpoint assegnazione progetto → renter
- [ ] Reset password
- [ ] Fatturazione: il campo `balance` esiste, definire il modello (canone vs pay-per-lead)

---

# FASE C — Scala (2027)

Solo dopo il **primo inquilino pagante**. Prima è infrastruttura in anticipo sul bisogno.

## C1. `rank-rent-market-intel` — la regola dei 4 operatori automatica
Vedi `MARKET-INTEL.md`. Serper (chiave già in `.env`) + crediti Vertex 900€ fino al 2027.
Da costruire quando dovrai valutare la **terza** nicchia.

- [ ] Validazione automatica su `POST /api/projects`: rifiuta se operatori < 4

## C2. SERP tracking (Fase 7)
- [ ] Cron posizioni keyword su D1
- [ ] Alert su cali di ranking
- [ ] Sitemap submit automatico a GSC

## C3. KPI reali (Fase 10)
- [ ] GSC clicks + GA4 sessions nella dashboard (oggi solo conteggi D1)

## C4. Dashboard e wizard (Fasi 9-10)
- [ ] Auth separata (oggi usa `API_SECRET`)
- [ ] Kanban progetti
- [ ] Wizard UI creazione siti

## C5. Motore autoalimentante
Vedi `ENGINE.md`. I tre cicli si accendono in ordine: dato→pagina→ranking,
ranking→lead→domanda, domanda→nuove pagine. **Replica multi-città (Fondi, Terracina) solo
dopo il primo sito affittato.**

---

## Regole permanenti

1. **Regola dei 4 operatori** — meno di 4 sul territorio = nessun compratore. Verificare
   prima di generare (oggi manuale, C1 la automatizza)
2. **Niente contenuti falsi** — recensioni inventate, prova sociale simulata, scarsità falsa,
   segnaposto in produzione. La build deve fallire se li trova
3. **Lead su D1 prima di ogni inoltro** — il contatore è ciò che si vende
4. **Il portale resta di Studio Pura Luce** — l'esclusiva si vende sui lead, non sull'asset
5. **Un nodo alla volta** — il sito N+1 quando il sito N ha un inquilino pagante
6. **Solo Claude Code** — niente framework di orchestrazione (il progetto è deragliato ad
   aprile per conflitto di tooling)
7. **"Fatto" = deployato e produce dati** — non "il codice esiste"

## Debiti tecnici non bloccanti (quando capita)

- [ ] 4 test rotti: mock batch generation (2), import `google-analytics` (1), setup `app` (1)
- [ ] Submodule `rankame` e `tools/local-business-builder` senza `.gitmodules`
- [ ] `site.config.json` nel repo generato non riceve il dominio (resta `null`)
- [ ] Nessun polling post-deploy: status resta `deploying` finché non si assegna il dominio
