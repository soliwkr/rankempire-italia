# Keyword mapping → IA per Ristrutturazioni Formia

Data di analisi: 23 ottobre 2026. Fonte: repository `soliwkr/rankempire-italia`, commit `0879620d5a1f07e619b93087283be3497b3e079e` (al momento della lettura).

## Dataset letto

- `strategia/keyword/sud-pontino/keyword-brief-sud-pontino.csv`: 2.155 keyword su 7 nicchie, **424** record di ristrutturazioni.
- `strategia/keyword/sud-pontino/volumi-ristrutturazioni.csv`: 424 keyword edilizie, **5** con valore mensile numerico; **419** senza valore (dato mancante, non zero).
- Periodo dichiarato dal file Planner: luglio 2022 – giugno 2026; esportazione del 24 luglio 2026.
- Ripartizione dei 424 record: 396 template servizio × città, 24 frazioni, 4 articoli. Nessuna ragione per pubblicare tutte le combinazioni.

## Segnali riportati nel CSV Planner

| Keyword | Ricerche mensili medie riportate | Ambito/nota |
| --- | ---: | --- |
| bonus ristrutturazione 2026 | 50.000 | Nazionale, richiede rigoroso controllo normativo prima di affrontarlo |
| quanto costa ristrutturare casa al mq | 5.000 | Nazionale, intento informativo utile al funnel |
| come scegliere impresa edile | 500 | Nazionale, guida decisionale |
| impresa edile gaeta | 500 | Locale ma diversa da Formia, non target della prima release |
| quanto dura una ristrutturazione | 500 | Nazionale, guida informativa |

**ATTENZIONE:** non sono stime di traffico del nostro dominio, né volumi certificati per il solo Sud Pontino. La concorrenza riportata dal Planner è concorrenza pubblicitaria, non difficoltà SEO organica.

## Decisone architetturale v0.2

| Pagina | Intento | Fonte / motivazione |
| --- | --- | --- |
| `/` | navigazione e fiducia | brand/tema generale |
| `/ristrutturare-casa/` | guida commerciale | 39 combinazioni del cluster `ristrutturazione casa` nel mapping (non pubblicate singolarmente) |
| `/ristrutturazione-bagno/` | guida commerciale | 39 combinazioni del cluster `ristrutturazione bagno`; servizio con payout Edilnet dichiarato |
| `/vasca-in-doccia/` | guida transazionale | **non compare** nel mapping di luglio: scelta fondata sulle categorie Edilnet, da validare con dati e SERP prima di espandere |
| `/costi-ristrutturazione/` | ricerca informativa e supporto conversione | `quanto costa ristrutturare casa al mq`, 5.000 riportate su Italia |
| `/preventivi/` | preparazione e conversione | 60 record con `preventivo` nella nicchia edilizia, ma senza volumi locali associati |
| `/metodo/` | fiducia e trasparenza | disclosure editoriale e affiliazione |
| `/privacy/` | conformità preliminare | solo pagina demo; revisione titolarità e policy prima del deploy pubblico |

## Cosa NON fare ancora

- Non generare pagina per singolo comune/frazione o varianti lessicali senza evidenza di valore specifico.
- Non usare i campi vuoti come volume 0.
- Non creare pagine su bonus 2026 senza revisione delle fonti istituzionali e data di aggiornamento.
- Non inserire costi al m² arbitrari o recensioni inventate.
- Non attribuire click o richieste Edilnet fino a quando link affiliato e verifica di tracciamento non sono attivi.

## Gate per l'eventuale sviluppo organico

1. Audit pubblico dei risultati già indicizzati dal vecchio dominio e redirect da stabilire.
2. GSC: autenticazione effettiva del Worker e misura degli URL esistenti.
3. Serper: campione SERP controllato su intent principali e registrazione fonti; non chiamare SEO difficulty il valore `Competition` di Google Ads.
4. Dopo release: click organici, interazioni outbound e richieste affiliate validate; non solo posizioni.
