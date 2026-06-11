import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { loadSourceRegistry, validateSourceRegistry } from '../scripts/lib/source-registry.mjs';

const registry = JSON.parse(readFileSync('data/source-registry.json', 'utf8'));

test('source registry schema 3.0 validates', () => {
  const errors = validateSourceRegistry(registry);
  assert.deepEqual(errors, []);
  assert.equal(registry.schema_version, '3.0');
});

test('source registry has expected authority counts', () => {
  const { sources } = loadSourceRegistry(registry);
  const catalog = sources.filter((source) => source.authority_type === 'catalog_authority');
  const mapping = sources.filter((source) => source.authority_type === 'mapping_authority');
  const corroboration = sources.filter((source) => source.authority_type === 'corroboration');
  const research = sources.filter((source) => source.authority_type === 'research_candidate');

  assert.equal(sources.length, 15);
  assert.equal(catalog.length, 8);
  assert.equal(mapping.length, 5);
  assert.equal(corroboration.length, 1);
  assert.equal(research.length, 1);
});

test('required mapping authorities are registered', () => {
  const ids = new Set(registry.sources.map((source) => source.id));
  for (const id of [
    'nist-csf-53-supplemental',
    'nist-csf11-csf20-crosswalk',
    'nist-800-171-oscal-mappings',
    'disa-cci-nist-references',
    'nist-800-53b-baselines',
  ]) {
    assert.ok(ids.has(id), `missing source ${id}`);
  }
});
