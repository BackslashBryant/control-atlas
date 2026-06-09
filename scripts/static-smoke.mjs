#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const required = [
  'index.html',
  'app/app.mjs',
  'app/runtime.mjs',
  'styles/app.css',
  'data/source-registry.json',
  'data/generated/bootstrap.json',
  'data/generated/catalog.json',
  'data/generated/coverage.json',
  'data/generated/mappings.json',
  'data/generated/paths.json',
];

for (const path of required) assert.ok(existsSync(path), `${path} is required`);

const catalog = JSON.parse(readFileSync('data/generated/catalog.json', 'utf8'));
assert.equal(catalog.schema_version, '2.0');
assert.ok(catalog.frameworks.length >= 8, 'broad federal/DoD framework registry required');
assert.ok(catalog.items.length > 1000, 'normalized searchable catalogs required');
assert.ok(catalog.mappings.length > 0, 'direct mappings required');
assert.ok(catalog.paths.length > 0, 'calculated paths required');
assert.ok(catalog.items.filter((item) => item.framework_id === 'disa-cci').length > 5000, 'complete official CCI catalog required');
assert.ok(catalog.mappings.filter((mapping) => mapping.source_key.startsWith('disa-cci:')).length > 3000, 'official CCI-to-control references required');
assert.ok(catalog.items.filter((item) => item.framework_id === 'disa-cci').every((item) => item.canonical_evidence.source_id === 'disa-cci-list'), 'CCI identity must come from the official CCI List');
assert.ok(!catalog.frameworks.some((framework) => /stig/i.test(framework.id)), 'STIG catalogs are not first-class framework goals');

const html = readFileSync('index.html', 'utf8');
const app = readFileSync('app/app.mjs', 'utf8');
assert.match(html, /Framework Mapper/);
assert.match(html, /app\/app\.mjs/);
assert.doesNotMatch(html, /<article/);
assert.match(app, /fetch\('\.\/data\/generated\/bootstrap\.json'\)/);
assert.match(app, /async function ensureDataset/);

console.log(`Static smoke passed: ${catalog.frameworks.length} frameworks, ${catalog.items.length} items, ${catalog.mappings.length} direct mappings`);
