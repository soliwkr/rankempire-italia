# MARKET-INTEL.md
### Brief per il worker di ricerca di mercato (`rank-rent-market-intel`)
### Scritto il 24/07/2026 · da implementare quando serve, NON subito

> Questo documento fissa una decisione presa, non un lavoro da fare adesso.
> Leggilo prima di ricostruire il worker mancante.

---

## 1. Perché serve

Il worker `rank-rent-market-intel` è stato cancellato dall'account Cloudflare (verificato
24/07). Il bot Telegram lo chiama ancora (`MARKET_INTEL_URL`) → il comando `/intel` è rotto.

Ma il punto non è ripristinare quello che c'era: **la domanda che il worker deve rispondere
è cambiata.** Non "quanto traffico fa questa keyword" ma:

> **Quanti operatori si contendono questo mercato, e quanto è attaccabile la SERP?**

Motivo: autospurghi a Formia aveva domanda reale ma **un solo operatore** (Lombardi, che
copre da solo 8 comuni). 52 pagine generate, zero compratori possibili. Un tool basato sui
volumi non l'avrebbe mai rilevato. Un tool basato sulla densità sì, in 5 minuti.

## 2. Cosa deve restituire

Input: `{ nicchia, città }` → Output:

```json
{
  "operatori_attivi": 12,
  "verdetto_densita": "contendibile",        // <4 = "monopolio, scartare"
  "operatori": [{ "nome": "...", "rating": 4.9, "recensioni": 59 }],
  "serp": {
    "posizioni_directory": 6,                 // paginegialle, virgilio, prontopro...
    "posizioni_aziende_locali": 2,
    "posizioni_portali_nazionali": 2,
    "punteggio_attaccabilita": 0.8            // alto = SERP occupata da directory = terreno libero
  },
  "keyword_correlate": ["..."],               // da PAA e ricerche correlate
  "verdetto": "attaccare | valutare | scartare"
}
```

**La regola dei 4 operatori è il filtro principale**, e va applicata PRIMA di generare
qualsiasi pagina (cfr. `CLAUDE.md`, regola 1).

## 3. Fonti dati — cosa usare e perché

### Serper.dev — già configurato in `.env` ✅
- SERP organiche: chi ranka, in che ordine
- **People Also Ask** e ricerche correlate → keyword reali suggerite da Google
- Modulo **Google Maps** → schede locali strutturate (nome, rating, n. recensioni)
- Costo per query molto basso, chiave già presente. **Prima scelta.**

### Vertex AI con grounding — la ragione architetturale del market-intel ✅
**Crediti disponibili: 900 € fino al 2027.** Free tier:
- **Vertex AI Search: 10.000 query/mese gratis**
- **Gemini: 5.000 prompt di grounding/mese gratis** (grounding con Google Search)

Il grounding non è un optional: **è la ragione per cui il market-intel gira su Vertex anziché
sull'AI Gateway.** La generazione pagine (Gemini Flash, content bulk) resta su AI Gateway
Cloudflare — è un task di produzione testi che non ha bisogno di dati freschi. L'analisi di
mercato invece ha bisogno di dati reali e aggiornati (chi opera dove, quanti sono, che SERP
c'è adesso): il grounding con Google Search è ciò che li fornisce senza scraping.

**Due pipeline, due infrastrutture:**
| Pipeline | Modello | Dove gira | Perché |
|---|---|---|---|
| Generazione pagine sito | Gemini Flash | Cloudflare AI Gateway | Caching, rate limiting, logging. Nessun bisogno di dati freschi |
| Market intelligence | Gemini con grounding | Vertex AI (GCP) | Grounding con Google Search per dati reali. Coperto dai crediti |

Con 900 € sopra al free tier, l'analisi di mercato può girare quasi a costo zero per un anno.
Il repo ha già `vertex-auth.ts` funzionante (JWT RS256 + service account) → **copiare quello,
non riscriverlo**.

### Da NON usare
- **DataForSEO** — utile solo se servono i volumi veri. Per ora non sono il dato che blocca.
- **SerpApi** — fa le stesse cose di Serper, costa di più. Serper è già configurato.
- **Google Ads API / Keyword Planner API** — richiede developer token approvato da Google,
  che richiede un account Ads con spesa reale. Non vale il tempo per una ricerca esplorativa.
- **openseo self-hosted su VPS** — tutto lo stack self-hosted è deprecato per scelta
  (Hetzner, Dokploy, n8n, PostgreSQL). Riaccendere una VPS per un tool SEO va contro quella
  decisione. Valutare solo se emerge una funzione che sull'edge è davvero impossibile.

## 4. Architettura suggerita

Worker Cloudflare separato (`rank-rent-market-intel`), chiamato da:
- il bot Telegram (`/intel <nicchia> <città>`)
- `factory-core` prima di creare un progetto nuovo

```
POST /analyze  { niche, city }
  → Serper: SERP organica + Maps + PAA
  → classifica i domini in prima pagina (directory / locale / nazionale)
  → conta operatori distinti da Maps
  → applica la regola dei 4
  → Vertex Gemini con grounding Google Search per sintesi qualitativa
  → salva su D1 per storico
  → risponde JSON
```

**Storico su D1:** ogni analisi va salvata. La densità competitiva cambia nel tempo, e avere
la serie storica è lo stesso tipo di moat del time-series di `cercasa-db`.

## 5. Cosa NON fare

- **Non spostare la generazione delle pagine su Agent Builder.** È un batch che il worker fa
  già bene; ingabbiarlo in una piattaforma agentica aggiunge latenza, vincoli e lock-in senza
  guadagno. Lo stack è Cloudflare.
- **Non costruire il worker per "sfruttare i crediti".** I crediti valgono se si incastrano in
  qualcosa che serve già. Se ti fanno riscrivere l'architettura, sono costati più di quanto valgono.
- **Non costruirlo prima di avere un cliente pagante.** È il tool che serve per valutare la
  *prossima* nicchia — non per la prima vendita.

## 6. Quando costruirlo

Quando dovrai valutare la **terza nicchia**. Le prime due (immobiliare/ristrutturazioni con
Vittorio, rifiuti/metalli col contatto di Sessa Aurunca) hanno già l'analisi fatta a mano in
`strategia/NETWORK-SUD-PONTINO.md` e nel keyword brief.

A quel punto l'automazione si ripaga. Prima è infrastruttura in anticipo sul bisogno.

## 7. Contesto: le nicchie già analizzate a mano (24/07/2026)

| Nicchia | Operatori Formia | Verdetto |
|---|---|---|
| Ristrutturazioni / edili | 12+ | ✅ contendibile |
| Termoidraulica | 9 | ✅ |
| Elettricisti | 7 | ✅ |
| Climatizzazione / fotovoltaico | 6 | ✅ ticket alto |
| Studi tecnici | 6 | ✅ |
| Serramenti | 4 | ⚠️ soglia |
| Fabbri | 3 | ⚠️ debole |
| **Autospurghi** | **1** | ❌ **monopolio — archiviato** |
| Rifiuti / metalli | servizio pubblico dominante nel Sud Pontino, 4+ privati nel casertano | ✅ contatto già disponibile |

Questa tabella è il benchmark di riferimento per validare l'output del worker: se dice
"autospurghi Formia = contendibile", il worker è tarato male.
