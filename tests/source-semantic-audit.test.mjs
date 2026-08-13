import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("source semantic audit records reviewed dispositions without conflating them with parser proof", () => {
  const report = JSON.parse(readFileSync("data/generated/source-semantic-audit.json", "utf8"));
  assert.equal(report.schema_version, "2.0");
  assert.equal(report.catalog_count, 27);
  assert.equal(report.catalogs.length, 27);
  for (const catalog of report.catalogs) {
    assert.equal(catalog.automated_evidence.status, "reconciled", catalog.catalog_id);
    assert.ok(catalog.declared_publisher_structure?.containment_paths.length, catalog.catalog_id);
    assert.match(catalog.evidence_boundary.reviewed_at, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(catalog.evidence_boundary.representative_samples.length >= 3, catalog.catalog_id);
    assert.ok(catalog.evidence_boundary.official_sources.length >= 1, catalog.catalog_id);
    assert.notEqual(catalog.evidence_boundary.semantic_content_review, "unverified");
    assert.notEqual(catalog.evidence_boundary.locator_only_review, "unverified");
    assert.notEqual(catalog.evidence_boundary.upstream_currentness_review, "unverified");
  }
});

test("required source regressions and unresolved dispositions remain explicit", () => {
  const report = JSON.parse(readFileSync("data/generated/source-semantic-audit.json", "utf8"));
  const byId = new Map(report.catalogs.map((catalog) => [catalog.catalog_id, catalog]));

  assert.ok(
    byId.get("disa-stig").evidence_boundary.representative_samples
      .some((sample) => sample.record_id === "V-256609" && sample.source_locator.includes("#V-256609")),
  );
  assert.equal(byId.get("nist-800-171-rev2").evidence_boundary.upstream_currentness_review, "superseded");
  assert.equal(byId.get("dod-rai").evidence_boundary.locator_only_review, "remediation_required");
  assert.equal(byId.get("dod-rai").evidence_boundary.upstream_currentness_review, "refresh_required");
  assert.equal(byId.get("mitre-d3fend").evidence_boundary.upstream_currentness_review, "refresh_required");
  assert.equal(byId.get("nist-800-53a").evidence_boundary.locator_only_review, "remediation_required");
  assert.equal(byId.get("nist-iot-cybersecurity").evidence_boundary.upstream_currentness_review, "refresh_required");
});
