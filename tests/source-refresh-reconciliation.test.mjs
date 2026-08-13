import assert from 'node:assert/strict';
import test from 'node:test';

import { artifactHash, reconcileFreshness } from '../scripts/reconcile-source-freshness.mjs';

test('artifact hashes ignore refresh timestamps but retain substantive changes', () => {
  const first = { snapshot_date: '2026-01-01', records: [{ id: 'A', title: 'Alpha' }] };
  const later = { snapshot_date: '2026-07-16', records: [{ id: 'A', title: 'Alpha' }] };
  const changed = { snapshot_date: '2026-07-16', records: [{ id: 'A', title: 'Beta' }] };
  assert.equal(artifactHash(first), artifactHash(later));
  assert.notEqual(artifactHash(first), artifactHash(changed));
});

test('reconciliation separates checked dates, imported dates, and link observations', () => {
  const unchangedArtifact = { source_version: '1', records: [{ id: 'A' }] };
  const existingHash = artifactHash([unchangedArtifact]);
  const registry = {
    sources: [{ id: 'auto', version: '1' }, { id: 'changed', version: '1' }, { id: 'link', version: 'current' }],
    freshness: { sources: [
      { source_id: 'auto', sync_model: 'auto_synced', last_checked: '2026-07-01', last_imported: '2026-07-01', hash: existingHash },
      { source_id: 'changed', sync_model: 'auto_synced', last_checked: '2026-07-01', last_imported: '2026-07-01', hash: null },
      { source_id: 'link', sync_model: 'link_out', last_checked: '2026-07-01', last_imported: null, hash: null },
    ] },
  };
  const artifacts = new Map([
    ['auto', [unchangedArtifact]],
    ['changed', [{ source_version: '2', records: [{ id: 'B' }] }]],
  ]);
  reconcileFreshness(registry, artifacts, '2026-07-16', ['link']);
  assert.equal(registry.freshness.sources[0].last_checked, '2026-07-16');
  assert.equal(registry.freshness.sources[0].last_imported, '2026-07-01');
  assert.equal(registry.freshness.sources[1].last_imported, '2026-07-16');
  assert.equal(registry.sources[1].version, '2');
  assert.equal(registry.freshness.sources[2].last_checked, '2026-07-16');
  assert.equal(registry.freshness.sources[2].last_imported, null);
});

test('reconciliation keeps publication, source, and primary-artifact versions aligned', () => {
  const registry = {
    publications: [{ id: 'attack', version: '1', retrieved_at: '2026-07-01' }],
    sources: [{ id: 'attack', version: '1', retrieved_at: '2026-07-01' }],
    artifacts: [{ id: 'artifact-attack', publication_source_id: 'attack', version: '1', retrieved_at: '2026-07-01' }],
    freshness: { sources: [{ source_id: 'attack', sync_model: 'auto_synced', last_checked: '2026-07-01', last_imported: '2026-07-01', hash: null }] },
  };
  reconcileFreshness(registry, new Map([['attack', [{ source_version: '2', records: [{ id: 'A' }] }]]]), '2026-07-16');
  assert.equal(registry.publications[0].version, '2');
  assert.equal(registry.sources[0].version, '2');
  assert.equal(registry.artifacts[0].version, '2');
  assert.equal(registry.publications[0].retrieved_at, '2026-07-16');
});
