import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseCciXml } from '../scripts/lib/cci-adapter.mjs';
import { parseOlirCsv } from '../scripts/lib/olir-adapter.mjs';
import { buildFrameworkData } from '../scripts/build-framework-data.mjs';

test('CCI adapter preserves official bridge requirements and references', () => {
  const result = parseCciXml(readFileSync('tests/fixtures/cci/sample.xml', 'utf8'));
  assert.equal(result.records[0].id, 'CCI-000015');
  assert.deepEqual(result.relationships.map((item) => item.target_id), ['AC-2.1']);
  assert.ok(result.relationships.every((item) => item.evidence_source === 'disa-cci-nist-references'));
});

test('OLIR adapter preserves source and target identifiers', () => {
  const relationships = parseOlirCsv(readFileSync('tests/fixtures/olir/sample-crosswalk.csv', 'utf8'));
  assert.equal(relationships[0].source_id, 'nist-800-53:AC-2');
  assert.equal(relationships[0].target_id, 'csf-2:PR.AA-01');
});

test('federal graph build emits graph contract counts', () => {
  const result = buildFrameworkData();
  const generatedAt = JSON.parse(readFileSync('data/generated/sources.json', 'utf8')).generated_at;
  buildFrameworkData();
  assert.equal(result.sources, 17);
  assert.ok(result.nodes > 6000);
  assert.ok(result.edges > 3000);
  assert.equal(result.edges, result.evidence);
  assert.ok(result.findings > 0);
  assert.equal(JSON.parse(readFileSync('data/generated/sources.json', 'utf8')).generated_at, generatedAt);
});
