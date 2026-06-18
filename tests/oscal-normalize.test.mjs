import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  classifyOscalDocument,
  parse800171CsvCatalog,
  parse800172Catalog,
  parse80053Catalog,
} from '../tools/normalizers/oscal-normalize.mjs';

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

test('800-171 Rev. 2 CSV normalization preserves requirement identifiers and discussions', () => {
  const csv = [
    'Family,Basic/Derived Security Requirement,Identifier,Sort-As, Security Requirement,Discussion',
    'Access Control,Basic,3.1.1,03.01.01,"Limit system access to authorized users.","Access control discussion."',
  ].join('\n');
  const result = parse800171CsvCatalog(csv, 'nist-800-171-rev2');
  assert.equal(result.source_key, 'nist-800-171-rev2');
  assert.deepEqual(result.records[0], {
    id: '3.1.1',
    type: '800-171-requirement',
    framework: '800-171',
    title: '3.1.1',
    family: 'Access Control',
    description: 'Limit system access to authorized users. Access control discussion.',
    plain_language_summary: 'Limit system access to authorized users.',
  });
});

test('800-172 catalog normalization preserves enhanced requirement identifiers', () => {
  const catalog = {
    catalog: {
      groups: [{
        id: 'SP_800_172_3_0_0_3.1',
        class: 'family',
        title: 'Access Control',
        controls: [{
          id: 'SP_800_172_3_0_0_03.01.01E',
          class: 'security_requirement',
          title: 'Dual Authorization',
          parts: [{ prose: 'Protect critical CUI functions.' }],
        }],
      }],
    },
  };
  const result = parse800172Catalog(catalog, 'nist-800-172-rev3');
  assert.equal(result.source_key, 'nist-800-172-rev3');
  assert.deepEqual(result.records[0], {
    id: '3.1.1E',
    type: '800-172-requirement',
    framework: '800-172',
    title: 'Dual Authorization',
    family: 'Access Control',
    description: 'Protect critical CUI functions.',
    plain_language_summary: 'Protect critical CUI functions.',
  });
});
