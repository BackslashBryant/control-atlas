import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  contextualSuggestionsForRecord,
  recordContextKind,
} from "../../src/ui/lib/contextualMatching";

const resources = JSON.parse(
  readFileSync("data/commons-resource-dataset.json", "utf8"),
).resources;

function fixture(id: string, objectType: string, catalogId: string, title = id) {
  return {
    node: {
      id: `${catalogId}:${id}`,
      node_type: objectType,
      metadata: { item_id: id, title, catalog_id: catalogId },
    },
    document: {
      item_id: id,
      title,
      object_type: objectType,
      catalog_id: catalogId,
    },
  };
}

test("record context adapts to catalog-aware object types", () => {
  const kind = (value: ReturnType<typeof fixture>) =>
    recordContextKind(value.node, value.document);
  assert.equal(kind(fixture("AC-2", "control", "nist-800-53")), "control");
  assert.equal(kind(fixture("CCI-000001", "requirement", "disa-cci")), "cci");
  assert.equal(kind(fixture("V-222387", "stig_rule", "disa-stig")), "stig");
  assert.equal(kind(fixture("T1195.002", "attack_technique", "mitre-attack")), "attack");
  assert.equal(kind(fixture("3.17.1", "requirement", "nist-800-171", "Supply Chain Risk Management Plan")), "supply_chain");
  assert.equal(kind(fixture("252.204-7012", "clause", "dfars")), "policy_or_clause");
});

test("editorial suggestions carry visible reasons and never become graph edges", () => {
  const { node, document } = fixture(
    "V-222387",
    "stig_rule",
    "disa-stig",
  );
  const before = JSON.stringify({ node, document });
  const suggestions = contextualSuggestionsForRecord({
    node,
    document,
    resources,
  });

  assert.ok(suggestions.length > 0);
  assert.equal(JSON.stringify({ node, document }), before);
  for (const suggestion of suggestions) {
    assert.equal(suggestion.kind, "control_atlas_suggestion");
    assert.equal(suggestion.structural, false);
    assert.ok(suggestion.reason.code);
    assert.ok(suggestion.reason.label);
    assert.ok(suggestion.destination.view);
    assert.equal(Object.hasOwn(suggestion, "source_node_id"), false);
    assert.equal(Object.hasOwn(suggestion, "target_node_id"), false);
    assert.equal(Object.hasOwn(suggestion, "relationship_type"), false);
  }
});

test("context groups stay small and sparse records omit empty help", () => {
  const supplyChain = fixture(
    "3.17.1",
    "requirement",
    "nist-800-171",
    "Supply Chain Risk Management Plan",
  );
  const suggestions = contextualSuggestionsForRecord({
    ...supplyChain,
    resources,
    maxPerGroup: 2,
  });
  const groupCounts = suggestions.reduce<Record<string, number>>((counts, item) => {
    counts[item.group] = (counts[item.group] || 0) + 1;
    return counts;
  }, {});
  assert.ok(Object.values(groupCounts).every((count) => count <= 2));

  const sparse = fixture("CATALOG", "catalog", "example");
  assert.deepEqual(
    contextualSuggestionsForRecord({ ...sparse, resources }),
    [],
  );
});
