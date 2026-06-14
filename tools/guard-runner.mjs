#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const task = process.argv[2];

if (!task) {
  console.log('Usage: node tools/guard-runner.mjs <lint|type|test>');
  process.exit(1);
}

function hasBin(bin) {
  const binPath = path.join(repoRoot, 'node_modules', '.bin', bin + (process.platform === 'win32' ? '.cmd' : ''));
  return existsSync(binPath);
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', cwd: repoRoot, shell: process.platform === 'win32' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

switch (task) {
  case 'lint': {
    if (!hasBin('eslint')) {
      console.log('eslint not installed; skipping lint step.');
      process.exit(0);
    }
    run('npx', ['--no-install', 'eslint', '.', '--max-warnings=0']);
    break;
  }
  case 'type': {
    if (!hasBin('tsc')) {
      console.log('TypeScript (tsc) not installed; skipping typecheck.');
      process.exit(0);
    }
    run('npx', ['--no-install', 'tsc', '-p', 'tsconfig.json', '--noEmit']);
    break;
  }
  case 'test': {
    if (hasBin('jest')) {
      run('npx', ['--no-install', 'jest', '--runInBand']);
    } else {
      console.log('No dedicated test runner detected; skipping tests (use npm run verify for custom flows).');
    }
    break;
  }
  default:
    console.error(`Unknown task: ${task}`);
    process.exit(1);
}
