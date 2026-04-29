---
plan: 02-05
phase: 02-astro-template-completion
status: complete
completed: 2026-04-25
---

# Piano 02-05: robots.txt + Build Smoke Test + Checkpoint Visivo

## Obiettivo

Completare la pipeline di build: robots.txt dinamico, sitemap generata da @astrojs/sitemap, build smoke test con mock server, checkpoint visivo approvato dall'utente.

## Cosa è stato fatto

### Task 1: robots.txt.ts + build smoke test
- Creato `src/pages/robots.txt.ts` — URL sitemap dinamico da `Astro.site` (nessun hardcode)
- Creato `scripts/mock-factory.cjs` — mock server locale per smoke test (40 pagine mock: 1 homepage + 3 service + 9 zone + 27 service_zone)
- Fix auto-corretto: upgrade `@tailwindcss/vite` 4.0.0 → 4.1.4 (build falliva con errore `Cannot convert undefined or null to object`)
- Build smoke test: **exit code 0**, 41 pagine generate
- Output verificato: `dist/sitemap-index.xml` + `dist/robots.txt` presenti
- `robots.txt` contiene: `Sitemap: https://ristrutturazioniformia.it/sitemap-index.xml`
- Sitemap: **41 URL**, nessun `example.com`, dominio reale corretto
- `factoryApi` ripristinato a `https://factory-core.soliwkr.workers.dev`

### Task 2: Checkpoint visivo (approvato)
- Preview avviato su `http://localhost:4321`
- Homepage, service hub, leaf page, zone hub, blog index verificati
- `robots.txt` e `sitemap-index.xml` accessibili e corretti
- JSON-LD `@graph` senza valori `null` verificato in DevTools
- **Checkpoint approvato dall'utente**

## Verifiche

| Check | Risultato |
|-------|-----------|
| `npx astro build` exit code | 0 ✓ |
| URL in sitemap | 41 ✓ |
| `example.com` in sitemap | 0 match ✓ |
| `dist/sitemap-index.xml` | presente ✓ |
| `dist/robots.txt` con Sitemap: | presente ✓ |
| Checkpoint visivo utente | approvato ✓ |

## Artefatti creati

| File | Cosa fornisce |
|------|---------------|
| `src/pages/robots.txt.ts` | robots.txt dinamico con URL sitemap da Astro.site |
| `scripts/mock-factory.cjs` | Mock server per smoke test build |
| `dist/sitemap-index.xml` | Sitemap XML con 41 URL (generata da @astrojs/sitemap) |
| `dist/robots.txt` | robots.txt con riferimento sitemap |

## Self-Check: PASSED

Tutti e 4 i success criteria ROADMAP Phase 2 soddisfatti:
- ✓ SITE-01: 41 pagine generate (1 homepage + 3 service hub + 9 zone hub + 27 leaf + 1 blog index)
- ✓ SITE-02: JSON-LD @graph su ogni pagina (LocalBusiness senza null, BreadcrumbList, Service su leaf, FAQPage su homepage)
- ✓ SITE-03: sitemap-index.xml e robots.txt in dist/ con dominio corretto
- ✓ SITE-04: Nessuna chiamata Directus o /api/generate nei log di build
