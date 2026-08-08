import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const manifest = JSON.parse(readFileSync('data/olir-catalog-manifest.json', 'utf8'));

test('every applicable Final OLIR entry retains the NIST catalog-detail retrieval evidence', () => {
  const applicableFinal = manifest.processed_items.filter((item) =>
    item.status === 'Final' && item.resolved_catalog_id,
  );
  assert.equal(applicableFinal.length, manifest.applicable_final_count);
  for (const item of applicableFinal) {
    const detail = item.retrieval_attempts?.find((attempt) =>
      attempt.kind === 'NIST catalog detail endpoint',
    );
    assert.equal(detail?.status, 200, `OLIR ${item.id} is missing the live NIST detail response`);
    assert.match(detail.url, /\/extensions\/nudp\/services\/json\/olir\/informative-reference-catalog\/details\//);
    if (!item.ingested) {
      assert.ok(item.quarantine_reason?.trim(), `OLIR ${item.id} must state why it remains unavailable`);
    }
  }
});
