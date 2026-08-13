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
  assert.deepEqual(
    coverage.dimensions.map((dimension) => dimension.dimension).sort(),
    TAXONOMY_CONTRACT.dimensions.map((dimension) => dimension.id).sort(),
  );
  assert.ok(coverage.source_fields.every((field) => field.source_field !== "unrecorded"));
});
