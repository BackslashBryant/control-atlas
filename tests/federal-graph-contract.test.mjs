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
    // This used to require /before|Compare|Review/ — "operational guidance
    // missing" — which mandated a reflexive "review both sides before assuming
    // coverage transfers" tail on all 22k edges. The owner's copy directive
    // retires that pattern, and tests/e2e/critical-path-matrix.spec.mjs:152
    // already asserted the rendered table must NOT show it, so the two
    // contradicted each other. The rationale must still say something real.
    assert.doesNotMatch(
      edge.plain_language_rationale,
      /Review both sides|Compare both items before/i,
      `retired reflexive guidance resurfaced on ${edge.id}`,
    );
    assert.ok(
      edge.plain_language_rationale.trim().length >= 20,
      `plain-language rationale too thin for ${edge.id}`,
    );
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

test('every isolated CCI is one NIST genuinely never re-mapped to Revision 5', () => {
  const nodes = generated('nodes').nodes;
  const edges = generated('edges').edges;
  const ccis = JSON.parse(readFileSync('data/ccis.json', 'utf8'));
  const controls = JSON.parse(readFileSync('data/controls-800-53.json', 'utf8'));
  const crosswalk = JSON.parse(readFileSync('data/800-53-rev4-to-rev5-crosswalk.json', 'utf8'));

  const controlIds = new Set(controls.records.map((record) => record.id));
  const connected = new Set();
  for (const edge of edges) {
    connected.add(edge.source_node_id);
    connected.add(edge.target_node_id);
  }
  const legacyId = (index) => {
    const match = /^([A-Z]{2,3}-\d+)(?:\s*\((\d+)\))?/.exec(String(index ?? '').trim());
    if (!match) return null;
    return match[2] ? `${match[1]}.${Number.parseInt(match[2], 10)}` : match[1];
  };

  const isolated = nodes.filter(
    (node) => node.metadata?.catalog_id === 'disa-cci' && !connected.has(node.id),
  );
  const byId = new Map(ccis.records.map((record) => [record.id, record]));

  // The point of the crosswalk: a CCI may only stay isolated when NIST publishes
  // no Revision 5 home for the control it cites. If any legacy control it cites is
  // in the Rev 5 catalog, or has a published withdrawn/Appendix J target, the
  // record should have been connected and this catches the regression.
  for (const node of isolated) {
    const record = byId.get(node.metadata.item_id);
    assert.ok(record, `${node.id} has no matching CCI record`);
    for (const reference of record.references) {
      if (!reference.title.startsWith('NIST SP 800-53')) continue;
      const id = legacyId(reference.index);
      if (!id) continue;
      assert.ok(
        !controlIds.has(id),
        `${node.id} is isolated but cites ${id}, which exists in the Rev 5 catalog`,
      );
      assert.ok(
        !crosswalk.appendix_j[id]?.targets.length,
        `${node.id} is isolated but ${id} has a published Appendix J mapping`,
      );
      assert.ok(
        !crosswalk.withdrawn[id]?.targets.some((target) => controlIds.has(target)),
        `${node.id} is isolated but ${id} has a published withdrawn-control mapping`,
      );
    }
  }
});

test('the Rev 4 crosswalk maps only what NIST published', () => {
  const controls = JSON.parse(readFileSync('data/controls-800-53.json', 'utf8'));
  const map = JSON.parse(readFileSync('maps/cci-to-800-53-rev4.json', 'utf8'));
  const crosswalk = JSON.parse(readFileSync('data/800-53-rev4-to-rev5-crosswalk.json', 'utf8'));
  const controlIds = new Set(controls.records.map((record) => record.id));

  assert.equal(crosswalk.artifacts.length, 2, 'both NIST workbooks are recorded');
  for (const artifact of crosswalk.artifacts) {
    assert.match(artifact.url, /^https:\/\/csrc\.nist\.gov\//, 'artifacts come from NIST CSRC');
    assert.match(artifact.checksum, /^sha256:[0-9a-f]{64}$/, 'artifacts are checksummed');
  }

  assert.ok(map.relationships.length > 0, 'the crosswalk produced relationships');
  for (const relationship of map.relationships) {
    assert.ok(
      controlIds.has(relationship.target_id),
      `${relationship.source_id} maps to ${relationship.target_id}, which is not a Rev 5 control`,
    );
    // These edges compose two published documents rather than restating one, so
    // they must never claim the "direct" confidence a single published mapping gets.
    assert.equal(relationship.confidence, 'derived', `${relationship.source_id} confidence`);
    assert.ok(
      ['carried_forward', 'withdrawn', 'appendix_j'].includes(relationship.basis),
      `${relationship.source_id} has an unrecognized basis ${relationship.basis}`,
    );
    if (relationship.basis === 'appendix_j') {
      const cited = /Revision [34] ([A-Z]{2,3}-\d+)/.exec(relationship.why);
      assert.ok(cited, `${relationship.source_id} does not cite its legacy control`);
      assert.ok(
        crosswalk.appendix_j[cited[1]]?.targets.includes(relationship.target_id),
        `${relationship.source_id} claims an Appendix J target NIST did not publish`,
      );
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

test('W1.3a: every SP 800-53A assessment procedure has a real, resolvable parent', () => {
  const nodes = generated('nodes').nodes;
  const nodeIds = new Set(nodes.map((node) => node.id));
  const procedures = nodes.filter((node) => node.node_type === 'assessment_procedure');
  assert.equal(procedures.length, 1014, 'assessment procedure count');
  for (const node of procedures) {
    assert.ok(node.parent_id, `${node.id} is missing parent_id`);
    assert.ok(nodeIds.has(node.parent_id), `${node.id} parent_id ${node.parent_id} does not exist`);
    assert.equal(node.parent_derivation, 'nist_control_metadata', `${node.id} parent_derivation`);
  }
});

test('W1.3b: CCI structural parenting resolves the promotable majority and reports the genuine residue honestly', () => {
  const nodes = generated('nodes').nodes;
  const nodeIds = new Set(nodes.map((node) => node.id));
  const ccis = nodes.filter((node) => node.metadata?.catalog_id === 'disa-cci');
  assert.equal(ccis.length, 5137, 'CCI count');

  const parented = ccis.filter((node) => node.parent_id);
  const unparented = ccis.filter((node) => !node.parent_id);

  // Proven red first (2026-07-26): before this session, zero CCIs had parent_id
  // at all, since the field did not exist. This asserts the promotion actually
  // ran, not just that the field is technically optional.
  assert.ok(parented.length >= 5093, `expected >= 5093 CCIs parented, got ${parented.length}`);
  assert.ok(
    unparented.length <= 44,
    `expected <= 44 genuinely unmappable CCIs, got ${unparented.length}`,
  );

  for (const node of parented) {
    assert.ok(nodeIds.has(node.parent_id), `${node.id} parent_id ${node.parent_id} does not exist`);
    assert.ok(
      ['cci_promoted_ap', 'cci_promoted_control'].includes(node.parent_derivation),
      `${node.id} has an unrecognized parent_derivation ${node.parent_derivation}`,
    );
    const parentCatalog = node.parent_derivation === 'cci_promoted_ap' ? 'nist-800-53a' : 'nist-800-53';
    assert.ok(
      node.parent_id.startsWith(`${parentCatalog}:`),
      `${node.id} parent_derivation ${node.parent_derivation} does not match its parent_id ${node.parent_id}`,
    );
  }

  // Every genuinely unmappable CCI must still show up in maps/cci-to-800-53.json
  // and maps/cci-to-800-53-rev4.json as unresolved, not merely absent — this
  // catches the module silently dropping a CCI it should have resolved.
  const direct = JSON.parse(readFileSync('maps/cci-to-800-53.json', 'utf8'));
  const crosswalkMap = JSON.parse(readFileSync('maps/cci-to-800-53-rev4.json', 'utf8'));
  const hasCandidate = new Set([
    ...direct.relationships.map((r) => r.source_id),
    ...crosswalkMap.relationships.map((r) => r.source_id),
  ]);
  for (const node of unparented) {
    assert.ok(
      !hasCandidate.has(node.metadata.item_id) ||
        ![...direct.relationships, ...crosswalkMap.relationships].some(
          (r) =>
            r.source_id === node.metadata.item_id &&
            nodes.some(
              (n) =>
                (n.node_type === 'assessment_procedure' || n.node_type === 'control' || n.node_type === 'control_enhancement') &&
                n.metadata?.item_id === r.target_id &&
                n.metadata?.catalog_id === 'nist-800-53',
            ),
        ),
      `${node.id} has a resolvable candidate but was left unparented`,
    );
  }
});

test('every node with a parent_id carries a class-1 structural relationship, never applicability or correlation', () => {
  const nodes = generated('nodes').nodes;
  const APPLICABILITY_OR_CORRELATION_DERIVATIONS = new Set([
    'selected_by_baseline',
    'included_in_profile',
    'modified_by_overlay',
    'applicable_to',
    'maps_to',
    'implements',
    'mitigates',
    'assessed_by',
  ]);
  for (const node of nodes) {
    if (!node.parent_id) continue;
    assert.ok(
      !APPLICABILITY_OR_CORRELATION_DERIVATIONS.has(node.parent_derivation),
      `${node.id} parent_derivation "${node.parent_derivation}" names a Class 2/3 relationship, not a structural one`,
    );
  }
});
