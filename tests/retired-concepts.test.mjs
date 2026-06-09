import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const retiredFiles = [
  'data/cves.json',
  'data/nvd-sync-state.json',
  'data/tenable-sync-state.json',
  'maps/cve-to-cwe-to-800-53.json',
  'scripts/fetch-nvd.mjs',
];

test('retired vulnerability data and ingestion files are removed', () => {
  for (const path of retiredFiles) assert.equal(existsSync(path), false, `${path} must be removed`);
});

test('active product surfaces contain no retired vulnerability concepts', () => {
  const paths = [
    'index.html',
    'app/runtime.mjs',
    'app/app.mjs',
    'styles/app.css',
    'package.json',
    '.github/workflows/nightly-refresh.yml',
    'README.md',
    'docs/PRD.md',
    'docs/vision.md',
    'docs/roadmap.md',
    'docs/context.md',
  ];
  const retired = /\b(CVE|NVD|Tenable|Nessus|plugin ID|plugin IDs)\b/i;
  for (const path of paths) {
    assert.ok(existsSync(path), `${path} must exist`);
    assert.doesNotMatch(readFileSync(path, 'utf8'), retired, `${path} contains retired product language`);
  }
});
