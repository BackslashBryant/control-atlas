import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  INGESTION_STAGES,
  INGESTION_TASKS,
  validateIngestionPipelineDefinition,
} from '../scripts/lib/ingestion-pipeline.mjs';
import { preserveGeneratedAt } from '../scripts/lib/stable-generated-at.mjs';

test('generated ingestion ledgers preserve their timestamp when content is unchanged', () => {
  const path = 'data/generated/ingestion-stage-ledger.json';
  const previous = JSON.parse(readFileSync(path, 'utf8'));
  const next = { ...previous, generated_at: '2099-01-01T00:00:00.000Z' };
  assert.equal(preserveGeneratedAt(path, next).generated_at, previous.generated_at);
  next.status = 'FAILED';
  assert.equal(preserveGeneratedAt(path, next).generated_at, '2099-01-01T00:00:00.000Z');
});

test('every source uses one complete ingestion lifecycle with explicit presentation', () => {
  assert.deepEqual(validateIngestionPipelineDefinition(), []);
  assert.deepEqual(INGESTION_STAGES, [
    'discover', 'acquire', 'attest', 'parse', 'normalize',
    'structure', 'relationships', 'presentation', 'reconcile', 'publish',
  ]);
  assert.ok(INGESTION_TASKS.some((task) => task.stages.includes('presentation')));
  assert.deepEqual(
    INGESTION_TASKS.find((task) => task.id === 'enrich-commons-resources')?.args,
    ['--refresh'],
  );
  assert.ok(INGESTION_TASKS.filter((task) => task.stages.includes('parse'))
    .every((task) => task.stages.includes('acquire') || task.id === 'extract-dod-zero-trust'));
});

test('SourceCountLedger never conflates parsed publisher counts with runtime citations', () => {
  const ledger = JSON.parse(readFileSync('data/generated/source-count-ledger.json', 'utf8'));
  const registry = JSON.parse(readFileSync('data/source-registry.json', 'utf8'));
  assert.equal(ledger.artifacts.length, registry.artifacts.length);
  assert.equal(ledger.catalogs.length, registry.catalog_source_bundles.length);
  assert.match(ledger.count_semantics.parsed_source_records, /source adapter/i);
  assert.match(ledger.count_semantics.runtime_node_citations, /graph nodes/i);
  assert.ok(ledger.artifacts.every((entry) => Number.isInteger(entry.counts.parsed_source_records)));
  assert.ok(ledger.artifacts.every((entry) => Number.isInteger(entry.counts.runtime_node_citations)));
});

test('every artifact and catalog has an explicit outcome for every ingestion stage', () => {
  const ledger = JSON.parse(readFileSync('data/generated/ingestion-stage-ledger.json', 'utf8'));
  for (const entry of [...ledger.artifacts, ...ledger.catalogs]) {
    assert.deepEqual(Object.keys(entry.stages), INGESTION_STAGES);
    assert.ok(Object.values(entry.stages).every((stage) => ['complete', 'not_applicable', 'failed'].includes(stage.status)));
  }
});

test('every Resource uses the same lifecycle and has an explicit presentation outcome', () => {
  const ledger = JSON.parse(readFileSync('data/generated/resource-ingestion-ledger.json', 'utf8'));
  const dataset = JSON.parse(readFileSync('data/commons-resource-dataset.json', 'utf8'));
  assert.equal(ledger.status, 'COMPLETE');
  assert.equal(ledger.resources.length, dataset.resources.length);
  for (const entry of ledger.resources) {
    assert.deepEqual(Object.keys(entry.stages), INGESTION_STAGES);
    assert.ok(Object.values(entry.stages).every((stage) => ['complete', 'not_applicable', 'failed'].includes(stage.status)));
    assert.notEqual(entry.stages.presentation.status, 'not_applicable');
  }
});
