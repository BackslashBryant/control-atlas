#!/usr/bin/env node

/**
 * feature-new
 *
 * Interactive helper that creates a new feature spec and one temporary active plan.
 */

import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { slugify, scaffoldFeature, loadCurrentFeature, archiveCurrentFeature } from './lib/workflow-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function ask(rl, prompt) {
  return new Promise(resolve => {
    rl.question(prompt, answer => resolve(answer.trim()));
  });
}

function parseList(input) {
  if (!input) return [];
  return input
    .split(/[,;+]\s*|\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

async function confirm(rl, message, defaultAnswer = 'n') {
  const answer = await ask(rl, `${message} (${defaultAnswer === 'y' ? 'Y/n' : 'y/N'}): `);
  if (!answer) return defaultAnswer === 'y';
  return answer.toLowerCase().startsWith('y');
}

async function main() {
  console.log('\n=== Cursor Feature Bootstrap ===\n');

  const current = loadCurrentFeature();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  if (current) {
    console.log(`Current feature: ${current.featureName} (slug: ${current.slug})`);
    const proceed = await confirm(
      rl,
      'Archive the current feature and start a new one?',
      'n',
    );
    if (!proceed) {
      console.log('\nNothing changed. Finish or archive the current feature first.');
      rl.close();
      process.exit(0);
    }
    archiveCurrentFeature();
  }

  let featureName = '';
  while (!featureName) {
    featureName = await ask(rl, 'Feature name (user-facing, scoped slice): ');
  }
  const slug = slugify(featureName);

  const targetUser = await ask(rl, 'Target user / persona: ');
  const painPoint = await ask(rl, 'What pain/problem are we solving (one sentence): ');
  const outcome = await ask(rl, 'Desired outcome (what success looks like): ');
  const metricsRaw = await ask(rl, 'Success metrics (comma separated, optional): ');
  const mustRaw = await ask(rl, 'Must-have deliverables (comma separated): ');
  const niceRaw = await ask(rl, 'Not-now / nice-to-have ideas (comma separated, optional): ');

  const metrics = parseList(metricsRaw);
  const mustHaves = parseList(mustRaw);
  const niceToHaves = parseList(niceRaw);

  const summary = {
    slug,
    featureName,
    targetUser: targetUser || 'TBD (clarify with spec)',
    painPoint: painPoint || 'TBD',
    outcome: outcome || 'TBD',
    metrics,
    mustHaves,
    niceToHaves,
  };

  scaffoldFeature(summary);

  console.log('\n[brains] Refreshing automation helpers...\n');
  const refreshResult = spawnSync(npmCmd, ['run', 'brains:refresh'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (refreshResult.status !== 0) {
    console.warn('\n[warn] brains:refresh exited non-zero. Run `npm run brains:refresh` manually to keep automation state current.\n');
  }

  console.log('\nFeature scaffolding complete.\n');
  console.log('Key files:');
  console.log(`- Spec:        .notes/features/${slug}/spec.md`);
  console.log(`- Progress:    .notes/features/${slug}/progress.md`);
  console.log(`- Active plan: docs/Plan.md`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Open the spec and fill in any TODOs.');
  console.log('2. Create a GitHub issue using the "0 - Spec" template and paste the spec content.');
  console.log('3. Ask @Vector to read the spec and update docs/Plan.md (use the "1 - Plan" issue template).');
  console.log('4. Keep implementation limited to the Feature DoD and docs/PRD.md. Delete docs/Plan.md in the shipping change.');
  console.log('');
  console.log('Need to restart? Run this command again once the current feature ships.');

  rl.close();
}

try {
  await main();
} catch (error) {
  console.error('feature-new failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
