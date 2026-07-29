import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("ancestorChain walks validated parent_id first, root-first, including the node itself", () => {
  const nodes: AncestorNode[] = [
    {
      id: "nist-800-53:CATALOG",
      label: "SP 800-53",
      node_type: "catalog",
      metadata: { catalog_id: "nist-800-53" },
    },
    {
      id: "nist-800-53:FAMILY-AC",
      label: "Access Control",
      node_type: "family",
      parent_id: "nist-800-53:CATALOG",
      parent_relationship_class: "structural",
      metadata: { catalog_id: "nist-800-53" },
    },
    {
      id: "nist-800-53:AC-1",
      label: "AC-1",
      node_type: "control",
      parent_id: "nist-800-53:FAMILY-AC",
      parent_relationship_class: "structural",
      metadata: { catalog_id: "nist-800-53" },
    },
  ];
  const graph = graphFrom(nodes);
  const chain = ancestorChain("nist-800-53:AC-1", graph);
  assert.deepEqual(
    chain.map((link) => link.id),
    ["nist-800-53:CATALOG", "nist-800-53:FAMILY-AC", "nist-800-53:AC-1"],
  );
});

test("ancestorChain returns a partial chain rather than throwing on a missing parent", () => {
  const nodes: AncestorNode[] = [
    {
      id: "disa-cci:CCI-999999",
      label: "CCI-999999",
      node_type: "requirement",
      parent_id: "nist-800-53a:DOES-NOT-EXIST",
      parent_relationship_class: "structural",
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
    {
      id: "a",
      node_type: "control",
      parent_id: "b",
      parent_relationship_class: "structural",
      metadata: { catalog_id: "x" },
    },
    {
      id: "b",
      node_type: "control",
      parent_id: "a",
      parent_relationship_class: "structural",
      metadata: { catalog_id: "x" },
    },
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
    { id: "root", node_type: "catalog", metadata: { catalog_id: "y" } },
    {
      id: "deep-parent",
      node_type: "group",
      metadata: { catalog_id: "y" },
      parent_id: "root",
      parent_relationship_class: "structural",
    },
    {
      id: "shallow-parent",
      node_type: "group",
      metadata: { catalog_id: "y" },
    },
    { id: "child", node_type: "control", metadata: { catalog_id: "z" } },
  ];
  const graph = graphFrom(nodes);
  const picked = pickCanonicalParent(
    "child",
    ["deep-parent", "shallow-parent"],
    graph,
  );
  assert.equal(picked, "shallow-parent");

  const tiedNodes: AncestorNode[] = [
    { id: "b-parent", node_type: "group", metadata: { catalog_id: "y" } },
    { id: "a-parent", node_type: "group", metadata: { catalog_id: "y" } },
    { id: "child2", node_type: "control", metadata: { catalog_id: "z" } },
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

test("CA-ATL-001/002: ancestry accepts only declared structural parents in the native catalog", () => {
  const nodes: AncestorNode[] = [
    {
      id: "nist-800-53:CATALOG",
      label: "SP 800-53 Rev. 5",
      node_type: "catalog",
      metadata: { catalog_id: "nist-800-53" },
    },
    {
      id: "nist-800-53:FAMILY-AC",
      label: "Access Control",
      node_type: "family",
      metadata: { catalog_id: "nist-800-53" },
    },
    {
      id: "nist-800-53:AC-2",
      label: "AC-2",
      node_type: "control",
      metadata: { catalog_id: "nist-800-53" },
    },
    {
      id: "csf-2:PR.AA-01",
      label: "PR.AA-01",
      node_type: "subcategory",
      metadata: { catalog_id: "csf-2" },
    },
    {
      id: "nist-800-53b:MODERATE",
      label: "Moderate",
      node_type: "baseline",
      metadata: { catalog_id: "nist-800-53b" },
    },
  ];
  const edges: AncestorEdge[] = [
    {
      source_node_id: "nist-800-53:CATALOG",
      target_node_id: "nist-800-53:FAMILY-AC",
      relationship_type: "contains",
      relationship_class: "structural",
    },
    {
      source_node_id: "nist-800-53:FAMILY-AC",
      target_node_id: "nist-800-53:AC-2",
      relationship_type: "contains",
      relationship_class: "structural",
    },
    {
      source_node_id: "csf-2:PR.AA-01",
      target_node_id: "nist-800-53:AC-2",
      relationship_type: "maps_to",
      relationship_class: "correlation",
    },
    {
      source_node_id: "nist-800-53b:MODERATE",
      target_node_id: "nist-800-53:AC-2",
      relationship_type: "selects",
      relationship_class: "applicability",
    },
  ];

  assert.deepEqual(
    ancestorChain("nist-800-53:AC-2", graphFrom(nodes, edges)).map(
      (link) => link.id,
    ),
    [
      "nist-800-53:CATALOG",
      "nist-800-53:FAMILY-AC",
      "nist-800-53:AC-2",
    ],
  );
});

test("CA-ATL-001: cross-catalog parent_id fails closed even when marked structural", () => {
  const nodes: AncestorNode[] = [
    {
      id: "csf-2:FUNCTION-PR",
      node_type: "function",
      metadata: { catalog_id: "csf-2" },
    },
    {
      id: "nist-800-53:CATALOG",
      node_type: "catalog",
      parent_id: "csf-2:FUNCTION-PR",
      parent_relationship_class: "structural",
      metadata: { catalog_id: "nist-800-53" },
    },
  ];

  assert.deepEqual(
    ancestorChain("nist-800-53:CATALOG", graphFrom(nodes)).map(
      (link) => link.id,
    ),
    ["nist-800-53:CATALOG"],
  );
});

test("tree doctrine: a baseline cannot become a structural parent", () => {
  const nodes: AncestorNode[] = [
    {
      id: "nist-800-53b:MODERATE",
      label: "Moderate",
      node_type: "baseline",
      metadata: { catalog_id: "nist-800-53b" },
    },
    {
      id: "nist-800-53b:AC-2",
      label: "AC-2",
      node_type: "control",
      parent_id: "nist-800-53b:MODERATE",
      parent_relationship_class: "structural",
      metadata: { catalog_id: "nist-800-53b" },
    },
  ];
  const edges: AncestorEdge[] = [
    {
      source_node_id: "nist-800-53b:MODERATE",
      target_node_id: "nist-800-53b:AC-2",
      relationship_type: "contains",
      relationship_class: "structural",
    },
  ];

  assert.deepEqual(
    ancestorChain("nist-800-53b:AC-2", graphFrom(nodes, edges)).map(
      (link) => link.id,
    ),
    ["nist-800-53b:AC-2"],
  );
});

test("AC-2 generated ancestry is catalog to family to control, with no choices or mappings", () => {
  const nodes = JSON.parse(
    readFileSync("data/generated/nodes.json", "utf8"),
  ).nodes as AncestorNode[];
  const edges = JSON.parse(
    readFileSync("data/generated/edges.json", "utf8"),
  ).edges as AncestorEdge[];

  assert.deepEqual(
    ancestorChain("nist-800-53:AC-2", graphFrom(nodes, edges)).map(
      (link) => link.id,
    ),
    [
      "nist-800-53:CATALOG",
      "nist-800-53:FAMILY-AC",
      "nist-800-53:AC-2",
    ],
  );
});
