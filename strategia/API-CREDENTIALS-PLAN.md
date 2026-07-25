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
Oggi i domini si comprano a mano — questo servizio automatizza il flusso.
NON implementato nel codice — va scritto `src/services/ovh-domains.ts`.

**Dove si innesta:** nel flusso "assegna dominio" di `projects.ts`, PRIMA della
creazione CNAME su Cloudflare. Il servizio nuovo si inserisce così:

```
POST /api/projects/:id/domain  { customDomain: "ristrutturazioniformia.it" }
  → [NUOVO] OvhDomainsService.registerDomain(domain)     ← compra il dominio
  → [NUOVO] OvhDomainsService.setNameservers(domain, CF)  ← punta a Cloudflare NS
  → [ESISTENTE] CloudflareDNSService.createCnameRecord()  ← crea CNAME
  → [ESISTENTE] CloudflarePagesService.addDomain()         ← collega a Pages
  → [ESISTENTE] GoogleTrackingService.addSiteToGSC()       ← registra su GSC
```

**Variabili necessarie:**

| Variabile | Valore | Tipo |
|---|---|---|
| `OVH_APP_KEY` | Application Key | Secret |
| `OVH_APP_SECRET` | Application Secret | Secret |
| `OVH_CONSUMER_KEY` | Consumer Key (con grant sui domini) | Secret |

**Autenticazione OVH:** le 3 credenziali servono tutte. Ogni richiesta API è firmata
con un hash HMAC di `APP_SECRET + CONSUMER_KEY + method + URL + body + timestamp`.
Il Consumer Key è legato ai permessi (ACL) concessi al momento della creazione.

**Come ottenere:**
1. [api.ovh.com/createApp](https://api.ovh.com/createApp/) → crea app, ricevi AK + AS
2. Richiedi Consumer Key con questi ACL:
   ```
   GET    /domain/*
   POST   /domain/*
   PUT    /domain/*
   GET    /order/cart/*
   POST   /order/cart
   POST   /order/cart/*
   DELETE /order/cart/*
   ```
3. Valida il CK seguendo il link di conferma OVH
4. `wrangler secret put OVH_APP_KEY --name factory-core`
5. `wrangler secret put OVH_APP_SECRET --name factory-core`
6. `wrangler secret put OVH_CONSUMER_KEY --name factory-core`

**Base URL API:** `https://eu.api.ovh.com/1.0`

**Endpoint da implementare in `ovh-domains.ts`:**

| Operazione | Metodo | Endpoint | Note |
|---|---|---|---|
| Crea carrello | `POST` | `/order/cart` | Nessuna auth richiesta |
| Verifica disponibilità dominio | `GET` | `/order/cart/{cartId}/domain?domain=xxx` | Ritorna prezzi e disponibilità |
| Aggiungi dominio al carrello | `POST` | `/order/cart/{cartId}/domain` | Body: `GenericDomainCreation` |
| Checkout (compra) | `POST` | `/order/cart/{cartId}/checkout` | Crea l'ordine e addebita |
| Stato dominio | `GET` | `/domain/{serviceName}` | Verifica che sia attivo |
| Lista nameserver attuali | `GET` | `/domain/{serviceName}/nameServer` | Per sapere cosa c'è |
| Aggiorna nameserver | `POST` | `/domain/{serviceName}/nameServers/update` | Punta a Cloudflare NS |

**Flusso completo nel servizio:**
```
1. POST /order/cart                          → ottieni cartId
2. GET  /order/cart/{id}/domain?domain=xxx   → verifica disponibilità
3. POST /order/cart/{id}/domain              → aggiungi al carrello
4. POST /order/cart/{id}/checkout            → compra
5. (polling) GET /domain/{domain}            → attendi che sia attivo
6. POST /domain/{domain}/nameServers/update  → punta a Cloudflare NS
   → poi passa il controllo a CloudflareDNSService (già implementato)
```

**Nota DNS:** non serve creare record nella zona OVH (`/domain/zone/*/record`)
perché i nameserver punteranno a Cloudflare, dove i DNS sono già gestiti.

### C3. Climbo (consegna lead + reputazione — Fase B)

**Cosa fa:** crea location per sito, inietta lead verificati, consegna al tenant.
NON implementato — va scritto `src/services/climbo.ts` (vedi CLIMBO-INTEGRATION.md §6).

**Regola ferma:** Climbo NON raccoglie lead. Riceve il lead **già registrato su D1**,
con leadId D1 salvato nel campo `note` del contatto. La raccolta resta solo su D1.
Ogni chiamata Climbo è in try/catch separato: se Climbo è giù, il lead resta su D1
e la notifica Telegram parte lo stesso.

**Dove si innesta:** in `src/api/leads.ts`, endpoint `/verify` (~riga 155).
Quando `doiStatus → verified`, accanto alla notifica Telegram esistente:

```
lead verified
  ├── (già presente) TelegramService.notifyLeadVerified()
  └── (nuovo, try/catch separato) ClimboService:
        1. upsertContact(locationId, lead)  → crea/trova il contatto
        2. se il progetto ha un renter → sendDeliveryCampaign()
```

E alla creazione progetto (`src/api/projects.ts`):
```
POST /api/projects
  └── (nuovo) ClimboService.createLocation(project) → salva climboLocationId su D1
```

**Variabili necessarie:**

| Variabile | Valore | Tipo |
|---|---|---|
| `CLIMBO_API_KEY` | API token dal pannello Climbo | Secret |

**Come ottenere:**
1. Dashboard Climbo → Settings → API → genera token
2. `wrangler secret put CLIMBO_API_KEY --name factory-core`

**Base URL API:** `https://api.climbo.com`
**Autenticazione:** header `x-api-key: <CLIMBO_API_KEY>`
**Modello dati:** business → location → contact. Un sito RR = una location.

**Endpoint da implementare in `climbo.ts`:**

| Operazione | Metodo | Endpoint | Note |
|---|---|---|---|
| Crea location | `POST` | `/business/{businessId}/location?location_name=xxx` | Parametro `location_name` in query (1-128 char). Nessun body. Risposta: `LocationDTO` con l'ID |
| Crea contatto/i | `POST` | `/business/{businessId}/location/{locationId}/contacts` | Body: `{ contacts: [{ first_name, last_name?, phone?, email?, service_date? }] }`. **Almeno phone O email obbligatorio.** Max 100 per batch. Risposta 201 |
| Aggiorna contatto | `PATCH` | `/business/{businessId}/location/{locationId}/contacts/{contactId}` | Per salvare il leadId D1 nel campo note |
| Crea campagna | `POST` | `/business/{businessId}/location/{locationId}/campaigns` | Body: `{ name, template_id, list, channel, scheduled_at? }`. Canali: `sms`, `email`, `whatsapp`. `list`: `"All contacts"` o `"Not contacted"`. Risposta 202 |
| Crea template | `POST` | `/business/{businessId}/location/{locationId}/templates` | Template messaggio per le campagne |
| Invia inviti recensione | `POST` | `/business/{businessId}/location/{locationId}/invites` | Per la fase tenant (reputazione GBP) |

**Mapping dati lead D1 → contatto Climbo:**

| Campo D1 (leads) | Campo Climbo (contact) |
|---|---|
| `name` | `first_name` |
| `email` | `email` |
| `phone` | `phone` |
| `id` (leadId D1) | salvato via PATCH nel campo note/custom |
| `createdAt` | `service_date` |

**Schema D1 da aggiungere** (campi additivi, non breaking):
- `projects.climboLocationId` (text, nullable)
- `leads.climboContactId` (text, nullable)

**Fasatura:** la creazione location (al progetto) ha senso anticipare in Fase A,
così i contatti si accumulano. Campagne e inviti recensione sono Fase B (quando c'è il tenant).

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
