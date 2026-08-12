#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const environment = join(root, '.venv-data');
const python = process.platform === 'win32'
  ? join(environment, 'Scripts', 'python.exe')
  : join(environment, 'bin', 'python');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(python)) run(process.platform === 'win32' ? 'python' : 'python3', ['-m', 'venv', environment]);
run(python, ['-m', 'pip', 'install', '--disable-pip-version-check', '--requirement', 'requirements-data.txt']);
run(python, ['-c', 'import pdfplumber, pypdf; print(f"pdfplumber={pdfplumber.__version__} pypdf={pypdf.__version__}")']);
