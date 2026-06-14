#!/usr/bin/env node
/**
 * Loads key/value pairs from an env file and prints exported commands.
 * Use `--apply` on Windows to persist via PowerShell; other platforms can `eval $(npm run mcp:load-env -- --print)`.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const printOnly = args.includes('--print') || !apply;

function resolveEnvFile() {
  const explicitIndex = args.findIndex((arg) => arg === '--file');
  if (explicitIndex !== -1 && args[explicitIndex + 1]) {
    return path.resolve(process.cwd(), args[explicitIndex + 1]);
  }
  const defaultFiles = ['.env.local', '.env', 'docs/env.template'].map((file) => path.join(repoRoot, file));
  return defaultFiles.find((file) => existsSync(file));
}

const envFile = resolveEnvFile();
if (!envFile) {
  console.error('No env file found (.env.local, .env, or docs/env.template).');
  process.exit(1);
}

const lines = readFileSync(envFile, 'utf8').split(/\r?\n/);
const entries = [];

for (const line of lines) {
  if (!line || line.trim().startsWith('#')) {
    continue;
  }
  const idx = line.indexOf('=');
  if (idx === -1) {
    continue;
  }
  const key = line.slice(0, idx).trim();
  const value = line.slice(idx + 1).trim();
  if (!key) {
    continue;
  }
  entries.push({ key, value });
}

if (entries.length === 0) {
  console.log(`No variables found in ${envFile}.`);
  process.exit(0);
}

if (printOnly) {
  console.log(`# Exporting ${entries.length} variables from ${path.relative(repoRoot, envFile)}`);
  for (const { key, value } of entries) {
    console.log(`export ${key}="${value.replace(/"/g, '\\"')}"`);
  }
}

if (apply) {
  if (process.platform !== 'win32') {
    console.warn('Automatic apply is only implemented for Windows via PowerShell. Use the printed exports on POSIX shells.');
    process.exit(0);
  }

  for (const { key, value } of entries) {
    const ps = `[Environment]::SetEnvironmentVariable('${key}','${value.replace(/'/g, "''")}', 'User')`;
    const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', ps], { stdio: 'inherit' });
    if (result.status !== 0) {
      console.error(`Failed to set ${key}`);
      process.exit(1);
    }
  }
  console.log(`Applied ${entries.length} variables to the current user profile.`);
}
