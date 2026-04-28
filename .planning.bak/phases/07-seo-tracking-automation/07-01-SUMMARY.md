---
phase: 07-seo-tracking-automation
plan: 01
subsystem: seo-tracking
tags: [seo, analytics, gsc]
dependency_graph:
  requires: []
  provides: [seo-services, schema-updates]
  affects: [deploy-pipeline]
tech_stack:
  added: [google-analytics-admin-api, google-search-console-api]
key_files:
  - factory-core/src/db/schema.ts
  - factory-core/src/services/google-analytics.ts
  - factory-core/src/services/search-console.ts
decisions:
  - "Utilizzare le API di Google tramite google-auth-library per l'autenticazione tramite Service Account."
metrics:
  duration: 15m
  completed_date: 2026-05-18
---

# Phase 07 Plan 01: SEO Tracking Foundation Summary

Implementati gli schemi database necessari e i servizi API di base per interagire con Google Analytics 4 e Google Search Console.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

- `createGA4Property`: implementazione logica specifica da completare.
- `verifyDomain`: implementazione logica specifica da completare.
- `submitSitemap`: implementazione logica specifica da completare.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: credentials | factory-core/src/services/*.ts | Richiede `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` via environment variables. |

## Self-Check: PASSED
