#!/usr/bin/env node
/**
 * seed-project.ts — Phase 3 orchestratore
 *
 * Uso: npx tsx scripts/seed-project.ts <projectId> [avatar] [servizi...] [zone...]
 *
 * Esempi:
 *   npx tsx scripts/seed-project.ts proj-formia-idraulico
 *   npx tsx scripts/seed-project.ts proj-formia-idraulico in-pain
 *
 * Richiede:
 *   - .dev.vars con API_SECRET e FACTORY_URL (default: http://localhost:8787)
 *   - wrangler dev in esecuzione: cd factory-core && npx wrangler dev
 *   - Progetto esistente in D1 con niche e location popolati
 *
 * Configurazione servizi/zone: modificare le costanti SERVICES e ZONES sotto
 * oppure passarle come argomenti JSON (terzo e quarto argomento).
 *
 * NOTA: API_SECRET viene letto da .dev.vars, non da variabili d'ambiente del processo.
 * Questo file non è mai committato in git (.gitignore via Cloudflare standard).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- Lettura .dev.vars (pattern da test-ai-real.ts) ---
const devVarsPath = path.join(__dirname, '../.dev.vars');
let env: Record<string, string> = {};
try {
  const devVarsRaw = fs.readFileSync(devVarsPath, 'utf-8');
  devVarsRaw.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && key.trim() && value.length > 0) {
      env[key.trim()] = value.join('=').trim();
    }
  });
} catch {
  console.error('ERRORE: .dev.vars non trovato. Creare factory-core/.dev.vars con API_SECRET.');
  process.exit(1);
}

const BASE_URL = env.FACTORY_URL || 'http://localhost:8787';
const API_SECRET = env.API_SECRET;

if (!API_SECRET) {
  console.error('ERRORE: API_SECRET non trovato in .dev.vars');
  process.exit(1);
}

// --- Argomenti CLI ---
const args = process.argv.slice(2);
const projectId = args[0];
const avatar = (args[1] as 'in-pain' | 'skeptic' | 'bundler') || 'in-pain';

if (!projectId) {
  console.error('ERRORE: projectId richiesto come primo argomento');
  console.error('Uso: npx tsx scripts/seed-project.ts <projectId> [avatar]');
  process.exit(1);
}

// --- Configurazione servizi e zone ---
// MODIFICA QUESTI VALORI per il progetto specifico
// Oppure popola project.configJson in D1 e leggi da lì in future iterazioni
const SERVICES = [
  'riparazioni-perdite',
  'installazione-caldaie',
  'installazione-sanitari',
  'manutenzione-impianti',
  'pronto-intervento',
];

const ZONES = [
  'Formia',
  'Gaeta',
  'Minturno',
  'Cassino',
  'Terracina',
];

// --- Helper: chiamata autenticata all'endpoint seed ---
async function seedType(type: string, body: object): Promise<{ pagesWritten: number }> {
  const url = `${BASE_URL}/api/generate/seed-project/${projectId}?type=${type}`;
  console.log(`\n[seed] ${type} → POST ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${type} fallito: HTTP ${res.status} — ${text}`);
  }

  const data = await res.json() as any;
  console.log(`[seed] ${type} → ${data.pagesWritten} pagine scritte`);
  return { pagesWritten: data.pagesWritten };
}

// --- Esecuzione sequenziale 5 tipi (D-03) ---
async function main() {
  console.log(`\n=== SEED PROJECT: ${projectId} (avatar: ${avatar}) ===`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Servizi: ${SERVICES.join(', ')}`);
  console.log(`Zone: ${ZONES.join(', ')}`);
  console.log('');

  let totalPages = 0;

  try {
    // 1. homepage — 1 pagina
    const hp = await seedType('homepage', { avatar });
    totalPages += hp.pagesWritten;

    // 2. services — N pagine (una per servizio)
    const sv = await seedType('services', { services: SERVICES, avatar });
    totalPages += sv.pagesWritten;

    // 3. zones — N pagine (una per zona)
    const zn = await seedType('zones', { zones: ZONES, avatar });
    totalPages += zn.pagesWritten;

    // 4. service_zones — N×M pagine (loop interno nel Worker per CF-02)
    // Lo script chiama una sola volta; il Worker fa il loop per servizio
    const sz = await seedType('service_zones', { services: SERVICES, zones: ZONES, avatar });
    totalPages += sz.pagesWritten;

    // 5. blog — K pagine (Gemini decide, floor ≥3)
    const bl = await seedType('blog', { avatar });
    totalPages += bl.pagesWritten;

    console.log(`\n=== COMPLETATO: ${totalPages} pagine totali scritte su D1 ===`);
    console.log(`\nVerifica conteggio:\n  cd factory-core && npx wrangler d1 execute factory-db --local --command "SELECT type, COUNT(*) as count FROM pages WHERE project_id='${projectId}' GROUP BY type ORDER BY type;"`);

  } catch (err: any) {
    console.error(`\n[seed] ERRORE: ${err.message}`);
    console.error('Assicurarsi che wrangler dev sia in esecuzione: cd factory-core && npx wrangler dev');
    process.exit(1);
  }
}

main();
