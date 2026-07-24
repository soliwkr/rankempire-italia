# MERGE-PLAN.md (v2)
### Basato sullo stato REALE del repo locale · 24 luglio 2026
### Sostituisce la v1, tarata sul clone GitHub (non allineato al tuo disco)

> **Cosa cambia rispetto alla v1.** Gli screenshot del tuo VS Code mostrano che il repo
> locale contiene più lavoro di quello pubblicato, e che la cronologia commit smentisce
> `.planning`: **sei molto più avanti di Phase 5.**

---

## Verifiche già fatte (non rifarle)

| Cosa | Esito |
|---|---|
| `.env` tracciato da git? | ❌ No — `.gitignore` copre `.env` e `.env.*`. **Bene.** |
| Credenziali (`gcloud-key.json`, `client_secret.json`, `gmb_token.json`) in HEAD? | ❌ Nessuna |
| Credenziali nella storia del branch? | ❌ Nessuna traccia |
| `rankame`, `tools/local-business-builder` | ✅ Sono **submodule** git (mode 160000), non repo annidati per errore |
| `.gitmodules` | ⚠️ **ASSENTE** — submodule senza configurazione |
| `.claude/` | 362 file, **tutti** con prefisso `gsd-`. Zero personalizzazioni tue |

**Sulle credenziali:** l'allarme della v1 nasceva da `CONCERNS.md` (24/04), che citava
`client-mgc-reparation/gcloud-key.json`. Su questo branch non risultano né in HEAD né nella
storia. Verifica comunque sul tuo locale con `git log --all --diff-filter=A --name-only |
grep -iE "gcloud-key|client_secret|gmb_token"` (io vedo solo `gsd/refactor/refactor`). Se non
esce nulla: allarme rientrato, nessuna azione.

---

## Passo 1 — SALVA IL LAVORO APPESO (prima di tutto)

Dagli screenshot: branch `gsd/refactor/refactor`, **3 commit non pushati**, **7 file non
committati**, di cui due `.zip` non tracciati e due cancellazioni.

```bash
git status
git stash list
```

I `.zip` (`factory-core.zip`, `rankame.zip`) sono backup manuali: **non committarli**.
Le cancellazioni di `temp-debug` e `temp-template` sono giuste.

```bash
printf '\n# backup locali\n*.zip\n' >> .gitignore
git add -A
git commit -m "wip: salva lavoro non committato prima della riorganizzazione"
git push origin gsd/refactor/refactor
```

**Perché prima di tutto:** non si riorganizza un repo con lavoro appeso. Questo commit è la rete.

## Passo 2 — Ricostruisci lo stato REALE dai commit

`.planning` dice "Phase 5 non iniziata". I commit dicono altro:

| Dai commit | Fase roadmap | Stato dichiarato |
|---|---|---|
| Renter Auth API + middleware JWT | Phase 9 | ⏸ "non iniziata" |
| Isolated Renter Project API, multi-tenant | Phase 9 | ⏸ |
| R2 Media Storage & Proxy multi-tenant | — | — |
| Lead Management API (PATCH & Filter) | **Phase 6** | ⏸ |
| GoogleTrackingService: GSC + GA4 automation | **Phase 7** | ⏸ |
| `proof_sent_at` column + migration | **Phase 8** | ⏸ |
| notifyProofReady in TelegramService | **Phase 8** | ⏸ |
| Outreach Trigger in Lead Verification API | **Phase 8** | ⏸ |
| BatchGenerator multi-page | Phase 3 (est.) | ✅ |
| Dashboard Core Stats API + KPI | Phase 9 | ⏸ |
| Slug normalization accenti italiani | fix Phase 2 | ✅ |

**Sei intorno al 70-80%, non al 40%.** Le fasi di monetizzazione (6, 7, 8) hanno codice.

Il lavoro più prezioso della sessione, da far fare a Claude Code:

```
Leggi tutti i commit (git log --all --format="%h %ad %s" --date=short).
Confrontali con .planning/ROADMAP.md e .planning/STATE.md.
Dimmi fase per fase cosa risulta implementato NEL CODICE e cosa no.
Non fidarti di .planning: fidati dei file su disco e dei test che passano.
Poi riscrivi ROADMAP.md e STATE.md con lo stato reale.
```

**Criterio di verifica:** il commit non basta — il file deve esistere e i test passare.
Un "feat: implement X" può essere stato revertito o lasciato a metà.

## Passo 3 — Sistema i submodule

`rankame` e `tools/local-business-builder` sono submodule ma **manca `.gitmodules`**: git sa
che sono submodule ma non da quale URL clonarli. Su un clone pulito si rompono.

```bash
git submodule status
```

Due opzioni per ciascuno:

**A) Tienilo submodule** (se il codice è riusabile altrove e ha un remote):
```bash
git submodule add <url-repo> rankame
```

**B) Assorbilo nel repo principale** (più semplice, se serve solo qui):
```bash
git rm --cached rankame
rm -rf rankame/.git
git add rankame && git commit -m "chore: assorbe rankame nel repo principale"
```

Nota: `rankame/templates/astro-rank-rent-latest` ha modifiche non committate (visibili nel
Source Control). Salvale prima di toccare la struttura.

## Passo 4 — Rimozione GSD

Solo ora, con il lavoro salvato e lo stato ricostruito.

```bash
git checkout -b pulizia-tooling
rm -rf .claude .gemini .agent .opencode .gsd
rm -f .gsd-id
rm -rf grezzo-poi-cancella .planning-backup .planning.restart.bak
git add -A
git commit -m "chore: rimuove tooling GSD e cartelle temporanee"
```

Verificato: nessuna perdita, tutti i 362 file in `.claude/` erano `gsd-*`.

**Rinomina il branch** (ora è `gsd/refactor/refactor`, anche su origin):
```bash
git branch -m main
git push -u origin main
# GitHub → Settings → Branches → default branch = main
```

## Passo 5 — CLAUDE.md + strategia

Copia `CLAUDE.md` nella root, ma **aggiorna la sezione "stato reale"** con quanto emerso dal
Passo 2: la versione consegnata dice "fermo a Phase 5" e non è vero.

Importa da `strategia-sud-pontino.zip`:
```
strategia/
├── NETWORK-SUD-PONTINO.md
├── ENGINE.md
├── RIPRESA.md              ← correggi: non è al 40%
├── pitch-triplo-inevitabile.md
├── proposta-fondatore-inserto-dati-mercato.md
└── keyword/
```

## Passo 6 — Merge

```bash
git checkout main && git merge pulizia-tooling && git push
```

---

## Cosa NON fare

- **Non riscrivere factory-core.** Ha test, multi-tenancy, API dei lead. Funziona.
- **Non ricostruire il bot Telegram.** `TelegramService` è già dentro factory-core.
- **Non generare siti nuovi.** Nessuna nicchia nuova finché un sito non ha un inquilino pagante.
- **Non ripartire da Phase 5.** Prima scopri dove sei davvero (Passo 2).

## Il punto

Se il Passo 2 conferma quello che i commit lasciano intendere, hai **un sistema quasi completo
di lead generation multi-tenant, con proof package e outreach automatico**, fermo da tre mesi
per un incidente di tooling. Non ti manca codice: ti manca collegare un dominio, far girare i
lead, e chiamare un'impresa edile.

Il prossimo passo resta la telefonata — ma con un motore molto più avanti di quanto credessi.
