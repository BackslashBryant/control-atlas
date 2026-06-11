#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { loadSourceRegistry } from './lib/source-registry.mjs';

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
  'data/generated/candidates.json',
  'data/generated/source-health.json',
];

for (const path of required) assert.ok(existsSync(path), `${path} is required`);

const registry = loadSourceRegistry(JSON.parse(readFileSync('data/source-registry.json', 'utf8')));
const catalogAuthorities = registry.sources.filter((source) => source.authority_type === 'catalog_authority');
const mappingAuthorities = registry.sources.filter((source) => source.authority_type === 'mapping_authority');
assert.equal(registry.registry.schema_version, '3.0');
assert.equal(catalogAuthorities.length, 8);
assert.equal(mappingAuthorities.length, 5);

const catalog = JSON.parse(readFileSync('data/generated/catalog.json', 'utf8'));
assert.equal(catalog.schema_version, '2.1');
assert.ok(catalog.frameworks.length >= 8, 'broad federal/DoD framework registry required');
assert.ok(catalog.items.length > 1000, 'normalized searchable catalogs required');
assert.ok(catalog.mappings.length > 0, 'direct mappings required');
assert.ok(catalog.paths.length > 0, 'calculated paths required');
assert.ok(catalog.items.filter((item) => item.framework_id === 'disa-cci').length > 5000, 'complete official CCI catalog required');
assert.ok(catalog.mappings.filter((mapping) => mapping.source_key.startsWith('disa-cci:')).length > 3000, 'official CCI-to-control references required');
assert.ok(catalog.items.filter((item) => item.framework_id === 'disa-cci').every((item) => item.canonical_evidence.source_id === 'disa-cci-list'), 'CCI identity must come from the official CCI List');
assert.ok(catalog.mappings.every((mapping) =>
  (mapping.evidence || []).some((entry) => entry.authority_type === 'mapping_authority'),
), 'published mappings must include mapping_authority evidence');
assert.equal(catalog.items.filter((item) => item.framework_id === 'nist-ai-rmf').length, 72, 'complete official AI RMF Playbook catalog required');
assert.equal(catalog.items.filter((item) => item.framework_id === 'nist-ssdf').length, 42, 'complete official SSDF task catalog required');
assert.equal(catalog.items.filter((item) => item.framework_id === 'fedramp-rev5').length, 4, 'FedRAMP public baseline identities required');
assert.equal(catalog.items.filter((item) => item.framework_id === 'cmmc-2').length, 3, 'CMMC public level identities required');
assert.equal(catalog.items.filter((item) => item.framework_id === 'dod-rai').length, 11, 'DoD RAI public toolkit modules required');
assert.ok(catalog.mappings.every((mapping) => !['cmmc-2', 'fedramp-rev5', 'nist-ai-rmf', 'nist-ssdf'].includes(mapping.target_key.split(':')[0])), 'unsupported seed crosswalks must not publish');
assert.ok(!catalog.frameworks.some((framework) => /stig/i.test(framework.id)), 'STIG catalogs are not first-class framework goals');

const sourceHealth = JSON.parse(readFileSync('data/generated/source-health.json', 'utf8'));
assert.ok(sourceHealth.sources.length >= 15, 'source health must track registry sources');

const html = readFileSync('index.html', 'utf8');
const app = readFileSync('app/app.mjs', 'utf8');
assert.match(html, /Framework Mapper/);
assert.match(html, /app\/app\.mjs/);
assert.doesNotMatch(html, /<article/);
assert.match(app, /fetch\('\.\/data\/generated\/bootstrap\.json'\)/);
assert.match(app, /async function ensureDataset/);

console.log(`Static smoke passed: ${catalog.frameworks.length} frameworks, ${catalog.items.length} items, ${catalog.mappings.length} direct mappings`);
