import assert from "node:assert/strict";
import test from "node:test";

import {
  TAXONOMY_CONTRACT,
  TAXONOMY_TAG_BY_ID,
  taxonomyTagMatchesQuery,
} from "../../src/shared/taxonomy-contract.mjs";
import {
  parseViewState,
  serializeViewState,
} from "../../src/ui/lib/viewState";

test("governed taxonomy defines ownership, review, layers, and requested discovery categories", () => {
  assert.equal(TAXONOMY_CONTRACT.version, "1.2.0");
  assert.ok(TAXONOMY_CONTRACT.owner);
  assert.match(TAXONOMY_CONTRACT.review_date, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(TAXONOMY_CONTRACT.supersession_rule, /replaces/i);
  assert.deepEqual(Object.keys(TAXONOMY_CONTRACT.layers).sort(), ["atlas_evidence", "editorial", "publisher"]);
  assert.deepEqual(TAXONOMY_CONTRACT.assignment_provenance_layers, {
    publisher: "publisher",
    inferred: "atlas_evidence",
  });
  assert.deepEqual(Object.keys(TAXONOMY_CONTRACT.applicability_states).sort(), ["applicable", "not_applicable", "unreviewed"]);
  assert.match(TAXONOMY_CONTRACT.applicability_resolution.absence_rule, /unreviewed/i);
  assert.deepEqual(TAXONOMY_CONTRACT.filter_semantics, {
    within_dimension: "or",
    across_dimensions: "and",
    url_parameter: "tag",
    unavailable_values: "suppress",
    aliases: "search_only",
  });
  for (const id of [
    "technology.operating-system", "asset.database", "asset.network-device",
    "asset.application", "environment.cloud", "asset.container",
    "asset.virtualization", "asset.identity-system", "asset.physical-security",
    "asset.server", "asset.workstation", "asset.mobile", "asset.iot",
    "vendor.microsoft", "product.microsoft-windows",
  ]) assert.ok(TAXONOMY_TAG_BY_ID.has(id), id);
  for (const tag of TAXONOMY_CONTRACT.tags) {
    assert.ok(tag.id.includes("."));
    assert.ok(tag.label);
    assert.ok(tag.entity_scope.includes("record"));
    assert.equal(tag.validation_state, "approved");
  }
});

test("tag URLs round-trip repeatable values in stable order and aliases remain searchable", () => {
  const state = parseViewState("?view=search&tag=vendor.microsoft&tag=asset.server&tag=vendor.microsoft");
  assert.equal(state.view, "search");
  if (state.view !== "search") throw new Error("expected search state");
  assert.deepEqual(state.tags, ["asset.server", "vendor.microsoft"]);
  assert.equal(
    serializeViewState({ ...state, tags: ["vendor.microsoft", "asset.server"] }),
    "?view=search&tag=asset.server&tag=vendor.microsoft",
  );
  assert.equal(taxonomyTagMatchesQuery(TAXONOMY_TAG_BY_ID.get("asset.database")!, "dbms"), true);
});
