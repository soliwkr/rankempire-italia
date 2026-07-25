# PIANO TECNICO — Fase A2: debiti bloccanti sul percorso del lead
### Verificato leggendo il codice su `main` (commit `b171407`) · 25 luglio 2026
### Da eseguire in Claude Code, dentro `factory-core/`

> **Perché adesso:** questi difetti stanno sul percorso che va dal form al lead notificato.
> Vanno chiusi **prima** di mettere online qualsiasi sito, altrimenti raccogli richieste
> che non arrivano a destinazione. Il TASK 1 in particolare non è un rischio teorico:
> l'ho verificato nel codice, è un bug attivo.

---

## TASK 1 — 🔴 CRITICO: il link di verifica DOI è rotto

**Ogni lead che arriva viene perso.** Confermato leggendo il codice, non ipotizzato.

### La catena del bug

```
src/index.ts:41        app.route('/api/leads', leadsApi);
src/api/leads.ts:135   api.get('/verify', ...)
                       → endpoint reale: /api/leads/verify

wrangler.toml:20       VERIFICATION_BASE_URL = "https://factory-core.soliwkr.workers.dev/verify"
src/services/email.ts:15
                       const verificationUrl = `${this.config.verificationBaseUrl}?token=${token}`
                       → link generato: .../verify?token=XXX     ❌ 404
```

### L'effetto a cascata

1. L'utente compila il form → il lead **viene salvato** su D1 con `doiStatus: 'pending'` ✅
2. Riceve l'email con un link che punta a `/verify` → **404**
3. `doiStatus` resta `pending` per sempre
4. Il blocco Telegram in `leads.ts:162` non viene mai raggiunto → **nessuna notifica**
5. `notifyProofReady` non parte mai → **nessun proof package**

Il lead c'è in D1 ma nessuno lo sa. Il contatore — cioè la cosa che vendi — resta a zero.

### Il fix

In `factory-core/wrangler.toml` riga 20:

```toml
VERIFICATION_BASE_URL = "https://factory-core.soliwkr.workers.dev/api/leads/verify"
```

### Verifica di accettazione (obbligatoria, non basta il deploy)

```bash
# 1. crea un lead di test con la tua email vera
curl -X POST https://factory-core.soliwkr.workers.dev/api/leads \
  -H "Content-Type: application/json" \
  -d '{"project_id":"<id-progetto-reale>","name":"Test","email":"<tua-email>","phone":"3331234567","message":"test DOI"}'

# 2. apri l'email, clicca il link → deve rispondere, non 404
# 3. controlla che il lead sia passato a verified
npx wrangler d1 execute factory-db --remote \
  --command "SELECT id, email, doi_status, status FROM leads ORDER BY created_at DESC LIMIT 1"
```

**Fatto quando:** `doi_status = 'verified'` **e** è arrivata la notifica Telegram.
Se il DB dice verified ma Telegram tace, il problema è nei secret `TELEGRAM_BOT_TOKEN` /
`TELEGRAM_CHAT_ID` del worker — vanno controllati (ricorda che il token è stato rigenerato).

---

## TASK 2 — Validare `project_id` (lead orfani)

`src/api/leads.ts:96-130`: il `project_id` arriva dal body, passa lo schema Zod, e viene
inserito senza verificare che il progetto esista.

**Conseguenze:** chiunque può creare lead per progetti inesistenti; e la `innerJoin` in
`/verify` non trova nulla → quei lead non si verificano mai (falliscono in silenzio,
stesso sintomo del TASK 1).

**Fix:** dopo la validazione Zod e prima dell'insert, controllare che il progetto esista.
Se non esiste → `404` con messaggio chiaro. Aggiungere un test.

---

## TASK 3 — Rate limiting sul form lead

Endpoint `POST /api/leads` pubblico e senza limiti. L'honeypot (`body.website_url`) ferma
i bot ingenui, non un attacco vero.

**Fix consigliato:** limite per IP (`CF-Connecting-IP`) su finestra breve — es. 5 invii /
10 minuti. Opzioni, in ordine di semplicità:
1. Cloudflare Rate Limiting Rules dal dashboard (zero codice, preferibile)
2. KV con TTL
3. Durable Object (sovradimensionato qui)

**Nota:** valutare anche un limite per `project_id`, così un solo sito sotto attacco non
riempie il DB.

---

## TASK 4 — L'invio email non deve far fallire la richiesta

`src/api/leads.ts:128-131`: `await emailService.sendVerificationEmail(...)` non è in
try/catch. Se Resend è giù o la chiave scade, la POST risponde **500** — ma **il lead è già
stato scritto su D1**. L'utente vede un errore, ricompila, e ottieni lead duplicati.

**Fix:** avvolgere l'invio in try/catch. Se fallisce: loggare, salvare lo stato (es. un
campo `emailStatus` o riusare `status`), e rispondere comunque `201`.

Il principio invariante resta rispettato — D1 prima di tutto — ma va reso esplicito anche
nella risposta all'utente.

---

## TASK 5 — Rimuovere codice morto

`src/services/cloudflare-pages.ts` definisce `CloudflarePagesService`, che **nessun file di
produzione importa** (verificato con grep; solo il suo test lo referenzia). È residuo dello
switch Pages → Workers, ora fatto da `cloudflare-workers.ts`.

**Fix:** eliminare `cloudflare-pages.ts` e `cloudflare-pages.test.ts`.

---

## TASK 6 — I 4 test rotti

Dall'audit: 2 mock di batch generation, 1 import di `google-analytics` non più esistente,
1 setup `app` mancante. Nessuno indica un bug in produzione.

I due sui mock falliscono perché i fixture hanno `body` sotto i 200 caratteri e il quality
filter — correttamente — li scarta. **Il fix è nei fixture, non nel quality check:** allungare
i testi dei mock oltre la soglia.

**Fatto quando:** `npx vitest run` → 106/106.

---

## Ordine di esecuzione

1. **TASK 1** — da solo, con verifica E2E completa prima di procedere
2. TASK 2 e TASK 4 — insieme, toccano lo stesso handler
3. TASK 5 — indipendente, due minuti
4. TASK 3 — se scegli le regole Cloudflare, è lavoro da dashboard
5. TASK 6 — per ultimo, non blocca nulla

Un commit per task. Diff mostrato prima di ogni commit.

---

## Criterio di chiusura della Fase A2

Un lead inviato dal form arriva a: **riga in D1 → email ricevuta → link cliccato →
`doi_status = verified` → notifica Telegram sul telefono.**

Finché quella catena non è verificata **davvero, con un lead reale**, nessun sito va online.
Non è pedanteria: è che un portale che raccoglie richieste invisibili è peggio di un portale
che non esiste — perché ti fa credere di non avere domanda.

## Cosa NON fare in questo giro

- Non toccare `batch-generator.ts` (appena rifattorizzato, funziona)
- Non aggiungere funzionalità nuove: qui si ripara il percorso del lead
- Non rifattorizzare il quality check per far passare i test — sono i test a essere vecchi
