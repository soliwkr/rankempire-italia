---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Audit stato reale completato — fasi 5-6 backend done, 7-10 parziali
last_updated: "2026-07-24T12:00:00.000Z"
last_activity: 2026-07-24
progress:
  total_phases: 10
  completed_phases: 6
  total_plans: 18
  completed_plans: 18
  percent: 65
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-24)

**Core value:** Un sistema che trasforma nicchia + città in un sito live che raccoglie lead in meno di 1 ora — costo marginale vicino a zero per ogni sito aggiuntivo.
**Current focus:** Fasi 7-10 parziali; il prossimo passo non è codice ma vendita (telefonata impresa edile Formia).

## Current Position

Phase: 7-10 (tutte parzialmente implementate)
Status: Backend fasi 5-6 completato ad-hoc; fasi 7-10 hanno codice parziale
Last activity: 2026-07-24

Progress: [██████░░░░] 65%

## What's Actually Built (audit 24/07/2026)

| Phase | Backend | DB Schema | Cosa manca |
|-------|---------|-----------|------------|
| 1-4 | ✅ 100% | ✅ | Niente |
| 5 Custom Domain | ✅ 85% | ✅ (ga4_measurement_id, gsc_site_url) | Validazione dominio |
| 6 Lead Capture | ✅ 100% | ✅ (avatar, verification_token) | Niente (backend completo) |
| 7 SEO & Tracking | 🟡 40% | ✅ | SERP cron, rank tracking, drop alert, sitemap submit |
| 8 Proof & Outreach | 🟡 30% | 🟡 (proof_sent_at) | PDF generation, threshold logic (12 lead/60gg) |
| 9 Dashboard Core | 🟡 50% | ✅ | Kanban persistence, auth gate dashboard |
| 10 KPIs & Wizard | 🔴 20% | ❌ | GSC/GA4 aggregation endpoints, wizard flow |

### Features fuori roadmap (complete)

- **Renter API** — Auth JWT, multi-tenant isolation (progetti, pagine, media R2)
- **Batch Generator** — Orchestrazione multi-page con quality check italiano
- **R2 Media Storage** — Upload multi-tenant con D1 tracking
- **Slug Normalization** — Accenti italiani, URL-safe
- **Deploy Workers** — Switch da CF Pages a CF Workers

## Performance Metrics

**Velocity:**

- Total formal plans completed: 18 (fasi 1-4)
- Ad-hoc implementations: fasi 5-6 + bonus features (maggio-luglio 2026)

**By Phase:**

| Phase | Plans | Status |
|-------|-------|--------|
| 01 | 4 | Complete |
| 02 | 5 | Complete |
| 03 | 3 | Complete |
| 04 | 6 | Complete |
| 05 | ad-hoc | Backend done |
| 06 | ad-hoc | Backend done |
| 07-10 | ad-hoc | Partial |

## Accumulated Context

### Decisions

- Init: 100% Cloudflare stack — no VPS, no n8n, no Directus
- Init: factory-core Bearer token auth (FACT-06) is Phase 1 priority
- 2026-05: Deploy switch da CF Pages a CF Workers
- 2026-05: Renter API multi-tenant implementata fuori roadmap
- 2026-07: GSD e framework orchestrazione rimossi — solo Claude Code

### Blockers/Concerns

- **0 lead, 0 renters, 0 clienti fatturati** — il collo di bottiglia è vendita, non codice
- factory-core ha 0 righe in leads — nessun sito ha mai catturato un lead in produzione
- gsc_site_url NULL su tutti i progetti — nessun sito collegato a Search Console
- SSRF su `/api/scrape-site`: accetta URL arbitrari senza allowlist né auth

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | Client onboarding automation (ONBO-01/02/03) | Deferred | 2026-04-24 |
| v2 | Monthly PDF reports (REP-01/02) | Deferred | 2026-04-24 |
| v2 | Outreach sequence automation (OUTR-04/05) | Deferred | 2026-04-24 |
| v2 | AI blog post cron (CONT-01/02/03) | Deferred | 2026-04-24 |
| v2 | Multi-tenant support (MULT-01) | Deferred → Done | Implementato ad-hoc |

## Session Continuity

Last session: 2026-07-24
Stopped at: Audit stato reale — ROADMAP/STATE/CLAUDE.md/RIPRESA.md allineati al codice
Resume file: None
Next: Non è codice. È la prima telefonata a un'impresa edile di Formia.
