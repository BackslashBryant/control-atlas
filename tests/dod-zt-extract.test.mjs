import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  capabilityNodeId,
  extractDodZeroTrust,
  extractOverlayRelationships,
  normalizeControlId,
  parseActivitiesFromFragments,
  parseCapabilitiesFromFragments,
  parseOtActivitiesFromFragments,
} from '../tools/importers/dod-zt-extract.mjs';
import { buildDodZeroTrustCatalog } from '../tools/importers/framework-adapters.mjs';

test('normalizeControlId preserves NIST 800-53 Rev 5 identifiers', () => {
  assert.equal(normalizeControlId('AC-2'), 'AC-2');
  assert.equal(normalizeControlId('AC-2(7)'), 'AC-2(7)');
  assert.equal(normalizeControlId('IA-5(1)'), 'IA-5(1)');
  assert.equal(normalizeControlId('bad'), null);
});

test('capabilityNodeId maps dotted capability ids to graph ids', () => {
  assert.equal(capabilityNodeId('1.1'), 'CAP-1-1');
  assert.equal(capabilityNodeId('7.6'), 'CAP-7-6');
});

test('extractOverlayRelationships parses control to capability mappings from overlay text', () => {
  const sample = `
Capability 1.1: User Inventory
AC-2 Account Management X
AC-2(7) Privileged User Accounts X
IA-2 Identification and Authentication X

Capability 1.2: Conditional User Access
AC-3 Access Enforcement X
AC-2 Account Management X
`;
  const { relationships } = extractOverlayRelationships(sample);
  assert.ok(relationships.some((entry) =>
    entry.source_id === 'AC-2'
    && entry.target_id === 'CAP-1-1'
    && entry.relationship_type === 'supports'));
  assert.ok(relationships.some((entry) =>
    entry.source_id === 'AC-3'
    && entry.target_id === 'CAP-1-2'));
  assert.equal(new Set(relationships.map((entry) => `${entry.source_id}:${entry.target_id}`)).size, relationships.length);
});

test('extractOverlayRelationships rejects figure labels and invalid control tokens', () => {
  const validControlIds = new Set(['AC-2', 'SC-16']);
  const sample = `Capability 2.7: Endpoint Detection\nFigure EC-1\nAC-2 Account Management\nSAC-16(3) typo\nSC-16 Security Attributes`;
  const result = extractOverlayRelationships(sample, 'dod-zt-overlays-2024', validControlIds);
  assert.deepEqual(result.relationships.map((entry) => entry.source_id), ['AC-2', 'SC-16']);
  assert.deepEqual(result.rejected_references.map((entry) => entry.source_id), ['EC-1', 'SAC-16(3)']);
});

test('authoritative table fragments reconcile every DoD capability and activity', () => {
  const capabilitiesSource = JSON.parse(readFileSync('data/curated/dod-zt/source-fragments/capabilities.json', 'utf8'));
  const otSource = JSON.parse(readFileSync('data/curated/dod-zt/source-fragments/ot.json', 'utf8'));
  const capabilities = parseCapabilitiesFromFragments(capabilitiesSource);
  const enterprise = parseActivitiesFromFragments(capabilitiesSource);
  const operationalTechnology = parseOtActivitiesFromFragments(otSource);

  assert.equal(capabilities.length, 45);
  assert.equal(enterprise.length, 152);
  assert.equal(operationalTechnology.length, 105);
  assert.ok([...capabilities, ...enterprise, ...operationalTechnology].every((entry) => entry.source_fragments.length > 0));
  assert.ok(operationalTechnology.every((entry) => entry.operational_technology === true));
});

test('DoD extraction is fail-closed and contains no synthetic records', async () => {
  const result = await extractDodZeroTrust();
  assert.equal(result.documents_extracted, 8);
  assert.equal(result.pages_extracted, 636);
  assert.equal(result.capabilities, 45);
  assert.equal(result.enterprise_activities, 152);
  assert.equal(result.operational_technology_activities, 105);
  assert.equal(result.synthetic_records, 0);
  assert.equal(result.parser_failures, 0);
  assert.equal(result.overlay_relationships_discovered, 1910);
  assert.equal(result.overlay_relationships_published, 1903);
  assert.equal(result.overlay_relationships_rejected, 7);

  const manifest = JSON.parse(readFileSync('data/curated/dod-zt/source-manifest.json', 'utf8'));
  const taxonomy = JSON.parse(readFileSync('data/curated/dod-zt/taxonomy.json', 'utf8'));
  assert.equal(manifest.reconciliation.atlas_documents, 6);
  assert.equal(manifest.reconciliation.supporting_documents, 2);
  assert.equal(manifest.reconciliation.atlas_records_expected, 320);
  assert.ok(manifest.documents.every((document) => document.byte_length > 0 && document.retrieved_at));
  assert.ok(taxonomy.documents.every((document) => document.description && document.document_sections.length > 0));
  assert.ok(taxonomy.documents.every((document) => document.description_source_fragments.length > 0));

  const catalog = buildDodZeroTrustCatalog('2026-08-12', 'data/curated/dod-zt');
  assert.equal(catalog.record_count, 320);
  assert.equal(catalog.records.filter((record) => record.type === 'zt_document').length, 6);
  assert.ok(catalog.records.find((record) => record.id === 'DOC-OVERLAYS')?.metadata?.relationships
    .some((relationship) => relationship.target_id === 'DOC-RA' && relationship.source_locator === 'overlays.pdf#page=2'));
  assert.ok(catalog.records.filter((record) => record.type === 'zt_document')
    .every((record) => record.description !== record.title && record.metadata.document_sections.length > 0));
  assert.ok(!catalog.records.some((record) => record.id === 'DOC-NEWSLETTER-2024-11' || record.id === 'DOC-PLACEMATS'));

  const source = readFileSync('tools/importers/dod-zt-extract.mjs', 'utf8');
  assert.doesNotMatch(source, /fallback/i);
  assert.doesNotMatch(source, /[a-z]:[\\/](?:storage|users)[\\/]/i);
});

test('DoD source registry distinguishes historical mappings and supporting resources', () => {
  const registry = JSON.parse(readFileSync('data/source-registry.json', 'utf8'));
  const dodArtifacts = registry.artifacts.filter((artifact) => artifact.id.startsWith('artifact-dod-zt-'));
  assert.equal(dodArtifacts.length, 8);
  assert.equal(registry.quarantine.some((entry) => entry.id === 'artifact-dod-zt-overlays-2024'), false);
  assert.equal(dodArtifacts.find((artifact) => artifact.id === 'artifact-dod-zt-overlays-2024').lifecycle_status, 'historical');
  assert.equal(dodArtifacts.filter((artifact) => artifact.source_role === 'enrichment').length, 2);
});

test('committed dod-zt overlay map uses capability graph ids', () => {
  const map = JSON.parse(readFileSync('maps/800-53-to-dod-zt-overlays.json', 'utf8'));
  assert.equal(map.source_key, 'dod-zt-overlays-2024');
  assert.ok(map.relationships.length > 100);
  assert.ok(map.relationships.every((entry) => entry.target_id.startsWith('CAP-')));
  assert.ok(map.relationships.every((entry) => entry.relationship_type === 'supports'));
  assert.deepEqual(map.rejected_references.map((entry) => entry.source_id).sort(), [
    'EC-1', 'IA-4(14)', 'NSM-8', 'SA-18(8)', 'SAC-16(3)', 'SC-4(10)', 'SC-4(26)',
  ]);
});
