import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildCalculatedPaths,
  buildMappingMatrix,
  buildMatrixCsv,
  reconcileAssertions,
} from '../scripts/lib/framework-engine.mjs';
import { parseCciXml } from '../scripts/lib/cci-adapter.mjs';
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
  artifact: `https://example.test/${sourceId}`,
  locator: 'fixture:1',
  snapshot_date: '2026-06-09',
  agreement,
});

test('gold evidence publishes canonical mapping and preserves evidence gaps', () => {
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

test('calculated paths are bounded, cycle-free, and exclude related_to edges', () => {
  const mappings = [
    { id: 'a', source_key: 'f1:A', target_key: 'f2:B', relationship_type: 'maps_to' },
    { id: 'b', source_key: 'f2:B', target_key: 'f3:C', relationship_type: 'implements' },
    { id: 'c', source_key: 'f3:C', target_key: 'f4:D', relationship_type: 'supports' },
    { id: 'cycle', source_key: 'f3:C', target_key: 'f1:A', relationship_type: 'maps_to' },
    { id: 'context', source_key: 'f2:B', target_key: 'f5:E', relationship_type: 'related_to' },
  ];

  const paths = buildCalculatedPaths(mappings, { maxHops: 3 });
  const fromA = paths.filter((path) => path.source_key === 'f1:A');
  assert.ok(fromA.some((path) => path.target_key === 'f4:D' && path.hops.length === 3));
  assert.ok(!paths.some((path) => path.target_key === 'f5:E'));
  assert.ok(paths.every((path) => new Set(path.item_keys).size === path.item_keys.length));
});

test('matrix classifies direct, calculated, and unmapped source items and exports them', () => {
  const items = [
    { key: 'f1:A', framework_id: 'f1', item_id: 'A', title: 'Alpha' },
    { key: 'f1:X', framework_id: 'f1', item_id: 'X', title: 'Unmapped' },
    { key: 'f2:B', framework_id: 'f2', item_id: 'B', title: 'Bravo' },
    { key: 'f3:C', framework_id: 'f3', item_id: 'C', title: 'Charlie' },
  ];
  const mappings = [
    { id: 'a', source_key: 'f1:A', target_key: 'f2:B', relationship_type: 'maps_to', evidence_gaps: [] },
    { id: 'b', source_key: 'f2:B', target_key: 'f3:C', relationship_type: 'implements', evidence_gaps: ['bronze'] },
  ];
  const paths = buildCalculatedPaths(mappings);
  const matrix = buildMappingMatrix({ source_framework: 'f1', target_framework: 'f3' }, { items, mappings, paths });

  assert.equal(matrix.rows.find((row) => row.source_key === 'f1:A').classification, 'calculated');
  assert.equal(matrix.rows.find((row) => row.source_key === 'f1:X').classification, 'unmapped');
  const reverseMatrix = buildMappingMatrix({ source_framework: 'f2', target_framework: 'f1' }, { items, mappings, paths });
  assert.equal(reverseMatrix.rows.find((row) => row.source_key === 'f2:B').classification, 'direct');
  assert.equal(reverseMatrix.rows.find((row) => row.source_key === 'f2:B').direct[0].matrix_direction, 'incoming');
  assert.equal(reverseMatrix.rows.find((row) => row.source_key === 'f2:B').direct[0].matrix_target_key, 'f1:A');
  assert.match(buildMatrixCsv(matrix), /"Match type"/);
  assert.match(buildMatrixCsv(reverseMatrix), /incoming/);
  assert.match(buildMatrixCsv(matrix), /"Possible connection"/);
  assert.match(buildMatrixCsv(matrix), /"No known match"/);
});

test('CCI adapter treats CCIs as bridge requirements and maps official NIST references without STIG data', () => {
  const xml = `<?xml version="1.0"?>
    <cci_list><metadata><version>2025-01-23</version><publishdate>2025-01-23</publishdate></metadata>
    <cci_items><cci_item id="CCI-000015"><status>draft</status><publishdate>2009-05-13</publishdate>
    <contributor>DISA FSO</contributor><definition>Support account management.</definition><type>technical</type>
    <references><reference creator="NIST" title="NIST SP 800-53 Revision 5" version="5" location="https://csrc.nist.gov/" index="AC-2 (1)" />
    <reference creator="NIST" title="NIST SP 800-53 Revision 4" version="4" location="https://csrc.nist.gov/" index="AC-2 (1)" /></references>
    </cci_item></cci_items></cci_list>`;

  const result = parseCciXml(xml);
  assert.equal(result.records[0].id, 'CCI-000015');
  assert.equal(result.records[0].type, 'technical');
  assert.equal(result.records[0].source.key, 'disa-cci-list');
  assert.deepEqual(result.relationships.map((item) => item.target_id), ['AC-2.1']);
  assert.ok(result.relationships.every((item) => item.evidence_source === 'disa-cci-list'));
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

test('generated framework data excludes unsupported seed crosswalk assertions', () => {
  const catalog = JSON.parse(readFileSync('data/generated/catalog.json', 'utf8'));
  const unsupportedTargets = new Set(['cmmc-2', 'fedramp-rev5', 'nist-ai-rmf', 'nist-ssdf']);
  assert.ok(catalog.mappings.every((mapping) => !unsupportedTargets.has(mapping.target_key.split(':')[0])));
});
