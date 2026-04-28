# Phase 2: Astro Template Completion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 02-astro-template-completion
**Mode:** discuss
**Areas discussed:** Config structure, Content data contract, URL routing pattern, Schema.org ghost-phase

---

## Config Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Niche + city + services + zones | Config base con tutti i campi per routing | |
| Solo niche + city, zone dal D1 | Config minimale, fetch metadati separato | |
| Config ricca con gmbPlaceId + geo + business fields nullable | Config completa con slot per Google APIs e dati renter | ✓ |

**User's choice:** Config ricca con gmbPlaceId, geo, businessName, phone, address nullable — tutti null in fase ghost, valorizzati al rebuild post-renter.

**Notes:** L'utente ha sollevato la questione dei GBP "service area" vs GBP finti. Decisione: SAB GBP è legittimo per renter reali (contractor che servono un'area), mai in fase ghost perché non esiste business reale. Lo slot `gmbPlaceId: null` nel config è già pronto per l'onboarding. Lo schema.org LocalBusiness per SAB non ha `streetAddress` ma ha `areaServed` — già pianificato.

---

## Content Data Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Tabella pages in D1 + endpoint /api/sites/:id/pages | Phase 3 scrive per-page, Astro fetcha tutto in un colpo | ✓ |
| Static files JSON injettati nel repo | Phase 3 genera file, Phase 4 inietta nel repo | |

**User's choice:** Tabella pages in D1 + endpoint dedicato. Astro non chiama l'AI al build time.

**Notes:** L'endpoint va creato in Phase 3. Phase 2 si basa sul contratto minimo (slug, type, title, body, faq[], meta).

---

## URL Routing Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| /[service]/[zone] nested | Due segmenti, hub naturali, interlinking bidirezionale | ✓ |
| /[service]-[zone] flat keyword URL | URL keyword-rich, no hub, pagine orfane | |
| /servizi/[service]/[zone] con prefisso | Più strutturato, perde keyword density | |

**User's choice:** `/[service]/[zone]` nested con hub pages completi (service hub + zone hub).

**Notes:** L'utente ha chiesto esplicitamente di considerare l'interlinking interno massivo come criterio di scelta. La struttura nested con hub bidirezionali è l'unica che permette un mesh denso dove ogni pagina è max 2 click da ogni altra — fondamentale per PageRank flow e topical/geo authority.

---

## Schema.org Ghost-Phase

| Option | Description | Selected |
|--------|-------------|----------|
| Schema ridotto + Service nodes completi | LocalBusiness con soli campi disponibili, Service/FAQ/Breadcrumb completi | ✓ |
| Schema completo con dati generici/placeholder | Rischio penalità Google per dati non verificabili | |
| Nessun LocalBusiness in fase ghost | Solo Service + FAQ + Breadcrumb | |

**User's choice:** Schema ridotto — nessun placeholder inventato, omissione dei campi null.

**Notes:** Google cross-referenzia schema.org con Knowledge Graph e GMB. Dati placeholder non verificabili sono peggio di campi omessi. Schema valido anche parziale.

---

## Google APIs Discussion

L'utente ha sollevato il tema delle GCloud APIs come arricchimento generale del template. Emergono:

- **Places API** per landmarks italiani locali (equivalente `enriched_locations.json` di MGC) → deferred Phase 7
- **GMB API** per AggregateRating da recensioni reali → deferred Phase 7+
- **Pattern @graph da MGC Reparation** adottato come reference model: `SchemaManager.tsx` tradotto in Astro component statico

## Claude's Discretion

- Astro integration per sitemap (`@astrojs/sitemap`)
- Struttura file Astro (layout, componenti, naming)
- Design/CSS del template (placeholder visivo accettabile per Phase 2)
- Mapping niche → schema.org `@type` specifico
- Formato esatto tabella `pages` in D1 (Phase 3 definisce)

## Deferred Ideas

- Places API per landmarks italiani — Phase 7
- pSEO keyword variations extra — valutare in Phase 3
- AggregateRating da GMB — Phase 7+ post-onboarding renter
- Lead form attivo — Phase 6
