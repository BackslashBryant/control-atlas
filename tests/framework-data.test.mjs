import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCalculatedPaths,
  buildMappingMatrix,
  buildMatrixCsv,
  reconcileAssertions,
} from '../scripts/lib/framework-engine.mjs';
import { parseCciXml } from '../scripts/lib/cci-adapter.mjs';

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
  assert.match(buildMatrixCsv(matrix), /"classification"/);
  assert.match(buildMatrixCsv(reverseMatrix), /"incoming"/);
  assert.match(buildMatrixCsv(matrix), /"calculated"/);
  assert.match(buildMatrixCsv(matrix), /"unmapped"/);
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
