# Keyword brief Sud Pontino — istruzioni

**2.155 keyword**, 7 nicchie, 8 comuni + 6 frazioni di Formia.
Generato dalla ricerca di mercato del 23-24/07/2026 (Google Places + SERP + ProntoPro).

## File

| File | Cosa | Uso |
|---|---|---|
| `keyword-brief-sud-pontino.csv` | Il brief completo con metadati | Apri in Excel/Sheets, ci incolli i volumi |
| `planner-batch/*.txt` | 7 liste secche, una per nicchia | Copia-incolla in Keyword Planner |

I file `.txt` sono già sotto il limite di 1.000 keyword per import del Planner.

## Procedura

1. **Google Keyword Planner** → *Scopri nuove keyword* → tab **Inizia con le keyword**
2. Incolla il contenuto di un file `planner-batch/*.txt`
3. Imposta località **Italia** (o Latina) e lingua **Italiano**
4. Scarica il CSV dei risultati
5. Ripeti per le 7 nicchie
6. Rimandami i CSV scaricati: incrocio i volumi col brief e ti restituisco il piano
   editoriale prioritizzato per valore reale

**Alternativa più veloce:** se usi Ahrefs (Keywords Explorer accetta liste), stessa cosa
ma ottieni anche KD (difficoltà) e SERP. Meglio per decidere l'ordine di pubblicazione.

## Colonne del CSV

| Colonna | Significato |
|---|---|
| `Priorita nicchia` | 1 = attaccare per prima (densità operatori alta) |
| `Operatori a Formia` | Quanti concorrenti reali. **<4 = niente mercato per il lead** |
| `Tipo keyword` | core / commerciale / comparativo / emergenza / iperlocale / informazionale |
| `Fascia` | core (Formia→Itri) · espansione (Fondi, Castelforte, S. Cosma) · nazionale |
| `Tipo pagina` | Pagina servizio×città · Pagina frazione · Articolo blog |
| `Volume mensile`, `Concorrenza`, `CPC` | **Vuote — le riempi tu col Planner** |
| `Priorita finale` | Da calcolare dopo: volume × intento ÷ difficoltà |

## Come leggere i tipi di keyword

- **emergenza** (`idraulico urgente Formia`) — massimo intento, chiama subito. Volume basso,
  conversione altissima. Il lead vale di più.
- **commerciale** (`preventivo ristrutturazione bagno Gaeta`) — sta chiedendo un prezzo.
  È il cuore del lead-gen.
- **core** (`impresa edile Formia`) — testa della nicchia, più volume e più concorrenza.
- **iperlocale** (`ristrutturazione casa Maranola`) — volume quasi nullo ma concorrenza zero:
  ranki in settimane, e chi cerca così è a un passo dal chiamare.
- **informazionale** (`quanto costa ristrutturare casa al mq`) — TOFU, porta traffico e
  autorità al dominio, non conversione diretta.

## Cosa aspettarsi dai volumi

Su comuni da 30-40k abitanti la maggior parte delle keyword geo darà **0-10 ricerche/mese**
o "volume non disponibile". **Non è un fallimento del brief.** In locale il valore sta nella
somma della coda lunga e nel tasso di conversione, non nel volume della singola query.

Regola pratica: se una nicchia ha ≥20 keyword con volume ≥10, il mercato c'è.

## Attenzione — due cose emerse dalla ricerca

1. **"Edilpro" è un'azienda reale** (rivenditore edile, lungomare Caboto, Gaeta).
   Il brand inventato su `ristrutturazioniformia.it` va cambiato prima del go-live.
2. **Autospurghi è escluso dal brief**: 1 solo operatore su 8 comuni (Lombardi) = monopolio,
   nessun compratore per il lead. Vedi NETWORK-SUD-PONTINO.md §2.
