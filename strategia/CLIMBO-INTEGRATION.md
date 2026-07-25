# CLIMBO-INTEGRATION.md
### Climbo come parte integrante della factory — architettura
### Basato sull'API reale (doc.climbo.com/llms.txt) e sul codice di factory-core · 25 luglio 2026

> **Decisione:** ogni sito rank-and-rent creato dalla fabbrica ha una corrispondente
> **location Climbo**, con un piano dedicato. Climbo gestisce ciò che a factory-core manca —
> consegna multicanale del lead, follow-up, e (quando c'è il tenant) reputazione.
> **La raccolta lead resta su D1. Climbo non raccoglie: riceve, instrada, traccia.**

---

## 1. Il principio invariante

Un solo registro canonico dei lead: **D1**. È ciò che rende difendibile l'attribuzione
("questo lead te l'ho portato io"). Climbo riceve il lead **già registrato**, con l'ID D1
come riferimento. Due sistemi, un riferimento univoco, nessuna divergenza.

```
form sito → factory-core → D1 (verità)  →  Climbo (consegna + follow-up + reputazione)
                            │                        │
                            └── verificationToken    └── contact.note = leadId D1
```

## 2. Il modello dati Climbo (dalla API)

Climbo ragiona in gerarchia: **business → location → contact**.

**Mapping deciso:** un **sito rank-and-rent = una location Climbo.**
Non "un inquilino = una location", perché un sito esiste (e produce lead) *prima* di avere
un inquilino. La location nasce con il sito; il tenant si aggancia dopo.

| Entità factory-core | Entità Climbo | Quando nasce |
|---|---|---|
| `project` (sito RR) | `location` | alla creazione del sito |
| `lead` (verified) | `contact` nella location | quando `doiStatus → verified` |
| `renter` (tenant) | destinatario campagne | quando il sito è affittato |

## 3. Endpoint Climbo che useremo (verificati nella doc)

| Uso | Endpoint |
|---|---|
| Creare la location quando nasce il sito | `POST` Add New Location |
| Iniettare il lead verificato | Create a location contact (singolo o array ≤100, richiede phone o email) |
| Salvare l'ID D1 sul contatto | Update a location contact |
| Consegna al tenant + follow-up | Create and schedule campaign (canali: SMS, Email, WhatsApp) |
| Template messaggi per canale | Create template |
| **(fase tenant)** invito recensione | Send review requests |
| **(fase tenant)** metriche GBP | Get Google Business Profile performance metrics |

## 4. Il punto di innesto nel codice — è già lì

In `src/api/leads.ts`, endpoint `/verify` (riga ~155): quando il lead passa a `verified`,
c'è **già** un blocco try/catch che manda la notifica Telegram. Climbo si aggancia **nello
stesso punto, con la stessa forma** — non serve reingegnerizzare il flusso.

```
lead verified
  ├── (già presente) notifica Telegram a Chris
  └── (nuovo) ClimboService:
        1. crea/trova il contact nella location del progetto
        2. salva leadId D1 nel contact (note o campo custom)
        3. se il progetto ha un renter → campagna di consegna sul canale del tenant
```

**Regola di robustezza:** la chiamata Climbo va in un try/catch separato da quello Telegram.
Se Climbo è giù, il lead resta comunque su D1 e la notifica Telegram parte lo stesso.
Climbo è un consumatore a valle, mai un single point of failure sul percorso del lead.

## 5. Modifiche schema necessarie

Tabella `projects` — aggiungere:
- `climboLocationId` (text, nullable) — la location Climbo del sito

Tabella `leads` — aggiungere:
- `climboContactId` (text, nullable) — il contact creato a valle (per idempotenza: se già
  presente, si aggiorna invece di duplicare)

Nessuna delle due tocca il percorso esistente: sono campi additivi.

## 6. ClimboService — nuovo servizio

`src/services/climbo.ts`, stessa forma degli altri service (`telegram.ts`, `github.ts`):

```
class ClimboService {
  constructor({ apiKey })
  createLocation(project)        → ritorna climboLocationId
  upsertContact(locationId, lead) → crea o aggiorna, ritorna climboContactId
  sendDeliveryCampaign(locationId, contactId, channel, template)
}
```

Secret nuovo: `CLIMBO_API_KEY` (via `wrangler secret put`, mai in `wrangler.toml`).

## 7. Il ciclo di vita completo, con Climbo dentro

```
[1] Crea progetto (factory-core)
      └── crea location Climbo → salva climboLocationId
[2..5] Genera, deploy, dominio, sito live   (invariato)
[6] Lead arriva → D1                          (invariato, resta la verità)
[7] DOI verificato
      ├── D1: doiStatus = verified            (invariato)
      ├── Telegram a Chris                     (invariato)
      └── Climbo: upsert contact con leadId D1
[8] SE il sito ha un tenant:
      └── Climbo: campagna di consegna al tenant (WhatsApp/SMS/Email)
          + eventuale follow-up + invito recensione sul GBP del tenant
```

Prima del tenant (fase speculativa), Climbo accumula i contatti. Quando arriva il tenant,
la storia dei lead è già lì da consegnare — è parte del proof.

## 8. Cosa Climbo NON fa (i confini)

- **Non raccoglie lead.** Nessun form Climbo sui siti. La raccolta è solo D1.
- **Non pubblica blog automatico** bypassando il quality gate. Gli articoli restano nella
  pipeline factory-core (`BatchGenerator.includeBlog`), se e quando servono.
- **Non genera recensioni finte né social di imprese inesistenti.** La reputazione si attiva
  solo con un tenant reale, su clienti reali, sul GBP del tenant.
- **Non è un single point of failure.** Ogni sua chiamata è a valle e in try/catch isolato.

## 9. Fasatura — quando implementare

Questo è lavoro di **Fase B** (monetizzazione, da ottobre), NON di Fase A.

Motivo: la consegna al tenant e il follow-up servono quando c'è un tenant. In Fase A
(accumulo, fino a settembre) il lead lo ricevi tu su Telegram e basta — non c'è nessuno a cui
consegnarlo. Costruire l'integrazione ora sarebbe infrastruttura in anticipo sul bisogno.

**L'unico pezzo che ha senso anticipare**, se vuoi: creare la location Climbo alla nascita
del sito (punto 1), così quando arriva il tenant la storia dei contatti è già accumulata.
Ma solo se non ti distrae dagli obiettivi di Fase A (siti online, lead che circolano).

## 10. Nota sul valore reale

L'API Climbo è nata per la reputazione (review, GBP, employee, leaderboard). La parte che
usiamo qui — contact + campagne multicanale — è solida ma è una porzione del prodotto. Va
benissimo usarne un pezzo: la licenza lifetime è già pagata, e il costo operativo per
location è ~€4-5. Ma non c'è obbligo di usare il resto solo perché esiste. La reputazione
si aggiunge quando c'è il tenant, non prima.
