#!/usr/bin/env npx ts-node
/**
 * E2E smoke test: POST /api/projects/:id/domain
 *
 * Usage:
 *   FACTORY_URL=https://factory-core.soliwkr.workers.dev \
 *   API_SECRET=<secret> \
 *   PROJECT_ID=<uuid> \
 *   DOMAIN=<subdomain.example.com> \
 *   npx ts-node factory-core/scripts/test-domain-assignment.ts
 *
 * Or against local dev:
 *   FACTORY_URL=http://localhost:8787 ...
 */

const FACTORY_URL = process.env.FACTORY_URL ?? 'http://localhost:8787';
const API_SECRET = process.env.API_SECRET ?? '';
const PROJECT_ID = process.env.PROJECT_ID ?? '';
const DOMAIN = process.env.DOMAIN ?? '';

function fail(msg: string): never {
  console.error(`\n❌ FAIL: ${msg}`);
  process.exit(1);
}

function pass(msg: string) {
  console.log(`✅ ${msg}`);
}

async function run() {
  if (!API_SECRET) fail('API_SECRET env var is required');
  if (!PROJECT_ID) fail('PROJECT_ID env var is required');
  if (!DOMAIN) fail('DOMAIN env var is required');

  console.log(`\n🔧 Smoke test: POST ${FACTORY_URL}/api/projects/${PROJECT_ID}/domain`);
  console.log(`   Domain: ${DOMAIN}\n`);

  // Step 1: Call the domain endpoint
  const res = await fetch(`${FACTORY_URL}/api/projects/${PROJECT_ID}/domain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-secret': API_SECRET,
    },
    body: JSON.stringify({ domain: DOMAIN }),
  });

  const body = await res.json() as any;

  // Idempotency: 200 (first call) or 200 with already-linked state are both valid
  if (!res.ok) {
    fail(`Domain endpoint returned ${res.status}: ${JSON.stringify(body)}`);
  }

  if (!body.success) {
    fail(`Response missing success:true — got: ${JSON.stringify(body)}`);
  }

  pass(`Domain endpoint returned 200 success`);
  pass(`domain: ${body.domain}`);
  pass(`status: ${body.status}`);

  // Step 2: Verify project status updated to 'live'
  const projectRes = await fetch(`${FACTORY_URL}/api/projects`, {
    headers: { 'x-api-secret': API_SECRET },
  });

  if (!projectRes.ok) {
    fail(`Could not fetch project list: ${projectRes.status}`);
  }

  const projects = await projectRes.json() as any[];
  const project = projects.find((p: any) => p.id === PROJECT_ID);

  if (!project) {
    fail(`Project ${PROJECT_ID} not found in project list`);
  }

  if (project.status !== 'live') {
    fail(`Expected project status='live', got '${project.status}'`);
  }

  if (project.domain !== DOMAIN) {
    fail(`Expected project.domain='${DOMAIN}', got '${project.domain}'`);
  }

  pass(`Project status is 'live'`);
  pass(`Project domain is '${project.domain}'`);

  console.log('\n✅ All checks passed — Custom Domain Go-Live smoke test OK\n');
}

run().catch((err) => fail(err.message));
