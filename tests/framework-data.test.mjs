import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCciXml } from '../scripts/lib/cci-adapter.mjs';
import { parseOlirCsv } from '../scripts/lib/olir-adapter.mjs';
import { buildFrameworkData } from '../scripts/build-framework-data.mjs';

const generated = (name) => JSON.parse(readFileSync(`data/generated/${name}.json`, 'utf8'));

test('CCI adapter preserves official bridge requirements and references', () => {
  const result = parseCciXml(readFileSync('tests/fixtures/cci/sample.xml', 'utf8'));
  assert.equal(result.records[0].id, 'CCI-000015');
  assert.deepEqual(result.relationships.map((item) => item.target_id), ['AC-2.1']);
  assert.ok(result.relationships.every((item) => item.evidence_source === 'disa-cci-nist-references'));
});

test('OLIR adapter preserves source and target identifiers', () => {
  const relationships = parseOlirCsv(readFileSync('tests/fixtures/olir/sample-crosswalk.csv', 'utf8'));
  assert.equal(relationships[0].source_id, 'nist-800-53:AC-2');
  assert.equal(relationships[0].target_id, 'csf-2:PR.AA-01');
});

test('federal graph build emits graph contract counts', () => {
  const result = buildFrameworkData();
  const generatedAt = generated('sources').generated_at;
  buildFrameworkData();
  assert.equal(result.sources, 20);
  assert.ok(result.nodes > 6800);
  assert.ok(result.edges > 4200);
  assert.equal(result.edges, result.evidence);
  assert.ok(result.findings > 0);
  assert.equal(generated('sources').generated_at, generatedAt);
});

test('issue 10 graph build emits FIPS, RMF, family, and 800-53B context for AC-2', () => {
  buildFrameworkData();
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;

  const nodeIds = new Set(nodes.map((node) => node.id));
  assert.ok(nodeIds.has('fips-199:FIPS-199-MODERATE'));
  assert.ok(nodeIds.has('fips-200:AC'));
  assert.ok(nodeIds.has('nist-800-37:RMF-SELECT'));
  assert.ok(nodeIds.has('nist-800-53b:MODERATE'));
  assert.ok(nodeIds.has('nist-800-53:FAMILY-AC'));

  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'nist-800-53b:MODERATE'
    && edge.target_node_id === 'nist-800-53:AC-2'
    && edge.relationship_type === 'includes'));
  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'fips-199:FIPS-199-MODERATE'
    && edge.target_node_id === 'nist-800-53b:MODERATE'
    && edge.relationship_type === 'selects'));
  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'fips-200:AC'
    && edge.target_node_id === 'nist-800-53:FAMILY-AC'
    && edge.relationship_type === 'references'));
  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'nist-800-37:RMF-SELECT'
    && edge.target_node_id === 'nist-800-53b:MODERATE'
    && edge.relationship_type === 'selects'));
});
