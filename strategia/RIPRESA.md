# RIPRESA.md — Rank Empire Italia
### Documento di ripresa · ricognizione 23 luglio 2026
### Sostituisce FACTORY.md (che era tarato sui worker di aprile, versione superata)

---

## ⚠️ 0. PRIMA DI TUTTO — SICUREZZA CREDENZIALI (oggi, non domani)

Il file `.planning/codebase/CONCERNS.md` (analisi del 24/04) segnala **credenziali in chiaro
committate nel repository**:

- `client-mgc-reparation/gcloud-key.json` — service account key GCP (2.4 KB)
- `client-mgc-reparation/client_secret.json` — OAuth client secret
- `client-mgc-reparation/gmb_token.json` — refresh token Google My Business
- `firebase-applet-config.json` — config Firebase con API key
- `.env.example` — contiene identificatori reali del service account

**I repo sono stati resi pubblici il 23/07/2026.** Anche rimettendoli privati, le credenziali
restano nella storia git e potrebbero essere state indicizzate/clonate.

**Azioni, in quest'ordine:**
1. **Rimetti privati i repo** (`rankempire-italia`, `telegram-ranketogram`, `rank-rent-factory`).
2. **Ruota TUTTE le credenziali GCP esposte**: service account key, OAuth client secret,
   token GMB. Da console Google Cloud → elimina la chiave vecchia, generane una nuova.
3. **Restringi la API key Firebase** per dominio in Firebase Console.
4. Aggiungi a `.gitignore`: `**/gcloud-key.json`, `**/client_secret.json`, `**/gmb_token.json`,
   `firebase-applet-config.json`.
5. Sostituisci i valori reali in `.env.example` con segnaposto generici.
6. (Opzionale ma consigliato) purga la storia con `git filter-repo` per quei path.

> Non è teoria: una service account key GCP in un repo pubblico viene trovata da bot
> automatici in ore, e può essere usata per far girare risorse a tuo carico.

---

## 1. Cosa è successo davvero (dal tuo stesso forensics)

`.planning/forensics/report-20260428-110816.md`, scritto da te il 28 aprile:

Il progetto **non è deragliato per un errore di progettazione**. È deragliato per un
conflitto di tooling:

- Passaggio da Claude a **Gemini CLI**; il GSD SDK ha continuato a usare Sonnet ignorando
  `config.json` (*model lock-in*, confidence HIGH) → rate limit a raffica.
- **Desync ROADMAP/disco**: ROADMAP diceva "Phase 3 non iniziata" mentre su disco era completa.
- **Residui di 4 tooling** (`.claude/`, `.gemini/`, `.agent/`, `.opencode/` — ~362 file ciascuno,
  quasi identici) con hook e state tracker in conflitto.
- Recovery automatico fallito → `git reset --hard` manuale.

**Traduzione:** ti si è rotto il trapano a metà lavoro. Il sistema che stavi costruendo è sano.

## 2. Dove sei davvero: 40%, ma il 40% difficile

| Fase | Cosa | Stato |
|---|---|---|
| 1 — Factory-Core Foundation | auth, schema D1, env config | ✅ 25/04 |
| 2 — Astro Template | routing completo, schema.org, sitemap, D1 fetch | ✅ 25/04 |
| 3 — AI Content Generation | **105 pagine** programmatiche, copywriting avatar-based | ✅ 26/04 |
| 4 — Deploy Pipeline | repo GitHub + CF Pages + config injection, state machine, idempotenza | ✅ 27/04 |
| **5 — Custom Domain Go-Live** | **dominio custom su ogni sito** | ⏸ **FERMO QUI** |
| 6 — Lead Capture | DOI GDPR, D1, Resend, avatar tagging, Telegram | ⏸ |
| 7 — SEO & Tracking | GA4 auto, **GSC verify + sitemap auto**, SERP cron | ⏸ |
| 8 — Proof Package | ghost lead → PDF di prova → trigger outreach | ⏸ |
| 9-10 — Dashboard | progetti, Kanban, KPI, wizard UI | ⏸ |

18 piani su 18 eseguiti. Ogni fase ha PLAN, CONTEXT, SUMMARY, VERIFICATION.

**Le 6 fasi mancanti sono, nell'ordine esatto, la monetizzazione:**
dominio → lead → tracking → prova → outreach → gestione.
Ti sei fermato sulla soglia, con il piano per attraversarla già scritto.

## 3. Ordine di ripresa

### 3.1 Disintossicazione tooling (prima di qualsiasi codice)
Finché 4 sistemi di agenti convivono nella stessa cartella, il deragliamento si ripete.
- **Scegli UN tooling: Claude Code.** È dove lavori davvero.
- Rimuovi `.gemini/`, `.agent/`, `.opencode/` (sono ~362 file quasi identici a `.claude/`).
  Fai un branch di backup prima, se ti dà ansia.
- Risincronizza `ROADMAP.md` con lo stato reale su disco (Phase 3 e 4 sono complete).
- Pulisci le cartelle spazzatura: `grezzo-poi-cancella/`, `temp-debug/`, `temp-template/`,
  `.planning-backup/`, `.planning.restart.bak/`.

### 3.2 Phase 5 — Custom Domain Go-Live
È il punto di ripartenza previsto dalla roadmap **ed è esattamente ciò che ti serve ora**:
il dominio che stai comprando per autospurghi.
- `factory-core/src/services/cloudflare-dns.ts` esiste già.
- Obiettivo: da `*.pages.dev` a dominio proprio, automatizzato.
- Manca `05-CONTEXT.md`/`05-PLAN.md` completi: vanno generati prima di eseguire.

### 3.3 Phase 6 — Lead Capture
`factory-db.leads` ha **0 righe**. Nessun sito ha mai catturato un lead.
Principio invariante: **scrivi su D1 PRIMA di qualsiasi inoltro** (email/Telegram).
Il contatore lead è ciò che si vende all'inquilino: se un lead si perde, si perde la prova.

### 3.4 Phase 7 — SEO & Tracking
`gsc_site_url` è NULL su tutti i progetti: **nessun sito è mai stato collegato a Search Console.**
È il motivo per cui 52 pagine buone di autospurghi non hanno prodotto nulla da aprile.
Nota: GA4 automatico è previsto dalla roadmap, ma per il portale immobiliare abbiamo deciso
GSC + CF Web Analytics senza GA4 (niente cookie banner). Valuta se la stessa scelta vale qui.

## 4. Correzioni di sicurezza già identificate (CONCERNS.md)

Da chiudere prima di esporre la factory in produzione:
- **Nessuna auth su factory-core**: `/api/projects`, `/api/leads`, `/api/generate` pubblici →
  chiunque può creare repo, generare contenuti AI, deployare. (Phase 1 ha aggiunto bearerAuth:
  **verificare che sia effettivamente attivo su tutte le route** nella versione deployata.)
- **SSRF su `/api/scrape-site`**: accetta URL arbitrari senza allowlist né auth.
- **Firestore `leads`: `allow create: if true`** — scritture pubbliche non vincolate.
- **`project_id` non validato** sull'inserimento lead.

## 5. Mappa dei repo (aggiornata 23/07)

| Repo | Cosa | Note |
|---|---|---|
| `soliwkr/rankempire-italia` | **IL PROGETTO BUONO** — factory-core completo + .planning | riprendere da qui |
| `StudioPuraLuce/astro-rank-rent` | template ufficiale (ha `src/lib/slug.ts`) | agg. 10/07 |
| `StudioPuraLuce/rr-autospurghi-formia` | sito live-ish, 52 pagine | **manca `slug.ts`** |
| `StudioPuraLuce/telegram-ranketogram` | bot Telegram (aprile) | superato da rankempire |
| `StudioPuraLuce/rank-rent-factory` | factory-core (aprile) | superato da rankempire |
| `rr-smoke-test-final`, `rr-test-deploy-smoke` | siti di test (fabbro MI, idraulico FO) | archiviabili |

**Worker in produzione oggi:** `factory-core`, `rank-rent-bot-chris` (versione aprile).
`rank-rent-market-intel` **non esiste più** → comando `/intel` del bot è rotto.

## 6. Il vincolo, di nuovo

7 sistemi rank-and-rent in 5 mesi. **0 lead. 0 renters. 0 clienti fatturati.**
Le fasi che mancano non sono di costruzione: sono di monetizzazione. La più remunerativa
non richiede codice — è la telefonata all'autospurghista di Formia mentre il sito va live.

Ordine consigliato: sicurezza credenziali → pulizia tooling → Phase 5 (dominio) →
telefonata in parallelo → Phase 6 (lead) → Phase 7 (GSC).
