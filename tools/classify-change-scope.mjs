#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const EVIDENCE_PREFIXES = [
  'docs/audits/',
  'artifacts/audits/',
];

function normalizePath(path) {
  return path.replaceAll('\\', '/').replace(/^\.\/+/, '');
}

export function classifyNameStatus(nameStatus) {
  const entries = nameStatus
    .split('\0')
    .filter(Boolean);

  if (entries.length === 0) {
    return { scope: 'full', reason: 'empty-diff' };
  }

  for (let index = 0; index < entries.length;) {
    const status = entries[index++];
    if (!/^[AM]\d*$/.test(status)) {
      return { scope: 'full', reason: `unsupported-status-${status}` };
    }

    const path = normalizePath(entries[index++] ?? '');
    if (!path || !EVIDENCE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
      return { scope: 'full', reason: `runtime-or-unknown-path-${path || 'missing'}` };
    }
  }

  return { scope: 'evidence-only', reason: 'audits-only' };
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
  let result = { scope: 'full', reason: 'base-unavailable' };

  if (base) {
    try {
      const diff = execFileSync(
        'git',
        ['diff', '--name-status', '-z', `${base}..${head}`],
        { encoding: 'utf8' },
      );
      result = classifyNameStatus(diff);
    } catch {
      result = { scope: 'full', reason: 'diff-failed' };
    }
  }

  process.stdout.write(`scope=${result.scope}\nreason=${result.reason}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli();
}
