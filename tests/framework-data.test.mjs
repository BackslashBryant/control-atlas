import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCciXml } from '../tools/importers/cci-adapter.mjs';
import { parseOlirCsv } from '../tools/relationship-builders/olir-adapter.mjs';
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
  assert.equal(result.sources, 35);
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

test('issue 11 graph build emits assessment context and governance artifacts for AC-2', () => {
  buildFrameworkData();
  const sources = generated('sources').sources;
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;
  const evidence = generated('evidence').evidence;
  const buildManifest = generated('build-manifest');
  const sourceManifests = generated('source-manifests');
  const diffSummary = generated('graph-diff-summary');

  assert.ok(sources.some((source) => source.id === 'nist-800-53a-assessment-procedures'));
  const assessmentNode = nodes.find((node) => node.id === 'nist-800-53a:AC-2');
  assert.ok(assessmentNode, 'missing AC-2 assessment node');
  assert.equal(assessmentNode.node_type, 'assessment_procedure');
  assert.ok(Array.isArray(assessmentNode.metadata.assessment_methods));
  assert.ok(Array.isArray(assessmentNode.metadata.assessment_objectives));
  assert.ok(Array.isArray(assessmentNode.metadata.assessment_objects));
  assert.match(assessmentNode.metadata.procedure_text, /account managers are assigned/i);

  const assessmentEdge = edges.find((edge) =>
    edge.source_node_id === 'nist-800-53a:AC-2'
    && edge.target_node_id === 'nist-800-53:AC-2'
    && edge.relationship_type === 'assesses');
  assert.ok(assessmentEdge, 'missing AC-2 assesses edge');
  assert.ok(evidence.some((entry) => assessmentEdge.evidence_ids.includes(entry.id)));

  assert.ok(existsSync('data/generated/build-manifest.json'));
  assert.ok(existsSync('data/generated/source-manifests.json'));
  assert.ok(existsSync('data/generated/graph-diff-summary.json'));
  assert.ok(buildManifest.build_manifest.runtime_artifacts.includes('graph-health.json'));
  assert.ok(buildManifest.build_manifest.governance_artifacts.includes('build-manifest.json'));
  assert.ok(sourceManifests.source_manifests.some((entry) => entry.source_id === 'nist-800-53a-assessment-procedures'));
  assert.equal(diffSummary.graph_diff_summary.kind, 'graph_diff_summary');
});

test('issue 12 graph build emits Release 2 program context without a synthetic revision bridge', () => {
  buildFrameworkData();
  const sources = generated('sources').sources;
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;

  const sourceIds = new Set(sources.map((source) => source.id));
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const id of ['nist-800-171-rev2', 'nist-800-172-rev3', 'isoo-cui-regulation', 'nara-cui-registry']) {
    assert.ok(sourceIds.has(id), `missing source ${id}`);
  }

  for (const id of [
    'nist-800-171-rev2:3.1.1',
    'nist-800-171-rev2:CATALOG',
    'nist-800-171:CATALOG',
    'nist-800-172:3.1.1E',
    'nist-800-172:CATALOG',
    'cui-policy:CUI-PROGRAM',
    'cui-policy:CUI-BASIC',
    'cui-policy:CUI-SPECIFIED',
  ]) {
    assert.ok(nodeIds.has(id), `missing node ${id}`);
  }

  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'fedramp-rev5:MODERATE'
    && edge.target_node_id === 'nist-800-53:AC-2'
    && edge.relationship_type === 'includes'));
  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'cmmc-2:LEVEL-2'
    && edge.target_node_id === 'nist-800-171-rev2:3.1.1'
    && edge.relationship_type === 'requires'));
  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'cmmc-2:LEVEL-3'
    && edge.target_node_id === 'nist-800-171-rev2:CATALOG'
    && edge.relationship_type === 'depends_on'));
  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'cmmc-2:LEVEL-3'
    && edge.target_node_id === 'nist-800-172:CATALOG'
    && edge.relationship_type === 'depends_on'));
  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'nist-800-171-rev2:CATALOG'
    && edge.target_node_id === 'cui-policy:CUI-BASIC'
    && edge.relationship_type === 'protects'));
  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'nist-800-172:CATALOG'
    && edge.target_node_id === 'cui-policy:CUI-PROGRAM'
    && edge.relationship_type === 'supports'));
  assert.ok(!edges.some((edge) =>
    edge.source_node_id === 'cmmc-2:LEVEL-2'
    && edge.target_node_id.startsWith('nist-800-171:')
    && edge.relationship_type === 'requires'));
  assert.ok(!edges.some((edge) =>
    edge.source_node_id === 'cmmc-2:LEVEL-2'
    && edge.target_node_id === 'nist-800-53:AC-2'));
});

test('epic 2 graph build emits DISA STIG and SRG nodes plus official CCI references', () => {
  buildFrameworkData();
  const sources = generated('sources').sources;
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;

  const sourceIds = new Set(sources.map((source) => source.id));
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const id of ['disa-stig-library', 'disa-srg-library', 'disa-stig-srg-cci-references']) {
    assert.ok(sourceIds.has(id), `missing source ${id}`);
  }

  assert.ok(nodeIds.has('disa-stig:V-100001'));
  assert.ok(nodeIds.has('disa-srg:V-200001'));

  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'disa-stig:V-100001'
    && edge.target_node_id === 'disa-cci:CCI-000015'
    && edge.relationship_type === 'references'));
  assert.ok(edges.some((edge) =>
    edge.source_node_id === 'disa-srg:V-200001'
    && edge.target_node_id === 'disa-cci:CCI-000213'
    && edge.relationship_type === 'references'));
  assert.ok(!edges.some((edge) =>
    edge.source_node_id === 'disa-stig:V-100001'
    && edge.target_node_id === 'nist-800-53:AC-2'));
});

test('epic 3 graph build emits a library search artifact with filter facets', () => {
  buildFrameworkData();
  const library = generated('library-search');

  assert.equal(library.schema_version, '1.0');
  assert.ok(Array.isArray(library.library_search.documents));
  assert.ok(typeof library.library_search.serialized_index === 'string');

  const ac2 = library.library_search.documents.find((entry) => entry.id === 'nist-800-53:AC-2');
  assert.ok(ac2, 'missing AC-2 library document');
  assert.equal(ac2.object_type, 'control');
  assert.equal(ac2.source_class, 'federal_published');
  assert.equal(ac2.control_family, 'Access Control');
});
