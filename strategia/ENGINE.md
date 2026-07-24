# ENGINE.md — Il motore autoalimentante
### Progetto strategico · portale rank-and-rent iper-locale · Sud Pontino
### Handoff chat → Claude Code · luglio 2026

> Questo documento è la **visione completa** del motore + la **sequenza di accensione**.
> Leggere DOPO `BRIEF-CLAUDE-CODE.md` (che contiene le decisioni già chiuse e i vincoli).
> Regola sovrana: si costruisce uno stadio alla volta, e ogni stadio si sblocca solo
> quando il precedente ha prodotto il suo segnale. Non costruire a valle di un ciclo
> il cui carburante non esiste ancora.

---

## 1. La tesi in una frase

Un motore che trasforma dati immobiliari iper-locali in pagine che rankano, che
producono lead, che rivelano la domanda reale, che genera le pagine successive — un
ciclo che a ogni giro rende il successivo più facile. Costruito una volta, replicabile
città per città a costo marginale quasi nullo (Formia → Fondi → Terracina → provincia LT).

## 2. I tre cicli

**Ciclo A — Dato → Pagina → Ranking.**
Gli annunci diventano statistiche aggregate per micro-zona; le statistiche diventano
pagine; la freschezza dei dati diventa segnale di crawl. Si rigenera solo ciò che si è
mosso.

**Ciclo B — Ranking → Lead → Domanda.**
Le pagine catturano contatti. I contatti SONO dati di prima parte: budget reali, zone
reali, tipologie richieste — domanda che nessun keyword tool mostra, perché è la tua.

**Ciclo C — Domanda → Nuove Pagine.**
GSC (near-miss in posizione 8-15) + i lead (cosa la gente chiede davvero) alimentano un
motore che PROPONE le prossime pagine. Tu approvi. Lui pubblica. Il giudizio resta umano.

I tre cicli si chiudono ad anello: C rialimenta A. Da qui "autoalimentante".

## 3. I moat (in ordine di forza) — cosa NON è copiabile

1. **Time-series iper-locale.** cercasa-db raccoglie da febbraio 2026. La storia reale di
   prezzi / giorni-sul-mercato / inventario per micro-zona, nel tempo, non è scrapabile
   retroattivamente. Un concorrente che parte fra un anno è indietro di un anno per
   sempre. **Cresce da solo ogni giorno che il cron gira. È il moat più forte e parte OGGI.**
2. **OMI + mercato live.** Quotazioni ufficiali Agenzia delle Entrate (pubbliche, per
   micro-zona, trimestrali) incrociate col dato di mercato vivo = autorità + freschezza in
   una pagina. Nessuno le incrocia. (Verificare accesso/formato OMI attuale prima di
   dipenderne.)
3. **Domanda di prima parte.** I lead rivelano la domanda prima dei tool pubblici.
4. **Leva multi-città.** Il motore è agnostico alla città: un'infrastruttura, N inquilini.
   Le agenzie non ce l'hanno, i portali non la vogliono nel micro-mercato.

Dove NON compete (accettato, non un bug): "case in vendita a Formia" generico resta dei
portali nazionali. Il motore presidia l'iper-locale editoriale + informazionale + la
coda transazionale di zona, che i portali ignorano e le agenzie non sanno scalare.

## 4. Architettura ideale (con "tutte le API") — per strati

Tutto su Cloudflare edge, coerente con lo stack esistente.

**Ingestione:**
- cercasa-db espanso: dedup multi-portale dello stesso immobile, geocoding a micro-zona.
- GSC API (ranking/near-miss asset propri, gratis).
- DataForSEO pay-per-call (SERP + volumi competitor, one-shot non subscription).
- OMI (Agenzia Entrate) + ISTAT (contesto socio-demografico).
- Google Places (densità servizi, distanza mare — nutre il "perché questa zona").

**Intelligenza:**
- Workers AI / LLM: strato editoriale SOPRA i numeri. Scrive DAI dati, mai inventa.
- Vectorize: clustering semantico della domanda → trova buchi di contenuto + link interni.
- Rilevamento soglia: se €/mq o inventario di una zona si muove oltre X%, genera un
  "aggiornamento di mercato" datato e fattuale. Freschezza reale, non prosa rigirata.

**Pubblicazione / chiusura loop:**
- Queues + Workflows: rigenerano SOLO le pagine il cui dato sottostante è cambiato.
- D1 lead → analisi domanda → coda pagine proposte.
- Cron: scrape periodico (oggi FERMO dal 2 luglio — va riattivato: è il cuore del ciclo A).
- Human-in-the-loop: il sistema propone "queste 10 pagine valgono questa settimana, ecco
  perché"; l'umano approva. Sempre.

## 5. Il vincolo che protegge il brand (non negoziabile)

Il motore pubblica **dati e fatti derivati dai dati** — non prosa generata a massa.
"Scaled content abuse" è esattamente ciò che le policy anti-spam Google colpiscono, ed è
l'opposto della USP white-hat che vendi a Vittorio (stessa lama dell'anti-gating: la
disciplina È il prodotto). L'AI scrive dai numeri, l'umano approva. Nel momento in cui
"autoalimentante" degenera in "auto-genera 500 pagine di fuffa", il brand è bruciato.

## 6. SEQUENZA DI ACCENSIONE (la parte che conta)

Ogni stadio si accende solo al segnale del precedente. Nessuno stadio "in parallelo per
guadagnare tempo": i cicli B e C non hanno carburante prima che A produca.

### Stadio 0 — Time-series ON (oggi, costo ~0)
- Riattiva e stabilizza il cron di cercasa-scraper. Correggi la normalizzazione città
  (oggi tutto sotto "Formia"): mappa a micro-zona.
- **Perché ora:** ogni giorno di ritardo è storia persa per sempre. È l'unico pezzo che
  parte prima di tutto perché il suo valore è il tempo accumulato.
- **Segnale per proseguire:** dati freschi e mappati per zona in D1.

### Stadio 1 — Ciclo A minimo (il sito che già esiste)
- Le 9 pagine Fase 1 live, Listino alimentato dai dati freschi dello Stadio 0.
- Deploy, GSC, sitemap, indicizzazione. Worker lead attivo (già costruito).
- **Perché ora:** senza pagine indicizzate non esiste ranking, senza ranking non esistono
  lead. È il collo di bottiglia fisico di tutto il resto.
- **Segnale per proseguire:** pagine indicizzate + primi movimenti in GSC (impression).

### Stadio 2 — Chiudi il ciclo B (raccolta domanda)
- I lead arrivano e sono loggati (già pronto). Aggiungi SOLO la lettura: una query/vista
  che aggrega intent + zona + budget dei lead reali.
- GSC API: estrai i near-miss (posizione 8-15) — pagine che quasi rankano.
- **Perché ora e non prima:** questo stadio ANALIZZA dati che prima non esistevano.
  Costruirlo prima = costruire un analizzatore di un dataset vuoto.
- **Segnale per proseguire:** un primo insieme di near-miss + un manipolo di lead reali
  con pattern leggibili.

### Stadio 3 — Ciclo C semi-automatico (proposta pagine)
- Il sistema incrocia near-miss GSC + domanda lead → propone le prossime N pagine
  (frazioni Fase 2, tipologie, "aggiornamenti di mercato" da soglia).
- Generazione dati-driven, approvazione umana, pubblicazione via Workflows.
- Aggiungi qui OMI (autorità) se l'accesso è verificato.
- **Perché ora:** ora hai entrambi gli input reali che rendono la proposta sensata.
- **Segnale per proseguire:** il loop gira su Formia — le pagine proposte rankano e
  producono lead misurabili.

### Stadio 4 — Replica multi-città (Fondi, Terracina, provincia LT)
- SOLO ora. Astrarre città/zone a configurazione: `data/citta/{slug}.json` + geo per zona.
- Il motore è già agnostico: cambia il dato geografico e la sorgente scrape, non il codice.
- Un nuovo dominio per città (esclusiva territoriale = un inquilino per città, cfr. BRIEF).
- **Perché ULTIMO:** la replica moltiplica. Moltiplicare prima che Formia sia affittato =
  moltiplicare un'ipotesi non validata. Il segnale che sblocca la replica NON è tecnico
  ("il motore funziona") ma commerciale: **Formia affittato**, cioè un ★★★ firmato o un
  inquilino pagante. Prima di quel segnale, Fondi e Terracina restano UNA RIGA in questo
  file, non codice.

## 7. La regola che tiene tutto insieme

> L'asimmetria non vale niente se il primo sito non è affittato.

Il motore è remunerativo come *sistema replicato*, ma il moltiplicatore si attiva solo su
un'unità validata. La cosa più remunerativa che puoi fare adesso non è costruire lo
Stadio 3: è portare lo Stadio 1 a ranking e mettere il primo assegno in banca. Il
time-series (Stadio 0) intanto accumula valore da solo, gratis, in sottofondo.

Ordine del valore atteso, dal più al meno certo: Stadio 0 (moat gratis) → Stadio 1
(carburante di tutto) → primo affitto → Stadi 2-3 (intelligenza) → Stadio 4 (scala).
