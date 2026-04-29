---
status: diagnosed
phase: 7-seo-tracking-automation
domain: SEO & Tracking Automation
date: 2026-04-27
---

# CONTEXT: Phase 7 - SEO & Tracking Automation

## Goal
Implementare automazione per GA4, GSC e monitoraggio SERP.

## Requirements (SEO-01 to SEO-04)
1. **SEO-01**: Creazione automatica GA4 via Google Analytics Admin API + salvataggio ID in D1.
2. **SEO-02**: Verifica dominio GSC + invio sitemap.xml automatico al deploy.
3. **SEO-03**: Cron settimanale (Worker) via Serper.dev per tracciamento posizioni keyword.
4. **SEO-04**: Alert Telegram automatico per cali SERP > 3 posizioni WoW.

## Implementation Decisions
- **GA4:** Google Analytics Admin API.
- **GSC:** Google Search Console API (Domain verification + Sitemap submission).
- **SERP Tracking:** Serper.dev API.
- **Automation:** Cloudflare Worker Cron.
- **Persistence:** Tabella `projects` in D1 per GA4 ID e keyword tracciate.
- **Notifications:** Telegram Bot API (già utilizzato in Phase 6).

## Canonical Refs
- [SEO-01, SEO-02, SEO-03, SEO-04] REQUIREMENTS.md
- [ROADMAP.md] .planning/ROADMAP.md

## Code Context
- D1 Projects Table: `factory-core/src/db/schema.ts`
- Worker Cron: `factory-core/src/cron/serp-check.ts` (da implementare)
- Google API Services: `factory-core/src/services/google-analytics.ts`, `factory-core/src/services/search-console.ts` (da implementare)
EOF
