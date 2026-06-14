#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setRepoMode, detectRepoMode } from './lib/repo-mode.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const gitignorePath = path.join(repoRoot, '.gitignore');
const appsDir = path.join(repoRoot, 'apps');
const appsReadmePath = path.join(appsDir, 'README.md');

const APPS_README = `# Apps

Use this directory for any new downstream app surfaces that should stay clearly separated from the repo shell.

- Keep real product code under the repo's approved app roots.
- Do not place agent scaffolding or template-only support here.
- Treat the repo root as orchestration, docs, tests, and tooling only.
`;

function updateGitignore() {
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, '', 'utf8');
  }

  const content = readFileSync(gitignorePath, 'utf8');
  const lines = content.split(/\r?\n/);

  if (lines.some(line => line.trim() === '.cursor/*')) {
    return false;
  }

  let insertIndex = lines.findIndex(line => line.includes('Run `npm run convert:app`'));
  if (insertIndex < 0) {
    insertIndex = lines.length;
  }

  lines.splice(insertIndex, 0, '.cursor/*', '!.cursorignore');
  writeFileSync(gitignorePath, `${lines.join('\n').replace(/\n+$/, '\n')}`, 'utf8');
  return true;
}

function ensureAppsReadme() {
  mkdirSync(appsDir, { recursive: true });
  if (existsSync(appsReadmePath)) {
    return false;
  }
  writeFileSync(appsReadmePath, APPS_README, 'utf8');
  return true;
}

async function main() {
  const currentMode = detectRepoMode();
  console.log(currentMode === 'app'
    ? 'Refreshing repository app-mode defaults...'
    : 'Converting repository from template mode to app mode...');
  console.log('');

  await setRepoMode('app');
  console.log('✓ Set committed repository mode to "app"');
  console.log(ensureAppsReadme() ? '✓ Created apps/README.md' : 'i apps/README.md already present');
  console.log(updateGitignore() ? '✓ Updated .gitignore for app mode' : 'i .gitignore already configured for app mode');
  console.log('');
  console.log('Conversion complete.');
}

main().catch(error => {
  console.error('Error converting to app mode:', error instanceof Error ? error.message : error);
  process.exit(1);
});
