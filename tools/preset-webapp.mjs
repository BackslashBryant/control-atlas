#!/usr/bin/env node

/**
 * Webapp preset bootstrap
 *
 * Seeds an initial MVP feature spec/plan for the default health-check web app.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  scaffoldFeature,
  loadCurrentFeature,
  slugify,
} from './lib/workflow-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const notesDir = path.join(repoRoot, '.notes');
const ideasPath = path.join(notesDir, 'ideas.md');

function ensureNotes() {
  if (!existsSync(notesDir)) {
    mkdirSync(notesDir, { recursive: true });
  }
  if (!existsSync(ideasPath)) {
    const notes = `# Future Ideas

- Retro mashup UI that streams classic game data
- AI agent playground with websocket updates
- Progressive web app exported to native shells
`;
    writeFileSync(ideasPath, notes, 'utf8');
  }
}

function main() {
  ensureNotes();

  const current = loadCurrentFeature();
  if (current) {
    console.log(`Current feature detected (${current.featureName}). Preset skipped.`);
    return;
  }

  const featureName = 'Bootstrap Web Health MVP';
  const slug = slugify(featureName);
  scaffoldFeature({
    slug,
    featureName,
    targetUser: 'Solo dev verifying Cursor workspace',
    painPoint: 'No starter UI/API exists to validate the agent workflow quickly.',
    outcome:
      'Deliver a simple health endpoint and UI status tile to prove the agents can ship end-to-end.',
    mustHaves: [
      'Health API returns JSON { status: "ok" }',
      'Front-end renders the health status with passing tests',
      'Playwright smoke test covers API + UI',
    ],
    metrics: [
      'All automated checks (npm run verify) GREEN',
      'Preview URL or local server manually confirmed once',
    ],
    niceToHaves: [
      'Additional dashboards or metrics',
      'User authentication or persistence',
    ],
  });

  console.log('\nSeeded default feature: Bootstrap Web Health MVP');
  console.log('Use `npm run feature:new` to replace it with your own MVP.');
}

try {
  main();
} catch (error) {
  console.error(
    'Preset generation failed:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
