# CLAUDE.md

Contesto permanente del progetto. Claude Code legge questo file a ogni sessione.
Aggiornalo quando cambia lo stato, non quando cambia l'umore.

---

## Chi sono / cosa sto costruendo

Solopreneur, Studio Pura Luce (P.IVA IT02996460594), Formia (LT).
Costruisco una **rete di lead generation locale (rank & rent) sul Sud Pontino**: portali
iper-locali, uno per nicchia, che catturano domanda su 8 comuni e la consegnano **in
esclusiva** a un operatore per nicchia per territorio.

Bacino: Formia, Gaeta, Minturno, Scauri, Itri, Fondi, Castelforte, Santi Cosma e Damiano.

Stack: **solo Cloudflare edge** (Workers, Pages, D1, R2, KV, Queues, Workflows).
Niente self-hosted: Hetzner/Dokploy/Directus/n8n/PostgreSQL sono deprecati.
Preferisco risposte diritte, in italiano, senza giri di parole né complimenti.

## Lo stato reale (aggiornato 24/07/2026)

**Il dato che conta: 7 sistemi rank-and-rent costruiti in 5 mesi. 0 lead. 0 renters. 0 clienti fatturati.**
Il collo di bottiglia non è mai stato tecnico. Le fasi che mancano sono di monetizzazione.

| Asset | Stato |
|---|---|
| `rankempire-italia` | **Questo repo.** Il motore. 4 fasi su 10, fermo a Phase 5 (custom domain go-live) |
| `astro-rank-rent` | Template ufficiale dei siti (ha `src/lib/slug.ts`, aggiornato 10/07) |
| `ristrutturazioniformia.it` | Dominio **già indicizzato** (335 impression, pos. media 6,9). Guscio: contenuti falsi da rimuovere |
| `agenziaimmobiliareformia.it` | Sito nuovo pronto (Astro + D1 lead). Cliente ★ fondatore: Vittorio Piscitelli |
| `rr-autospurghi-formia` | 52 pagine buone ma **archiviato**: 1 solo autospurghista su 8 comuni = nessun compratore |
| `cercasa-db` | 799 annunci storici osservati; backfill micro-zone verificato. Ultima evidenza D1: 22 luglio. Recovery runtime preservata; ingest corrente **non provato operativo** |

## Le regole (non negoziabili)

1. **Regola dei 4 operatori.** Prima di generare un solo file per una nicchia: contare gli
   operatori attivi sul territorio (Google Places). **Meno di 4 = nessun mercato per il lead,
   si passa oltre.** Questa regola ha già salvato 52 pagine sprecate su autospurghi.
2. **Niente contenuti falsi. Mai.** Zero recensioni inventate, zero prova sociale simulata
   ("Luigi da Gaeta — poco fa"), zero scarsità falsa ("solo 3 posti rimasti"), zero
   segnaposto in produzione (`${...}`, `XXXXXXXXXX`, `800 123 456`, `via.placeholder.com`).
   Sono pratiche commerciali scorrette (Cod. Consumo) e distruggono l'unica cosa che mi
   distingue: la conformità come prodotto. La build deve fallire se ne trova.
3. **Il lead si scrive su D1 PRIMA di qualsiasi inoltro.** Il contatore lead è ciò che vendo
   all'inquilino. Un lead perso è una prova persa.
4. **Il portale resta mio.** L'esclusiva si vende sui **lead**, mai sulla proprietà dell'asset.
5. **Un nodo alla volta.** Il sito N+1 si costruisce quando il sito N ha un inquilino
   **pagante**. Non "quando funziona": quando incassa.
6. **Niente GSD, niente framework di orchestrazione.** Solo Claude Code. Il progetto è
   deragliato ad aprile per conflitto di tooling (model lock-in, rate limit, stato
   desincronizzato). Vedi `strategia/RIPRESA.md`.

## Come lavorare con me in questo repo

- **Un passo alla volta.** Mostrami il diff prima di committare. Non riscrivere mezzo
  progetto mentre guardo altrove.
- **Aggiorna `.planning/` a mano.** ROADMAP e STATE sono markdown: quando una fase avanza,
  scrivilo. È la disciplina che il GSD prometteva e non ha mantenuto.
- **Le decisioni si scrivono nei docs.** Se una sessione produce una scelta importante,
  finisce in `strategia/` o in `.planning/`. Le decisioni dette a voce si perdono.
- **Non "migliorare al volo".** Se durante un lavoro noti altro da sistemare, dillo e
  segnalo — non farlo nello stesso commit.

## Dove sta cosa

```
.planning/     roadmap, stato, fasi, forensics  ← aggiornare a mano
strategia/     network, engine, pitch, keyword brief
factory-core/  l'API della factory (Hono + D1)
template/      il template Astro dei siti generati
```

I **siti** restano repo separati (ognuno ha il suo deploy e dominio). Qui c'è il cervello.

## Prossimo passo

Non è codice. È la prima telefonata a un'impresa edile di Formia — 12 operatori attivi,
mercato contendibile, dominio già indicizzato. Vedi `strategia/NETWORK-SUD-PONTINO.md`.
