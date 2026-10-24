# Ristrutturazioni Formia — primo pilota della rete nazionale CPL (RF-DELIVERY)
**Data:** 2026-10-24  
**Owner del prodotto:** Chris / Internet Marketing Secrets (identità fiscale da riconfermare prima della pubblicazione)  
**Direzione operativa:** SOLIWKR Operator & Portfolio AIOS (CEO PaperClip); **repo proprietario:** `soliwkr/rankempire-italia`  
**Issue unica di delivery:** [SOL-43 — RF-DELIVERY](https://hq.soliwkr.pro/SOL/issues/SOL-43), assegnata al CEO SOLIWKR. Stato operativo e aggiornamenti vivono solo in questa issue.
**Coda canonica di lavoro:** PaperClipHQ / SOLIWKR Pro, progetti già esistenti «SOLIWKR — Operazioni di portafoglio» e «RankEmpire Italia». **Questa pagina è la specifica di delivery, NON una seconda coda di task**. Ogni attività viva ha un solo task PaperClip; il task punta alla sezione/ID RF qui sotto. Evitare issue duplicate e copie dello stato.  
**WIP operativo:** 1 sito in consegna alla volta. **La strategia target è una rete di molti siti CPL in tutta Italia**, non un business limitato a Formia. Il gate di scala è una prova economica CPL, non un contratto con un’impresa/renter. La strategia prevalente vive in [CPL-NETWORK-ITALIA.md](CPL-NETWORK-ITALIA.md).

## Missione e limiti
Validare **ristrutturazioniformia.it** come **primo sito-test** di un network nazionale CPL: portale indipendente e credibile, con contenuti utili e rinvio trasparente a **un programma CPL idoneo**, non necessariamente Edilnet. Il **partner raccoglie i contatti nel proprio form, verifica il lead, assiste il cliente e gestisce il servizio**; il publisher non acquisisce, inoltra, qualifica né tratta i dati personali delle richieste. Il sito resta responsabile della propria privacy/analytics/disclosure. Misura del pilota: sito di qualità, outbound attribuibili, e **lead validi approvati e remunerati dal partner**; non basta il deploy. Un €6 CPL Edilnet è solo una possibile baseline, da verificare.

**Fuori scope nel ciclo esecutivo attuale:** deploy di nuovi domini, generazione massiva di city pages, infrastrutture/automazioni agentiche aggiuntive, VPS, spese/ads, chiamate e outreach a imprese, attività da CRM/lead broker diretto, interventi a eSIM o Trovatemi, mutazioni a servizi condivisi, pubblicazione automatica. **L’ideazione e la futura rete nazionale sono invece IN SCOPE strategico** nella specifica CPL; ogni nuovo sito richiederà propria verifica di intent, partner e gate.

## Stato e evidenze da cui ripartire (verifiche puntuali)
- Repo `soliwkr/rankempire-italia` branch `preview/ristrutturazioni-formia-v03` con package sito in `sites/ristrutturazioni-formia-v02/`: 10 pagine, sorgenti, test, proposte consent/GTM/GA4. La v0.3 **non risulta pubblicata**; 403 upload asset riportato al 23/10. Nessun assunto di successo live.
- Preview **v0.2** storica: `https://rf-editorial-v02.ristrutturazioni-formia.pages.dev/`, da ricontrollare HTTP/robots prima di citarla come live. Dominio produzione `https://ristrutturazioniformia.it/`: NON toccare fino a gate RF-09.
- Keyword Planner in `strategia/keyword/sud-pontino/`: brief 2.155 keyword, 424 ristrutturazioni, export 24/07/2026. Solo 5 keyword ristrutturazioni con volume indicato; **vuoto non equivale a zero**. Evitare 424 pagine località/intent duplicati.
- Studio consenso riusabile dal repo `soliwkr/esim`: iubenda + Consent Mode Basic + GTM + GA4, tag solo post-consenso. Gli ID `GTM-W3LSK9RZ`, `G-GWJ9YPPVJW` in eSIM sono DEL SITO ESIM: **non riusarli per Formia**.
- Operatore di Search Console `rankempire-gsc-operator` dispone di 2 secret e project ID `soliwkr`; **l'autenticazione reale a Search Console non è stata certificata**; endpoint non pubblici. Evitare di copiare credenziali in repo/ticket.
- Da `soliwkr/thesprint-uk` si ricava operatore «Internet Marketing Secrets» P.IVA IT02996460594. Verificare titolarità/dati legali per questo sito prima del lancio; non fingere che portale sia impresa edile.
- Il vecchio starter è stato descritto con brand EdilPro, false garanzie, numeri placeholder, testimonianze/social proof simulate; inventario URL e correzioni obbligatorie.
- PaperClip esistente `SOL-34` (W1 DOI del precedente modello **form first-party**) ha segnalato **FAIL statico** fra `/verify` e `/api/leads/verify`. **Non è un gate per il referral CPL senza raccolta lead propria**: registrare il debito della factory legacy, senza dedicarvi lavoro nel pilota publisher né ripetere audit.
- Partner da confrontare: Edilnet e programmi CPL compatibili con le nicchie, le località e il traffico SEO nazionale; **nessun account publisher o payout alternativo è qui considerato approvato**. Link Edilnet ancora in attesa; niente dipendenza da un partner unico. Il funnel video Edilnet del 24/10 mostra ri-selezione categoria e form lungo: CVR/lead-validi ancora UNKNOWN.

## Sequenza di consegna — ID stabili per le evidenze (NON attività duplicate)
| ID | Lavoro verificabile | Gate / prova di uscita | Responsabile |
|---|---|---|---|
| RF-01 | Ricostruire AS-IS: branch/commit, Pages, URL pubblico, robots/noindex, permessi deploy, documentazione e rollback | Matrice con prove e SHA; distinguere preview da produzione | CTO |
| RF-02 | Ripristinare **solo preview** v0.3, diagnosticare 403 e usare percorso GitHub/Wrangler autorizzato | URL preview HTTP 200 navigabile, 10 pagine, noindex header/meta, produzione immutata, deployment ID | CTO → QA |
| RF-03 | Mappare URL già indicizzati, query GSC e redirect; testare API Search Console senza esporre operator o secret | Inventario URL attuali/nuovi, piano 301 e report API PASS/FAIL/UNKNOWN | CTO |
| RF-04 | Riscrivere copy editoriale e commerciale di home, casa, bagno, vasca-doccia, costi, preventivi, metodo, trasparenza | Ogni claim con fonte/data/qualifica; guide realmente utili; prezzi solo come stime motivate; NO testi falsi, NO doorway | Editor / CEO |
| RF-05 | Rifinire design e QA mobile/accessibilità/performance, fotografie lecite e verificabili | Verifica screenshot desktop+mobile, tastiera, navigazione, Core Web Vitals/lighthouse con valori misurati | CTO → QA |
| RF-06 | Privacy/cookie/identità: usare impostazione eSIM ma CMP/contratto per DOMINIO Formia, revisione legale di Internet Marketing Secrets | Test banner (accetta/rifiuta/personalizza/revoca), footer gestione preferenze; privacy e titolare verificati | CTO → owner |
| RF-07 | GTM/GA4 della proprietà Formia, isolati da eSIM; eventi page_view e intent affiliate senza PII | Prima consenso 0 richieste Google, dopo consenso 1 page_view per load, revoca funzionante, DebugView e network proof; preview senza dati live | CTO → QA |
| RF-08 | **Partner CPL modulari**: confrontare network disponibili (Edilnet come benchmark), ammissibilità SEO/geo, deep-link, mobile, payout valido, attribuzione e disclosure; raccolta dati **solo partner** | Link referral autorizzato, criteri lead valido/payout/storni documentati, click provato senza lead fittizio, zero moduli/PII proprietari | CEO → CTO |
| RF-09 | Go-live controllato, solo con approvazione ESPRESSA owner e QA indipendente | Diff preview-prod, backup/rollback, URL redirect, SEO/indexability, privacy, analytics, link affiliato, test 200/301; approvazione registrata | Owner → Release/QA |
| RF-10 | Misurare e decidere: 7/14 giorni GSC, GA4, outbound per partner e conversioni approvate | Evidenze di query/impression/click, lead **validati e remunerati** (UNKNOWN finché partner non conferma), calcolo RPM/margine, go/no-go alla **prossima long tail nazionale** | CEO / Owner |

## Ordine di esecuzione e criteri
- **Una sola attività in corso**: prima RF-01, quindi RF-02; RF-03..08 vengono affrontate sequenzialmente o in mini-PR su branch isolati, RF-09 solo dopo approvazione. Non avviare RF-10 prima della produzione.
- Uno step è `done` solo con **prova primaria** (SHA/PR, Cloudflare deployment ID, HTTP/browser audit, GA4 DebugView, Edilnet report), non per testo dichiarativo o anteprima locale.
- `blocked` se manca un partner CPL realmente accessibile/attribuibile, consenso, autorizzazione permessi, documentazione legale o reale accesso API. In questi casi confrontare soluzioni affiliate standard; non contattare imprese e non inventare successi.
- CEO SOLIWKR coordina e mantiene il SOLO task canonico PaperClip; CTO esegue sviluppo autorizzato; Staff/QA verificano indipendentemente; Release interviene soltanto al gate dell'owner. Nessun agente può ampliare il mandato, autoapprovare lanci, creare subtask automatici, negoziare con imprese o gestire i lead.
- Nessun contenuto copia-incolla da altri domini. `soliwkr/esim` è reference tecnica, non stream di analytics condiviso. `soliwkr/Soliwkr` è portfolio router, non copia questo piano.
- Rispettare `AGENTS.md` di SOLIWKR e il canon del progetto; `.planning/STATE.md` e ROADMAP factory del luglio 2026 sono **snapshot legacy**, non sostituiscono lo stato corrente di Ristrutturazioni Formia. Evitare modifiche opportunistiche fuori scope.

## Prima consegna attesa da SOLIWKR CEO
Una nota di handoff nella **stessa issue PaperClip**: commit/branch sorgente, check dei blocchi reali, RF-01 PASS/FAIL con evidenza, prossima singola azione RF-02 o blocker; no deleghe automatiche, deploy o costi extra. Ritorno qui per feedback/approvazioni mirate, non nuovo planning in chat.

## Link fondamentali
- [GitHub — RankEmpire](https://github.com/soliwkr/rankempire-italia)
- [Sorgenti preview v0.3](https://github.com/soliwkr/rankempire-italia/tree/preview/ristrutturazioni-formia-v03/sites/ristrutturazioni-formia-v02)
- [GitHub — SOLIWKR AIOS](https://github.com/soliwkr/Soliwkr)
- [PaperClip — progetti e coda](https://hq.soliwkr.pro)
- [Modello nazionale CPL: long tail → sito → partner](CPL-NETWORK-ITALIA.md)
- [Audit DOI legacy SOL-34](https://hq.soliwkr.pro/SOL/issues/SOL-34)
