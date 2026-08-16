# CercaCasa Recovery Specification v1

## 1. Stato

**CONFIGURAZIONE E CODICE RECUPERATI. MIGRAZIONE MICRO-ZONE VERIFICATA.
INGEST CORRENTE NON PROVATO OPERATIVO. RIPARAZIONE RUNTIME RINVIATA.**

L'ultimo dato runtime acquisito in sola lettura mostra un corpus storico di 799 annunci e
un `last_seen_at` massimo pari a `2026-07-22T12:01:10.478Z`. Questo non dimostra che il
cron stia producendo dati oggi. Il ripristino della credenziale provider e qualsiasi
riavvio restano fuori dallo scope di questa specifica.

## 2. Scope e ownership

CercaCasa è tooling RankEmpire per acquisizione e persistenza di dati immobiliari.
`rankempire-italia` conserva la documentazione operativa e di recovery durevole.

Il portale AIF è un consumatore downstream separato: non possiede lo scraper, non è stato
modificato durante questa recovery e non deve leggere gli annunci grezzi come se fossero
inventario corrente. TROVATEMI OS resta l'autorità di business e governance. D1 resta il
system of record dei dati acquisiti; Telegram è solo un canale di notifica.

Questa specifica canonizza le evidenze disponibili. Non canonizza la trascrizione
dell'operatore né promuove automaticamente il bundle distribuito a sorgente manutenibile.

## 3. Fonti di evidenza

Le etichette usate nel documento hanno significato stretto:

- **VERIFICATO NEL REPOSITORY**: osservato nel repository RankEmpire o nel sorgente
  TypeScript storico.
- **VERIFICATO NEL BUNDLE RECUPERATO**: osservato nel JavaScript distribuito recuperato;
  prova del comportamento conservato, non della sua manutenibilità.
- **EVIDENZA DA TRASCRIZIONE OPERATORE**: ricostruzione della sessione storica; richiede
  corroborazione quando possibile.
- **EVIDENZA DI RECOVERY FORNITA**: vincolo o fatto consegnato con questa specifica, non
  riverificato quando la verifica avrebbe richiesto di esporre materiale sensibile.
- **EVIDENZA RUNTIME PRECEDENTEMENTE ACQUISITA**: verifica read-only già catturata dal
  livello di orchestrazione; non ripetuta in questo task.
- **INFERENZA**: spiegazione coerente con più evidenze, non fatto direttamente osservato.
- **IGNOTO / NON RECUPERATO**: non dimostrabile con gli artefatti disponibili.

| Fonte | Autorità e ruolo | Limiti |
|---|---|---|
| `rankempire-italia` | **VERIFICATO NEL REPOSITORY.** Registro durevole RankEmpire e stato documentale di partenza, `main` a `42b1a61cc200fd66f93ef5ff44d89a60a6df3bf2`. | Conteneva diagnosi CercaCasa stale; non prova lo stato Cloudflare corrente. |
| `StudioPuraLuce/telegram-realestate` | **VERIFICATO NEL REPOSITORY.** Baseline TypeScript storica, tip `6bba7dc5c3d67de3e09f3691b1fe6de1a470d05b`. | Precede le correzioni di luglio e non contiene `zone`; il record di recovery segnala separatamente configurazioni storiche con credenziali compromesse. |
| `soliwkr/cercasa-scraper` | **VERIFICATO NEL BUNDLE RECUPERATO.** Snapshot del bundle distribuito, singolo commit `72700b6cc27a1b2b0ba343d2b837f53e02a8f387`. | Contiene JavaScript compilato, non la sorgente TypeScript canonica; non prova che il runtime funzioni oggi. |
| Trascrizione operatore | **EVIDENZA DA TRASCRIZIONE OPERATORE.** Sequenza della diagnosi, migrazione live e deploy di luglio. | Non è repository truth; timestamp e comandi esatti non sono tutti recuperati. |
| Verifiche runtime già catturate | **EVIDENZA RUNTIME PRECEDENTEMENTE ACQUISITA.** Conteggio D1, freschezza, distribuzione zone, cron/binding e lista secret. | Fotografia read-only successiva alla repair; non autorizza nuove query e non dimostra ingest successivi. |

## 4. Timeline ricostruita

| Quando | Evento | Classe di evidenza |
|---|---|---|
| 8 febbraio 2026 | Primo commit della baseline storica. | **VERIFICATO NEL REPOSITORY.** |
| 9 febbraio 2026 | Tip storico leggibile. Il worker interroga Idealista, Immobiliare e Subito; Idealista contiene 16 target e due ricerche per target, vendita e affitto. Gli errori provider possono diventare array vuoti. | **VERIFICATO NEL REPOSITORY.** |
| Luglio 2026, data esatta non recuperata | La diagnosi corregge l'ipotesi “cron fermo dal 2 luglio”: le esecuzioni avvenivano, ma quota RapidAPI esaurita e gestione degli errori potevano produrre successi apparenti senza ingest. Il cron storico riportato era `0 */1 * * *`. | **EVIDENZA DA TRASCRIZIONE OPERATORE**, corroborata dalla baseline con 16 target × vendita/affitto e catch che restituiscono risultati vuoti. |
| Luglio 2026, data esatta non recuperata | Recovery ridotta a Idealista, Formia/Gaeta/Minturno/Itri e cron giornaliero `0 8 * * *`; aggiunti conteggi e segnali di errore/notifica. | **EVIDENZA DA TRASCRIZIONE OPERATORE** + **VERIFICATO NEL BUNDLE RECUPERATO** per lo stato finale conservato. |
| Luglio 2026, data esatta non recuperata | Diagnosi semantica: `city = municipality || locationName` rende correttamente `Formia` per le micro-zone di Formia. La dimensione mancante è `zone`, alimentata in futuro da `district`. | **VERIFICATO NEL REPOSITORY** per la vecchia mappatura; **EVIDENZA DA TRASCRIZIONE OPERATORE** e **VERIFICATO NEL BUNDLE RECUPERATO** per la correzione. |
| Luglio 2026, data esatta non recuperata | Aggiunta live di `zone TEXT` e backfill di tutte le 799 righe; poi deploy del worker zone-aware. | **EVIDENZA DA TRASCRIZIONE OPERATORE** + **EVIDENZA RUNTIME PRECEDENTEMENTE ACQUISITA** per conteggio e distribuzione. |
| 13 agosto 2026 | Conservazione su GitHub del bundle recuperato e della configurazione associata. | **VERIFICATO NEL BUNDLE RECUPERATO.** Il commit non ricostruisce la storia dei deploy di luglio. |

**INFERENZA:** con 16 target, due operazioni per target e frequenza oraria, l'esaurimento
della quota mensile poco dopo il reset è una spiegazione coerente del no-ingest. Il consumo
effettivo e l'istante esatto di esaurimento non sono stati recuperati.

## 5. Contratto runtime recuperato

Il contratto conservato dal bundle è:

- sorgente di scrape schedulato: Idealista soltanto;
- territori: Formia, Gaeta, Minturno e Itri;
- schedule: ogni giorno alle 08:00 UTC (`0 8 * * *`);
- `city`: comune restituito dal provider, con il target di ricerca come fallback;
- `zone`: distretto restituito dal provider, con il target di ricerca come fallback;
- log schedulato: annunci trovati, nuovi e aggiornati;
- D1 viene aggiornato prima della notifica riepilogativa Telegram;
- Telegram segnala nuovi annunci, zero risultati ed errori, ma non è un system of record.

**VERIFICATO NEL BUNDLE RECUPERATO — semantica di scrittura D1:**

- i record nuovi includono `zone` nell'`INSERT`;
- i record cambiati aggiornano sia `city` sia `zone`;
- i record invariati aggiornano `last_seen_at` e valorizzano `zone` solo se prima era
  `NULL`, tramite `COALESCE`.

**VERIFICATO NEL BUNDLE RECUPERATO — limite dell'errore:** le risposte 403 e 429 sono
riconosciute e registrate come errori quota/auth, ma il catch della singola località
restituisce ancora un array vuoto. L'intero scrape fallisce quando il totale aggregato è
zero; l'handler schedulato poi registra e notifica l'errore senza rilanciarlo. La prova che
Cloudflare classifichi l'esecuzione come fallita, e non soltanto che l'operatore riceva un
segnale, è **IGNOTA / NON RECUPERATA**. La ricostruzione TypeScript deve rendere esplicita
questa scelta invece di assumerla corretta.

## 6. Migrazione storica delle zone

> **APPLICATA STORICAMENTE AL D1 LIVE — NON RIESEGUIRE.**

**EVIDENZA DA TRASCRIZIONE OPERATORE:** la migrazione aggiunse `zone TEXT` direttamente al
D1 live e popolò 799 record su 799, senza lasciare valori `NULL`:

- 518 assegnazioni derivate dal testo dell'indirizzo;
- 281 assegnazioni inferite dalle coordinate con prossimità al centroide/geografia.

**EVIDENZA RUNTIME PRECEDENTEMENTE ACQUISITA:** la distribuzione verificata è:

| Zona | Record |
|---|---:|
| Centro | 215 |
| San Pietro - San Giulio | 153 |
| Penitro - Santa Croce | 110 |
| Gianola - Santo Janni | 104 |
| Rio Fresco | 94 |
| Maranola - Trivio | 93 |
| Vindicio | 30 |
| **Totale** | **799** |

L'SQL originale e la sequenza esatta di tutti i comandi di backfill sono **IGNOTI / NON
RECUPERATI**. Questa specifica non crea una migration eseguibile sostitutiva.

## 7. Provenienza, semantica e sicurezza

### Provenienza delle zone

Le 799 zone storiche non sono tutte distretti forniti da Idealista. La provenienza del
backfill è mista: indirizzo o inferenza geografica. I record acquisiti dal worker corretto
usano invece il distretto provider con fallback al target.

Per una futura evoluzione del modello dati è raccomandato, ma **NON IMPLEMENTATO**, un campo
`zone_assignment_method` con valori controllati:

- `provider_district`;
- `address_derived`;
- `coordinate_inferred`.

### Limiti del corpus storico

- 799 è il corpus storico osservato, non stock di mercato attualmente attivo.
- Non esiste un lifecycle di rimozione affidabile. La baseline prevede stati e change type,
  ma l'upsert restituisce `removed: 0` con removal tracking non implementato.
- `status='active'` indica il valore legacy persistito, non la presenza corrente sul
  portale sorgente.
- `price_history` è un change log sparso attivato dalle variazioni, non una serie di
  snapshot periodici.
- `listing_changes` registra in modo effettivo nuovi annunci e variazioni prezzo nella
  baseline; non costituisce un lifecycle completo di rimozione/status.
- Il prezzo richiesto non è un prezzo di compravendita conclusa.

Questi dati non autorizzano affermazioni su inventario corrente, statistiche ufficiali di
mercato, dati ufficiali Idealista o prezzi di transazione.

### Sicurezza

**EVIDENZA DI RECOVERY FORNITA:** configurazioni storiche di `telegram-realestate` hanno
contenuto credenziali provider/bot committate. I valori sono da considerare compromessi,
non devono essere recuperati dalla storia Git e non devono mai entrare in questo repository
pubblico. Un futuro repair richiede credenziali nuove e ruotate, salvate esclusivamente
come Cloudflare secrets.

**VERIFICATO NEL BUNDLE RECUPERATO:** il repository di recovery traccia un file cache account
sotto `.wrangler/cache/`. Il contenuto non è stato aperto. Il prossimo task deve preservare
l'evidenza necessaria e poi rimuovere il file dal sorgente manutenibile e ignorare la cache.

## 8. Stato corrente

**EVIDENZA RUNTIME PRECEDENTEMENTE ACQUISITA:**

- corpus D1 osservato: 799 righe;
- `last_seen_at` più recente osservato: `2026-07-22T12:01:10.478Z`;
- distribuzione micro-zone coerente con il backfill;
- configurazione Worker osservata con cron giornaliero `0 8 * * *` e binding D1 presente;
- nell'elenco secret allora catturato non compariva il secret RapidAPI richiesto;
- nessuna evidenza D1 di ingest successivo al deploy recuperato.

Conclusione sicura: **la repair storica di luglio è documentata, ma l'ingest corrente non è
provato operativo**. Chris ha rinviato esplicitamente il ripristino/rotazione della
credenziale. Non è autorizzato alcun riavvio in questa fase.

## 9. Documentazione stale corretta

Questa recovery corregge soltanto le seguenti contraddizioni RankEmpire:

- `CLAUDE.md`: sostituisce “751 immobili” e “cron fermo dal 2 luglio” con corpus storico di
  799 righe, backfill verificato, ultima freschezza osservata il 22 luglio e ingest corrente
  non provato;
- `ROADMAP-DEV.md`, A1: sostituisce la diagnosi del cron fermo con cron attivo ma ingest
  silenziosamente impedito da quota/error handling, e separa la repair storica dalla prova
  operativa ancora mancante;
- `ROADMAP-DEV.md`, A1: sostituisce la falsa normalizzazione “tutto Formia” con la semantica
  corretta comune=`city`, micro-zona=`zone`.

Le altre sezioni strategiche datate non vengono corrette in questo task.

## 10. Prossimo task: CercaCasa TypeScript Source Reconstruction v1

Obiettivo del task successivo: ricostruire una sorgente TypeScript manutenibile partendo
dalla baseline storica e portando dentro, in modo esplicito e testabile, il comportamento
del bundle recuperato.

Il task deve iniziare **offline, senza deploy**:

1. ricostruire tipi, scraper Idealista, handler scheduled e persistenza D1;
2. preservare il contratto quattro comuni / cron giornaliero / semantica `city` e `zone`;
3. decidere e testare la propagazione di 403, 429, risultati parziali e zero risultati;
4. mantenere D1 come system of record e Telegram come notifica downstream;
5. rimuovere dal sorgente manutenibile la cache `.wrangler` e aggiungere la regola di ignore,
   dopo aver conservato la sola evidenza forense necessaria senza aprirne o copiarne i valori;
6. non recuperare credenziali storiche e non introdurre migration live;
7. produrre test offline e diff sorgente prima di qualunque autorizzazione runtime.

Restano fuori anche dal primo passo di ricostruzione: autenticazione Cloudflare, letture o
scritture D1, rotazione/inserimento secret, chiamate provider, esecuzione scraper, deploy e
riavvio. Queste azioni richiederanno un task e un'autorizzazione successivi, dopo la review
del sorgente ricostruito.
