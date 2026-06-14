#!/usr/bin/env node
/**
 * Lightweight dependency policy checker.
 * - Warns on wildcard or source-based versions (`*`, `latest`, `file:`, `git+`)
 * - Flags deny-listed packages
 * - Ensures at least one lockfile exists
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const pkgPath = path.join(repoRoot, 'package.json');

if (!existsSync(pkgPath)) {
  console.warn('No package.json found. Skip dependency policy check.');
  process.exit(0);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

const denyList = new Set([
  'event-stream',
  'flatmap-stream',
  'node-ssh',
  'left-pad',
]);

const riskyPatterns = [
  /^\s*\*$/,
  /\blatest\b/i,
  /^file:/i,
  /^link:/i,
  /^git\+/i,
  /^https?:/i,
];

const findings = [];

for (const [name, version] of Object.entries(deps)) {
  if (denyList.has(name)) {
    findings.push({ level: 'error', name, reason: 'deny-listed package' });
    continue;
  }

  if (riskyPatterns.some((pattern) => pattern.test(version))) {
    findings.push({ level: 'warn', name, reason: `risky spec "${version}"` });
  }

  if (!/^\d/.test(version) && !version.startsWith('workspace:') && !version.startsWith('npm:')) {
    findings.push({ level: 'warn', name, reason: `non-pinned version "${version}"` });
  }
}

const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'].filter((file) =>
  existsSync(path.join(repoRoot, file)),
);

if (lockfiles.length === 0) {
  findings.push({ level: 'warn', name: 'lockfile', reason: 'No lockfile found (npm ci will be nondeterministic).' });
}

const strict = process.argv.includes('--strict') || process.env.DEP_CHECK_STRICT === '1';
const hasErrors = findings.some((finding) => finding.level === 'error');
const hasWarnings = findings.length > 0;

if (!hasWarnings) {
  console.log('Dependency policy check: clean');
} else {
  for (const finding of findings) {
    const tag = finding.level === 'error' ? 'ERROR' : 'WARN';
    console.log(`${tag}: ${finding.name} -> ${finding.reason}`);
  }
}

if (strict && (hasErrors || hasWarnings)) {
  process.exit(1);
}

if (!strict && hasErrors) {
  // Always fail on deny-listed packages to stay safe.
  process.exit(1);
}
