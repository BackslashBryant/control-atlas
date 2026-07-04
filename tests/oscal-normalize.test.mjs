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

test('800-53 catalog normalization substitutes assignment and selection ODP moustaches', () => {
  const catalog = {
    catalog: {
      groups: [{
        id: 'ac',
        class: 'family',
        title: 'Access Control',
        controls: [{
          id: 'ac-2',
          class: 'SP800-53',
          title: 'Account Management',
          params: [
            { id: 'ac-02_odp.03', label: 'personnel or roles' },
            {
              id: 'ac-02_odp.10',
              select: { 'how-many': 'one-or-more', choice: ['monthly', 'quarterly', 'annually'] },
            },
          ],
          parts: [{
            id: 'ac-2_smt',
            name: 'statement',
            parts: [
              { id: 'ac-2_smt.e', name: 'item', prose: 'Require approvals by {{ insert: param, ac-02_odp.03 }} for requests to create accounts;' },
              { id: 'ac-2_smt.j', name: 'item', prose: 'Review accounts {{ insert: param, ac-02_odp.10 }};' },
            ],
          }],
        }],
      }],
    },
  };
  const result = parse80053Catalog(catalog, 'nist-oscal');
  const record = result.records.find((item) => item.id === 'AC-2');
  assert.match(record.description, /\[Assignment: personnel or roles\]/);
  assert.match(record.description, /\[Selection \(one or more\): monthly; quarterly; annually\]/);
  assert.doesNotMatch(record.description, / by for /);
});

test('800-53 catalog normalization resolves nested selection choices and falls back for unresolved refs', () => {
  const catalog = {
    catalog: {
      groups: [{
        id: 'sc',
        class: 'family',
        title: 'System and Communications Protection',
        controls: [{
          id: 'sc-30',
          class: 'SP800-53',
          title: 'Concealment and Misdirection',
          controls: [{
            id: 'sc-30.3',
            class: 'SP800-53-enhancement',
            title: 'Change Processing and Storage Locations',
            params: [
              { id: 'sc-30.03_odp.01', label: 'processing and/or storage' },
              {
                id: 'sc-30.03_odp.02',
                select: { choice: ['{{ insert: param, sc-30.03_odp.03 }}', 'random time intervals'] },
              },
              { id: 'sc-30.03_odp.03', label: 'time frequency' },
            ],
            parts: [{
              id: 'sc-30.3_smt',
              name: 'statement',
              prose: 'Change the location of {{ insert: param, sc-30.03_odp.01 }} {{ insert: param, sc-30.03_odp.02 }}.',
            }],
          }],
        }],
      }],
    },
  };
  const result = parse80053Catalog(catalog, 'nist-oscal');
  const record = result.records.find((item) => item.id === 'SC-30.3');
  assert.match(record.description, /\[Selection: \[Assignment: time frequency\]; random time intervals\]/);

  const missingParamCatalog = {
    catalog: {
      groups: [{
        id: 'xx',
        class: 'family',
        title: 'Test Family',
        controls: [{
          id: 'xx-1',
          class: 'SP800-53',
          title: 'Test Control',
          params: [],
          parts: [{ id: 'xx-1_smt', name: 'statement', prose: 'Do the thing within {{ insert: param, xx-01_odp.missing }}.' }],
        }],
      }],
    },
  };
  const missingResult = parse80053Catalog(missingParamCatalog, 'nist-oscal');
  const missingRecord = missingResult.records.find((item) => item.id === 'XX-1');
  assert.match(missingRecord.description, /\[Assignment: organization-defined value\]/);
});

test('800-53 catalog normalization excludes assessment-objective and assessment-method prose from description', () => {
  const result = parse80053Catalog(sample80053Assessment, 'nist-oscal');
  const record = result.records.find((item) => item.id === 'AC-2');
  assert.match(record.description, /Define account types allowed for the system/);
  assert.doesNotMatch(record.description, /account types allowed for use within the system are defined and documented/);
  assert.doesNotMatch(record.description, /account managers are assigned/);
  assert.doesNotMatch(record.description, /Access control policy/);
  assert.doesNotMatch(record.description, /System owners/);
});

test('800-53 catalog normalization marks withdrawn controls and captures superseded_by', () => {
  const catalog = {
    catalog: {
      groups: [{
        id: 'ac',
        class: 'family',
        title: 'Access Control',
        controls: [{
          id: 'ac-13',
          class: 'SP800-53',
          title: 'Supervision and Review — Access Control',
          props: [{ name: 'status', value: 'withdrawn' }],
          links: [
            { href: '#ac-2', rel: 'incorporated-into' },
            { href: '#au-6', rel: 'incorporated-into' },
          ],
        }],
      }],
    },
  };
  const result = parse80053Catalog(catalog, 'nist-oscal');
  const record = result.records.find((item) => item.id === 'AC-13');
  assert.equal(record.status, 'withdrawn');
  assert.deepEqual(record.metadata.superseded_by, ['AC-2', 'AU-6']);
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
