import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFederalGraphRuntime,
  normalizeViewState,
  parseViewState,
  serializeViewState,
} from '../app/runtime.mjs';

const fixture = {
  sources: [
    { id: 'nist-oscal', name: 'NIST OSCAL Content', owner: 'NIST', provenance_class: 'federal_published', graph_eligible: true, metadata: { frameworks: ['nist-800-53', 'csf-2'] } },
    { id: 'nist-map', name: 'NIST mapping', owner: 'NIST', provenance_class: 'federal_published', graph_eligible: true, metadata: { frameworks: ['nist-800-53', 'csf-2'] } },
  ],
  nodes: [
    { id: 'nist-800-53:AC-2', node_type: 'control', label: 'AC-2 Account Management', source_id: 'nist-oscal', metadata: { catalog_id: 'nist-800-53', item_id: 'AC-2', title: 'Account Management', description: 'Manage system accounts.' } },
    { id: 'nist-800-53:AC-3', node_type: 'control', label: 'AC-3 Access Enforcement', source_id: 'nist-oscal', metadata: { catalog_id: 'nist-800-53', item_id: 'AC-3', title: 'Access Enforcement', description: 'Enforce access.' } },
    { id: 'csf-2:PR.AA-01', node_type: 'requirement', label: 'PR.AA-01 Identity Management', source_id: 'nist-oscal', metadata: { catalog_id: 'csf-2', item_id: 'PR.AA-01', title: 'Identity Management', description: 'Identity controls.' } },
  ],
  edges: [
    { id: 'edge:m1', source_node_id: 'nist-800-53:AC-2', target_node_id: 'csf-2:PR.AA-01', relationship_type: 'maps_to', provenance_class: 'federal_published', confidence: 'direct', publication_status: 'published', evidence_ids: ['evidence:m1'] },
  ],
  evidence: [
    { id: 'evidence:m1', source_id: 'nist-map', source_version: '2026', locator: 'map:1', evidence_quality: 'primary' },
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
  assert.equal(runtime.getNodes({ catalog_id: 'nist-800-53' }).length, 2);
  assert.equal(runtime.getEdgesForNode('nist-800-53:AC-2')[0].id, 'edge:m1');
  assert.equal(runtime.getEvidenceForEdge('edge:m1')[0].source.name, 'NIST mapping');
  assert.equal(runtime.getSources().length, 2);
  assert.equal(runtime.getGraphHealth().length, 1);
});

test('runtime builds a catalog relationship matrix and CSV from graph edges', () => {
  const runtime = createFederalGraphRuntime(fixture);
  const matrix = runtime.buildRelationshipMatrix({ source_catalog: 'nist-800-53', target_catalog: 'csf-2' });
  assert.equal(matrix.rows.length, 2);
  assert.equal(matrix.rows[0].classification, 'published');
  assert.equal(matrix.rows[1].classification, 'unmapped');
  assert.match(runtime.buildRelationshipCsv(matrix), /AC-2/);
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
