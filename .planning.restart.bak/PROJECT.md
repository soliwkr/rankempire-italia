# Rank Empire Italia

## What This Is

Una factory automatizzata per creare, deployare e monetizzare siti rank-and-rent nel mercato italiano. L'operatore seleziona nicchia + città, l'AI genera ~105 pagine di contenuto localizzato (con copywriting avatar-based Gary Halbert), e il sistema deploya atomicamente ogni sito su Cloudflare Pages con un repository GitHub dedicato. I siti raccolgono lead reali (ghost leads), generano proof package automatici e vengono affittati a business locali italiani per €200-500/mese.

## Core Value

Un sistema che trasforma una nicchia + città in un sito live che raccoglie lead in meno di 1 ora — con costo marginale vicino a zero per ogni sito aggiuntivo.

## Requirements

### Validated

- ✓ Factory-core Cloudflare Worker (lead intake, deploy pipeline, AI content generation) — esistente
- ✓ Template Astro base per siti rank-rent — esistente (rankame/templates/astro-base)
- ✓ Schema D1 per projects, leads, renters — esistente (rankame/factory-core)
- ✓ Avatar-based content generation (in-pain, skeptic, bundler) con Gary Halbert copywriting — esistente (rankame/factory-core/src/services/prompts.ts)
- ✓ GitHub deployment pipeline (template → new repo → Cloudflare Pages CI) — esistente
- ✓ Double opt-in lead verification via Resend — esistente
- ✓ Telegram notification per nuovi lead — esistente (parziale)
- ✓ Dashboard React operator-facing — esistente (molte feature stub da completare)

### Active

**Factory Pipeline**
- [ ] Wizard dashboard multi-step: nicchia + città → genera contenuto AI → deploya → sito live
- [ ] Generazione programmatica ~105 pagine per sito (servizio × zone, pagine servizio, zone, blog)
- [ ] Template Astro con routing dinamico completo (non solo homepage)
- [ ] Config-driven site: ogni sito legge config.json nel repo per nicchia/città/servizi/zone

**Lead Capture**
- [ ] Form lead con double opt-in GDPR-compliant su ogni sito deployato
- [ ] Typebot widget embed per qualificazione chatbot (in-pain / skeptic / bundler routing)
- [ ] WhatsApp Business API routing per lead caldi
- [ ] Email nurturing via Resend per lead tiepidi (n8n workflow)

**SEO & Tracking**
- [ ] GA4 property creata automaticamente per ogni progetto
- [ ] GSC verifica dominio + sitemap submission automatica
- [ ] SERP tracking via Serper.dev con alert Telegram su drop posizione

**Proof Package & Monetizzazione**
- [ ] Accumulo ghost leads per 30-60 giorni prima dell'outreach
- [ ] Proof package PDF generato automaticamente (GA4 + GSC + lead reali)
- [ ] Sequenza outreach automatica via n8n (email/WhatsApp 10-14 giorni)
- [ ] Onboarding cliente automatico: Drive + contratto + redeploy sito con dati reali

**Automazione & Operations**
- [ ] n8n workflow orchestration (onboarding, report mensili, SERP, lead routing)
- [ ] Report mensile automatico PDF → Google Drive cliente
- [ ] Revenue tracking in Directus/D1 + Metabase dashboard
- [ ] Uptime monitoring Kuma per tutti i siti

**Dashboard Operator**
- [ ] Kanban drag-and-drop siti (con persistenza stato)
- [ ] KPI dashboard reali (da GSC/GA4, non placeholder hardcoded)
- [ ] Gestione progetti (crea, visualizza status, revenue per sito)
- [ ] Fix modelli Gemini (attualmente rotti: usano nomi modello inesistenti)

### Out of Scope

- Targeting Roma/Milano — troppo competitivo (KD 40-60), focus città 50-200K
- Mobile app — web-first
- PBN o link building black hat — rischio penalizzazione
- Google Business Profile finti — violazione ToS Google
- Twilio come canale primario — sostituito da WhatsApp Business API (10x più economico)
- Vendita lead a più competitor contemporaneamente senza consenso — GDPR violation
- Redux/Zustand/context — architettura state attuale (useState + Firestore) sufficiente per v1

## Context

**Codebase esistente (frammentata in 2 tentativi paralleli):**

1. **Root project** (`src/` + `factory-core/`): Dashboard React con Firebase/Firestore, factory-core Worker con pipeline deployment via GitHub. Molte feature stub (`/api/deploy/cloudflare` sempre return stub, `/api/proof/generate` stub, Kanban UI-only, KPI hardcoded). Modelli Gemini rotti (usano `gemini-3-flash-preview` che non esiste).

2. **rankame/** (secondo tentativo più pulito): Factory-core più pulito, template Astro base, avatar-based prompts con Gary Halbert methodology, schema D1 più semplice. Manca la dashboard e molte feature, ma l'architettura è più coerente.

**Infrastruttura VPS (Hetzner) già live:**
- Directus (CMS headless)
- n8n (automazione)
- Metabase (dashboard)
- PostgreSQL + Redis
- SerpBear (da aggiungere)
- Uptime Kuma

**Primo sito già live:** `ristrutturazioniformia.it` (Formia, ristrutturazioni)

**Stack target definitivo:**
- Siti: Astro 5.x + Tailwind 4.0 → Cloudflare Pages (1 repo GitHub per sito)
- Backend factory: Cloudflare Worker (Hono) + D1 + KV
- CMS dati siti: Directus → Astro fetch al build time
- Automazione: n8n (orchestratore workflow)
- Dashboard operator: React SPA + Firebase Auth
- AI content: Gemini 2.5 Flash via Cloudflare AI Gateway
- Lead capture: form DOI + Typebot chatbot
- Notifiche: Telegram bot + WhatsApp Business API
- Tracking: GA4 + GSC + Serper.dev

## Constraints

- **Stack**: Cloudflare-first (Pages, Workers, D1, KV) — zero lock-in SaaS costosi
- **Costo infrastruttura**: ≤€100/mese fino a 50 siti (VPS + API + domini)
- **GDPR**: Double opt-in obbligatorio su ogni form, DPA con ogni cliente, registro trattamenti
- **Target geografico**: Città 50K-200K abitanti (sweet spot volume/competizione)
- **Linguaggio siti**: Italiano naturale, no aziendalese (Gary Halbert methodology)
- **Nicchie prioritarie**: Ristrutturazioni, idraulico, fabbro, caldaie, dentisti, veterinari, elettricista
- **No dipendenze esterne pesanti**: Stack self-hosted su VPS (n8n, Directus, Metabase)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 1 sito = 1 repo GitHub + 1 Cloudflare Pages | Isolamento totale, deploy atomici, nessun monorepo da gestire | — Pending |
| rankame/factory-core come base canonica | Più pulito del root, architettura Cloudflare-nativa coerente | — Pending |
| Avatar-based content (in-pain/skeptic/bundler) | Copywriting localizzato con psicologia buyer — conversion rate >generico | — Pending |
| Directus come CMS per tutti i siti | Headless, self-hosted, zero costo, webhook per rebuild automatico | — Pending |
| n8n come orchestratore workflow | Self-hosted, API REST, Google/Telegram/email native | — Pending |
| WhatsApp Business API invece di Twilio | €0 vs €100/mese per 50 siti, preferenza utente italiano | — Pending |
| Ghost leads 30-60gg prima di outreach | Proof package con dati reali → conversion rate 30-50% vs cold pitch | — Pending |
| Modello revenue primario: affitto mensile fisso | Revenue ricorrente prevedibile, margine 93-97% | — Pending |

## Evolution

Questo documento evolve alle transizioni di fase e ai milestone.

**Dopo ogni transizione di fase** (via `/gsd-transition`):
1. Requirements invalidati? → Sposta in Out of Scope con motivazione
2. Requirements validati? → Sposta in Validated con riferimento fase
3. Nuovi requirements emersi? → Aggiungi in Active
4. Decisioni da loggare? → Aggiungi in Key Decisions
5. "What This Is" ancora accurato? → Aggiorna se deriva

**Dopo ogni milestone** (via `/gsd-complete-milestone`):
1. Review completa di tutte le sezioni
2. Core Value check — ancora la priorità giusta?
3. Audit Out of Scope — motivazioni ancora valide?
4. Aggiorna Context con stato attuale

---
*Last updated: 2026-04-24 after initialization*
