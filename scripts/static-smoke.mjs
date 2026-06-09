#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

const requiredFiles = [
  'index.html',
  'data/manifest.json',
  'data/xref-map.json',
  'data/controls-800-53.json',
  'data/csf-subcategories.json',
  'data/requirements-800-171.json',
  'data/tasks-800-37.json',
  'data/cmmc-practices.json',
  'data/fisma-reference.json',
  'data/ccis.json',
  'maps/800-53-to-csf.json',
  'maps/800-53-to-800-171.json',
  'maps/800-53-to-800-37.json',
  'maps/800-53-to-cmmc.json',
  'maps/800-53-to-fedramp.json',
  'maps/800-53-to-fisma.json',
  'maps/cci-to-800-53.json',
  'scripts/build-xref.mjs',
  'scripts/fetch-ccis.mjs',
  'scripts/fetch-oscal-catalogs.mjs',
  'scripts/fetch-nvd.mjs',
  'scripts/refresh-data.mjs',
  'scripts/check-data-size.mjs',
  'data/search-index.json',
  'data/cves.json',
  'maps/cve-to-cwe-to-800-53.json',
  '.github/workflows/nightly-refresh.yml',
];

for (const file of requiredFiles) {
  assert.ok(existsSync(file), `${file} must exist`);
  assert.ok(statSync(file).size > 0, `${file} must not be empty`);
}

const html = readFileSync('index.html', 'utf8');
const manifest = JSON.parse(readFileSync('data/manifest.json', 'utf8'));
const xref = JSON.parse(readFileSync('data/xref-map.json', 'utf8'));

assert.match(html, /<title>GovFrame Navigator<\/title>/, 'index.html must expose the GovFrame title');
assert.match(html, /id="searchInput"/, 'index.html must include the search input');
assert.match(html, /id="freshnessBanner"/, 'index.html must include the freshness banner');
assert.match(html, /id="offlineSnapshot"/, 'index.html must include the embedded fallback snapshot');
assert.match(html, /id="sourceDetailDialog"/, 'index.html must include source detail dialog');
assert.match(html, /value="cci-item"/, 'index.html must include CCI framework filter');

assert.ok(manifest.phase === '3' || manifest.phase === '4' || manifest.phase === '5' || manifest.phase === '6', 'manifest must be phase 3, 4, 5, or 6');
assert.ok(manifest.sources?.['nist-800-53-rev5'], 'manifest must include 800-53 source metadata');
assert.ok(manifest.sources?.['cci-curated'], 'manifest must include CCI source metadata');
assert.equal(manifest.sources['cci-curated'].resolved_from, 'bronze');

assert.ok(Array.isArray(xref.records), 'xref map records must be an array');
assert.ok(xref.records.some((record) => record.id === 'AC-2'), 'xref map must include AC-2');
assert.ok(xref.records.some((record) => record.id === '3.1.1'), 'xref map must include 800-171 3.1.1');
assert.ok(xref.records.some((record) => record.id === 'CCI-000015'), 'xref map must include CCI-000015');

const ac2 = xref.records.find((r) => r.id === 'AC-2');
assert.ok(ac2?.fedramp_baselines?.moderate, 'AC-2 must expose FedRAMP moderate baseline flag');

const controls = JSON.parse(readFileSync('data/controls-800-53.json', 'utf8'));
assert.ok(controls.records.length > 100, 'full 800-53 catalog required');

console.log('Static smoke passed: Phase 3 artifact inputs are present and readable.');
