import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTROL_RING_ORDER,
  buildFocusedControlRings,
  expandFocusedControlCluster,
} from "../../src/ui/graph/buildFocusedControlRings.ts";
import {
  buildSourceHierarchyModel,
  buildVisibleRelationshipModel,
} from "../../src/ui/graph/buildVisibleRelationshipModel.ts";

test("focused control rings use the required order", () => {
  assert.deepEqual(CONTROL_RING_ORDER, [
    "selected-control",
    "control-catalog-context",
    "baseline-overlay-profile",
    "assessment-and-implementation",
    "mapping-and-threat-context",
    "templates-playbooks-sources",
  ]);
});

test("expanded focused clusters use fCoSE and expose their children", () => {
  const focused = buildFocusedControlRings("AC-2");
  const expanded = expandFocusedControlCluster(focused, "disa-ccis");
  assert.equal(expanded.layoutEngine, "fcose");
  assert.equal(
    expanded.nodes.some((node) => node.id === "cluster:disa-ccis"),
    false,
  );
  assert.equal(
    expanded.nodes.filter((node) => node.id.startsWith("disa-ccis:")).length,
    35,
  );
});

test("AC-2 focused model keeps the control dominant and clusters dense groups", () => {
  const model = buildFocusedControlRings("AC-2");
  assert.equal(model.centerNodeId, "nist-800-53:AC-2");
  assert.equal(model.layoutEngine, "concentric");
  assert.ok(model.nodes.length <= 12);
  assert.equal(
    model.nodes.find((node) => node.id === "nist-800-53:AC-2")?.graphRole,
    "nist-control",
  );
  assert.ok(model.nodes.some((node) => node.id === "cluster:disa-ccis"));
  assert.ok(model.nodes.some((node) => node.id === "cluster:disa-stig-srg"));
  assert.ok(model.nodes.some((node) => node.id === "cluster:resources"));
  assert.equal(
    model.nodes.find((node) => node.id === "cluster:disa-ccis")?.metadata
      .childCount,
    35,
  );
});

test("default visible relationship model is the nine-tier hierarchy", () => {
  const model = buildSourceHierarchyModel();
  assert.equal(model.layoutEngine, "dagre");
  assert.equal(model.nodes.length, 9);
  assert.equal(model.edges.length, 8);
  assert.equal(model.nodes.some((node) => node.id.startsWith("source:")), false);
});

test("visible relationship model resolves AC-2 and empty map modes", () => {
  assert.equal(buildVisibleRelationshipModel({ nodeId: "" }).nodes.length, 9);
  assert.equal(
    buildVisibleRelationshipModel({ nodeId: "nist-800-53:AC-2" }).centerNodeId,
    "nist-800-53:AC-2",
  );
  assert.equal(
    buildVisibleRelationshipModel({ nodeId: "AC-2" }).centerNodeId,
    "nist-800-53:AC-2",
  );
});
