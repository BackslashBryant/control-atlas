#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const python = process.platform === 'win32'
  ? join(root, '.venv-data', 'Scripts', 'python.exe')
  : join(root, '.venv-data', 'bin', 'python');

if (!existsSync(python)) {
  console.error('Missing .venv-data. Run npm run setup:data-python first.');
  process.exit(1);
}
const [script, ...args] = process.argv.slice(2);
if (!script) {
  console.error('Usage: node scripts/run-data-python.mjs <script> [...args]');
  process.exit(1);
}
const result = spawnSync(python, [script, ...args], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
