---
phase: 04-deploy-pipeline
plan: "02"
subsystem: github/template-repo
tags: [github, template-repository, astro, manual-setup, deploy-pipeline]
status: complete
key-files:
  created:
    - "StudioPuraLuce/astro-rank-rent (GitHub remote)"
  modified: []
---

## Obiettivo

Push del template Astro su GitHub come Template Repository `StudioPuraLuce/astro-rank-rent`, prerequisito per tutti i deploy della pipeline.

## Cosa è stato fatto

**Task 1 — Push template + abilita is_template:**
- Repo `StudioPuraLuce/astro-rank-rent` creato su GitHub (privato)
- Template `rankame/templates/astro-base` pushato come branch `main` (9453 oggetti)
- Flag `is_template: true` abilitato via GitHub Settings
- `src/data/site.config.json` presente nel repo (placeholder per injection da deploy endpoint)

## Verifica

```json
{
  "is_template": true,
  "name": "astro-rank-rent",
  "private": true,
  "visibility": "private"
}
```

API GitHub conferma: `GET /repos/StudioPuraLuce/astro-rank-rent` → `is_template: true`

## Must-Haves

- [x] D-05: Il repo StudioPuraLuce/astro-rank-rent esiste su GitHub con is_template: true
- [x] D-05: Il repo contiene astro.config.mjs, package.json e src/data/site.config.json
- [x] D-05: GitHub API restituisce is_template: true

## Self-Check: PASSED
