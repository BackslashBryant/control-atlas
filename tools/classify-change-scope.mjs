#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const EVIDENCE_PREFIXES = [
  'docs/audits/',
  'artifacts/audits/',
];

const GENERATED_DATA_INPUT_PREFIXES = [
  'data/',
  'maps/',
  'scripts/',
  'src/shared/',
  'tools/importers/',
  'tools/normalizers/',
];

const GENERATED_DATA_INPUT_FILES = new Set([
  'tools/build-static-site.mjs',
  'package-lock.json',
  'package.json',
]);

function normalizePath(path) {
  return path.replaceAll('\\', '/').replace(/^\.\/+/, '');
}

export function classifyNameStatus(nameStatus) {
  const entries = nameStatus
    .split('\0')
    .filter(Boolean);

  if (entries.length === 0) {
    return { scope: 'full', reason: 'empty-diff', buildMode: 'full' };
  }

  let buildMode = 'incremental';

  for (let index = 0; index < entries.length;) {
    const status = entries[index++];
    if (!/^[AM]\d*$/.test(status)) {
      return { scope: 'full', reason: `unsupported-status-${status}`, buildMode: 'full' };
    }

    const path = normalizePath(entries[index++] ?? '');
    if (!path || !EVIDENCE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      if (!path) {
        return { scope: 'full', reason: 'runtime-or-unknown-path-missing', buildMode: 'full' };
      }
      if (
        GENERATED_DATA_INPUT_FILES.has(path) ||
        GENERATED_DATA_INPUT_PREFIXES.some((prefix) => path.startsWith(prefix))
      ) {
        buildMode = 'full';
      }
      continue;
    }
  }

  const paths = entries.filter((_, index) => index % 2 === 1).map(normalizePath);
  const evidenceOnly = paths.every((path) =>
    EVIDENCE_PREFIXES.some((prefix) => path.startsWith(prefix)),
  );
  return evidenceOnly
    ? { scope: 'evidence-only', reason: 'audits-only', buildMode: 'none' }
    : { scope: 'full', reason: `runtime-${buildMode}`, buildMode };
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? '' : process.argv[index + 1] ?? '';
}

function resolveBase(base, head) {
  if (base && !/^0+$/.test(base)) {
    return base;
  }

  try {
    return execFileSync('git', ['merge-base', head, 'origin/main'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

function runCli() {
  const head = argumentValue('--head') || 'HEAD';
  const base = resolveBase(argumentValue('--base'), head);
  let result = { scope: 'full', reason: 'base-unavailable', buildMode: 'full' };

  if (base) {
    try {
      const diff = execFileSync(
        'git',
        ['diff', '--name-status', '-z', `${base}..${head}`],
        { encoding: 'utf8' },
      );
      result = classifyNameStatus(diff);
    } catch {
      result = { scope: 'full', reason: 'diff-failed', buildMode: 'full' };
    }
  }

  process.stdout.write(`scope=${result.scope}\nreason=${result.reason}\n`);
  process.stdout.write(`build_mode=${result.buildMode}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli();
}
