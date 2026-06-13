import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  classifyOscalDocument,
  parse80053Catalog,
} from '../scripts/lib/oscal-normalize.mjs';

const sample80053Assessment = JSON.parse(readFileSync('tests/fixtures/oscal/sample-800-53-assessment.json', 'utf8'));

test('OSCAL seam classifies supported Release 1 document models', () => {
  assert.equal(classifyOscalDocument(sample80053Assessment), 'catalog');
  assert.equal(classifyOscalDocument({ profile: { uuid: '1' } }), 'profile');
  assert.equal(classifyOscalDocument({ 'component-definition': { uuid: '1' } }), 'component-definition');
  assert.equal(classifyOscalDocument({ 'assessment-plan': { uuid: '1' } }), 'assessment-plan');
});

test('OSCAL seam rejects unsupported document models', () => {
  assert.throws(() => classifyOscalDocument({ 'system-security-plan': { uuid: '1' } }), /Unsupported OSCAL document model/);
});

test('800-53 catalog normalization captures issue 11 assessment context', () => {
  const result = parse80053Catalog(sample80053Assessment, 'nist-oscal');
  const record = result.records.find((item) => item.id === 'AC-2');

  assert.equal(record.source.key, 'nist-oscal');
  assert.ok(record.metadata.assessment);
  assert.equal(record.metadata.assessment.source_key, 'nist-800-53a-assessment-procedures');
  assert.deepEqual(record.metadata.assessment.methods.map((entry) => entry.method), ['EXAMINE', 'INTERVIEW']);
  assert.deepEqual(record.metadata.assessment.objects[0], ['Access control policy', 'system security plan']);
  assert.ok(record.metadata.assessment.objectives.some((entry) => entry.label === 'AC-02a.[01]'));
  assert.match(record.metadata.assessment.procedure_text, /account managers are assigned/i);
});
