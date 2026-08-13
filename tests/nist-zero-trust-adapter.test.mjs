import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseSp800207A, parseSp800207Core } from '../tools/importers/nist-zero-trust-adapter.mjs';
import { buildNistZeroTrustCatalog } from '../tools/importers/framework-adapters.mjs';

test('SP 800-207 parser extracts the seven tenets and eleven logical components from located lines', () => {
  const fragments = JSON.parse(readFileSync('data/curated/nist-zt/source-fragments/sp800-207.json', 'utf8'));
  const parsed = parseSp800207Core(fragments);
  assert.equal(parsed.tenets.length, 7);
  assert.equal(parsed.components.length, 11);
  assert.equal(parsed.components.filter((entry) => entry.component_class === 'core').length, 3);
  assert.ok([...parsed.tenets, ...parsed.components].every((entry) => entry.source_fragments.length > 0));
});

test('SP 800-207A parser extracts every labeled cloud-native zero trust requirement', () => {
  const fragments = JSON.parse(readFileSync('data/curated/nist-zt/source-fragments/sp800-207a.json', 'utf8'));
  const parsed = parseSp800207A(fragments);
  assert.equal(parsed.requirements.length, 11);
  assert.deepEqual(parsed.requirements.map((entry) => entry.id), [
    'ID-SEG-REC-1', 'ID-SEG-REC-2', 'ID-SEG-REC-3', 'ID-SEG-REC-4', 'ID-SEG-REC-5',
    'MON-CNA-REQ-1', 'MON-CNA-REQ-2', 'MON-CNA-REQ-3', 'MON-CNA-REQ-4',
    'MON-DATA-USE-1', 'MON-DATA-USE-2',
  ]);
  assert.ok(parsed.requirements.every((entry) => entry.source_fragments.length > 0));
});

test('NIST SP 1800-35 corpus reconciles all 19 builds and both page types', () => {
  const manifest = JSON.parse(readFileSync('data/curated/nist-zt/nist-source-manifest.json', 'utf8'));
  const builds = JSON.parse(readFileSync('data/curated/nist-zt/sp1800-35-builds.json', 'utf8')).records;
  assert.equal(manifest.reconciliation.sp1800_35_builds_discovered, 19);
  assert.equal(manifest.reconciliation.sp800_207a_requirements, 11);
  assert.equal(manifest.reconciliation.sp1800_35_builds_ingested, 19);
  assert.equal(manifest.reconciliation.sp1800_35_architecture_pages, 19);
  assert.equal(manifest.reconciliation.sp1800_35_implementation_guides, 19);
  assert.equal(manifest.reconciliation.failed_pages, 0);
  assert.equal(manifest.reconciliation.synthetic_records, 0);
  assert.match(manifest.repository.commit, /^[a-f0-9]{40}$/);
  assert.equal(manifest.sources.filter((source) => /^SP180035-/.test(source.source_key)).length, 38);
  assert.ok(manifest.sources.filter((source) => /^SP180035-/.test(source.source_key))
    .every((source) => source.artifact_url.includes(`/${manifest.repository.commit}/`)));
  assert.equal(builds.length, 19);
  assert.ok(builds.every((build) => build.architecture_sections.length > 0 && build.implementation_sections.length > 0));
  assert.deepEqual(builds.find((build) => build.code === 'E1B3').related_build_codes, ['E1B2']);
  assert.ok(builds.every((build) => build.source_pages.every((page) => /^sha256:[a-f0-9]{64}$/.test(page.sha256) && page.artifact_url.includes(`/${manifest.repository.commit}/`))));
});

test('NIST SP 1800-35 keeps the official collaborator roster distinct from mapping-workbook labels', () => {
  const catalog = buildNistZeroTrustCatalog('2026-08-13', 'data/curated/nist-zt');
  const roster = catalog.records.filter((record) => record.type === 'zt_collaborator');
  const mappingContributors = catalog.records.filter((record) => record.type === 'zt_mapping_contributor');
  assert.equal(roster.length, 24);
  assert.deepEqual(roster.map((record) => record.title), [
    'Appgate', 'IBM', 'PC Matic', 'AWS', 'Ivanti', 'Ping Identity', 'Broadcom', 'Lookout',
    'Radiant Logic', 'Cisco', 'Mandiant', 'SailPoint', 'DigiCert', 'Microsoft', 'Tenable', 'F5',
    'Okta', 'Trellix', 'Forescout', 'Omnissa', 'Zimperium', 'Google Cloud', 'Palo Alto Networks', 'Zscaler',
  ]);
  assert.equal(mappingContributors.length, 16);
  assert.ok(mappingContributors.every((record) => record.metadata.publisher_field === 'Collaborator'));
  assert.ok(catalog.records.filter((record) => record.type === 'zt_product_component')
    .every((record) => mappingContributors.some((contributor) => contributor.id === record.metadata.parent_id)));
});
