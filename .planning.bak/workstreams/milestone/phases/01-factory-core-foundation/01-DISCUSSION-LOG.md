# Phase 1: Factory-Core Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-24
**Phase:** 01-factory-core-foundation
**Areas discussed:** Auth, Scope Codebase, Schema D1, VERIFICATION_BASE_URL

---

## Auth

| Option | Description | Selected |
|--------|-------------|----------|
| Hono bearerAuth() middleware | Built-in Hono middleware, secret in env var, zero boilerplate | ✓ |
| Custom middleware Hono | Middleware manuale, più flessibile ma più codice | |
| Cloudflare Access (zero-trust) | Protezione infrastruttura, non gestisce granularità endpoint | |

**User's choice:** Hono bearerAuth() middleware
**Notes:** Secret in env var

---

| Option | Description | Selected |
|--------|-------------|----------|
| Solo POST /api/leads | Solo lead submission pubblica | |
| POST /api/leads + GET /verify/:token | Anche il link DOI deve essere pubblico | ✓ |
| Solo /health | Tutto tranne /health richiede auth | |

**User's choice:** POST /api/leads + GET /verify/:token
**Notes:** Il lead clicca il link di verifica dall'email — non ha un Bearer token

---

## Scope Codebase

| Option | Description | Selected |
|--------|-------------|----------|
| Solo rankame/factory-core | Il canonico da PROJECT.md | |
| Entrambi i factory-core | Fix parallelo su entrambi | ✓ |
| Root factory-core/ diventa canonico | Rivalutazione architetturale | |

**User's choice:** Entrambi i factory-core

---

| Option | Description | Selected |
|--------|-------------|----------|
| No, fuori scope | Phase 1 success criteria riguarda solo factory-core | ✓ |
| Sì, fixare anche src/services/gemini.ts | Risolve tutti i modelli rotti | |

**User's choice:** No, fuori scope — src/services/gemini.ts deferred

---

## Schema D1

| Option | Description | Selected |
|--------|-------------|----------|
| Drizzle schema + generate migration | Schema.ts → drizzle-kit generate | ✓ |
| SQL migration manuale | ALTER TABLE diretto | |
| Nuova tabella separata | Over-engineering per Phase 1 | |

**User's choice:** Drizzle schema + generate migration

---

| Option | Description | Selected |
|--------|-------------|----------|
| Plaintext | Necessario per DOI/Resend | ✓ |
| Hash bcrypt | Non funziona per invio email | |

**User's choice:** Plaintext

---

## VERIFICATION_BASE_URL

| Option | Description | Selected |
|--------|-------------|----------|
| factory-core.soliwkr.workers.dev | URL già presente in codebase come TODO | ✓ |
| Un URL diverso | URL production differente | |

**User's choice:** factory-core.soliwkr.workers.dev confermato

---

## Claude's Discretion

- Nome esatto della env var per il Bearer secret
- Struttura del middleware Hono (route group vs app-level con eccezioni)

## Deferred Ideas

- Fix src/services/gemini.ts (modelli rotti) — fuori scope Fase 1
- Consolidamento/eliminazione root factory-core/ — decisione architetturale dopo Fase 2
