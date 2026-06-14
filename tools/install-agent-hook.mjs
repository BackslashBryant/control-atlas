#!/usr/bin/env node

/**
 * Copies the optional path-scope pre-commit hook into .git/hooks.
 * Safe to run repeatedly; use --force to overwrite an existing hook.
 */

import { copyFileSync, existsSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const hookSample = path.join(repoRoot, 'scripts', 'hooks', 'pre-commit.sample');
const hookTarget = path.join(repoRoot, '.git', 'hooks', 'pre-commit');

function main() {
  const force = process.argv.includes('--force');

  if (!existsSync(path.join(repoRoot, '.git'))) {
    console.error('This repository has no .git directory. Initialise git first.');
    process.exit(1);
  }

  if (!existsSync(hookSample)) {
    console.error('Missing scripts/hooks/pre-commit.sample. Please restore it before installing.');
    process.exit(1);
  }

  if (existsSync(hookTarget) && !force) {
    console.log('A pre-commit hook already exists. Re-run with --force to overwrite.');
    process.exit(0);
  }

  copyFileSync(hookSample, hookTarget);

  try {
    chmodSync(hookTarget, 0o755);
  } catch (error) {
    // chmod may fail on Windows; warn but continue.
    console.warn('Warning: unable to set execute bit on pre-commit hook. Set it manually if needed.');
  }

  console.log('Installed .git/hooks/pre-commit from scripts/hooks/pre-commit.sample');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
}
