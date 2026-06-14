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

test('runtime surfaces do not implement prohibited operational capabilities', () => {
  const paths = [
    'index.html',
    'app/runtime.mjs',
    'app/app.mjs',
    'package.json',
    '.github/workflows/nightly-refresh.yml',
  ];
  const prohibited = /\b(eMASS|Tenable|ACAS|Nessus|scan ingestion|evidence upload|compliance scoring|asset tracking)\b/i;
  for (const path of paths) {
    assert.ok(existsSync(path), `${path} must exist`);
    assert.doesNotMatch(readFileSync(path, 'utf8'), prohibited, `${path} contains a prohibited runtime capability`);
  }
});

test('runtime surfaces do not collect, upload, or store user data', () => {
  const runtime = [
    readFileSync('index.html', 'utf8'),
    readFileSync('app/runtime.mjs', 'utf8'),
    readFileSync('app/app.mjs', 'utf8'),
  ].join('\n');

  assert.doesNotMatch(runtime, /<input[^>]+type=["']file["']/i);
  assert.doesNotMatch(runtime, /\b(localStorage|sessionStorage|WebSocket|XMLHttpRequest)\b/);
  assert.doesNotMatch(runtime, /fetch\([^)]*(?:POST|PUT|PATCH|DELETE)/i);
});
