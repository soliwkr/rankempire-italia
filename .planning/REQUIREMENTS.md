# Requirements: Rank Empire Italia

**Defined:** 2026-04-24
**Core Value:** Un sistema che trasforma nicchia + città in un sito live che raccoglie lead in meno di 1 ora — costo marginale vicino a zero per ogni sito aggiuntivo.

---

## v1 Requirements

### Factory Pipeline

- [ ] **FACT-01**: L'operatore può creare un nuovo progetto specificando nicchia, città e zone target tramite wizard dashboard multi-step
- [ ] **FACT-02**: Il sistema genera ~105 pagine di contenuto SEO italiano tramite Gemini 2.5 Flash con copywriting avatar-based (in-pain, skeptic, bundler — Gary Halbert methodology)
- [ ] **FACT-03**: Il sistema crea un nuovo repository GitHub dal template Astro per ogni progetto, senza sleep-hack (retry loop su GitHub API)
- [ ] **FACT-04**: Il sistema deploya il sito su un nuovo progetto Cloudflare Pages collegato al repository GitHub dedicato
- [ ] **FACT-05**: Il sistema inietta la config del sito (nicchia, città, zone, avatar, factory API URL) nel repo al momento del deploy
- [ ] **FACT-06**: Tutti gli endpoint factory-core non-pubblici richiedono autenticazione Bearer token

### Siti Deployati

- [ ] **SITE-01**: Ogni sito ha routing Astro completo: homepage, pagine servizio, pagine zona, pagine programmatiche servizio×zona (~72 pagine), blog
- [ ] **SITE-02**: Ogni sito include structured data schema.org LocalBusiness + FAQPage
- [ ] **SITE-03**: Ogni sito genera automaticamente sitemap.xml e robots.txt al build
- [ ] **SITE-04**: Ogni sito fetcha il contenuto da factory-core Worker D1 al build time (zero dipendenza da Directus o VPS)
- [ ] **SITE-05**: Ogni sito è configurato con il proprio dominio custom (es. `idraulicoformia.it`) su Cloudflare Pages

### Lead Capture

- [ ] **LEAD-01**: Form lead GDPR-compliant con honeypot e double opt-in su ogni sito deployato
- [ ] **LEAD-02**: Submission form scrive il lead su D1 (`factory-core`) con `doi_status = pending`
- [ ] **LEAD-03**: Email di verifica DOI inviata via Resend al lead con link token
- [ ] **LEAD-04**: Verifica DOI aggiorna `doi_status = verified` in D1
- [ ] **LEAD-05**: Notifica Telegram inviata all'operatore su ogni lead verificato (via `rank-rent-bot-chris`)
- [ ] **LEAD-06**: Lead taggato per avatar (in-pain / skeptic / bundler) in base al percorso di acquisizione

### SEO & Tracking

- [ ] **SEO-01**: GA4 property creata automaticamente per ogni nuovo progetto via Google Analytics Admin API
- [ ] **SEO-02**: Dominio verificato su GSC e sitemap.xml submessa automaticamente al deploy
- [ ] **SEO-03**: Worker Cron settimanale controlla posizioni SERP via Serper.dev per ogni progetto
- [ ] **SEO-04**: Alert Telegram automatico quando una keyword scende >3 posizioni

### Proof Package & Outreach

- [ ] **OUTR-01**: Ghost leads accumulati su D1 con tracking temporale per progetto
- [ ] **OUTR-02**: Proof package PDF generato automaticamente con dati reali (sessioni GA4, keyword GSC, lead count, esempi messaggi anonimizzati)
- [ ] **OUTR-03**: Notifica Telegram operatore quando un sito ha raggiunto soglia outreach (≥12 lead verificati o ≥60 giorni live)

### Dashboard Operator (`os.puraluce.studio`)

- [ ] **DASH-01**: Lista progetti con status (pending / deploying / live / rented), lead count, revenue mensile per progetto
- [ ] **DASH-02**: Wizard multi-step per creare nuovo sito: nicchia + città + zone → genera contenuto AI → crea repo → deploya
- [ ] **DASH-03**: Kanban board con drag-and-drop che persiste lo status su D1 (non solo UI)
- [ ] **DASH-04**: KPI dashboard con dati reali da GSC/GA4/D1 (zero placeholder hardcoded)
- [ ] **DASH-05**: Accesso al dashboard protetto da autenticazione (Firebase Auth o Bearer token)

---

## v2 Requirements (deferred)

### Client Onboarding Automation
- **ONBO-01**: Onboarding cliente automatico: cartella Google Drive, contratto pre-compilato, accesso GA4 reader
- **ONBO-02**: Redeploy automatico sito con dati reali cliente (nome azienda, telefono, indirizzo) dopo firma contratto
- **ONBO-03**: Email di benvenuto automatica con link Drive e istruzioni

### Reporting & Revenue
- **REP-01**: Report mensile PDF automatico per ogni cliente attivo → Google Drive + notifica Telegram
- **REP-02**: Revenue tracking in D1 + dashboard operatore (revenue per sito, MRR totale, churn)

### Outreach Automation
- **OUTR-04**: Sequenza outreach automatica via Worker Cron: email/WhatsApp cadenza 10-14 giorni a business locali target
- **OUTR-05**: Pipeline CRM: prospect → contattato → qualificato → chiuso / perso

### Content & SEO Avanzato
- **CONT-01**: Blog post generato AI 1×/settimana per sito via Worker Cron + commit automatico nel repo
- **CONT-02**: GBP post automatico 2×/settimana (Google Business Profile API)
- **CONT-03**: Competitor SERP snapshot mensile via Serper.dev

### Multi-Tenant
- **MULT-01**: Supporto multi-operatore con `renters` table (accesso segregato per cliente)

---

## Out of Scope

| Feature | Motivazione |
|---------|-------------|
| VPS / n8n / Directus | Sostituiti da stack 100% Cloudflare — zero infra extra |
| Targeting Roma / Milano | KD 40-60, troppo competitivo per v1 |
| Mobile app native | Web-first; il dashboard è responsive |
| PBN / link building black hat | Rischio penalizzazione Google |
| Google Business Profile finti | Violazione ToS Google, rischio ban account |
| Twilio come canale primario | Sostituito da WhatsApp Business API (10x più economico) |
| Vendita lead a più clienti contemporaneamente | GDPR violation senza consenso esplicito |
| Typebot widget | Complessità integrazione terze parti — lead form nativo sufficiente per v1 |
| Proof package cartaceo / postale | Digital-first, PDF via Drive/link diretto |

---

## Traceability

*Aggiornato dal roadmapper — vedere ROADMAP.md*

| Requirement | Phase | Status |
|-------------|-------|--------|
| FACT-06 | Phase 1 | Pending |
| SITE-01 | Phase 2 | Pending |
| SITE-02 | Phase 2 | Pending |
| SITE-03 | Phase 2 | Pending |
| SITE-04 | Phase 2 | Pending |
| FACT-02 | Phase 3 | Pending |
| FACT-01 | Phase 4 | Pending |
| FACT-03 | Phase 4 | Pending |
| FACT-04 | Phase 4 | Pending |
| FACT-05 | Phase 4 | Pending |
| SITE-05 | Phase 5 | Pending |
| LEAD-01 | Phase 6 | Pending |
| LEAD-02 | Phase 6 | Pending |
| LEAD-03 | Phase 6 | Pending |
| LEAD-04 | Phase 6 | Pending |
| LEAD-05 | Phase 6 | Pending |
| LEAD-06 | Phase 6 | Pending |
| SEO-01 | Phase 7 | Pending |
| SEO-02 | Phase 7 | Pending |
| SEO-03 | Phase 7 | Pending |
| SEO-04 | Phase 7 | Pending |
| OUTR-01 | Phase 8 | Pending |
| OUTR-02 | Phase 8 | Pending |
| OUTR-03 | Phase 8 | Pending |
| DASH-01 | Phase 9 | Pending |
| DASH-03 | Phase 9 | Pending |
| DASH-05 | Phase 9 | Pending |
| DASH-02 | Phase 10 | Pending |
| DASH-04 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 29 totali
- Mappati a fasi: 29 (100%)
- Non mappati: 0

---
*Requirements defined: 2026-04-24*
*Last updated: 2026-04-24 after roadmap creation — all 29 v1 requirements mapped*
