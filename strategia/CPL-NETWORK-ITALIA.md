# RankEmpire Italia — rete nazionale CPL demand-first
**Decisione owner:** 24 ottobre 2026. **Stato:** strategia autorizzata; realizzazione e lancio di nuovi siti soggetti a gate di validazione, budget e pubblicazione.  
**Coordinamento operativo:** SOLIWKR / PaperClip [SOL-43](https://hq.soliwkr.pro/SOL/issues/SOL-43). **Fonte proprietaria:** questo repository.  
**Prevale per il modello CPL nazionale** sui documenti storici della factory rank-and-rent/renter. Non cancella quei prodotti o contratti: li distingue dal nuovo binario CPL.

## Invariante tecnico — repo singola Astro per ogni sito (decisione owner 25/10)
`soliwkr/rankempire-italia` è **factory/scouting/control-plane**, NON repository di deploy dei singoli siti. **Ogni sito CPL** ha `soliwkr/<slug-sito>` come repo Astro propria, build `dist/`, Worker Static Assets proprio e dominio/analytics propri. Tutto sotto la **stessa coda SOLIWKR**, senza moltiplicare task. Il template Astro storico `astro-rank-rent` / `rankame/templates/astro-base` va prima recuperato e verificato; non è attualmente disponibile nei repository GitHub connessi. Prima di replicarlo nel CPL rimuovere funzioni renter, raccolta lead D1, LocalBusiness inventati e doorway service×zone. Il sito v0.3 statico in RankEmpire è soltanto uno **snapshot di trasferimento**, non un precedente architetturale. Non collegare Worker Builds ai branch della factory.

## Prodotto che vogliamo
Una **rete nazionale di molti siti editoriali-commerciali, ognuno con un intento preciso**, costruita sulle **long tail italiane con domanda dimostrabile e SERP insufficientemente servite**. Il sito risolve il problema di ricerca con informazioni affidabili e indirizza l'utente, volontariamente, al **modulo ospitato da un partner CPL**. L'editore monetizza solo quando il partner riconosce e valida la richiesta secondo condizioni scritte.

### Vincoli inderogabili dell'owner
- **ZERO vendita diretta a imprese** come modello operativo; niente telefonate, outreach, negoziazioni uno-a-uno, gestione clienti o renter. Nessuna ricerca di acquirenti locali del lead.
- **ZERO gestione dei dati personali della richiesta** da parte del publisher: il modulo e la raccolta dei contatti sono sul sito/infrastruttura del partner; niente form first-party, inoltri di nominativi, telefonate, qualificazione o assistenza lavori. Restano ovviamente le responsabilità proprie dell'editore per sito, analytics, cookie, disclosure e sicurezza.
- **Nessuna esecuzione o responsabilità del servizio sottostante**: l'impresa/partner gestisce preventivi, chiamate e lavori. Esplicitare sul sito ruolo editoriale, percorso esterno e condizioni; non promettere prestazioni di terzi né esenzioni da obblighi di legge.
- **Minimo intervento quotidiano**, una volta che siti, compliance e rapporti publisher esistenti sono configurati: automatizzare le attività ripetitive soltanto dove sicure e osservabili; non promettere rendita passiva certa.
- **Mercato italiano intero**, non soltanto Formia/Sud Pontino; la geografia si sceglie dalla query reale, non da un elenco di comuni da clonare. Il numero di siti non è un target di pubblicazione: è l'esito di opportunità autonome redditizie.
- **Una sola coda operativa** PaperClip, una sola priorità in esecuzione; nessuna nuova app, sistema lead CRM, VPS o agenti in cascata per replicare funzioni già presenti.

## Pipeline RankEmpire (decisionale, non autorizzazione alla pubblicazione)
1. **Discover:** partire da verticale commerciale × problema specifico × località quando appropriata × intenzione transazionale. Riutilizzare Keyword Planner e research esistenti; raccogliere keyword osservate in Search Console dopo la pubblicazione.
2. **Verify demand:** distinguere volumi Keyword Planner, trend, dati GSC del sito e ipotesi. Celle senza volume = **UNKNOWN**, non zero. Nessun volume o ranking «garantito».
3. **Inspect SERP:** verificare tramite risultati correnti intent, presenza di portali dominanti, debolezze dei risultati, contenuto effettivamente mancante; Serper è uno strumento di lettura SERP, **non certifica volumi mensili**.
4. **Check monetization *prima* di creare il sito:** programma CPL affiliati accessibile al publisher, categoria e geografia accettate, payout per lead **valido** e non click, requisiti di attribuzione, EPC atteso da test, modalità deeplink/widget e qualità mobile, termini del traffico SEO, soglie/storni/pagamenti. Evitare partner unico di default; Edilnet è **benchmark**, non destino obbligato.
5. **Score opportunità:** intent e valore dell'informazione, evidenza domanda, SERP gap reale, partner/commissione, fit editoriale, costo di produzione e mantenimento. Bloccare se non si può produrre **valore originale non disponibile altrove**.
6. **Build selectively:** contenuto profondo e originale, fonti chiare, responsabile editoriale autentico, eventuali strumenti utili, CTA con disclosure, tracking outbound minimizzato senza PII. Ogni dominio deve rispondere a una domanda distinta e non essere una doorway page verso la stessa landing.
7. **Preflight:** audit claims, copyright/licenze, mobile, performance, dati strutturati adeguati, privacy, consenso cookies, robots, URL/redirect, crawlability, misurazione, disclosure affiliate, proprietà GSC, backup e rollback.
8. **Measure:** GSC impressions/click, click outbound per partner/categoria, lead **approvati** dal report partner, payout effettivo, ore/costi, conversione. Niente test lead fittizi, né equivalenza tra click ed entrata.
9. **Decide/replicate:** prima stabilire che il funnel si attribuisce e produce lead validi e che il margine al netto dei costi è sostenibile. Poi scegliere **il successivo** vertical/intent ad alta opportunità. Non serve «il primo renter pagante»: quello era un gate del precedente rank-and-rent, non del modello publisher CPL.

## Economia che conta
- **Outbound CTR** = click su link CPL / sessioni pertinenti; misurabile tramite evento privacy-safe.
- **Valid-lead CVR** = lead CPL *approvati* / click outbound (dato attribuito dal partner, se disponibile).
- **Revenue per 1000 sessioni** = 1.000 × outbound CTR × valid-lead CVR × payout valido.
- **Netto** = payout incassati meno servizi, domini, contenuti, hosting e lavoro/QA. Numeri NON OSSERVATI rimangono UNKNOWN.
- Valutare payout insieme al **funnel**, non in isolamento: €10 con metà della conversione potrebbe rendere meno di €6.
- Se il network partner non rende disponibili statistiche per validazione e attribuzione, la sostenibilità resta NON VERIFICATA: non presentare ricavo come provato.

## Primo esperimento, non un confine geografico
**Ristrutturazioni Formia** è il laboratorio per provare il contratto tecnico-editoriale e la monetizzazione affiliata. Le 424 keyword su ristrutturazioni nel repo sono *materia prima* e non 424 pagine da pubblicare. L'avanzamento è in [RISTRUTTURAZIONI-FORMIA-DELIVERY.md](RISTRUTTURAZIONI-FORMIA-DELIVERY.md) e nella sola issue SOL-43. Prima di perfezionare a oltranza l'interfaccia, verificare che **almeno un partner pagante ragionevole** abbia un percorso convertibile; in caso contrario tenere stabile l'asset e testare un'altra nicchia con programma CPL verificato, previa approvazione owner.

### Regole di scala
- Progettare componenti riusabili (template, scoring, copy QA, conversion event schema) ma **non** generare o deployare centinaia di siti «perché si può».
- Lanciare un nuovo asset solo con: query/intent giustificati, originalità dimostrabile, partner attivo e idoneo, piano di misurazione e gate di pubblicazione approvato.
- Nessun contatto diretto con imprese come attività necessaria alla strategia. Registrazione e approvazione account publisher con network CPL standard è distinta dall'outreach B2B.
- Limitare il lavoro corrente a un asset in consegna finché non è disponibile una prima evidenza economica; questo è un **criterio di rischio/efficienza**, non una trasformazione dell'obiettivo nazionale in un business locale.
- È vietato usare falsi business, recensioni, statistiche, scarsità, indirizzi, foto di lavori propri inesistenti o redirect mascherati.
- Non sono autorizzati in questa decisione acquisti domini, nuovi deploy production, campagne, spese, lavoro su VPS o automazioni autonome aggiuntive.

## Cosa **non** è più un gate CPL
| Norma vecchia del rank-and-rent | Nel nuovo publisher CPL |
|---|---|
| 4 operatori locali da contattare | Non necessaria: servono partner affiliati che coprano la nicchia e il traffico |
| Primo impresa/renter pagante | Non necessaria: serve evidenza di lead approvati e payout partner |
| Lead in D1 e double opt-in proprietario | Non applicabile al referral outbound: il partner raccoglie e qualifica i lead |
| Vendere lead esclusivi ad impresa locale | **Escluso dalla strategia attuale** |
| Sito N+1 solo dopo primo renter | Sostituito con gate di **economics/attribuzione CPL** prima della scala |
| SEO locale solo Sud Pontino | Sostituito da scoperta di long-tail non servite **su scala Italia** |

Questa decisione non spegne né riscrive la factory legacy: ne delimita il ruolo rispetto al nuovo modello. Qualunque futura coesistenza dei due business richiede scope e autorizzazione specifici.
