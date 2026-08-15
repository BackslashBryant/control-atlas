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
  'EPL-2.0',
  '0BSD',
  'Python-2.0',
  '(MIT OR WTFPL)',
  '(MIT OR CC0-1.0)',
  '(BSD-2-Clause OR MIT OR Apache-2.0)',
]);

// This package ships a BSD-3-Clause LICENSE but omits the license field from
// its published package metadata. Keep this exception path-specific and
// evidence-backed so a different package cannot inherit the waiver.
const MISSING_LICENSE_METADATA_EXCEPTIONS = new Map([
  ['node_modules/parse-cache-control', {
    license: 'BSD-3-Clause',
    evidence: 'https://github.com/roryf/parse-cache-control/blob/master/LICENSE',
  }],
]);

const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const failures = [];

for (const [packagePath, metadata] of Object.entries(packageLock.packages || {})) {
  if (!packagePath || !metadata) continue;
  const license = metadata.license;
  if (!license) {
    const exception = MISSING_LICENSE_METADATA_EXCEPTIONS.get(packagePath);
    if (exception && ALLOWED_LICENSES.has(exception.license)) continue;
    failures.push(`${packagePath}: missing license field`);
    continue;
  }
  if (!ALLOWED_LICENSES.has(license)) {
    failures.push(`${packagePath}: unsupported license ${license}`);
  }
}

assert.equal(failures.length, 0, `License check failed:\n- ${failures.join('\n- ')}`);
console.log(`license-check: validated ${Object.keys(packageLock.packages || {}).length} package entries`);
