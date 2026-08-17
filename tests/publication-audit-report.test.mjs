import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const report = JSON.parse(readFileSync('data/generated/publication-audit-report.json', 'utf8'));
const index = JSON.parse(readFileSync('data/generated/publication-identity-index.json', 'utf8'));
const ledger = JSON.parse(readFileSync('data/generated/source-count-ledger.json', 'utf8'));

test('the audit report has zero unexplained orphans and zero unresolved metadata gaps', () => {
  assert.deepEqual(report.unexplained_orphan_publications, []);
  assert.deepEqual(report.unresolved_metadata, []);
  assert.equal(report.summary.unexplained_orphan_count, 0);
  assert.equal(report.summary.unresolved_metadata_count, 0);
});

test('the audit report lists exactly the canonical publications from the identity index', () => {
  assert.equal(report.summary.canonical_publication_count, index.identities.length);
  assert.deepEqual(
    report.canonical_publications.map((entry) => entry.id).sort(),
    index.identities.map((identity) => identity.id).sort(),
  );
});

test('the audit report surfaces every nonzero count-ledger delta with its reason', () => {
  const reported = new Map(report.nonzero_deltas.map((entry) => [entry.catalog_id, entry]));
  for (const catalog of ledger.catalogs) {
    const hasNonzero = catalog.counts.unexplained_graph_node_delta !== 0
      || catalog.counts.unexplained_graph_edge_delta !== 0
      || Boolean(catalog.counts.normalized_to_leaf_delta);
    assert.equal(reported.has(catalog.catalog_id), hasNonzero, `${catalog.catalog_id} delta reporting mismatch`);
    if (catalog.counts.normalized_to_leaf_delta) {
      assert.ok(
        reported.get(catalog.catalog_id).normalized_to_leaf_delta_reason,
        `${catalog.catalog_id} reported without a delta reason`,
      );
    }
  }
});
