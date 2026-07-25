# API-CREDENTIALS-PLAN.md
### Piano completo: rotazione chiavi bruciate + nuove API · 25 luglio 2026

> **Contesto:** `.dev.vars` era tracciato in git dal 28 aprile. Tutte le chiavi al suo
> interno sono da considerare compromesse. La Google SA key JSON è già stata ruotata.
> Questo piano copre: rotazione delle chiavi esistenti, aggiunta delle API mancanti
> (OVHcloud, Climbo, Google SA), e standardizzazione del posto in cui vivono.

---

## Regola unica

**Le credenziali vivono in 2 posti soli:**
1. `wrangler secret put` → produzione (Cloudflare Workers)
2. `factory-core/.dev.vars` locale → sviluppo (gitignored dal 25/07)

**Mai** in `wrangler.toml [vars]`, **mai** nel repo.

---

## A — CHIAVI DA RUOTARE (bruciate)

Queste erano in `.dev.vars` committato. Vanno rigenerate e rimesse come secret.

| # | Variabile | Servizio | Dove rigenerare | Comando deploy |
|---|---|---|---|---|
| 1 | `RESEND_API_KEY` | Email DOI (email.ts → leads.ts) | [resend.com/api-keys](https://resend.com/api-keys) | `wrangler secret put RESEND_API_KEY --name factory-core` |
| 2 | `CF_API_TOKEN` | Cloudflare API (Pages, DNS, Workers) | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) | `wrangler secret put CF_API_TOKEN --name factory-core` |
| 3 | `GOOGLE_AI_API_KEY` | Gemini Flash content gen (ai.ts) | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | `wrangler secret put GOOGLE_AI_API_KEY --name factory-core` |
| 4 | `GITHUB_TOKEN` | Crea repo da template (github.ts) | [github.com/settings/tokens](https://github.com/settings/tokens) — fine-grained, scope: repo (StudioPuraLuce/astro-rank-rent) | `wrangler secret put GITHUB_TOKEN --name factory-core` |
| 5 | `API_SECRET` | Bearer auth endpoint admin | `openssl rand -hex 32` | `wrangler secret put API_SECRET --name factory-core` |
| 6 | `TELEGRAM_BOT_TOKEN` | Notifiche lead (telegram.ts) | @BotFather → /revoke poi /newbot o /token | `wrangler secret put TELEGRAM_BOT_TOKEN --name factory-core` |

### Alias da unificare

Il codice usa sia `CF_API_TOKEN` che `CLOUDFLARE_API_TOKEN`, e sia `GOOGLE_AI_API_KEY` che
`GOOGLE_API_KEY`. In `.dev.vars` vanno messi entrambi i nomi con lo stesso valore, oppure
meglio: refactorare il codice per usare un solo nome per ciascuno. Da decidere.

---

## B — CHIAVI DA REVOCARE (codice morto)

Non usate nel codice di produzione. Revocarle e non ricrearle.

| Variabile | Era per | Azione |
|---|---|---|
| `DEEPGRAM_API_KEY` | Trascrizione chiamate (mai implementato) | Revocare su deepgram.com |
| `SERPER_API_KEY` | Ricerca keyword (solo test mock) | Revocare su serper.dev |
| `OPENROUTER_API_KEY` | Router multi-LLM (mai implementato) | Revocare su openrouter.ai |
| `CF_AI_GATEWAY_TOKEN` | Gateway Cloudflare (commentato) | Rigenerare SOLO se si decide di attivare il gateway (vedi sezione D) |

---

## C — NUOVE API DA AGGIUNGERE

### C1. Google Service Account (GSC + GA4)

**Cosa fa:** aggiunge sito a Search Console, crea property GA4 con Measurement ID.
Già implementato in `google-tracking.ts`, chiamato da `projects.ts` riga 245.

**Variabili necessarie:**

| Variabile | Valore | Tipo |
|---|---|---|
| `GOOGLE_CLIENT_EMAIL` | `xxx@soliwkr.iam.gserviceaccount.com` | Secret |
| `GOOGLE_PRIVATE_KEY` | chiave RSA dal JSON scaricato | Secret |
| `GA4_ACCOUNT_ID` | `accounts/XXXXXXXXX` (dal tuo GA4) | Secret o var |

**Come ottenere:**
1. [console.cloud.google.com](https://console.cloud.google.com) → IAM → Service Accounts
2. Crea nuovo SA (o usa uno esistente) con ruoli:
   - Search Console → `webmasters.sites.verify` (Owner del sito)
   - Analytics Admin → `analyticsadmin.googleapis.com` (Editor)
3. Crea chiave JSON → estrai `client_email` e `private_key`
4. `wrangler secret put GOOGLE_CLIENT_EMAIL --name factory-core`
5. `wrangler secret put GOOGLE_PRIVATE_KEY --name factory-core`
6. `wrangler secret put GA4_ACCOUNT_ID --name factory-core`

**Nota:** non serve più il file `.json` intero — il codice accetta email + key separati.

### C2. OVHcloud (registrazione domini)

**Cosa fa:** registra domini `.it` programmaticamente per i siti rank-and-rent.
NON implementato nel codice — va scritto `src/services/ovhcloud.ts`.

**Variabili necessarie:**

| Variabile | Valore | Tipo |
|---|---|---|
| `OVH_APP_KEY` | Application Key | Secret |
| `OVH_APP_SECRET` | Application Secret | Secret |
| `OVH_CONSUMER_KEY` | Consumer Key (con grant sui domini) | Secret |
| `OVH_ENDPOINT` | `ovh-eu` | Var (wrangler.toml) |

**Come ottenere:**
1. [api.ovh.com/createApp](https://api.ovh.com/createApp/) → crea app, ricevi AK + AS
2. Richiedi Consumer Key con diritti `GET/POST/PUT /domain/*`, `GET/POST /order/*`
3. Valida il CK seguendo il link di conferma
4. `wrangler secret put OVH_APP_KEY --name factory-core`
5. `wrangler secret put OVH_APP_SECRET --name factory-core`
6. `wrangler secret put OVH_CONSUMER_KEY --name factory-core`

**Endpoint principali da usare:**
- `POST /order/cart` → crea carrello
- `POST /order/cart/{id}/domain` → aggiunge dominio al carrello
- `POST /order/cart/{id}/checkout` → compra
- `GET /domain/{domain}` → stato del dominio
- `POST /domain/zone/{zone}/record` → DNS record (ma noi usiamo CF nameservers)

**Flusso probabile:**
```
OVHcloud registra il dominio → cambia nameservers a Cloudflare →
  factory-core crea Pages project + CNAME via CF API (già implementato)
```

### C3. Climbo (consegna lead + reputazione)

**Cosa fa:** crea location per sito, inietta lead verificati, consegna al tenant.
NON implementato — va scritto `src/services/climbo.ts` (vedi CLIMBO-INTEGRATION.md §6).

**Variabili necessarie:**

| Variabile | Valore | Tipo |
|---|---|---|
| `CLIMBO_API_KEY` | API token dal pannello Climbo | Secret |

**Come ottenere:**
1. Dashboard Climbo → Settings → API → genera token
2. `wrangler secret put CLIMBO_API_KEY --name factory-core`

**Endpoint principali (da doc.climbo.com/llms.txt):**
- `POST /locations` → crea location (= un sito RR)
- `POST /locations/{id}/contacts` → crea contatto (= lead verificato)
- `PUT /locations/{id}/contacts/{cid}` → aggiorna con leadId D1
- `POST /locations/{id}/campaigns` → campagna consegna al tenant

---

## D — STATO AI GATEWAY

| Fatto | Dettaglio |
|---|---|
| Gateway configurato? | Sì: `CF_AI_GATEWAY_NAME = "rank-rent-factory"` in wrangler.toml vars |
| Codice supporta gateway? | Sì: `ai.ts` + `batch-generator.ts` hanno dual-path (gateway se token presente, diretto altrimenti) |
| Gateway attivo in prod? | **Probabilmente no** — `CF_AI_GATEWAY_TOKEN` era commentato nel `.dev.vars` e quasi certamente non è settato come secret |
| Quali chiamate passano? | Solo Google Gemini Flash (content generation). Nessun altro provider usa il gateway |
| Valore del gateway | Logging, rate limiting, caching, fallback. Ha senso attivarlo quando il volume di generazione cresce |

**Per attivare:** rigenerare il token CF AI Gateway e `wrangler secret put CF_AI_GATEWAY_TOKEN --name factory-core`. Zero modifiche al codice.

---

## E — RIEPILOGO: stato finale dopo rotazione

### Secrets (wrangler secret put)

| Variabile | Stato |
|---|---|
| `RESEND_API_KEY` | 🔄 da ruotare |
| `CF_API_TOKEN` | 🔄 da ruotare |
| `CLOUDFLARE_API_TOKEN` | 🔄 da ruotare (alias) |
| `CF_ACCOUNT_ID` | ➡️ spostare in [vars] (non è un segreto) |
| `CLOUDFLARE_ACCOUNT_ID` | ➡️ spostare in [vars] (alias, non è un segreto) |
| `GOOGLE_AI_API_KEY` | 🔄 da ruotare |
| `GOOGLE_API_KEY` | 🔄 da ruotare (alias) |
| `GITHUB_TOKEN` | 🔄 da ruotare |
| `API_SECRET` | 🔄 da ruotare |
| `TELEGRAM_BOT_TOKEN` | 🔄 da ruotare |
| `GOOGLE_CLIENT_EMAIL` | 🆕 nuovo |
| `GOOGLE_PRIVATE_KEY` | 🆕 nuovo |
| `GA4_ACCOUNT_ID` | 🆕 nuovo |
| `OVH_APP_KEY` | 🆕 nuovo |
| `OVH_APP_SECRET` | 🆕 nuovo |
| `OVH_CONSUMER_KEY` | 🆕 nuovo |
| `CLIMBO_API_KEY` | 🆕 nuovo |
| `CF_AI_GATEWAY_TOKEN` | ⏸ opzionale (attivare dopo) |

### Vars (wrangler.toml [vars]) — non segrete

| Variabile | Valore |
|---|---|
| `CF_ACCOUNT_ID` | `60496826f56a093a72602bfae074fdcf` |
| `CLOUDFLARE_ACCOUNT_ID` | idem (alias) |
| `CF_AI_GATEWAY_NAME` | `rank-rent-factory` |
| `GITHUB_TEMPLATE_OWNER` | `StudioPuraLuce` |
| `GITHUB_TEMPLATE_REPO` | `astro-rank-rent` |
| `EMAIL_FROM` | `Rankame <noreply@rankame.com>` |
| `VERIFICATION_BASE_URL` | `https://factory-core.soliwkr.workers.dev/verify` |
| `FACTORY_API_URL` | `https://factory-core.soliwkr.workers.dev` |
| `TELEGRAM_CHAT_ID` | `-1002334812822` |
| `OVH_ENDPOINT` | `ovh-eu` |

---

## F — SEQUENZA OPERATIVA (domani)

```
1. Rigenera le 6 chiavi bruciate sui rispettivi dashboard (sezione A)
2. Per ciascuna: wrangler secret put + aggiorna .dev.vars locale
3. Revoca le 3 chiavi di codice morto (sezione B)
4. Crea Google Service Account + wrangler secret put (sezione C1)
5. Crea app OVHcloud API + wrangler secret put (sezione C2)
6. Genera Climbo API token + wrangler secret put (sezione C3)
7. Sposta CF_ACCOUNT_ID e CLOUDFLARE_ACCOUNT_ID in wrangler.toml [vars]
8. Verifica: wrangler secret list --name factory-core
9. Test: curl endpoint factory-core per verificare che i secret funzionino
```

Tempo stimato: ~30 minuti se hai già accesso a tutti i dashboard.
