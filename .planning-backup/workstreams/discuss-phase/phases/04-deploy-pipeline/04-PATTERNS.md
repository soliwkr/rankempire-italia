# Phase 4: Deploy Pipeline - Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 6
**Analogs found:** 6 / 6

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `factory-core/src/services/github.ts` | service | request-response | `factory-core/src/services/ai.ts` | exact |
| `factory-core/src/api/projects.ts` | controller | request-response + CRUD | `factory-core/src/api/seed.ts` | exact |
| `factory-core/src/services/cloudflare-pages.ts` | service | request-response | `factory-core/src/services/email.ts` | role-match |
| `factory-core/migrations/0004_add_deploy_columns.sql` | migration | batch | `factory-core/migrations/0003_petite_jack_murdock.sql` | exact |
| `factory-core/src/db/schema.ts` | model | CRUD | sé stesso (estensione) | exact |
| `factory-core/wrangler.toml` | config | — | sé stesso (estensione) | exact |

---

## Pattern Assignments

### `factory-core/src/services/github.ts` (service, request-response) — MODIFICA

**Analog principale:** `factory-core/src/services/ai.ts`

**Problema da risolvere:** rimuovere hardcode di `templateOwner`/`templateRepo` nel costruttore e sostituire `sleep(2000)` con retry loop su `GET /repos/{owner}/{repo}`.

**Imports pattern — pattern attuale da mantenere** (lines 1–5, github.ts):
```typescript
export interface GitHubConfig {
  token: string;
  templateOwner: string;
  templateRepo: string;
}
```
Aggiungere al costruttore che i valori vengono ora dall'esterno (già struttura corretta — nessuna modifica all'interfaccia, solo il chiamante passa env var invece di stringhe hardcoded).

**Config injection pattern — come AiConfig** (lines 1–6, ai.ts):
```typescript
export interface AiConfig {
  apiKey: string;
  accountId: string;
  gatewayName: string;
  gatewayToken?: string;
}
export class AiService {
  constructor(private config: AiConfig) {}
```
Copiare struttura: `GitHubConfig` già ha la forma giusta. Il costruttore nel chiamante (`projects.ts`) dovrà passare `c.env.GITHUB_TEMPLATE_OWNER` / `c.env.GITHUB_TEMPLATE_REPO` invece di stringhe hardcoded.

**Retry loop pattern — da implementare in `createProjectRepo`** (nessun analogo codebase — pattern da CONTEXT D-09):
```typescript
// Dopo createProjectRepo, prima di createFile:
// max 10 tentativi, 500ms intervallo
async function waitForRepo(
  owner: string,
  repo: string,
  token: string,
  maxAttempts = 10,
  intervalMs = 500
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Rank-and-Rent-Factory-Core'
      }
    });
    if (res.ok) return true;
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  return false;
}
```

**Error pattern — copiare da github.ts esistente** (lines 29–31, github.ts):
```typescript
if (!response.ok) {
  const error = await response.text();
  throw new Error(`GitHub API error: ${response.status} ${error}`);
}
```

---

### `factory-core/src/api/projects.ts` (controller, request-response + CRUD) — RISCRITTURA ENDPOINT DEPLOY

**Analog principale:** `factory-core/src/api/seed.ts`

**Imports pattern** (lines 1–6, seed.ts):
```typescript
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { projects, pages } from '../db/schema';
```
Per `projects.ts` Phase 4:
```typescript
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { projects } from '../db/schema';
import { GitHubService } from '../services/github';
import { CloudflarePagesService } from '../services/cloudflare-pages';
```

**Bindings type — estendere quello di index.ts** (lines 9–20, index.ts):
```typescript
type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  GITHUB_TOKEN: string;
  GOOGLE_AI_API_KEY: string;
  CF_ACCOUNT_ID: string;
  CF_AI_GATEWAY_NAME: string;
  CF_AI_GATEWAY_TOKEN: string;
  EMAIL_FROM: string;
  RESEND_API_KEY: string;
  API_SECRET: string;
};
```
Aggiungere in `projects.ts` le nuove binding:
```typescript
type Bindings = {
  DB: D1Database;
  GITHUB_TOKEN: string;
  GITHUB_TEMPLATE_OWNER: string;
  GITHUB_TEMPLATE_REPO: string;
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  FACTORY_API_URL: string;
};
```

**State machine D1 — pattern da seed.ts** (lines 166–175, seed.ts):
```typescript
const db = drizzle(c.env.DB);
let project: any;
try {
  project = await db.select().from(projects).where(eq(projects.id, projectId)).get();
} catch (err: any) {
  console.error('[seed] DB query error:', err.message);
  return c.json({ error: `Progetto "${projectId}" non trovato` }, 404);
}
if (!project) {
  return c.json({ error: `Progetto "${projectId}" non trovato` }, 404);
}
```

**Aggiornamento status D1 — copiare da projects.ts esistente** (lines 82–84, projects.ts):
```typescript
await db.update(projects)
  .set({ status: 'deploying' })
  .where(eq(projects.id, id));
```
Pattern da replicare ad ogni step della state machine (repo_created, pages_linked, deploying, live).

**Idempotency check — pattern da implementare ad inizio endpoint** (da CONTEXT D-11/D-12, nessun analogo diretto):
```typescript
// Inizio endpoint: check status esistente
if (project.status === 'live') {
  return c.json({
    error: 'Project already deployed',
    pages_url: project.pages_url,
    github_repo_url: project.github_repo_url
  }, 409);
}
// Ripresa da step parziale: skip step già completati
// if (project.status === 'repo_created') → salta createProjectRepo
// if (project.status === 'pages_linked') → salta anche createFile + CF Pages
```

**Error handling pattern** (lines 91–94, projects.ts + lines 243–246, seed.ts):
```typescript
} catch (err: any) {
  console.error('[deploy] Error:', err);
  return c.json({ error: 'Deployment failed', details: err.message }, 500);
}
```
Per il retry exhaustion (D-10) usare 503:
```typescript
return c.json({
  error: 'GitHub repo not ready after 10 attempts — richiama /deploy per riprendere',
  status: 'repo_created'
}, 503);
```

---

### `factory-core/src/services/cloudflare-pages.ts` (service, request-response) — NUOVO

**Analog principale:** `factory-core/src/services/email.ts`

**Struttura service — copiare da email.ts** (lines 1–9, email.ts):
```typescript
export interface EmailConfig {
  apiKey: string;
  from: string;
  verificationBaseUrl: string;
}
export class EmailService {
  constructor(private config: EmailConfig) {}
```
Tradurre in:
```typescript
export interface CloudflarePagesConfig {
  apiToken: string;
  accountId: string;
}
export class CloudflarePagesService {
  constructor(private config: CloudflarePagesConfig) {}
```

**HTTP call pattern — copiare da email.ts** (lines 37–50, email.ts):
```typescript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.config.apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});
if (!response.ok) {
  const error = await response.text();
  throw new Error(`Resend API error: ${response.status} ${error}`);
}
return await response.json();
```
Adattare con endpoint CF Pages:
```typescript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/pages/projects`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
);
if (!response.ok) {
  const error = await response.text();
  throw new Error(`Cloudflare Pages API error: ${response.status} ${error}`);
}
const result = await response.json() as any;
return result.result; // CF API wraps in { result, success, errors }
```

**Payload CF Pages — da CONTEXT D-01/D-02/D-03/D-04** (nessun analogo codebase):
```typescript
const body = {
  name: `rr-${slug}`,
  production_branch: 'main',
  source: {
    type: 'github',
    config: {
      owner: githubOwner,
      repo_name: githubRepo,
      production_branch: 'main',
    }
  },
  build_config: {
    build_command: 'npm run build',
    destination_dir: 'dist',
    root_dir: '',
  },
  deployment_configs: {
    production: {
      env_vars: {
        FACTORY_API_URL: { value: factoryApiUrl }
      }
    }
  }
};
```

---

### `factory-core/migrations/0004_add_deploy_columns.sql` (migration) — NUOVA

**Analog principale:** `factory-core/migrations/0003_petite_jack_murdock.sql`

**Formato migration ADD COLUMN** (line 1, 0003):
```sql
ALTER TABLE `leads` ADD `email` text;
```
Replicare per 3 colonne nullable su `projects`:
```sql
ALTER TABLE `projects` ADD `github_repo_url` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `pages_project_name` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `pages_url` text;
```
Nota: il separatore `--> statement-breakpoint` è il formato Drizzle Kit — copiare esattamente da migration 0003.

---

### `factory-core/src/db/schema.ts` (model) — MODIFICA

**Analog:** sé stesso — aggiungere 3 colonne seguendo il pattern delle colonne nullable esistenti.

**Pattern colonne nullable esistenti** (lines 19–20, schema.ts):
```typescript
domain: text('domain'),
// e
configJson: text('config_json'),
```
Aggiungere dopo `configJson`:
```typescript
githubRepoUrl: text('github_repo_url'),
pagesProjectName: text('pages_project_name'),
pagesUrl: text('pages_url'),
```
Convenzione: camelCase in TypeScript, snake_case come nome colonna SQL — coerente con tutto lo schema esistente.

---

### `factory-core/wrangler.toml` (config) — MODIFICA

**Analog:** sé stesso — estendere blocco `[vars]`.

**Pattern vars esistente** (lines 14–19, wrangler.toml):
```toml
[vars]
EMAIL_FROM = "Rankame <noreply@rankame.com>"
VERIFICATION_BASE_URL = "https://factory-core.soliwkr.workers.dev/verify"
# RESEND_API_KEY is secret, set via .dev.vars or 'wrangler secret put'
# API_SECRET is secret, set via .dev.vars or 'wrangler secret put'
```
Aggiungere al blocco `[vars]`:
```toml
GITHUB_TEMPLATE_OWNER = "StudioPuraLuce"
GITHUB_TEMPLATE_REPO = "astro-rank-rent"
FACTORY_API_URL = "https://factory-core.soliwkr.workers.dev"
# CF_API_TOKEN is secret, set via .dev.vars or 'wrangler secret put'
```
Convenzione del codebase: variabili non-sensitive in `[vars]`, secrets solo nei commenti e poi via `wrangler secret put`. Mantenere lo stesso stile commento.

---

## Shared Patterns

### Auth (Bearer Token)
**Fonte:** `factory-core/src/index.ts` lines 31–32
**Applica a:** tutti i controller sotto `protectedApp`
```typescript
const protectedApp = new Hono<{ Bindings: Bindings }>();
protectedApp.use('/*', async (c, next) => { return bearerAuth({ token: c.env.API_SECRET })(c, next); });
```
Il deploy endpoint è già montato su `protectedApp.route('/api/projects', projectsApi)` — nessuna modifica necessaria.

### Error Response Pattern
**Fonte:** `factory-core/src/api/projects.ts` line 93 + `factory-core/src/api/seed.ts` line 245
**Applica a:** tutti i controller e service
```typescript
return c.json({ error: 'Deployment failed', details: err.message }, 500);
```
Formato uniforme: `{ error: string, details?: string }` con HTTP status code appropriato.

### Drizzle D1 Query Pattern
**Fonte:** `factory-core/src/api/seed.ts` lines 167–174
**Applica a:** `projects.ts` deploy endpoint (read + update)
```typescript
const db = drizzle(c.env.DB);
const project = await db.select().from(projects).where(eq(projects.id, projectId)).get();
// update:
await db.update(projects).set({ status: 'repo_created', githubRepoUrl: repoUrl }).where(eq(projects.id, id));
```

### Service Instantiation from Env
**Fonte:** `factory-core/src/api/generate.ts` lines 23–28
**Applica a:** `projects.ts` per istanziare `GitHubService` e `CloudflarePagesService`
```typescript
const aiService = new AiService({
  apiKey: c.env.GOOGLE_AI_API_KEY,
  accountId: c.env.CF_ACCOUNT_ID,
  gatewayName: c.env.CF_AI_GATEWAY_NAME,
  gatewayToken: c.env.CF_AI_GATEWAY_TOKEN,
});
```
Copiare struttura per:
```typescript
const github = new GitHubService({
  token: c.env.GITHUB_TOKEN,
  templateOwner: c.env.GITHUB_TEMPLATE_OWNER,
  templateRepo: c.env.GITHUB_TEMPLATE_REPO,
});
const cfPages = new CloudflarePagesService({
  apiToken: c.env.CF_API_TOKEN,
  accountId: c.env.CF_ACCOUNT_ID,
});
```

### Fetch con Bearer Token (pattern service)
**Fonte:** `factory-core/src/services/email.ts` lines 37–50
**Applica a:** `CloudflarePagesService` — identico pattern HTTP call
```typescript
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.config.apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});
if (!response.ok) {
  const error = await response.text();
  throw new Error(`<ServiceName> API error: ${response.status} ${error}`);
}
return await response.json();
```

---

## No Analog Found

| File | Role | Data Flow | Motivo |
|---|---|---|---|
| (retry loop in github.ts) | utility | request-response | Nessun retry loop esistente nel codebase — usare pattern da CONTEXT D-09 |
| (idempotency check in deploy) | controller | CRUD | Nessuno state machine esistente — implementare secondo CONTEXT D-11/D-12 |
| (CF Pages payload shape) | service | request-response | Nessuna integrazione CF Pages esistente — usare CONTEXT D-01/D-03/D-04 |

---

## Metadata

**Scope ricerca analog:** `factory-core/src/services/`, `factory-core/src/api/`, `factory-core/migrations/`, `factory-core/src/db/`, `factory-core/wrangler.toml`
**File scansionati:** 14
**Data estrazione pattern:** 2026-04-26
