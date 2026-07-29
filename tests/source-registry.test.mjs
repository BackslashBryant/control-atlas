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

test('every source has the locked Phase 6 synchronization model', () => {
  const expected = {
    auto_synced: [
      'disa-cci-list', 'disa-cci-nist-references', 'disa-srg-library',
      'disa-stig-library', 'disa-stig-srg-cci-references', 'fedramp-2026-rules',
      'fedramp-rev5',
      'mitre-attack-enterprise', 'mitre-attack-ics', 'mitre-d3fend-mappings',
      'mitre-d3fend-ontology', 'nist-800-171-oscal-mappings', 'nist-800-171-rev2',
      'nist-800-172-rev3', 'nist-800-53a-assessment-procedures',
      'nist-800-53b-baselines', 'nist-ai-rmf-playbook', 'nist-olir-csf2-to-sp800-53',
      'nist-oscal', 'nist-ssdf-oscal',
    ],
    curated: [
      'dod-cmmc-rule', 'dod-rai-toolkit', 'dod-zt-capabilities',
      'dod-zt-execution-roadmap', 'dod-zt-overlays-2024',
      'dod-zt-reference-architecture-v2', 'dod-zt-strategy', 'isoo-cui-regulation',
      'nara-cui-registry', 'nist-800-171', 'nist-800-37-rev2', 'nist-800-53',
      'nist-800-53-rev4-rev5-crosswalk', 'nist-csf-2', 'nist-ssdf',
      'nist-fips-199', 'nist-fips-200',
    ],
    link_out: [
      'community-cci-research', 'cyber-mil-stig-compilations',
      'cyber-mil-stig-downloads', 'cyber-mil-stig-gpo', 'mitre-cis-cci-mappings',
      'nist-csf-53-supplemental', 'nist-csf11-csf20-crosswalk',
      'nist-informative-references', 'nist-olir-csf2-to-sp800-171',
      'nuwcdivnpt-github-org', 'nuwcdivnpt-stig-manager', 'stigviewer-catalog',
      'stigviewer-clkb-api',
    ],
  };
  const actual = Object.fromEntries(
    Object.keys(expected).map((model) => [
      model,
      registry.freshness.sources
        .filter((entry) => entry.sync_model === model)
        .map((entry) => entry.source_id)
        .sort(),
    ]),
  );
  for (const ids of Object.values(expected)) ids.sort();
  assert.deepEqual(actual, expected);
  assert.equal(registry.freshness.stale_after_days, 45);
});

test('loaded sources expose additive freshness fields', () => {
  const { byId } = loadSourceRegistry(registry);
  assert.equal(byId.get('nist-oscal').sync_model, 'auto_synced');
  assert.equal(byId.get('nist-oscal').stale_after_days, 45);
  assert.equal(byId.get('community-cci-research').last_imported, null);
  assert.equal(byId.get('community-cci-research').hash, null);
});

test('source registry rejects invalid or incomplete freshness metadata', () => {
  const invalid = structuredClone(registry);
  invalid.freshness.sources[0].last_checked = '2026-02-30';
  invalid.freshness.sources[1].hash = 'sha256:placeholder';
  invalid.freshness.sources.find((entry) => entry.sync_model === 'link_out').last_imported = '2026-01-01';
  invalid.freshness.sources.pop();
  const errors = validateSourceRegistry(invalid);
  assert.ok(errors.some((error) => error.includes('last_checked')));
  assert.ok(errors.some((error) => error.includes('sha256 digest')));
  assert.ok(errors.some((error) => error.includes('link-out source')));
  assert.ok(errors.some((error) => error.includes('missing freshness entry')));
});

test('manual review records never fabricate content checksums', () => {
  const invalid = structuredClone(registry);
  const manual = invalid.sources.find(
    (source) => source.retrieval_method === 'manual_review',
  );
  manual.checksum = 'sha256:publication_identity_placeholder';
  const errors = validateSourceRegistry(invalid);
  assert.ok(
    errors.some(
      (error) =>
        error.includes(`manual-review source ${manual.id}`) &&
        error.includes('null or a sha256 digest'),
    ),
  );

  for (const source of registry.sources.filter(
    (entry) => entry.retrieval_method === 'manual_review',
  )) {
    assert.ok(
      source.checksum === null || /^sha256:[a-f0-9]{64}$/.test(source.checksum),
      `${source.id} has a fabricated checksum`,
    );
  }
});

test('source provenance and eligibility remain separate', () => {
  const { sources } = loadSourceRegistry(registry);
  assert.ok(sources.length >= 35);
  assert.ok(!sources.some((source) => source.provenance_class === 'inferred'));
  assert.ok(!sources.some((source) => source.provenance_class === 'excluded'));
  assert.ok(sources.some((source) => source.eligibility_status === 'excluded'));
});

test('ingestion sources cannot publish records as publication identities', () => {
  const { byId } = loadSourceRegistry(registry);
  for (const id of ['nist-oscal', 'nist-ssdf-oscal']) {
    assert.equal(byId.get(id).metadata.identity_kind, 'ingestion');
    assert.equal(byId.get(id).graph_eligible, false);
  }
  for (const id of ['nist-800-53', 'nist-800-171', 'nist-csf-2', 'nist-ssdf']) {
    assert.equal(byId.get(id).metadata.identity_kind, 'publication');
    assert.equal(byId.get(id).graph_eligible, true);
  }
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
    'fedramp-2026-rules',
    'fedramp-rev5',
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
