import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { loadSourceRegistry, validateSourceRegistry } from '../tools/validators/source-registry.mjs';

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
  assert.ok(sources.length >= 35);
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
    'nist-800-53a-assessment-procedures',
    'nist-800-171-rev2',
    'nist-800-172-rev3',
    'isoo-cui-regulation',
    'nara-cui-registry',
    'disa-stig-library',
    'disa-srg-library',
    'disa-stig-srg-cci-references',
    'cyber-mil-stig-compilations',
    'cyber-mil-stig-downloads',
    'cyber-mil-stig-gpo',
    'stigviewer-catalog',
    'stigviewer-clkb-api',
    'nuwcdivnpt-github-org',
    'nuwcdivnpt-stig-manager',
  ]) {
    assert.ok(ids.has(id), `missing source ${id}`);
  }
});

test('official DISA sources record source-tier precedence metadata', () => {
  const { byId } = loadSourceRegistry(registry);
  for (const id of ['disa-stig-library', 'disa-srg-library', 'disa-stig-srg-cci-references']) {
    const source = byId.get(id);
    assert.equal(source.metadata.source_authority.tier, 'gold');
    assert.equal(source.metadata.source_authority.resolved_from, 'gold');
    assert.ok(Array.isArray(source.metadata.source_authority.fallbacks));
  }
});

test('supplemental STIG acquisition sources record non-gold fallback tiers', () => {
  const { byId } = loadSourceRegistry(registry);
  assert.equal(byId.get('stigviewer-catalog').metadata.source_authority.tier, 'silver');
  assert.equal(byId.get('stigviewer-clkb-api').metadata.source_authority.tier, 'silver');
  assert.equal(byId.get('nuwcdivnpt-stig-manager').metadata.source_authority.tier, 'silver');
});

test('release 2 sources keep revision boundaries and avoid a draft-only bridge source', () => {
  const { sources } = loadSourceRegistry(registry);
  const ids = new Set(sources.map((source) => source.id));
  assert.ok(ids.has('nist-800-171-rev2'));
  assert.ok(ids.has('nist-800-171-oscal-mappings'));
  assert.ok(ids.has('nist-800-172-rev3'));
  assert.ok(!ids.has('nist-800-171-rev2-rev3-bridge'));
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

test('restricted, limited, and excluded sources still require full provenance metadata', () => {
  const invalid = structuredClone(registry);
  invalid.sources[0].eligibility_status = 'limited';
  invalid.sources[0].access_status = 'restricted';
  invalid.sources[0].license_or_use = '';
  invalid.sources[0].lifecycle_status = 'deprecated';
  const errors = validateSourceRegistry(invalid);
  assert.ok(errors.some((error) => error.includes('missing required field: license_or_use')));
});
