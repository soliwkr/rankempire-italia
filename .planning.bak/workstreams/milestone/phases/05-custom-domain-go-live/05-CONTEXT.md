---
status: diagnosed
phase: 5-custom-domain-go-live
domain: Custom Domain Management
date: 2026-04-27
---

# CONTEXT: Phase 5 - Custom Domain Go-Live

## Domain
Configurazione dei domini custom per i siti generati su Cloudflare Pages.

## Locked Requirements (SITE-05)
1. Il sito deve essere raggiungibile via dominio custom su HTTPS con TLS certificato valido.
2. `www` e apice del dominio devono risolvere al progetto Cloudflare Pages.
3. Il dominio custom deve essere registrato in D1 nel record del progetto.

## Implementation Decisions
- **Domain Management:** Cloudflare Pages custom domain API.
- **SSL/TLS:** Gestito automaticamente da Cloudflare.
- **Persistence:** Il record del dominio deve essere aggiornato nella tabella `projects` di D1 tramite l'endpoint dedicato.

## Canonical Refs
- [SITE-05] REQUIREMENTS.md
- [D1 Projects Schema] factory-core/src/db/schema.ts

## Code Context
- Cloudflare Pages API: `factory-core/src/services/cloudflare-pages.ts`
- Project DB: `factory-core/src/db/schema.ts`
EOF

# Create the discussion log
cat <<EOF > .planning/phases/05-custom-domain-go-live/05-DISCUSSION-LOG.md
# Discussion Log: Phase 5

- **Date:** 2026-04-27
- **Phase:** 5 - Custom Domain Go-Live

## Topics
- Implementation of automated custom domain assignment via Cloudflare Pages API.
- Ensuring SSL/TLS coverage.
- D1 record update strategy.

## Decisions
- Use Cloudflare Pages custom domain API.
- Automatic SSL/TLS.
- Persist domain in D1 projects table.
EOF

# Commit the context
git add .planning/phases/05-custom-domain-go-live/05-CONTEXT.md .planning/phases/05-custom-domain-go-live/05-DISCUSSION-LOG.md
git commit -m "docs(phase-5): capture phase context"
