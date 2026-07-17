import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSourceViewModel,
  buildTierDrillModel,
  buildVisibleRelationshipModel,
} from "../../src/ui/graph/buildVisibleRelationshipModel";

test("source Path projections are explicitly not published relationship edges", () => {
  const purpose = buildSourceViewModel("purpose");
  assert.equal(purpose.nodes.length, 9);
  assert.equal(purpose.edges.length, 8);
  assert.ok(
    purpose.edges.every(
      (edge) =>
        edge.publication_status === "projection" &&
        edge.provenance_class === "curated_navigation",
    ),
  );
});

test("source Path offers novice questions by default and RMF as an alternate", () => {
  const novice = buildVisibleRelationshipModel({ nodeId: "foundation" });
  const rmf = buildVisibleRelationshipModel({
    nodeId: "foundation",
    sourceView: "rmf",
  });
  assert.deepEqual(
    novice.nodes.map((node) => node.metadata.item_id),
    [
      "Why does this apply?",
      "What must I do?",
      "Which requirements apply?",
      "How do I implement it?",
      "How do I test it?",
      "How does it map elsewhere?",
    ],
  );
  assert.deepEqual(
    rmf.nodes.map((node) => node.metadata.item_id),
    ["Prepare", "Categorize", "Select", "Implement", "Assess", "Authorize", "Monitor"],
  );
});

test("source drill projections contain real source records without claiming graph publication", () => {
  const drill = buildTierDrillModel(
    "control-catalog-requirement-set",
    undefined,
    "purpose",
  );
  assert.ok(drill.nodes.some((node) => node.id === "source:nist-sp-800-53-r5"));
  assert.ok(drill.edges.length > 0);
  assert.ok(drill.edges.every((edge) => edge.publication_status === "projection"));
});
