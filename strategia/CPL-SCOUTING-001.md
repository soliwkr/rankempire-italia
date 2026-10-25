# CPL SCOUTING 001 — primo screening nazionale (non un piano di pubblicazione)
**Data:** 2026-10-25. **Owner:** RankEmpire Italia. **Coda operativa unica:** [SOL-43](https://hq.soliwkr.pro/SOL/issues/SOL-43).
**Stato:** READ-ONLY / candidate discovery; nessun nuovo sito, contatto commerciale, budget, query Serper consumata o lead personale raccolto. I dati di domanda vengono dal repository, i controlli SERP sotto da pagine pubbliche visibili (NON risultati ottenuti da Serper). Questo file è evidence record della specifica nazionale [CPL-NETWORK-ITALIA.md](CPL-NETWORK-ITALIA.md).

## Correzione della base Keyword Planner
I file `strategia/keyword/sud-pontino/volumi-*.csv` riportano data 24 luglio 2026 e intervallo **luglio 2022–giugno 2026**. Il campo da leggere è `Avg. monthly searches`, non la somma storica né la riga aggregata `Tutti` o `Italia`. Esistono circa:
| Dataset | Keyword con testo | Con volume numerico | Query parent rilevante / ricerche mensili medie |
|---|---:|---:|---|
| ristrutturazioni | 424 | 5 | “quanto costa ristrutturare casa al mq” = **500**; “bonus ristrutturazione 2026” = **5.000** (query normativa volatile) |
| serramenti e infissi | 261 | 6 | “infissi pvc o alluminio” = **5.000**; “quanto costa cambiare gli infissi” = **500** |
| studi tecnici | 333 | 7 | “differenza cila e scia” = **500**; “quanto costa una sanatoria edilizia” = **500** |
| climatizzazione e fotovoltaico | 267 | 4 | “quanto costa impianto fotovoltaico 6 kw” = **5.000**; “conviene il fotovoltaico con accumulo” = **500** |
| termoidraulica | 352 | 8 | “quanto costa sostituire una caldaia” = **500** |
| elettricisti | 261 | 5 | “quanto costa rifare impianto elettrico” = **5.000** |
| immobiliare | 257 | 37 | molte query `case in vendita/affitto` con volumi, ma **non una prova di partner CPL publisher compatibile** |

**Avvertenze obbligatorie:** le keyword `parent` NON sono i volumi delle rispettive **long tail**: per ciascuna long tail qui proposta il valore numerico resta **UNKNOWN** finché non esiste un export specifico. Altre celle vuote NON sono 0, e il Keyword Planner misura interesse di ricerca, non percentuale di clic SEO o difficoltà organica. Il periodo di 4 anni non è «domanda osservata oggi»; serve verifica di trend e SERP corrente.

## Candidati di contenuto, non ancora «long tail non servite»
Scoring qualitativo preliminare: `monetizzazione` = esistenza programma vicino al topic, NON ammissione publisher; `gap SERP` = risultato di un mini campionamento via web, NON Serper live né top 10 sistematiche.
| Priorità esplorativa | Cluster long tail | Parent supportata / volume | Fit CPL noto | Risultato screening SERP e azione |
|---|---|---|---|---|
| P1 | **Sostituzione vasca/doccia per anziani**, seduta, maniglioni, spostamento scarico, bagno piccolo | Long tail **UNKNOWN** | Edilnet dichiara €6 validato per vasca→doccia; Bagni Italiani 8,50 € annunciati, approvazione/area **UNKNOWN** | Esistono guide specifiche e portali costi; **non** considerare gap provato. Serve evidenza beneficio originale, scelta prodotto e validità CPL, possibile percorso mirato nel sito Formia esistente. |
| P2 | **Caldaia da sostituire**, uscita fumi / condominio / sostituzione vs pompa calore | “quanto costa sostituire una caldaia” **500**; long tail **UNKNOWN** | “Ariel Caldaie CPL 5 €” indicato da LeadPlaza; ammissibilità SEO e copertura **UNKNOWN** | Valutare SERP specifica, fonti tecniche aggiornate e qualificazione, non generare claim normativi senza fonte. |
| P3 | **Infissi costieri**: PVC/alluminio e ferramenta anti-salsedine | “infissi pvc o alluminio” **5.000**; long tail **UNKNOWN** | Edilnet include “infissi” fra servizi ma il **payout per questa nicchia NON è attestato**; altri CPL infissi UNKNOWN | SERP contiene già articoli specializzati su salsedine e confronto PVC-alluminio. Quindi **non classificare come gap facile**; cercare un'intenzione specifica diversa o scartare. |
| P4 | **Fotovoltaico 6kW** su tetto piccolo/ombreggiato e accumulo | “quanto costa impianto fotovoltaico 6 kw” **5.000**; long tail **UNKNOWN** | Edilnet cita impianti FV ma payout esatto/lead valido **UNKNOWN** | Diversi siti con prezzo, produzione e tempi di ritorno: bisogno di uno strumento originale rigoroso e partner CPL provato. Non avviare un nuovo sito. |
| HOLD | **Impianto elettrico casa anni '70**: conformità, demolizione, preventivo per punti | “quanto costa rifare impianto elettrico” **5.000**; tail **UNKNOWN** | Edilnet categoria impianti, payout **UNKNOWN** | Presente articolo 2026 molto specifico e guida autorevole Idealista: **non gap facile**. Evitare clonazione di testo generico. |
| HOLD | **Sanatoria edilizia**, CILA/SCIA, difformità | “quanto costa una sanatoria edilizia” **500**, “differenza cila e scia” **500** | Partner CPL per servizi tecnici **non attestato** | Tema legale/tecnico dinamico e spesso dipendente dal comune: non monetizzabile in sicurezza senza fonti e programma ammesso. |

## Verifica partner e frizione *reali* (non forecast)
| Network/offerta | Evidenza pubblica | Fit publisher low-touch | Gate NON soddisfatti |
|---|---|---|---|
| [Edilnet](https://www.edilnet.it/programma-affiliazione) | €6/lead valido per casa, bagno, vasca/doccia; 90gg cookie e **nessuna soglia minima** dichiarata; altri verticali citati | **Compatibile a livello di contratto pubblicizzato** con sito editoriale e referral esterno. Funnel mobile filmato lungo e generalista: CVR UNKNOWN | Attribution test, category deep-link, lead approved/100 click, payout dopo accredito; categorie ulteriori non assumere €6 |
| [AdviceMe / LeadPlaza listino](https://www.leadplaza.it/campagneaffiliazione/) | 21/10/2026: Ristrutturazioni.com €10; Bagni Italiani €8,50; Ariel Caldaie €5; Arquati €6,50 (non classificarlo come offerta infissi senza verifica prodotto) | **DA APPROVARE**, non self-service certo: [termini generali](https://www.adviceme.it/affiliates-terms-and-conditions) parlano di publisher selezionati, ordine/approvazione, categorie email/display | **Soglia pagamento €100**, pagamento fino a 60 giorni dopo trasmissione documento contabile, accettazione traffico. SEO organico non esplicitamente approvato nel contratto visibile. Da leggere ordine specifico prima del GO |
| [PreventivoFacile](https://www.preventivofacile.it/affiliazione) | Widget HTML responsive publisher; la richiesta **inizia sul sito editore e viene completata sul sito partner**, commissione senza cifra pubblicata | Potenzialmente riduce frizione, ma uno script terzo sul proprio sito richiede controllo consent/dati e la configurazione è su richiesta | Verificare privacy widget e punto di raccolta iniziale, remunerazione, tracking, onboarding, compatibilità con divieto di trattare PII |

**Nota privacy:** il requisito owner “non trattare dati delle richieste” favorisce **solo un link outbound** a un partner che raccoglie i propri dati. Il widget di PreventivoFacile non va inserito automaticamente; potrebbe cambiare il confine dei trattamenti e delle informazioni da fornire.

## Fonti SERP controllate il 25/10/2026 (mini campionamento, nessuna pretesa top-10)
- https://costovascadoccia.it/ — calcolatore e contenuto accessibilità; concorrenza diretta vasca/doccia.
- https://prontopro.it/costi-prezzi/sostituzione-vasca-con-doccia_112529 — pubblica casi concreti, inclusi maniglioni e seduta.
- https://www.edilizia.com/guide/quanto-costa-ristrutturare-bagno-lavori-prezzi-preventivo-imprevisti/ — articolo specifico 2026 bagno.
- https://www.rginfissi.it/guida-infissi-pvc-o-alluminio — confronto con sezione clima marino.
- https://infissidema.it/infissi-casa-al-mare/ — specializzazione marina.
- https://ristrutturalo.it/rifare-impianto-elettrico-casa-anni-70-costi/ — articolo specifico ottobre 2026.
- https://www.idealista.it/news/immobiliare/residenziale/2023/09/14/175288-quanto-costa-rifare-un-impianto-elettrico-in-casa-la-guida-completa — incumbent autorevole.
- https://enera.it/blog/impianto-fotovoltaico-6-kw-costi-resa-tempi-di-rientro — guida dettagliata su impianti 6kW.

## Lo step successivo e i gate
1. PR Serper (manuale) [#5](https://github.com/soliwkr/rankempire-italia/pull/5) preparata e testata in simulazione; **non deployata**, binding presente ma accesso live non verificato. Un test Serper reale richiede percorso operator autenticato e verifica quote (non estrarre secret).
2. Per **P1 e P2 soltanto**, acquisire SERP top 10 riproducibile (query, paese, data), classificare tipo intento, diversità/autorità, lacune informative e CTA. Serve validazione semantica, non contare come volume i suggerimenti e risultati SERP.
3. Validare quale partner sia effettivamente ammesso a veicolare il traffico **SEO organico**, il supporto alla categoria, la geografia, il payout netto e soprattutto la percentuale **lead accettati/click**. Se accordo/account è assente, stato **PARTNER_UNVERIFIED**, non GO.
4. Per Formia restano [RF-02 403](RISTRUTTURAZIONI-FORMIA-DELIVERY.md) e gate legal/preview indipendenti da Serper; non riaprire il lavoro su DOI first-party.
5. Lo scoring numerico e le soglie economiche devono basarsi su dati misurati. Finché non ci sono GSC impression, click affiliati, approvazioni e compensi, la decisione è **SCOUTING, NO-GO BUILD**.
