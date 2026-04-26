# Phase 3: AI Content Generation - Discussion Log

> **Audit trail only.** Non usare come input per agenti di planning, research o execution.
> Le decisioni sono in CONTEXT.md — questo log preserva le alternative considerate.

**Date:** 2026-04-26
**Phase:** 03-ai-content-generation
**Mode:** discuss

---

## Invocazione & Timeout

| Opzione | Descrizione | Selezionata |
|---------|-------------|-------------|
| 105 call sequenziali | 1 call Gemini per pagina | |
| Batch per tipo (5-6 call) | 1 call Gemini per tipo, script chiama 5-6 volte | ✓ |
| Single mega-prompt | 1 call Gemini per tutto | |
| Script Node.js puro | Esterno al Worker, no timeout | |
| Cloudflare Queues | Async, background processing | |

**Decisione:** Batch per tipo — endpoint `?type=` chiamato da script. Ogni Worker request = 1 Gemini call.
**Motivazione utente:** "decidi tu" — scelto per assenza di rischio timeout + compatibilità futura con Phase 4 wizard.

---

## Blog Posts

| Opzione | Descrizione | Selezionata |
|---------|-------------|-------------|
| Numero fisso (3) | Hardcodato | |
| Numero fisso (5) | Hardcodato | |
| AI-determined | Gemini decide quanti e su quali argomenti | ✓ |

**Decisione:** AI-determined con floor ≥3 dal roadmap.
**Motivazione utente:** "non sarebbe la parte di intelligence a deciderlo?" — corretto, delegato a Gemini.

---

## Claude's Discretion

- Design interno PromptService
- Retry strategy per Gemini
- Come passare services/zones al Worker
- Struttura esatta dei prompt per tipo

---

## Upgrade Workers

**Nota:** Utente ha detto esplicitamente "se vale la pena fare upgrade workers, amen, faremo upgrade workers". Per Phase 3 non necessario (1 call per request). Annotato come opzione aperta per fasi future.
