import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("source semantic audit preserves the boundary between parser proof and semantic review", () => {
  const report = JSON.parse(readFileSync("data/generated/source-semantic-audit.json", "utf8"));
  assert.equal(report.catalog_count, 27);
  assert.equal(report.catalogs.length, 27);
  for (const catalog of report.catalogs) {
    assert.equal(catalog.automated_evidence.status, "reconciled", catalog.catalog_id);
    assert.ok(catalog.declared_publisher_structure?.containment_paths.length, catalog.catalog_id);
    assert.equal(catalog.evidence_boundary.semantic_content_review, "unverified");
    assert.equal(catalog.evidence_boundary.locator_only_review, "unverified");
  }
});
