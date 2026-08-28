#!/usr/bin/env node

import process from 'node:process';

import { runProcessSync } from './lib/process-runner.mjs';

const npmExecPath = process.env.npm_execpath;
if (!npmExecPath) {
  throw new Error('Lockfile verification requires npm_execpath; invoke it through npm.');
}

runProcessSync(process.execPath, [
  npmExecPath,
  'ci',
  '--dry-run',
  '--ignore-scripts',
  '--no-audit',
  '--no-fund',
], {
  label: 'npm ci lockfile verification',
  stdio: 'inherit',
});
