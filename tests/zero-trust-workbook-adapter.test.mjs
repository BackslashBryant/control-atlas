import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('committed Zero Trust structured sources reconcile without synthetic records', () => {
  const manifest = JSON.parse(readFileSync('data/curated/nist-zt/structured-source-manifest.json', 'utf8'));
  assert.equal(manifest.reconciliation.workbooks_discovered, 5);
  assert.equal(manifest.reconciliation.workbooks_ingested, 5);
  assert.equal(manifest.reconciliation.workbooks_failed, 0);
  assert.equal(manifest.reconciliation.synthetic_records, 0);
  assert.ok(manifest.reconciliation.mapping_records > 1_000);
  assert.ok(manifest.reconciliation.questionnaire_records >= 50);
  assert.ok(manifest.sources.every((entry) => /^sha256:[a-f0-9]{64}$/.test(entry.sha256)));
  assert.ok(manifest.sources.every((entry) => entry.byte_length > 0 && entry.parsed_records > 0));
});

test('Zero Trust mappings and questions retain workbook cell provenance', () => {
  const mappings = JSON.parse(readFileSync('data/curated/nist-zt/mappings.json', 'utf8')).records;
  const questions = JSON.parse(readFileSync('data/curated/nist-zt/microsoft-questionnaire.json', 'utf8')).records;
  assert.ok(mappings.every((entry) => entry.target_id && entry.source_fragments.length >= 4));
  assert.ok(mappings.every((entry) => entry.source_fragments.every((fragment) => /^[A-Z]+\d+$/.test(fragment.cell))));
  assert.ok(questions.every((entry) => entry.question && entry.answer_options.length > 0));
  assert.ok(questions.every((entry) => entry.source_fragments.some((fragment) => fragment.field === 'question')));
});
