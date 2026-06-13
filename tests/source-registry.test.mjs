import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { loadSourceRegistry, validateSourceRegistry } from '../scripts/lib/source-registry.mjs';

const registry = JSON.parse(readFileSync('data/source-registry.json', 'utf8'));

test('source registry schema 4.0 validates the federal source contract', () => {
  const errors = validateSourceRegistry(registry);
  assert.deepEqual(errors, []);
  assert.equal(registry.schema_version, '4.0');
  assert.ok(registry.sources.every((source) => source.provenance_class));
  assert.ok(registry.sources.every((source) => source.eligibility_status));
  assert.ok(registry.sources.every((source) => source.lifecycle_status));
  assert.ok(registry.sources.every((source) => source.access_status));
  assert.ok(registry.sources.every((source) => source.license_or_use));
});

test('source provenance and eligibility remain separate', () => {
  const { sources } = loadSourceRegistry(registry);
  assert.equal(sources.length, 20);
  assert.ok(!sources.some((source) => source.provenance_class === 'inferred'));
  assert.ok(!sources.some((source) => source.provenance_class === 'excluded'));
  assert.ok(sources.some((source) => source.eligibility_status === 'excluded'));
});

test('required federal sources are registered', () => {
  const ids = new Set(registry.sources.map((source) => source.id));
  for (const id of [
    'nist-csf-53-supplemental',
    'nist-csf11-csf20-crosswalk',
    'nist-800-171-oscal-mappings',
    'disa-cci-nist-references',
    'nist-800-53b-baselines',
    'nist-fips-199',
    'nist-fips-200',
    'nist-800-37-rev2',
  ]) {
    assert.ok(ids.has(id), `missing source ${id}`);
  }
});

test('registry rejects inferred or excluded as source provenance classes', () => {
  const invalid = structuredClone(registry);
  invalid.sources[0].provenance_class = 'inferred';
  invalid.sources[1].provenance_class = 'excluded';
  const errors = validateSourceRegistry(invalid);
  assert.ok(errors.some((error) => error.includes('unsupported provenance_class: inferred')));
  assert.ok(errors.some((error) => error.includes('unsupported provenance_class: excluded')));
});

test('excluded sources cannot publish graph records', () => {
  const invalid = structuredClone(registry);
  invalid.sources[0].eligibility_status = 'excluded';
  invalid.sources[0].graph_eligible = true;
  const errors = validateSourceRegistry(invalid);
  assert.ok(errors.some((error) => error.includes('excluded source') && error.includes('graph_eligible')));
});
