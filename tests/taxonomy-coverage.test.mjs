import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { TAXONOMY_CONTRACT } from "../src/shared/taxonomy-contract.mjs";

test("generated taxonomy coverage reconciles governed dimensions to the published corpus", () => {
  const report = JSON.parse(readFileSync("data/generated/taxonomy-coverage.json", "utf8"));
  const coverage = report.taxonomy_coverage;

  assert.equal(coverage.contract_version, TAXONOMY_CONTRACT.version);
  assert.ok(coverage.record_count > 0);
  assert.ok(coverage.catalogs.length >= 27);
  assert.ok(coverage.catalogs.every((catalog) => catalog.record_count >= catalog.tagged_record_count));
  assert.equal(
    coverage.record_dimension_decision_count,
    coverage.record_count * TAXONOMY_CONTRACT.dimensions.length,
  );
  assert.equal(
    Object.values(coverage.decision_counts).reduce((total, count) => total + count, 0),
    coverage.record_dimension_decision_count,
  );
  for (const group of [...coverage.catalogs, ...coverage.record_types]) {
    for (const dimension of TAXONOMY_CONTRACT.dimensions) {
      const states = group.dimensions[dimension.id];
      assert.equal(
        states.applicable_record_count + states.not_applicable_record_count + states.unreviewed_record_count,
        group.record_count,
      );
    }
  }
  assert.deepEqual(
    coverage.dimensions.map((dimension) => dimension.dimension).sort(),
    TAXONOMY_CONTRACT.dimensions.map((dimension) => dimension.id).sort(),
  );
  assert.ok(coverage.source_fields.every((field) => field.source_field !== "unrecorded"));
  assert.ok(coverage.source_fields.every((field) => field.record_count > 0));
  assert.ok(coverage.source_basis.every((basis) => basis.taxonomy_layer === "atlas_evidence" || basis.taxonomy_layer === "publisher"));
  assert.ok(coverage.source_basis.every((basis) => basis.assignment_provenance === "inferred" || basis.assignment_provenance === "publisher"));
  assert.ok(coverage.source_basis.every((basis) => basis.source_field !== "unrecorded" && basis.rule !== "unrecorded"));
  assert.equal(
    coverage.not_applicable_source_basis.reduce((total, basis) => total + basis.record_count, 0),
    coverage.decision_counts.not_applicable,
  );
  assert.ok(coverage.not_applicable_source_basis.every((basis) => basis.source_field && basis.rule));
  assert.ok(coverage.decision_counts.unreviewed > 0);

  const cci = coverage.catalogs.find((catalog) => catalog.catalog_id === "disa-cci");
  assert.ok(cci, "DISA CCI coverage row is required");
  assert.equal(cci.record_count, 5137);
  assert.equal(cci.tagged_record_count, 5137);
  assert.equal(cci.dimensions.domain.applicable_record_count, 4913);
  assert.equal(cci.dimensions.domain.unreviewed_record_count, 224);
  assert.ok(coverage.source_basis.some((basis) =>
    basis.taxonomy_layer === "publisher" &&
    basis.source_field === "metadata.related_categories[]" &&
    basis.rule === "exact-publisher-related-category" &&
    basis.record_count === 4913
  ));
});
