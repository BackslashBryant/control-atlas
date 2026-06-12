import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildCalculatedPaths,
  buildEvidenceEntry,
  buildMappingMatrix,
  buildMatrixCsv,
  reconcileAssertions,
} from '../scripts/lib/framework-engine.mjs';
import { parseCciXml } from '../scripts/lib/cci-adapter.mjs';
import { parseOlirCsv } from '../scripts/lib/olir-adapter.mjs';
import {
  buildCmmcPublicCatalog,
  buildDodRaiPublicCatalog,
  buildFedrampPublicCatalog,
  parseAiRmfPlaybook,
  parseSsdfCatalog,
} from '../scripts/lib/framework-adapters.mjs';

const evidence = (tier, sourceId, agreement = 'agrees') => ({
  tier,
  source_id: sourceId,
  authority_type: tier === 'gold'
    ? 'owner_authority_mapping'
    : tier === 'silver'
      ? 'corroboration'
      : 'research_candidate',
  artifact: `https://example.test/${sourceId}`,
  locator: 'fixture:1',
  snapshot_date: '2026-06-09',
  agreement,
});

test('gold mapping authority publishes canonical mapping and preserves evidence gaps', () => {
  const result = reconcileAssertions([
    {
      id: 'a1',
      source_key: 'nist-800-53:AC-2',
      target_key: 'csf-2:PR.AA-01',
      relationship_type: 'maps_to',
      evidence: [evidence('gold', 'official-crosswalk'), evidence('silver', 'mitre-crosswalk')],
    },
  ]);

  assert.equal(result.published.length, 1);
  assert.deepEqual(result.published[0].evidence_gaps, ['bronze']);
  assert.equal(result.blocked.length, 0);
  assert.equal(result.candidates.length, 0);
});

test('catalog authority cannot publish crosswalk evidence alone', () => {
  const result = reconcileAssertions([
    {
      id: 'catalog-only',
      source_key: 'nist-800-53:AC-2',
      target_key: 'csf-2:PR.AA-01',
      relationship_type: 'maps_to',
      evidence: [{
        ...evidence('gold', 'nist-oscal'),
        authority_type: 'catalog_authority',
      }],
    },
  ]);

  assert.equal(result.published.length, 0);
  assert.equal(result.blocked[0].block_reason, 'catalog_source_used_for_crosswalk');
});

test('bronze-only evidence becomes candidate instead of blocked missing gold', () => {
  const result = reconcileAssertions([
    {
      id: 'bronze-only',
      source_key: 'nist-800-53:AC-2',
      target_key: 'csf-2:PR.AA-01',
      relationship_type: 'maps_to',
      evidence: [evidence('bronze', 'community-cci-research')],
    },
  ]);

  assert.equal(result.published.length, 0);
  assert.equal(result.blocked.length, 0);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].candidate_reason, 'bronze_only_evidence');
});

test('missing or conflicting gold evidence blocks mapping', () => {
  const result = reconcileAssertions([
    {
      id: 'missing-gold',
      source_key: 'nist-800-53:AC-2',
      target_key: 'csf-2:PR.AA-01',
      relationship_type: 'maps_to',
      evidence: [evidence('silver', 'community-crosswalk')],
    },
    {
      id: 'conflicting-gold',
      source_key: 'nist-800-53:AC-3',
      target_key: 'csf-2:PR.AA-02',
      relationship_type: 'maps_to',
      evidence: [evidence('gold', 'official-crosswalk', 'conflicts')],
    },
  ]);

  assert.equal(result.published.length, 0);
  assert.deepEqual(result.blocked.map((item) => item.block_reason), [
    'missing_gold_evidence',
    'conflicting_gold_evidence',
  ]);
});

test('calculated paths are bounded, cycle-free, exclude related_to, and expose hop evidence', () => {
  const mappings = [
    {
      id: 'a',
      source_key: 'f1:A',
      target_key: 'f2:B',
      relationship_type: 'maps_to',
      evidence: [evidence('gold', 'map-a')],
    },
    {
      id: 'b',
      source_key: 'f2:B',
      target_key: 'f3:C',
      relationship_type: 'implements',
      evidence: [evidence('gold', 'map-b')],
    },
    {
      id: 'c',
      source_key: 'f3:C',
      target_key: 'f4:D',
      relationship_type: 'supports',
      evidence: [evidence('gold', 'map-c')],
    },
    {
      id: 'cycle',
      source_key: 'f3:C',
      target_key: 'f1:A',
      relationship_type: 'maps_to',
      evidence: [evidence('gold', 'map-cycle')],
    },
    {
      id: 'context',
      source_key: 'f2:B',
      target_key: 'f5:E',
      relationship_type: 'related_to',
      evidence: [evidence('gold', 'map-context')],
    },
  ];

  const paths = buildCalculatedPaths(mappings, { maxHops: 3 });
  const fromA = paths.filter((path) => path.source_key === 'f1:A');
  assert.ok(fromA.some((path) => path.target_key === 'f4:D' && path.hops.length === 3));
  assert.ok(!paths.some((path) => path.target_key === 'f5:E'));
  assert.ok(paths.every((path) => new Set(path.item_keys).size === path.item_keys.length));
  assert.ok(fromA.every((path) => path.hops.every((hop) => hop.source_id && hop.locator)));
});

test('matrix classifies direct, calculated, and unmapped source items and exports hop evidence', () => {
  const items = [
    { key: 'f1:A', framework_id: 'f1', item_id: 'A', title: 'Alpha' },
    { key: 'f1:X', framework_id: 'f1', item_id: 'X', title: 'Unmapped' },
    { key: 'f2:B', framework_id: 'f2', item_id: 'B', title: 'Bravo' },
    { key: 'f3:C', framework_id: 'f3', item_id: 'C', title: 'Charlie' },
  ];
  const mappings = [
    {
      id: 'a',
      source_key: 'f1:A',
      target_key: 'f2:B',
      relationship_type: 'maps_to',
      evidence: [evidence('gold', 'map-a')],
      evidence_gaps: [],
    },
    {
      id: 'b',
      source_key: 'f2:B',
      target_key: 'f3:C',
      relationship_type: 'implements',
      evidence: [evidence('gold', 'map-b')],
      evidence_gaps: ['bronze'],
    },
  ];
  const paths = buildCalculatedPaths(mappings);
  const matrix = buildMappingMatrix({ source_framework: 'f1', target_framework: 'f3' }, { items, mappings, paths });

  assert.equal(matrix.rows.find((row) => row.source_key === 'f1:A').classification, 'calculated');
  assert.equal(matrix.rows.find((row) => row.source_key === 'f1:X').classification, 'unmapped');
  const reverseMatrix = buildMappingMatrix({ source_framework: 'f2', target_framework: 'f1' }, { items, mappings, paths });
  assert.equal(reverseMatrix.rows.find((row) => row.source_key === 'f2:B').classification, 'direct');
  assert.equal(reverseMatrix.rows.find((row) => row.source_key === 'f2:B').direct[0].matrix_direction, 'incoming');
  assert.equal(reverseMatrix.rows.find((row) => row.source_key === 'f2:B').direct[0].matrix_target_key, 'f1:A');
  const csv = buildMatrixCsv(matrix);
  assert.match(csv, /"Match type"/);
  assert.match(buildMatrixCsv(reverseMatrix), /incoming/);
  assert.match(csv, /"Possible connection"/);
  assert.match(csv, /map-a@fixture:1/);
  assert.match(csv, /"No known match"/);
});

test('buildEvidenceEntry surfaces confidence, warnings, and authority_type', () => {
  const entry = buildEvidenceEntry({
    id: 'warn-1',
    status: 'published',
    evidence_gaps: ['bronze'],
    warnings: [{ code: 'conflicting_silver_evidence', source_id: 'mitre-cis-cci-mappings' }],
    evidence: [evidence('gold', 'disa-cci-nist-references')],
  });
  assert.equal(entry.confidence, 'derived');
  assert.equal(entry.sources[0].authority_type, 'owner_authority_mapping');
  assert.equal(entry.warnings.length, 1);
});

test('CCI adapter treats CCIs as bridge requirements and maps official NIST references without STIG data', () => {
  const xml = readFileSync('tests/fixtures/cci/sample.xml', 'utf8');
  const result = parseCciXml(xml);
  assert.equal(result.records[0].id, 'CCI-000015');
  assert.equal(result.records[0].type, 'technical');
  assert.equal(result.records[0].source.key, 'disa-cci-list');
  assert.deepEqual(result.relationships.map((item) => item.target_id), ['AC-2.1']);
  assert.ok(result.relationships.every((item) => item.evidence_source === 'disa-cci-nist-references'));
});

test('CCI adapter validates malformed XML, missing version, empty records, and parses multiple references and deprecated status', () => {
  assert.throws(() => {
    parseCciXml('<cci_list><metadata>');
  }, /Invalid CCI XML structure/);

  const missingMetadataXml = `<?xml version="1.0"?>
<cci_list>
  <cci_items>
    <cci_item id="CCI-000015">
      <status>draft</status>
    </cci_item>
  </cci_items>
</cci_list>`;
  assert.throws(() => {
    parseCciXml(missingMetadataXml);
  }, /CCI XML missing or invalid version or publish date metadata/);

  const emptyRecordsXml = `<?xml version="1.0"?>
<cci_list>
  <metadata>
    <version>2025-01-23</version>
    <publishdate>2025-01-23</publishdate>
  </metadata>
  <cci_items>
  </cci_items>
</cci_list>`;
  assert.throws(() => {
    parseCciXml(emptyRecordsXml);
  }, /CCI XML contains no CCI items/);

  const validXml = `<?xml version="1.0"?>
<cci_list>
  <metadata>
    <version>2025-01-23</version>
    <publishdate>2025-01-23</publishdate>
  </metadata>
  <cci_items>
    <cci_item id="CCI-000016">
      <status>deprecated</status>
      <publishdate>2010-01-01</publishdate>
      <definition>Test CCI definition</definition>
      <references>
        <reference creator="NIST" title="NIST SP 800-53 Revision 5" version="5" location="url" index="AC-3" />
        <reference creator="NIST" title="NIST SP 800-53 Revision 5" version="5" location="url" index="AC-3 (2)" />
      </references>
    </cci_item>
  </cci_items>
</cci_list>`;
  const result = parseCciXml(validXml);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].status, 'deprecated');
  assert.equal(result.relationships.length, 2);
  assert.deepEqual(result.relationships.map((r) => r.target_id), ['AC-3', 'AC-3.2']);
});

test('OLIR CSV adapter parses focal and reference columns', () => {
  const csv = readFileSync('tests/fixtures/olir/sample-crosswalk.csv', 'utf8');
  const relationships = parseOlirCsv(csv);
  assert.equal(relationships.length, 2);
  assert.equal(relationships[0].source_id, 'nist-800-53:AC-2');
  assert.equal(relationships[0].target_id, 'csf-2:PR.AA-01');
});

test('AI RMF adapter normalizes official playbook outcomes with source locators', () => {
  const result = parseAiRmfPlaybook([
    {
      title: 'GOVERN 1.1',
      category: 'Govern',
      description: 'Legal and regulatory requirements involving AI are understood.',
      section_actions: ['Document applicable requirements.'],
    },
  ], '2026-06-09');

  assert.equal(result.records[0].id, 'GOVERN 1.1');
  assert.equal(result.records[0].family, 'Govern');
  assert.equal(result.records[0].source.key, 'nist-ai-rmf-playbook');
  assert.match(result.records[0].source.locator, /GOVERN 1\.1/);
});

test('SSDF adapter emits granular task controls from official OSCAL', () => {
  const result = parseSsdfCatalog({
    catalog: {
      groups: [{
        id: 'po',
        title: 'Prepare the Organization',
        controls: [{
          id: 'po-1',
          title: 'Define Security Requirements',
          controls: [{
            id: 'po-1.1',
            title: 'Identify and document requirements',
            parts: [{ prose: 'Identify and document all security requirements.' }],
          }],
        }],
      }],
    },
  }, '2026-06-09');

  assert.deepEqual(result.records.map((record) => record.id), ['PO.1.1']);
  assert.equal(result.records[0].family, 'Prepare the Organization');
  assert.equal(result.records[0].source.key, 'nist-ssdf-oscal');
});

test('limited public catalogs publish only defensible official structures', () => {
  const fedramp = buildFedrampPublicCatalog('2026-06-09');
  const cmmc = buildCmmcPublicCatalog('2026-06-09');
  const rai = buildDodRaiPublicCatalog('2026-06-09');

  assert.deepEqual(fedramp.records.map((record) => record.id), ['LI-SAAS', 'LOW', 'MODERATE', 'HIGH']);
  assert.deepEqual(cmmc.records.map((record) => record.id), ['LEVEL-1', 'LEVEL-2', 'LEVEL-3']);
  assert.equal(rai.records.length, 11);
  assert.ok([...fedramp.records, ...cmmc.records, ...rai.records].every((record) => record.source?.locator));
});

test('generated framework data uses schema 2.1 and mapping authority evidence', () => {
  const catalog = JSON.parse(readFileSync('data/generated/catalog.json', 'utf8'));
  const unsupportedTargets = new Set(['cmmc-2', 'fedramp-rev5', 'nist-ai-rmf', 'nist-ssdf']);
  assert.equal(catalog.schema_version, '2.1');
  assert.ok(catalog.mappings.every((mapping) => !unsupportedTargets.has(mapping.target_key.split(':')[0])));
  assert.ok(catalog.mappings.every((mapping) =>
    (mapping.evidence || []).some((entry) => entry.authority_type === 'owner_authority_mapping'),
  ));
  assert.ok(catalog.paths.every((path) => (path.hops || []).every((hop) => hop.source_id)));
});

test('generated artifacts include candidates and source health', () => {
  const candidates = JSON.parse(readFileSync('data/generated/candidates.json', 'utf8'));
  const sourceHealth = JSON.parse(readFileSync('data/generated/source-health.json', 'utf8'));
  assert.ok(Array.isArray(candidates));
  assert.ok(sourceHealth.sources.length >= 15);
  assert.ok(sourceHealth.published_mappings > 0);
});

test('calculated paths enforce strict directionality (all-forward or all-reverse)', () => {
  const mappings = [
    {
      id: 'm1',
      source_key: 'A',
      target_key: 'B',
      relationship_type: 'maps_to',
      evidence: [evidence('gold', 'map-1')],
      status: 'published',
    },
    {
      id: 'm2',
      source_key: 'C',
      target_key: 'B',
      relationship_type: 'maps_to',
      evidence: [evidence('gold', 'map-2')],
      status: 'published',
    },
    {
      id: 'm3',
      source_key: 'C',
      target_key: 'D',
      relationship_type: 'maps_to',
      evidence: [evidence('gold', 'map-3')],
      status: 'published',
    },
  ];

  const paths = buildCalculatedPaths(mappings, { maxHops: 3 });
  
  // Mixed path A -> B <- C must NOT exist
  assert.ok(!paths.some((p) => p.source_key === 'A' && p.target_key === 'C'));
  
  // Forward path C -> B <- A must NOT exist
  assert.ok(!paths.some((p) => p.source_key === 'C' && p.target_key === 'A'));

  const mappings3 = [
    {
      id: 'm1',
      source_key: 'A',
      target_key: 'B',
      relationship_type: 'maps_to',
      evidence: [evidence('gold', 'map-1')],
      status: 'published',
    },
    {
      id: 'm4',
      source_key: 'B',
      target_key: 'D',
      relationship_type: 'maps_to',
      evidence: [evidence('gold', 'map-4')],
      status: 'published',
    },
  ];
  const paths3 = buildCalculatedPaths(mappings3, { maxHops: 3 });
  // Forward path A -> B -> D must exist
  assert.ok(paths3.some((p) => p.source_key === 'A' && p.target_key === 'D' && p.hops[0].direction === 'forward'));

  // Reverse path D <- B <- A must exist
  assert.ok(paths3.some((p) => p.source_key === 'D' && p.target_key === 'A' && p.hops[0].direction === 'reverse'));
});

