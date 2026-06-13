import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFederalGraphRuntime,
  getFederalContext,
  normalizeViewState,
  parseViewState,
  serializeViewState,
} from '../app/runtime.mjs';

const fixture = {
  sources: [
    { id: 'nist-oscal', name: 'NIST OSCAL Content', owner: 'NIST', provenance_class: 'federal_published', graph_eligible: true, metadata: { frameworks: ['nist-800-53', 'csf-2'] } },
    { id: 'nist-map', name: 'NIST mapping', owner: 'NIST', provenance_class: 'federal_published', graph_eligible: true, metadata: { frameworks: ['nist-800-53', 'csf-2'] } },
    { id: 'nist-800-53b-baselines', name: 'NIST SP 800-53B Baseline Profiles', owner: 'NIST', provenance_class: 'federal_published', graph_eligible: true, metadata: { frameworks: ['nist-800-53b'] } },
    { id: 'nist-fips-199', name: 'FIPS 199', owner: 'NIST', provenance_class: 'mandated', graph_eligible: true, metadata: { frameworks: ['fips-199'] } },
    { id: 'nist-fips-200', name: 'FIPS 200', owner: 'NIST', provenance_class: 'mandated', graph_eligible: true, metadata: { frameworks: ['fips-200'] } },
    { id: 'nist-800-37-rev2', name: 'SP 800-37 Rev. 2', owner: 'NIST', provenance_class: 'federal_published', graph_eligible: true, metadata: { frameworks: ['nist-800-37'] } },
    { id: 'nist-800-53a-assessment-procedures', name: 'SP 800-53A Assessment Procedures', owner: 'NIST', provenance_class: 'federal_published', graph_eligible: true, metadata: { frameworks: ['nist-800-53a'] } },
  ],
  nodes: [
    { id: 'nist-800-53:AC-2', node_type: 'control', label: 'AC-2 Account Management', source_id: 'nist-oscal', metadata: { catalog_id: 'nist-800-53', item_id: 'AC-2', title: 'Account Management', description: 'Manage system accounts.' } },
    { id: 'nist-800-53:AC-3', node_type: 'control', label: 'AC-3 Access Enforcement', source_id: 'nist-oscal', metadata: { catalog_id: 'nist-800-53', item_id: 'AC-3', title: 'Access Enforcement', description: 'Enforce access.' } },
    { id: 'nist-800-53a:AC-2', node_type: 'assessment_procedure', label: 'AC-2 Assessment Procedure', source_id: 'nist-800-53a-assessment-procedures', metadata: { catalog_id: 'nist-800-53a', item_id: 'AC-2', title: 'Account Management Assessment Procedure', description: 'Assess AC-2.', assessment_methods: ['EXAMINE', 'INTERVIEW'], assessment_objects: [['Access control policy', 'system security plan'], ['System owners']], assessment_objectives: [{ label: 'AC-02a.[01]', prose: 'account types allowed are defined and documented;' }], procedure_text: 'account types allowed are defined and documented; account managers are assigned;' } },
    { id: 'nist-800-53:FAMILY-AC', node_type: 'family', label: 'AC Access Control Family', source_id: 'nist-oscal', metadata: { catalog_id: 'nist-800-53', item_id: 'FAMILY-AC', title: 'Access Control', description: 'Access control family.' } },
    { id: 'csf-2:PR.AA-01', node_type: 'requirement', label: 'PR.AA-01 Identity Management', source_id: 'nist-oscal', metadata: { catalog_id: 'csf-2', item_id: 'PR.AA-01', title: 'Identity Management', description: 'Identity controls.' } },
    { id: 'nist-800-53b:MODERATE', node_type: 'baseline', label: 'MODERATE Moderate Baseline', source_id: 'nist-800-53b-baselines', metadata: { catalog_id: 'nist-800-53b', item_id: 'MODERATE', title: 'Moderate Baseline', description: 'Moderate impact baseline.' } },
    { id: 'fips-199:FIPS-199-MODERATE', node_type: 'impact_category', label: 'FIPS-199-MODERATE Moderate Impact', source_id: 'nist-fips-199', metadata: { catalog_id: 'fips-199', item_id: 'FIPS-199-MODERATE', title: 'Moderate Impact', description: 'Moderate potential impact.' } },
    { id: 'fips-200:AC', node_type: 'requirement', label: 'AC Access Control', source_id: 'nist-fips-200', metadata: { catalog_id: 'fips-200', item_id: 'AC', title: 'Access Control', description: 'Limit information system access.' } },
    { id: 'nist-800-37:RMF-SELECT', node_type: 'rmf_step', label: 'RMF-SELECT Select', source_id: 'nist-800-37-rev2', metadata: { catalog_id: 'nist-800-37', item_id: 'RMF-SELECT', title: 'Select', description: 'Select controls.' } },
  ],
  edges: [
    { id: 'edge:m1', source_node_id: 'nist-800-53:AC-2', target_node_id: 'csf-2:PR.AA-01', relationship_type: 'maps_to', provenance_class: 'federal_published', confidence: 'direct', publication_status: 'published', evidence_ids: ['evidence:m1'] },
    { id: 'edge:family-ac2', source_node_id: 'nist-800-53:FAMILY-AC', target_node_id: 'nist-800-53:AC-2', relationship_type: 'includes', provenance_class: 'federal_published', confidence: 'direct', publication_status: 'published', evidence_ids: ['evidence:family-ac2'] },
    { id: 'edge:baseline-ac2', source_node_id: 'nist-800-53b:MODERATE', target_node_id: 'nist-800-53:AC-2', relationship_type: 'includes', provenance_class: 'federal_published', confidence: 'direct', publication_status: 'published', evidence_ids: ['evidence:baseline-ac2'] },
    { id: 'edge:fips199-moderate', source_node_id: 'fips-199:FIPS-199-MODERATE', target_node_id: 'nist-800-53b:MODERATE', relationship_type: 'selects', provenance_class: 'mandated', confidence: 'direct', publication_status: 'published', evidence_ids: ['evidence:fips199-moderate'] },
    { id: 'edge:fips200-ac', source_node_id: 'fips-200:AC', target_node_id: 'nist-800-53:FAMILY-AC', relationship_type: 'references', provenance_class: 'mandated', confidence: 'direct', publication_status: 'published', evidence_ids: ['evidence:fips200-ac'] },
    { id: 'edge:rmf-select-baseline', source_node_id: 'nist-800-37:RMF-SELECT', target_node_id: 'nist-800-53b:MODERATE', relationship_type: 'selects', provenance_class: 'federal_published', confidence: 'direct', publication_status: 'published', evidence_ids: ['evidence:rmf-select-baseline'] },
    { id: 'edge:assessment-ac2', source_node_id: 'nist-800-53a:AC-2', target_node_id: 'nist-800-53:AC-2', relationship_type: 'assesses', provenance_class: 'federal_published', confidence: 'direct', publication_status: 'published', evidence_ids: ['evidence:assessment-ac2'] },
  ],
  evidence: [
    { id: 'evidence:m1', source_id: 'nist-map', source_version: '2026', locator: 'map:1', evidence_quality: 'primary' },
    { id: 'evidence:family-ac2', source_id: 'nist-oscal', source_version: '2026', locator: 'family:AC', evidence_quality: 'primary' },
    { id: 'evidence:baseline-ac2', source_id: 'nist-800-53b-baselines', source_version: '2026', locator: 'baseline:MODERATE', evidence_quality: 'primary' },
    { id: 'evidence:fips199-moderate', source_id: 'nist-fips-199', source_version: '2004', locator: 'section-3', evidence_quality: 'primary' },
    { id: 'evidence:fips200-ac', source_id: 'nist-fips-200', source_version: '2006', locator: 'section-3', evidence_quality: 'primary' },
    { id: 'evidence:rmf-select-baseline', source_id: 'nist-800-37-rev2', source_version: '2018', locator: 'section-3.2', evidence_quality: 'primary' },
    { id: 'evidence:assessment-ac2', source_id: 'nist-800-53a-assessment-procedures', source_version: '2026', locator: 'AC-2', evidence_quality: 'primary' },
  ],
  findings: [{ id: 'finding:1', finding_type: 'blocked_relationship', severity: 'warning', source_id: 'excluded', subject_id: 'edge:x', message: 'Blocked' }],
};

test('runtime searches graph nodes by exact ID before text', () => {
  const runtime = createFederalGraphRuntime(fixture);
  assert.equal(runtime.searchNodes('AC-2')[0].id, 'nist-800-53:AC-2');
  assert.equal(runtime.searchNodes('Access Enforcement')[0].id, 'nist-800-53:AC-3');
  assert.equal(runtime.getEdgesForNode('nist-800-53:AC-3').length, 0);
});

test('runtime exposes source-backed edges, evidence, sources, and graph health', () => {
  const runtime = createFederalGraphRuntime(fixture);
  assert.equal(runtime.getNode('csf-2:PR.AA-01').metadata.item_id, 'PR.AA-01');
  assert.equal(runtime.getNodes({ catalog_id: 'nist-800-53' }).length, 3);
  assert.equal(runtime.getEdgesForNode('nist-800-53:AC-2')[0].id, 'edge:m1');
  assert.equal(runtime.getEvidenceForEdge('edge:m1')[0].source.name, 'NIST mapping');
  assert.equal(runtime.getSources().length, 7);
  assert.equal(runtime.getGraphHealth().length, 1);
});

test('runtime builds a catalog relationship matrix and CSV from graph edges', () => {
  const runtime = createFederalGraphRuntime(fixture);
  const matrix = runtime.buildRelationshipMatrix({ source_catalog: 'nist-800-53', target_catalog: 'csf-2' });
  assert.equal(matrix.rows.length, 3);
  assert.equal(matrix.rows[0].classification, 'published');
  assert.equal(matrix.rows[1].classification, 'unmapped');
  assert.match(runtime.buildRelationshipCsv(matrix), /AC-2/);
});

test('runtime composes issue 10 federal context for a control from adjacent nodes', () => {
  const runtime = createFederalGraphRuntime(fixture);
  const context = getFederalContext(runtime, 'nist-800-53:AC-2');

  assert.deepEqual(context.baselineMembership.map((entry) => entry.baselineNode.id), ['nist-800-53b:MODERATE']);
  assert.deepEqual(context.categorizationContext.map((entry) => entry.categoryNode.id), ['fips-199:FIPS-199-MODERATE']);
  assert.deepEqual(context.minimumSecurityRequirements.map((entry) => entry.requirementNode.id), ['fips-200:AC']);
  assert.deepEqual(context.rmfLifecycle.map((entry) => entry.stepNode.id), ['nist-800-37:RMF-SELECT']);
  assert.deepEqual(context.assessmentContext.map((entry) => entry.assessmentNode.id), ['nist-800-53a:AC-2']);
  assert.deepEqual(context.assessmentContext[0].assessmentNode.metadata.assessment_methods, ['EXAMINE', 'INTERVIEW']);
});

test('view state preserves supported queries and identifies retired query types', () => {
  assert.deepEqual(parseViewState('?q=AC-2'), { view: 'search', query: 'AC-2', filter: '' });
  assert.deepEqual(parseViewState('?q=ABC-2024-0001'), { view: 'retired', query: 'ABC-2024-0001', retired_type: 'retired identifier' });
  assert.equal(serializeViewState({ view: 'search', query: 'AC-2' }), '?view=search&q=AC-2');
  assert.deepEqual(parseViewState('?view=matrix&source=nist-800-53&target=csf-2&items=AC-2%2CAC-3'), {
    view: 'matrix',
    source: 'nist-800-53',
    target: 'csf-2',
    items: 'AC-2,AC-3',
  });
});

test('normalizeViewState strips stale params per view', () => {
  assert.deepEqual(normalizeViewState('browse', { view: 'search', query: 'AC-2', framework: 'disa-cci', mode: 'expert' }), {
    mode: 'expert',
    view: 'browse',
    framework: 'disa-cci',
  });
  assert.deepEqual(normalizeViewState('sources', { query: 'AC-2', mode: 'expert' }), { mode: 'expert', view: 'sources' });
});
