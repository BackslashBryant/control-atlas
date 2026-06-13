import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { validateGraphArtifacts } from '../scripts/lib/federal-graph.mjs';

const generated = (name) => JSON.parse(readFileSync(`data/generated/${name}.json`, 'utf8'));
const expectedArtifacts = ['sources', 'nodes', 'edges', 'evidence', 'graph-health'];
const retiredArtifacts = [
  'bootstrap',
  'catalog',
  'coverage',
  'frameworks',
  'items',
  'mappings',
  'paths',
  'candidates',
  'source-health',
];

test('generated output uses only the federal graph artifact contract', () => {
  for (const name of expectedArtifacts) {
    assert.ok(existsSync(`data/generated/${name}.json`), `missing ${name}.json`);
    const artifact = generated(name);
    assert.equal(artifact.schema_version, '1.0', `${name}.json schema`);
    assert.ok(artifact.generated_at, `${name}.json generated_at`);
  }
  for (const name of retiredArtifacts) {
    assert.ok(!existsSync(`data/generated/${name}.json`), `retired artifact remains: ${name}.json`);
  }
  assert.ok(existsSync('data/generated/build-manifest.json'));
  assert.ok(existsSync('data/generated/source-manifests.json'));
  assert.ok(existsSync('data/generated/graph-diff-summary.json'));
});

test('every graph node has an eligible defining federal source', () => {
  const sources = generated('sources').sources;
  const nodes = generated('nodes').nodes;
  const sourcesById = new Map(sources.map((source) => [source.id, source]));

  assert.ok(nodes.length > 1000);
  for (const node of nodes) {
    assert.ok(node.id);
    assert.ok(node.node_type);
    assert.ok(node.label);
    assert.ok(node.lifecycle_status);
    const source = sourcesById.get(node.source_id);
    assert.ok(source, `unknown defining source for ${node.id}`);
    assert.equal(source.graph_eligible, true, `ineligible defining source for ${node.id}`);
    assert.notEqual(source.eligibility_status, 'excluded');
  }
});

test('displayable edges separate semantics, provenance, confidence, and evidence quality', () => {
  const edges = generated('edges').edges;
  const evidence = generated('evidence').evidence;
  const evidenceById = new Map(evidence.map((entry) => [entry.id, entry]));

  assert.ok(edges.length > 0);
  for (const edge of edges) {
    assert.ok(edge.relationship_type);
    assert.ok(edge.provenance_class);
    assert.ok(edge.confidence);
    assert.ok(['published', 'candidate'].includes(edge.publication_status));
    assert.ok(edge.evidence_ids.length > 0, `missing evidence for ${edge.id}`);
    assert.ok(edge.evidence_ids.every((id) => evidenceById.has(id)), `unknown evidence for ${edge.id}`);
    assert.ok(edge.evidence_ids.every((id) => evidenceById.get(id).evidence_quality));
    assert.notEqual(edge.publication_status, 'blocked');
  }
});

test('candidate edges are inferred and blocked relationships appear only in graph health', () => {
  const edges = generated('edges').edges;
  const findings = generated('graph-health').findings;
  const candidates = edges.filter((edge) => edge.publication_status === 'candidate');

  assert.ok(candidates.every((edge) => edge.provenance_class === 'inferred'));
  assert.ok(candidates.every((edge) => edge.confidence.startsWith('inferred_')));
  assert.ok(candidates.every((edge) => edge.warning && edge.inference_rule_id));
  assert.ok(findings.every((finding) => finding.id
    && finding.finding_type
    && finding.severity
    && finding.source_id
    && finding.subject_id
    && finding.message));
  assert.ok(!edges.some((edge) => edge.publication_status === 'blocked'));
});

test('graph validation rejects duplicates, non-public leakage, missing edge evidence, inferred published edges, and blocked edges', () => {
  const artifacts = {
    sources: [{
      id: 'excluded-source',
      provenance_class: 'federal_referenced',
      eligibility_status: 'excluded',
      graph_eligible: false,
      access_status: 'public',
    }, {
      id: 'restricted-source',
      provenance_class: 'federal_published',
      eligibility_status: 'eligible',
      graph_eligible: true,
      access_status: 'restricted',
    }, {
      id: 'restricted-source',
      provenance_class: 'federal_published',
      eligibility_status: 'eligible',
      graph_eligible: true,
      access_status: 'restricted',
    }],
    nodes: [{
      id: 'node:one',
      node_type: 'requirement',
      label: 'One',
      source_id: 'excluded-source',
      lifecycle_status: 'active',
      metadata: {},
    }, {
      id: 'node:one',
      node_type: 'requirement',
      label: 'Duplicate',
      source_id: 'restricted-source',
      lifecycle_status: 'active',
      metadata: {},
    }],
    edges: [{
      id: 'edge:blocked',
      source_node_id: 'node:one',
      target_node_id: 'node:one',
      relationship_type: 'maps_to',
      provenance_class: 'federal_referenced',
      confidence: 'direct',
      publication_status: 'blocked',
      evidence_ids: [],
      display_label: 'Blocked',
      warning: null,
      inference_rule_id: null,
    }, {
      id: 'edge:published-inferred',
      source_node_id: 'node:one',
      target_node_id: 'node:one',
      relationship_type: 'maps_to',
      provenance_class: 'inferred',
      confidence: 'inferred_high',
      publication_status: 'published',
      evidence_ids: ['evidence:restricted'],
      display_label: 'Bad',
      warning: null,
      inference_rule_id: 'rule-1',
    }],
    evidence: [{
      id: 'evidence:restricted',
      source_id: 'restricted-source',
      evidence_quality: 'primary',
    }],
    findings: [],
  };

  const errors = validateGraphArtifacts(artifacts);
  assert.ok(errors.includes('duplicate source id: restricted-source'));
  assert.ok(errors.includes('duplicate node id: node:one'));
  assert.ok(errors.includes('node node:one defining source excluded-source is not graph eligible'));
  assert.ok(errors.includes('node node:one defining source restricted-source must remain public for displayable graph content'));
  assert.ok(errors.includes('edge edge:blocked cannot use blocked publication_status'));
  assert.ok(errors.includes('edge edge:blocked must reference evidence'));
  assert.ok(errors.includes('published edge edge:published-inferred cannot use inferred provenance_class'));
  assert.ok(errors.includes('evidence evidence:restricted source restricted-source must remain public for displayable graph content'));
});
