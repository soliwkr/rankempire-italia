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

## Riscontro tecnico del 25/10/2026 — gate RF-02
- Secondo la documentazione ufficiale Cloudflare Pages, un progetto **Direct Upload non è convertibile in Git integration**. Il progetto `ristrutturazioni-formia` ha `source=null` nell'API ed è gestito come Direct Upload; quindi **un push GitHub non è un deploy automatico**. Il mezzo raccomandato è Wrangler `pages deploy <directory> --project-name=ristrutturazioni-formia --branch=rf-editorial-v03` con credenziale valida e permesso **Account → Cloudflare Pages → Edit (Pages Write)**, oppure il normale caricamento dashboard con sessione autorizzata. Non creare progetti alternativi per risolvere un problema di permessi.
- Errore precedente caricamento asset **403**, causa precisa ancora **UNKNOWN** (nessuna evidenza sulla lista di permessi della credenziale usata al momento dell'errore); acquisire log sanitizzato di quel tentativo e dimostrare il permesso `Pages Write` prima di un retry. Niente upload alla produzione o con credenziali copiate nella coda.
- [Direct Upload — Cloudflare](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [Cloudflare Pages API: Create deployment, accepted Pages Write](https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/create/) · [CI/Wrangler: token Pages Edit](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).
- Lo scouting **nazionale** di nicchie e affiliate è documentato in [CPL-SCOUTING-001.md](CPL-SCOUTING-001.md). Non dipende dal 403 ma non autorizza un secondo workstream di deploy.

## Decisione architetturale più recente — 25 ottobre 2026: **Repo + Worker, non riparare Pages**
**Owner ha cambiato il percorso di deployment.** La causa storica del 403 Pages può restare documentata, ma **non è più un gate da risolvere**. Non creare un nuovo progetto Pages né tentare retry del caricamento Pages; tenere la vecchia produzione come rollback, senza eliminarla o spostare domini.

La prima migrazione tecnica si trova nella [PR #6 — Workers Static Assets](https://github.com/soliwkr/rankempire-italia/pull/6) su branch `migration/rf-worker-20261025`, derivata dalla v0.3. Contiene `wrangler.jsonc`, Worker con `ASSETS` e X-Robots-Tag `noindex`, test eseguibili e un contratto di passaggio; **6/6 test del sorgente del branch superati tramite harness**. L'obiettivo è un Worker `ristrutturazioni-formia-web` con [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) collegato al repo GitHub e root `sites/ristrutturazioni-formia-v02` (cartella storica che contiene v0.3).

**Nuovo RF-02 e next step:** verificare connessione GitHub ↔ Workers Builds esistente, token di build con scope corretto e associare Worker al branch approvato; eseguire build e deploy isolato sul solo `workers.dev`, senza custom domain; verificare `/_health`, 10 pagine, 404, `noindex`, mobile e simulatore. Non dare per completato finché mancano URL Worker e deployment ID. Il connettore GitHub corrente non consente di creare un nuovo repository: staging nel repository RankEmpire, **repo dedicato per ogni sito resta decisione tecnica di scala**, da eseguire senza spezzare la storia o creare duplicazioni.

**Solo dopo QA** preparare release indicizzabile, mappa redirect URL e passaggio dominio autorizzato; nessun cambio al vecchio Pages di produzione senza gate e rollback documentato. I vecchi riferimenti a RF-02 Pages 403 sono storici e **superati da questa decisione**.

## CORREZIONE owner — 25/10/2026: **un repository Astro indipendente PER sito**
Prevale su qualsiasi istruzione precedente di usare `soliwkr/rankempire-italia` come repository del Worker. **RankEmpire = factory di ricerca/scoring/template/provisioning; non host dei siti.** Ogni nuovo sito CPL ha repository GitHub Astro dedicato, Worker dedicato, dominio e analytics dedicati. Per Formia: nome proposto `soliwkr/ristrutturazioniformia`, ancora **NON CREATO**; Worker `ristrutturazioni-formia-web` già creato e **NON DEPLOYATO**. Non collegarlo a branch della factory, neanche come workaround.

Evidenze: `CLAUDE.md` originale definisce «I siti restano repo separati» e `astro-rank-rent` come template; `.planning/phases/02-astro-template-completion/02-VERIFICATION.md` attesta il precedente `rankame/templates/astro-base`. **Template ufficiale ORA VERIFICATO:** il Worker `factory-core` espone `GITHUB_TEMPLATE_OWNER=StudioPuraLuce` e `GITHUB_TEMPLATE_REPO=astro-rank-rent`; [StudioPuraLuce/astro-rank-rent](https://github.com/StudioPuraLuce/astro-rank-rent) è un repository GitHub `is_template=true`, Astro ^6.1.8, accessibile. L'owner `soliwkr` nei vecchi tentativi era errato; `rankame` nel repo factory resta un gitlink legacy senza `.gitmodules` completa. Il template storico rank-and-rent va adattato al publisher CPL (no form proprio/PII, no LocalBusiness fittizio, no service×zone doorway).

**RF-02 corretto:** partire dal template Astro ufficiale StudioPuraLuce verificato, adattarlo al CPL, creare la repo singola del sito, trasferirvi v0.3 e le 10 pagine senza perdere contenuti, impostare build Astro→Static Assets `dist/` e collegare **solo questa repo** via Workers Builds al Worker Formia già creato. Poi build, workers.dev, 10 pagine, QA, noindex. La PR [#6](https://github.com/soliwkr/rankempire-italia/pull/6) è **snapshot di migrazione da esportare**, NON base per la connessione Git definitiva. Riparare Pages 403 resta fuori scope. Il gate produzione/DNS rimane fermo.

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
| RF-02 | **Repo Astro dedicata a Formia** dal template verificato/adattato al CPL, migrare v0.3, poi Worker Static Assets via GitHub Builds della repo **di sito** | Repo dedicata + commit, build Astro in dist, URL Worker + deployment ID, 10 pagine e 404, noindex e QA; produzione invariata | CTO → QA |
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
- `blocked` se manca l'autorizzazione Workers Builds/GitHub, un partner CPL realmente accessibile/attribuibile, consenso, documentazione legale o reale accesso API. In questi casi confrontare soluzioni affiliate standard; non contattare imprese e non inventare successi.
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
