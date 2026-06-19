#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ALLOWED_LICENSES = new Set([
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'CC-BY-3.0',
  'MPL-2.0',
  '0BSD',
  'Python-2.0',
  '(MIT OR WTFPL)',
  '(BSD-2-Clause OR MIT OR Apache-2.0)',
]);

const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const failures = [];

for (const [packagePath, metadata] of Object.entries(packageLock.packages || {})) {
  if (!packagePath || !metadata) continue;
  const license = metadata.license;
  if (!license) {
    failures.push(`${packagePath}: missing license field`);
    continue;
  }
  if (!ALLOWED_LICENSES.has(license)) {
    failures.push(`${packagePath}: unsupported license ${license}`);
  }
}

assert.equal(failures.length, 0, `License check failed:\n- ${failures.join('\n- ')}`);
console.log(`license-check: validated ${Object.keys(packageLock.packages || {}).length} package entries`);
