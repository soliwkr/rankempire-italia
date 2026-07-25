# OUTREACH.md
### Acquisizione clienti — piano in due fasi
### Riscrive la sezione outreach del BUSINESS_PLAN originale · 25 luglio 2026

> Il business plan originale aveva il **come** giusto (ghost lead, avatar, tripla firma) ma
> presupponeva di poter vendere subito. Il vincolo reale è diverso: **trasloco a Monte San
> Biagio a fine settembre.** Acquisire clienti da servire a stretto contatto *prima* del
> trasloco significa prenderli nel momento peggiore per seguirli.
>
> Quindi: **accumulo di asset fino a settembre, outreach da ottobre.** Non è rinvio — è che
> alcuni asset valgono di più proprio perché iniziano ora, e la vendita vale di più dopo.

---

## PARTE I — Fase di accumulo (luglio → settembre)

### Il principio

Ci sono asset che **maturano col tempo e non si recuperano a posteriori**. Iniziarli oggi
vale più che iniziarli a ottobre, indipendentemente da quando venderai. Ogni giorno in cui
non girano è valore perso per sempre.

Il criterio di successo di questa fase **non è "quanti clienti"** ma:

> Quanti asset sono **online e stanno producendo dati**.
> Un sistema costruito e non deployato non conta. Un cron fermo non conta.

### Gerarchia degli asset per valore composto

| # | Asset | Perché ora | Costo |
|---|---|---|---|
| 1 | **Time-series `cercasa-db`** | Storia di mercato non scrapabile retroattivamente. Cresce da solo. **Fermo dal 2 luglio** | mezz'ora |
| 2 | **Domini indicizzati in GSC** | Un dominio che entra oggi ha 3 mesi di autorità in più a ottobre | 1 giorno per sito |
| 3 | **Lead loggati su D1** | Il contatore è ciò che si vende. Zero lead in 5 mesi = nessuna prova | già costruito |
| 4 | **Motore (fasi 7-10)** | Non guadagna nulla ad essere anticipato, ma è lavoro tecnico che si fa bene nel caos | settimane |

**L'ordine non è negoziabile:** 1 e 2 hanno valore composto, 3 dipende da 2, 4 no.

### Obiettivi misurabili al 30 settembre

- [ ] Cron `cercasa-scraper` attivo e ininterrotto, normalizzazione per zona corretta
- [ ] ≥ 60 giorni di time-series continuo per micro-zona
- [ ] `ristrutturazioniformia.it` ripulito dai falsi, online, in GSC
- [ ] `agenziaimmobiliareformia.it` online, in GSC
- [ ] Form lead attivi su entrambi, con log su D1 **prima** dell'inoltro
- [ ] ≥ 1 lead reale loggato (anche uno solo: dimostra che il circuito è chiuso)

Se a fine settembre questi punti sono verdi, arrivi all'outreach con **un contatore, non una
promessa** — che è l'inverso di partire con un sito nuovo.

### Vincolo di qualità (blocca il go-live)

`ristrutturazioniformia.it` non va online finché contiene: recensioni inventate, prova sociale
simulata, scarsità falsa ("solo 3 posti rimasti"), telefoni o P.IVA fittizi, immagini
placeholder. E il brand "Edilpro" va cambiato: è un'azienda reale (rivenditore edile,
lungomare Caboto, Gaeta).

Non è pedanteria: sono pratiche commerciali scorrette, e contraddicono l'unico
posizionamento che ti distingue.

---

## PARTE II — Fase di acquisizione (da ottobre)

### Il principio

**Non vendere un servizio. Consegnare un cliente.**

L'artigiano non compra "SEO" o "lead generation": compra il telefono che squilla. Ogni
contatto arriva con qualcosa già in mano.

Gerarchia della prova, dalla più forte alla più debole:

1. **Lead reale già consegnato** (ghost lead) — imbattibile. Richiede un sito che ranka:
   **disponibile da ottobre proprio grazie alla Parte I**
2. **Dato sul suo mercato** che lui non ha (prezzi/mq, densità, volumi) — funziona subito
3. **Dato sul suo concorrente** — tocca la paura di perdere, più forte dell'ambizione
4. Promessa di risultati — non funziona, è quello che fanno tutti

### I tre avatar (dal business plan — confermati)

| Avatar | Chi è | La sua paura | Cosa gli vendi |
|---|---|---|---|
| **A — In difficoltà** | telefono muto | non arrivare a fine mese | chiamate, subito |
| **B — Scettico** | scottato da agenzie/ProntoPro | essere fregato di nuovo | prova senza rischio |
| **C — Ambizioso** | già investe | restare fermo mentre altri crescono | nuove città, esclusiva |

- **A** → «Ti giro una richiesta arrivata stamattina. Se ti interessa ce ne sono altre.»
- **B** → «Hai mai usato ProntoPro? Paghi 25 € per parlare con uno che sta sentendo altri
  quattro. Da me il contatto è solo tuo, e i primi te li giro gratis.»
- **C** → «Hai Formia. Gaeta e Minturno sono libere. Le vuoi prima che le prenda un altro?»

### Cosa è legale in Italia

Il cold outreach **B2B è consentito** sul legittimo interesse (art. 6.1.f GDPR), senza
consenso preventivo, con informativa e opt-out facile. Il Registro Pubblico delle Opposizioni
riguarda il B2C.

**Il punto che riguarda i tuoi target:** ditte individuali e liberi professionisti sono
trattati come **persone fisiche**. Email al loro indirizzo personale → serve consenso.
Email a `info@` di una società → no.

| Canale | Legale? | Note |
|---|---|---|
| Visita fisica | ✅ sempre | Nessun trattamento dati. Il più forte in provincia |
| WhatsApp a numero pubblico aziendale | ✅ | Individuale e pertinente. Mai broadcast |
| Telefonata a numero pubblico | ✅ | Orari lavorativi, tracciare le opposizioni |
| DM a profilo social aziendale | ✅ | Individuale, non automatizzato |
| Email a `info@` di società | ✅ | Con informativa in calce + opt-out |
| Email a indirizzo personale di ditta individuale | ❌ | Serve consenso |
| Invio massivo automatizzato | ❌ | Sproporzionato anche in B2B; brucia il dominio |

**La conformità qui non è un vincolo: è il prodotto.** Vendi TROVATEMI su anti-gating e
rispetto delle regole. Una segnalazione al Garante non costa una multa: costa il posizionamento.

### Informativa per le email B2B

> *Informativa ex artt. 13-14 GDPR: Studio Pura Luce (P.IVA IT02996460594) tratta i vostri
> dati di contatto aziendali, raccolti da elenchi ed archivi pubblici, per inviarvi
> comunicazioni commerciali relative a servizi ritenuti di vostro interesse. Base giuridica:
> legittimo interesse al marketing B2B. I dati non sono comunicati a terzi né trasferiti fuori
> UE. Per non ricevere più comunicazioni, rispondete con "STOP".*

### La tripla firma — attribuzione a prova di disputa

Dal business plan, e va tenuta: è ciò che rende difendibile il modello.

1. **Numero dedicato** sul sito → ogni chiamata tracciabile
2. **Form con log su D1** prima di qualsiasi inoltro → timestamp, pagina, contenuto
3. **Parametro di provenienza** → percorso documentato

Elimina il «tanto mi avrebbe chiamato lo stesso» prima che venga detto.

### Il filtro che precede ogni nicchia

**Regola dei 4 operatori.** Meno di 4 operatori attivi sul territorio = nessun compratore
possibile. Il business plan assumeva «ogni città ha 20+ idraulici»; a Formia c'è **un solo
autospurghista** che copre otto comuni — 52 pagine generate, zero compratori. La regola è la
patch a quel presupposto.

---

## I due contatti già in mano (da lavorare da ottobre)

**Vittorio Piscitelli** — Agenzia Immobiliare Italia, Formia. Cliente ★ fondatore a €0.
Il patto prevede la conversazione al giorno 90. Il pitch ★★★ è scritto
(`pitch-triplo-inevitabile.md`). Prerequisito: il portale immobiliare deve avere pagine
indicizzate — cioè la Parte I.

**Contatto Sessa Aurunca** — smaltimento rifiuti e commercio metalli, tutte le autorizzazioni,
copre da Caserta a Roma. Rapporto personale già esistente.
È il caso migliore del modello: **un solo inquilino può prendersi decine di città** senza
conflitti di esclusiva. Da non toccare commercialmente durante transazioni in cui sei tu il
cliente; da riprendere a ottobre con dati veri sul suo mercato.

## Cosa NON fare

- Non acquisire clienti da servire a stretto contatto prima del trasloco
- Non aspettare il ghost lead per costruire gli asset che lo rendono possibile
- Non mandare email a indirizzi personali di ditte individuali
- Non automatizzare l'invio massivo, in nessun canale
- Non promettere posizionamenti o guadagni: promettere solo ciò che è già successo
- Non considerare "fatto" un sistema che non è online e non produce dati
