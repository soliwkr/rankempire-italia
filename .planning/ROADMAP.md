# Roadmap: Rank Empire Italia

## Overview

Brownfield build on top of a deployed but incomplete Cloudflare-native factory. The journey moves from fixing the broken foundation (auth, model names, schema) through completing the Astro template and deploy pipeline, then layering lead capture, SEO automation, proof package generation, and finally a fully operational operator dashboard. Each phase delivers a coherent, verifiable capability — nothing ships half-finished.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3 ...): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions via `/gsd-insert-phase`

- [x] **Phase 1: Factory-Core Foundation** - Fix auth, Gemini models, D1 schema, and env config so the backend is safe and functional (completed 2026-04-25)
- [ ] **Phase 2: Astro Template Completion** - Full routing, schema.org markup, sitemap, and D1 data fetching replacing Directus
- [ ] **Phase 3: AI Content Generation** - 105-page programmatic content via Gemini 2.5 Flash with avatar-based copywriting
- [ ] **Phase 4: Deploy Pipeline** - Wizard backend triggers GitHub repo creation, Cloudflare Pages deploy, and config injection
- [ ] **Phase 5: Custom Domain Go-Live** - Each deployed site gets its own custom domain on Cloudflare Pages
- [ ] **Phase 6: Lead Capture** - GDPR-compliant DOI form, D1 write, Resend verification, avatar tagging, Telegram notification
- [ ] **Phase 7: SEO & Tracking Automation** - GA4 auto-create, GSC verify + sitemap submit, SERP cron, Telegram drop alert
- [ ] **Phase 8: Proof Package & Outreach Trigger** - Ghost lead accumulation, PDF proof package, outreach threshold notification
- [ ] **Phase 9: Dashboard Core** - Project list with real data, Kanban with D1 persistence, auth gate
- [ ] **Phase 10: Dashboard KPIs & Wizard UI** - Real KPI data from GSC/GA4/D1, wizard multi-step UI

## Phase Details

### Phase 1: Factory-Core Foundation
**Goal**: The factory-core Worker is secure, uses correct Gemini model identifiers, has a complete D1 schema, and has a correct production VERIFICATION_BASE_URL — so all subsequent phases build on a working base
**Depends on**: Nothing (first phase)
**Requirements**: FACT-06
**Success Criteria** (what must be TRUE):
  1. All non-public factory-core endpoints reject requests without a valid Bearer token and return 401
  2. Public lead submission endpoint remains unauthenticated (intentional)
  3. AI calls in factory-core use `gemini-2.5-flash` and receive a valid JSON response from Cloudflare AI Gateway
  4. The `leads` D1 table has an `email` column and migrations apply cleanly
  5. `VERIFICATION_BASE_URL` in wrangler.toml is set to the production Worker URL, not localhost
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Schema D1 email: aggiungere colonna email a schema.ts + db.insert in entrambi i factory-core
- [x] 01-02-PLAN.md — Auth + env config: bearerAuth middleware su endpoint protetti + VERIFICATION_BASE_URL produzione
- [x] 01-03-PLAN.md — [BLOCKING] Applicare migration D1 locale + verifica end-to-end tutti i criteri Fase 1
- [x] 01-04-PLAN.md — Gap closure CR-01+CR-02: return bearerAuth + verificationBaseUrl EmailService

### Phase 2: Astro Template Completion
**Goal**: The Astro rank-rent site template has complete routing (all page types), structured data markup, auto-generated sitemap + robots.txt, and fetches all content from factory-core D1 at build time with zero Directus dependency
**Depends on**: Phase 1
**Requirements**: SITE-01, SITE-02, SITE-03, SITE-04
**Success Criteria** (what must be TRUE):
  1. A built site has working routes for homepage, service pages, zone pages, service×zone pages (~72), and blog index
  2. Every page includes valid schema.org LocalBusiness and FAQPage JSON-LD in the HTML head
  3. `sitemap.xml` and `robots.txt` are present in the build output and list all generated URLs
  4. Running `astro build` with a factory-core API URL env var fetches content from D1 with no Directus or VPS calls in build logs
**Plans**: 5 plans
**UI hint**: yes

Plans:
- [ ] 02-01-PLAN.md — factory-core: tabella D1 pages + endpoint GET /api/sites/:id/pages + [BLOCKING] schema push
- [ ] 02-02-PLAN.md — Test infrastructure vitest: config + 3 test file RED + fixture (parallel con 02-01)
- [ ] 02-03-PLAN.md — Astro lib layer: astro.config.mjs + fetchPages + buildSchemaGraph + buildPaths + componenti (SchemaGraph, Breadcrumb, InternalLinks, Layout)
- [ ] 02-04-PLAN.md — Routing completo: 6 pagine Astro (homepage, service hub, leaf service×zone, zone hub, blog index, blog post)
- [ ] 02-05-PLAN.md — robots.txt + build smoke test + checkpoint visivo

### Phase 3: AI Content Generation
**Goal**: The factory-core `/api/generate/content` endpoint produces ~105 pages of localized Italian SEO content using Gemini 2.5 Flash and the three avatar-based prompts (in-pain, skeptic, bundler) for any given niche + city + zone combination
**Depends on**: Phase 1
**Requirements**: FACT-02
**Success Criteria** (what must be TRUE):
  1. Calling the generate endpoint for a niche + city returns content for all page types: homepage, service pages (≥5), zone pages (≥5), service×zone combinations (≥50), and blog posts (≥3)
  2. Generated copy reflects the in-pain, skeptic, or bundler avatar voice as specified in the request
  3. All content is in natural Italian with location-specific references (city name, zone names, local idioms)
  4. The endpoint completes within the Cloudflare Worker CPU time limit (no timeout errors)
**Plans**: TBD

### Phase 4: Deploy Pipeline
**Goal**: Submitting a project ID triggers the full automated pipeline: GitHub repo created from Astro template, config injected, Cloudflare Pages project created and linked — all without sleep hacks
**Depends on**: Phase 2, Phase 3
**Requirements**: FACT-01, FACT-03, FACT-04, FACT-05
**Success Criteria** (what must be TRUE):
  1. Calling the deploy endpoint for a project creates a new GitHub repo under the configured template owner without race-condition sleep delays (uses retry loop)
  2. The new repo contains a `site.config.json` file with the correct niche, city, zones, avatar, and factory API URL for that project
  3. A Cloudflare Pages project is created and linked to the new GitHub repo, triggering an automated build
  4. The deployed Pages URL returns a 200 with the generated site content within 5 minutes of the deploy call
**Plans**: TBD

### Phase 5: Custom Domain Go-Live
**Goal**: Each deployed rank-rent site is accessible via its own custom domain (e.g., `idraulicoformia.it`) configured on Cloudflare Pages
**Depends on**: Phase 4
**Requirements**: SITE-05
**Success Criteria** (what must be TRUE):
  1. After domain assignment, the site is reachable at the custom domain over HTTPS with a valid TLS certificate
  2. The `www` subdomain and apex domain both resolve to the Cloudflare Pages project
  3. The custom domain is recorded in the project's D1 row for downstream use (GSC, GA4, proof package)
**Plans**: TBD

### Phase 6: Lead Capture
**Goal**: Every deployed site has a working GDPR-compliant lead form: submissions write to D1 with pending status, trigger a DOI verification email, verify on click, tag by avatar, and notify the operator via Telegram
**Depends on**: Phase 4
**Requirements**: LEAD-01, LEAD-02, LEAD-03, LEAD-04, LEAD-05, LEAD-06
**Success Criteria** (what must be TRUE):
  1. Submitting the lead form with a honeypot field filled returns no success — bot is silently dropped
  2. A valid submission creates a lead row in D1 with `doi_status = pending` and the lead's email stored
  3. The lead receives a verification email via Resend with a working token link
  4. Clicking the verification link sets `doi_status = verified` in D1
  5. The operator receives a Telegram notification (via rank-rent-bot-chris) containing the lead's project, avatar tag, and timestamp
**Plans**: TBD
**UI hint**: yes

### Phase 7: SEO & Tracking Automation
**Goal**: Each new site automatically gets a GA4 property, GSC domain verification with sitemap submission, and a weekly SERP position cron that fires a Telegram alert on significant drops
**Depends on**: Phase 5
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04
**Success Criteria** (what must be TRUE):
  1. Deploying a new project automatically creates a GA4 property via Google Analytics Admin API and stores the property ID in D1
  2. The site's domain is verified on Google Search Console and `sitemap.xml` is submitted automatically on deploy
  3. A Cloudflare Worker Cron running weekly checks Serper.dev for each project's tracked keywords and records positions in D1
  4. When any keyword drops more than 3 positions week-over-week, a Telegram alert is sent to the operator with the keyword, old position, new position, and site name
**Plans**: TBD

### Phase 8: Proof Package & Outreach Trigger
**Goal**: Ghost leads accumulate on D1 with temporal tracking, a PDF proof package is auto-generated from real data, and the operator receives a Telegram notification when a site hits the outreach threshold
**Depends on**: Phase 6, Phase 7
**Requirements**: OUTR-01, OUTR-02, OUTR-03
**Success Criteria** (what must be TRUE):
  1. Every verified lead is stored with a creation timestamp and project reference, queryable as "ghost leads" per project
  2. Triggering proof package generation for a project produces a PDF containing: session counts from GA4, keyword positions from GSC, total verified lead count, and anonymized lead message examples
  3. When a project reaches ≥12 verified leads or ≥60 days live, the operator receives a Telegram notification indicating the site is ready for outreach
**Plans**: TBD

### Phase 9: Dashboard Core
**Goal**: The operator dashboard at `os.puraluce.studio` is protected by authentication, shows a real project list with live data from D1, and has a Kanban board whose column changes persist to D1
**Depends on**: Phase 4, Phase 6
**Requirements**: DASH-01, DASH-03, DASH-05
**Success Criteria** (what must be TRUE):
  1. Navigating to `os.puraluce.studio` without authentication redirects to a login screen; authenticated users reach the dashboard
  2. The project list shows each project's current status (pending / deploying / live / rented), lead count, and monthly revenue — all read from D1, not hardcoded
  3. Dragging a project card to a different Kanban column updates `kanban_status` in D1; reloading the page preserves the new column assignment
**Plans**: TBD
**UI hint**: yes

### Phase 10: Dashboard KPIs & Wizard UI
**Goal**: The dashboard wizard UI lets operators create a new site end-to-end, and the KPI dashboard shows real metrics from GSC/GA4/D1 with no hardcoded placeholder values
**Depends on**: Phase 9, Phase 7
**Requirements**: DASH-02, DASH-04
**Success Criteria** (what must be TRUE):
  1. Completing the wizard UI steps (niche → city → zones → generate → deploy) triggers the full factory pipeline and shows the new site URL on completion
  2. The KPI dashboard displays real click/impression/CTR data from GSC and session data from GA4 for each project
  3. All numeric KPI values on the dashboard are derived from live API calls or D1 queries — zero static string literals in JSX
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Factory-Core Foundation | 4/4 | Complete | 2026-04-25 |
| 2. Astro Template Completion | 0/5 | Not started | - |
| 3. AI Content Generation | 0/TBD | Not started | - |
| 4. Deploy Pipeline | 0/TBD | Not started | - |
| 5. Custom Domain Go-Live | 0/TBD | Not started | - |
| 6. Lead Capture | 0/TBD | Not started | - |
| 7. SEO & Tracking Automation | 0/TBD | Not started | - |
| 8. Proof Package & Outreach Trigger | 0/TBD | Not started | - |
| 9. Dashboard Core | 0/TBD | Not started | - |
| 10. Dashboard KPIs & Wizard UI | 0/TBD | Not started | - |
