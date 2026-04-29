---
phase: 01-factory-core-foundation
plan: "01"
subsystem: factory-core/database
tags: [drizzle, d1, schema, migration, leads, email]
dependency_graph:
  requires: []
  provides:
    - "Colonna email nella tabella leads (schema Drizzle + migration SQL)"
    - "Persistenza email nel db.insert del flusso lead"
  affects:
    - "rankame/factory-core/src/db/schema.ts"
    - "rankame/factory-core/src/api/leads.ts"
    - "factory-core/src/db/schema.ts"
    - "factory-core/src/api/leads.ts"
    - "rankame/factory-core/migrations/0003_premium_sway.sql"
    - "factory-core/migrations/0003_petite_jack_murdock.sql"
tech_stack:
  added: []
  patterns:
    - "Drizzle ORM schema nullable column: text('email') senza .notNull() per compatibilita lead preesistenti"
    - "drizzle-kit generate: aggiorna meta snapshot e produce SQL migration atomica"
key_files:
  created:
    - "rankame/factory-core/migrations/0003_premium_sway.sql"
    - "factory-core/migrations/0003_petite_jack_murdock.sql"
  modified:
    - "rankame/factory-core/src/db/schema.ts"
    - "rankame/factory-core/src/api/leads.ts"
    - "factory-core/src/db/schema.ts"
    - "factory-core/src/api/leads.ts"
decisions:
  - "Email nullable (nessun .notNull()) per compatibilita con lead preesistenti senza email in D1"
  - "Migration generata via drizzle-kit generate — non scritta manualmente — per garantire coerenza snapshot"
metrics:
  duration: "~10 minuti"
  completed: "2026-04-24"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
  files_created: 2
---

# Phase 01 Plan 01: Aggiunta colonna email a leads Summary

**One-liner:** Colonna email nullable aggiunta alla tabella leads in entrambi i factory-core con migration Drizzle 0003 e persistenza nel db.insert.

## Tasks Completati

| Task | Nome | Commit | File chiave |
|------|------|--------|-------------|
| 1 | Aggiungere colonna email a schema.ts + migration | 071e59b | schema.ts x2, migrations/0003 x2 |
| 2 | Persistere email nel db.insert di leads.ts | 80711da | leads.ts x2 |

## Cosa e stato fatto

### Task 1: Schema + Migration

In `rankame/factory-core/src/db/schema.ts` e `factory-core/src/db/schema.ts`, la tabella `leads` ora include:

```typescript
name: text('name'),
email: text('email'),   // <-- aggiunto
phone: text('phone'),
```

La colonna e nullable (no `.notNull()`) per garantire compatibilita con lead gia presenti in D1 privi di email.

`drizzle-kit generate` eseguito in entrambe le directory ha prodotto:
- `rankame/factory-core/migrations/0003_premium_sway.sql`
- `factory-core/migrations/0003_petite_jack_murdock.sql`

Entrambi contengono: `ALTER TABLE \`leads\` ADD \`email\` text;`

### Task 2: Persistenza nel db.insert

In `rankame/factory-core/src/api/leads.ts` e `factory-core/src/api/leads.ts`, il blocco `db.insert(leads).values({...})` ora include:

```typescript
name: name,
email: email,   // <-- aggiunto
phone: phone,
```

La variabile `email` era gia estratta dalla destructuring a linea 42 (`const { project_id, name, email, phone, message, project_name } = validation.data;`) e validata tramite `z.string().email()` nello schema Zod. Nessuna altra modifica al file.

## Deviations from Plan

None — piano eseguito esattamente come scritto.

## Known Stubs

None — i campi email sono ora completamente funzionali: validati (Zod), persistiti (db.insert), e presenti nello schema (Drizzle + migration SQL).

## Threat Flags

Nessun nuovo threat surface introdotto rispetto al threat model definito nel piano. Le tre minacce identificate (T-01-01, T-01-02, T-01-03) erano gia analizzate e accettate.

## Self-Check: PASSED

- [x] `rankame/factory-core/src/db/schema.ts` modificato — `email: text('email'),` presente a linea 30
- [x] `factory-core/src/db/schema.ts` modificato — `email: text('email'),` presente a linea 30
- [x] `rankame/factory-core/migrations/0003_premium_sway.sql` creato — contiene `ALTER TABLE \`leads\` ADD \`email\` text;`
- [x] `factory-core/migrations/0003_petite_jack_murdock.sql` creato — contiene `ALTER TABLE \`leads\` ADD \`email\` text;`
- [x] `rankame/factory-core/src/api/leads.ts` modificato — `email: email,` presente a linea 52
- [x] `factory-core/src/api/leads.ts` modificato — `email: email,` presente a linea 52
- [x] Commit 071e59b esiste (Task 1)
- [x] Commit 80711da esiste (Task 2)
- [x] Ordine colonne corretto: name → email → phone in schema.ts e leads.ts
- [x] Logica honeypot, Zod schema, GET /verify invariate
