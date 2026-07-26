import assert from "node:assert/strict";
import test from "node:test";

import {
  ancestorChain,
  buildAncestorGraph,
  pickCanonicalParent,
  type AncestorNode,
  type AncestorEdge,
} from "../../src/ui/lib/ancestorPath.ts";

function graphFrom(nodes: AncestorNode[], edges: AncestorEdge[] = []) {
  return buildAncestorGraph(nodes, edges);
}

test("ancestorChain walks parent_id first, root-first, including the node itself", () => {
  const nodes: AncestorNode[] = [
    { id: "csf-2:FUNCTION-GV", label: "GOVERN", node_type: "function" },
    {
      id: "nist-800-53:AC-1",
      label: "AC-1",
      node_type: "control",
      metadata: { catalog_id: "nist-800-53" },
    },
    {
      id: "nist-800-53a:AC-1",
      label: "AC-1 Assessment Procedure",
      node_type: "assessment_procedure",
      parent_id: "nist-800-53:AC-1",
      metadata: { catalog_id: "nist-800-53a" },
    },
    {
      id: "disa-cci:CCI-000001",
      label: "CCI-000001",
      node_type: "requirement",
      parent_id: "nist-800-53a:AC-1",
      metadata: { catalog_id: "disa-cci" },
    },
  ];
  const edges: AncestorEdge[] = [
    {
      source_node_id: "nist-800-53:CATALOG",
      target_node_id: "nist-800-53:AC-1",
      relationship_type: "includes",
    },
  ];
  const graph = graphFrom(nodes, edges);
  const chain = ancestorChain("disa-cci:CCI-000001", graph);
  assert.deepEqual(
    chain.map((link) => link.id),
    ["nist-800-53:AC-1", "nist-800-53a:AC-1", "disa-cci:CCI-000001"],
  );
});

test("ancestorChain returns a partial chain rather than throwing on a missing parent", () => {
  const nodes: AncestorNode[] = [
    {
      id: "disa-cci:CCI-999999",
      label: "CCI-999999",
      node_type: "requirement",
      parent_id: "nist-800-53a:DOES-NOT-EXIST",
      metadata: { catalog_id: "disa-cci" },
    },
  ];
  const graph = graphFrom(nodes);
  const chain = ancestorChain("disa-cci:CCI-999999", graph);
  assert.deepEqual(chain.map((link) => link.id), ["disa-cci:CCI-999999"]);
});

test("ancestorChain returns an empty array for an unknown node id", () => {
  const graph = graphFrom([]);
  assert.deepEqual(ancestorChain("nope", graph), []);
});

test("ancestorChain stops at a cycle instead of looping forever", () => {
  const nodes: AncestorNode[] = [
    { id: "a", node_type: "control", parent_id: "b" },
    { id: "b", node_type: "control", parent_id: "a" },
  ];
  const graph = graphFrom(nodes);
  const chain = ancestorChain("a", graph);
  // Must terminate; exact truncation point just needs to be well-defined.
  assert.ok(chain.length <= 2);
  assert.equal(chain.at(-1)?.id, "a");
});

test("pickCanonicalParent prefers a candidate in the child's own catalog_id", () => {
  const nodes: AncestorNode[] = [
    { id: "child", metadata: { catalog_id: "nist-800-53" } },
    { id: "same-catalog-parent", metadata: { catalog_id: "nist-800-53" } },
    { id: "other-catalog-parent", metadata: { catalog_id: "csf-2" } },
  ];
  const graph = graphFrom(nodes);
  const picked = pickCanonicalParent(
    "child",
    ["other-catalog-parent", "same-catalog-parent"],
    graph,
  );
  assert.equal(picked, "same-catalog-parent");
});

test("pickCanonicalParent falls back to the shallower candidate, then lexical order", () => {
  const nodes: AncestorNode[] = [
    { id: "root", metadata: { catalog_id: "x" } },
    { id: "deep-parent", metadata: { catalog_id: "y" }, parent_id: "root" },
    { id: "shallow-parent", metadata: { catalog_id: "y" } },
    { id: "child", metadata: { catalog_id: "z" } },
  ];
  const graph = graphFrom(nodes);
  const picked = pickCanonicalParent(
    "child",
    ["deep-parent", "shallow-parent"],
    graph,
  );
  assert.equal(picked, "shallow-parent");

  const tiedNodes: AncestorNode[] = [
    { id: "b-parent", metadata: { catalog_id: "y" } },
    { id: "a-parent", metadata: { catalog_id: "y" } },
    { id: "child2", metadata: { catalog_id: "z" } },
  ];
  const tiedGraph = graphFrom(tiedNodes);
  assert.equal(
    pickCanonicalParent("child2", ["b-parent", "a-parent"], tiedGraph),
    "a-parent",
  );
});

test("pickCanonicalParent returns null with no candidates and the single candidate with one", () => {
  const graph = graphFrom([{ id: "child" }]);
  assert.equal(pickCanonicalParent("child", [], graph), null);
  assert.equal(pickCanonicalParent("child", ["only"], graph), "only");
});
