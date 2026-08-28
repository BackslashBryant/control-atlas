#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import parseLicenseExpression from 'spdx-expression-parse';

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
  'Zlib',
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

function parsedLicenseIsAllowed(node) {
  if (node.conjunction === 'and') {
    return parsedLicenseIsAllowed(node.left) && parsedLicenseIsAllowed(node.right);
  }
  if (node.conjunction === 'or') {
    return parsedLicenseIsAllowed(node.left) || parsedLicenseIsAllowed(node.right);
  }
  return !node.exception && !node.plus && ALLOWED_LICENSES.has(node.license);
}

export function isAllowedLicenseExpression(expression) {
  try {
    return parsedLicenseIsAllowed(parseLicenseExpression(expression));
  } catch {
    return false;
  }
}

function runCli() {
  const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const failures = [];

  for (const [packagePath, metadata] of Object.entries(packageLock.packages || {})) {
    if (!packagePath || !metadata) continue;
    const license = metadata.license;
    if (!license) {
      const exception = MISSING_LICENSE_METADATA_EXCEPTIONS.get(packagePath);
      if (exception && isAllowedLicenseExpression(exception.license)) continue;
      failures.push(`${packagePath}: missing license field`);
      continue;
    }
    if (!isAllowedLicenseExpression(license)) {
      failures.push(`${packagePath}: unsupported license ${license}`);
    }
  }

  assert.equal(failures.length, 0, `License check failed:\n- ${failures.join('\n- ')}`);
  console.log(`license-check: validated ${Object.keys(packageLock.packages || {}).length} package entries`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) runCli();
