import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { validateGraphArtifacts } from '../tools/validators/federal-graph.mjs';
import { CATALOG_TIERS } from '../scripts/build-framework-data.mjs';

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

test('plain-language summaries and rationales avoid known generation defects', () => {
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;

  const badSummaryPatterns = [
    /Ensure we an\b/i,
    /\s+to\s+\./,
    /\s+for each\s+to\s+/,
    /\s+after\s+\./,
  ];

  let checkedSummaries = 0;
  for (const node of nodes) {
    if (!node.plain_language_summary) continue;
    checkedSummaries += 1;
    for (const pattern of badSummaryPatterns) {
      assert.doesNotMatch(node.plain_language_summary, pattern, `bad summary for ${node.id}: ${node.plain_language_summary}`);
    }
    assert.ok(node.plain_language_summary.length >= 20, `summary too short for ${node.id}`);
    assert.ok(!node.plain_language_summary.endsWith('...') || node.plain_language_summary.length > 100, `truncated mid-word for ${node.id}`);
  }
  assert.ok(checkedSummaries > 500, 'expected plain-language summaries on most nodes');

  const olirBoilerplate = edges.filter((edge) =>
    edge.plain_language_rationale && /^NIST OLIR concept crosswalk associates/i.test(edge.plain_language_rationale),
  );
  assert.equal(olirBoilerplate.length, 0, 'plain-language rationales should not echo OLIR boilerplate');

  for (const edge of edges.slice(0, 500)) {
    if (!edge.plain_language_rationale) continue;
    assert.doesNotMatch(edge.plain_language_rationale, /^NIST OLIR concept crosswalk associates/i);
    assert.match(edge.plain_language_rationale, /before|Compare|Review/i, `operational guidance missing for ${edge.id}`);
  }
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
      plain_language_summary: 'Plain language summary for node one',
      metadata: {},
    }, {
      id: 'node:one',
      node_type: 'requirement',
      label: 'Duplicate',
      source_id: 'restricted-source',
      lifecycle_status: 'active',
      plain_language_summary: 'Plain language summary for duplicate node',
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
      plain_language_rationale: 'Blocked relationship rationale',
      source_refs: [{ source_id: 'excluded-source', ref_type: 'primary', locator: 'test' }],
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
      rationale: 'Inferred mapping rationale',
      plain_language_rationale: 'Inferred plain rationale',
      source_refs: [{ source_id: 'restricted-source', ref_type: 'primary', locator: 'test' }],
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

test('every catalog with a declared parent tier has all of its records parented', () => {
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;
  const parented = new Set(
    edges.filter((edge) => edge.relationship_type === 'includes').map((edge) => edge.target_node_id),
  );
  const tierNodeTypes = new Set(Object.values(CATALOG_TIERS).map((tier) => tier.nodeType));

  for (const catalogId of Object.keys(CATALOG_TIERS)) {
    // A catalog summary node is the root of its own tree, so it is the one node
    // that legitimately has no parent. Tier nodes are the branches; parenting
    // those to their catalog is separate outstanding work (see docs/STATE.md).
    const records = nodes.filter(
      (node) =>
        node.metadata?.catalog_id === catalogId &&
        !tierNodeTypes.has(node.node_type) &&
        node.node_type !== 'catalog',
    );
    assert.ok(records.length > 0, `${catalogId} produced no records`);
    const unparented = records.filter((node) => !parented.has(node.id)).map((node) => node.id);
    assert.deepEqual(
      unparented,
      [],
      `${catalogId} declares a parent tier, so every record must have an includes edge from it`,
    );
  }
});

test('declared parent tiers materialize real tier nodes with plain-language titles', () => {
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;
  const childCount = new Map();
  for (const edge of edges) {
    if (edge.relationship_type !== 'includes') continue;
    childCount.set(edge.source_node_id, (childCount.get(edge.source_node_id) ?? 0) + 1);
  }

  for (const [catalogId, tier] of Object.entries(CATALOG_TIERS)) {
    const tierNodes = nodes.filter(
      (node) => node.metadata?.catalog_id === catalogId && node.node_type === tier.nodeType,
    );
    assert.ok(tierNodes.length > 0, `${catalogId} declares tier ${tier.nodeType} but built none`);
    for (const node of tierNodes) {
      assert.ok(node.label?.trim(), `${node.id} needs a label`);
      assert.ok(node.metadata?.title?.trim(), `${node.id} needs a title`);
      assert.ok(node.metadata?.description?.trim(), `${node.id} needs a description`);
      assert.ok(
        (childCount.get(node.id) ?? 0) > 0,
        `${node.id} is a tier node with no children, so it should not exist`,
      );
    }
  }
});

test('DISA STIG and SRG records carry their benchmark as the grouping label', () => {
  const nodes = generated('nodes').nodes;
  for (const [catalogId, nodeType] of [
    ['disa-stig', 'stig_rule'],
    ['disa-srg', 'srg_requirement'],
  ]) {
    const records = nodes.filter((node) => node.node_type === nodeType);
    assert.ok(records.length > 0, `${catalogId} produced no ${nodeType} records`);
    const unlabelled = records.filter((node) => !node.metadata?.family?.trim()).map((node) => node.id);
    assert.deepEqual(
      unlabelled,
      [],
      `${nodeType} records must carry metadata.family so the catalog family filter works`,
    );
  }

  const benchmarks = nodes.filter((node) => node.node_type === 'benchmark');
  const stigBenchmarks = benchmarks.filter((node) => node.metadata?.catalog_id === 'disa-stig');
  const srgBenchmarks = benchmarks.filter((node) => node.metadata?.catalog_id === 'disa-srg');
  assert.ok(stigBenchmarks.length > 0, 'expected DISA STIG benchmark nodes');
  assert.ok(srgBenchmarks.length > 0, 'expected DISA SRG benchmark nodes');
});

test('every tiered catalog has its outermost tier parented to the catalog node, not floating', () => {
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;
  const parented = new Set(
    edges.filter((edge) => edge.relationship_type === 'includes').map((edge) => edge.target_node_id),
  );
  for (const [catalogId, tier] of Object.entries(CATALOG_TIERS)) {
    const catalogNode = nodes.find((node) => node.id === `${catalogId}:CATALOG`);
    assert.ok(catalogNode, `${catalogId} needs a catalog node for its tier to hang off`);
    // The outermost tier is the parentTier when declared (e.g. CSF Function
    // above Category), else the tier itself (e.g. STIG benchmark).
    const outerNodeType = tier.parentTier?.nodeType || tier.nodeType;
    const outerNodes = nodes.filter(
      (node) => node.metadata?.catalog_id === catalogId && node.node_type === outerNodeType,
    );
    assert.ok(outerNodes.length > 0, `${catalogId} has no ${outerNodeType} tier nodes`);
    for (const node of outerNodes) {
      assert.ok(parented.has(node.id), `${node.id} should be parented to ${catalogId}:CATALOG`);
    }
  }
});

test('CSF 2.0 subcategories chain up through Category to Function', () => {
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;
  const includesEdges = edges.filter((edge) => edge.relationship_type === 'includes');
  const childrenOf = new Map();
  for (const edge of includesEdges) {
    if (!childrenOf.has(edge.source_node_id)) childrenOf.set(edge.source_node_id, []);
    childrenOf.get(edge.source_node_id).push(edge.target_node_id);
  }

  const functions = nodes.filter((node) => node.node_type === 'function' && node.metadata?.catalog_id === 'csf-2');
  const categories = nodes.filter((node) => node.node_type === 'category' && node.metadata?.catalog_id === 'csf-2');
  assert.equal(functions.length, 6, 'CSF 2.0 has 6 Functions');
  assert.equal(categories.length, 34, 'CSF 2.0 has 34 Categories');

  for (const fn of functions) {
    const children = childrenOf.get(fn.id) || [];
    assert.ok(children.length > 0, `${fn.id} should include at least one Category`);
    for (const childId of children) {
      const child = nodes.find((node) => node.id === childId);
      assert.equal(child?.node_type, 'category', `${fn.id} should only include Category nodes`);
    }
  }
  for (const category of categories) {
    const children = childrenOf.get(category.id) || [];
    assert.ok(children.length > 0, `${category.id} should include at least one subcategory`);
  }
});

test('ATT&CK sub-techniques nest under their parent technique', () => {
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;
  const parented = new Set(
    edges.filter((edge) => edge.relationship_type === 'includes').map((edge) => edge.target_node_id),
  );

  for (const catalogId of ['mitre-attack', 'mitre-attack-ics']) {
    const subtechniques = nodes.filter(
      (node) => node.metadata?.catalog_id === catalogId && node.metadata?.item_id?.includes('.'),
    );
    assert.ok(subtechniques.length > 0, `${catalogId} produced no sub-techniques`);
    for (const node of subtechniques) {
      const parentId = `${catalogId}:${node.metadata.item_id.split('.')[0]}`;
      assert.ok(
        edges.some(
          (edge) =>
            edge.relationship_type === 'includes' &&
            edge.source_node_id === parentId &&
            edge.target_node_id === node.id,
        ),
        `${node.id} should have an includes edge from its parent technique ${parentId}`,
      );
      assert.ok(parented.has(node.id), `${node.id} should be parented`);
    }
  }
});

test('DoD Zero Trust tenets are connected to the catalog, not fabricated as pillar children', () => {
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;
  const tenets = nodes.filter((node) => node.node_type === 'zt_tenet');
  assert.equal(tenets.length, 5, 'DoD Zero Trust has 5 tenets');

  const includesEdges = edges.filter((edge) => edge.relationship_type === 'includes');
  for (const tenet of tenets) {
    const parentEdge = includesEdges.find((edge) => edge.target_node_id === tenet.id);
    assert.ok(parentEdge, `${tenet.id} should not be isolated`);
    assert.equal(
      parentEdge.source_node_id,
      'dod-zt:CATALOG',
      `${tenet.id} should hang off the catalog as a sibling collection to pillars, not a fabricated pillar link`,
    );
  }
});
