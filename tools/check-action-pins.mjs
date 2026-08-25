#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const workflowDirectory = '.github/workflows';
const failures = [];

for (const file of readdirSync(workflowDirectory).filter((name) => /\.ya?ml$/.test(name))) {
  const lines = readFileSync(join(workflowDirectory, file), 'utf8').split('\n');
  for (const [index, line] of lines.entries()) {
    const match = line.match(/^\s*-?\s*uses:\s*([^\s#]+)/);
    if (!match || match[1].startsWith('./') || match[1].startsWith('docker://')) continue;
    if (!/@[0-9a-f]{40}$/i.test(match[1])) failures.push(`${file}:${index + 1} ${match[1]}`);
  }
}

if (failures.length > 0) {
  console.error('GitHub Actions must be pinned to immutable 40-character commit SHAs:');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log('All external GitHub Actions are pinned to immutable commit SHAs.');
