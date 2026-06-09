import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFrameworkRuntime,
  parseViewState,
  serializeViewState,
} from '../app/runtime.mjs';

const fixture = {
  frameworks: [
    { id: 'nist-800-53', name: 'NIST SP 800-53 Rev. 5' },
    { id: 'csf-2', name: 'NIST CSF 2.0' },
  ],
  items: [
    { key: 'nist-800-53:AC-2', framework_id: 'nist-800-53', item_id: 'AC-2', title: 'Account Management', text: 'Manage system accounts.' },
    { key: 'nist-800-53:AC-3', framework_id: 'nist-800-53', item_id: 'AC-3', title: 'Access Enforcement', text: 'Enforce access.' },
    { key: 'csf-2:PR.AA-01', framework_id: 'csf-2', item_id: 'PR.AA-01', title: 'Identity Management', text: 'Identity controls.' },
  ],
  mappings: [
    { id: 'm1', source_key: 'nist-800-53:AC-2', target_key: 'csf-2:PR.AA-01', relationship_type: 'maps_to', evidence_gaps: ['bronze'] },
  ],
  paths: [],
  evidence: { m1: { assertion_id: 'm1', sources: [{ tier: 'gold' }] } },
};

test('runtime searches exact IDs before text and keeps unmapped records searchable', () => {
  const runtime = createFrameworkRuntime(fixture);
  assert.equal(runtime.searchFrameworkItems('AC-2')[0].item_id, 'AC-2');
  assert.equal(runtime.searchFrameworkItems('Access Enforcement')[0].item_id, 'AC-3');
  assert.equal(runtime.getDirectMappings('nist-800-53:AC-3').length, 0);
});

test('runtime exposes direct mappings, evidence summaries, and matrix output', () => {
  const runtime = createFrameworkRuntime(fixture);
  assert.equal(runtime.getDirectMappings('nist-800-53:AC-2')[0].id, 'm1');
  assert.equal(runtime.getDirectMappings('csf-2:PR.AA-01')[0].id, 'm1');
  assert.equal(runtime.getEvidenceSummary('m1').sources[0].tier, 'gold');
  assert.equal(runtime.buildMappingMatrix({ source_framework: 'nist-800-53', target_framework: 'csf-2' }).rows.length, 2);
  assert.match(runtime.buildMatrixCsv({ source_framework: 'nist-800-53', target_framework: 'csf-2' }), /AC-2/);
  assert.equal(runtime.buildMappingMatrix({
    source_framework: 'nist-800-53',
    target_framework: 'csf-2',
    item_keys: ['nist-800-53:AC-2'],
  }).rows.length, 1);
});

test('view state preserves supported queries and identifies retired query types', () => {
  assert.deepEqual(parseViewState('?q=AC-2'), { view: 'search', query: 'AC-2' });
  assert.deepEqual(parseViewState('?q=ABC-2024-0001'), { view: 'retired', query: 'ABC-2024-0001', retired_type: 'retired identifier' });
  assert.equal(serializeViewState({ view: 'matrix', source: 'nist-800-53', target: 'csf-2' }), '?view=matrix&source=nist-800-53&target=csf-2');
  assert.deepEqual(parseViewState('?view=matrix&source=nist-800-53&target=csf-2&items=AC-2%2CAC-3'), {
    view: 'matrix',
    source: 'nist-800-53',
    target: 'csf-2',
    items: 'AC-2,AC-3',
  });
});
