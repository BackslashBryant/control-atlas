import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeAtlasGraph,
  buildAtlasAnalysisProjection,
} from "../../src/ui/lib/atlasGraphAnalysis";
import {
  buildAtlasGraphModel,
  type AtlasGraphModelInput,
} from "../../src/ui/lib/atlasGraphModel";

const input: AtlasGraphModelInput = {
  nodes: [
    { id: "a", metadata: { category: "official-a" } },
    { id: "b", metadata: { category: "official-b" } },
    { id: "c", metadata: { category: "official-c" } },
    { id: "isolated", metadata: { category: "official-isolated" } },
  ],
  edges: [
    { id: "e-2", source_node_id: "a", target_node_id: "b", directed: true },
    { id: "e-1", source_node_id: "a", target_node_id: "b", directed: true },
    { id: "e-mutual", source_node_id: "b", target_node_id: "a", directed: true },
    { id: "e-bc", source_node_id: "b", target_node_id: "c", directed: false },
  ],
};

test("analysis projection is simple, undirected, weighted, and traceable", () => {
  const semantic = buildAtlasGraphModel(input);
  const projection = buildAtlasAnalysisProjection(semantic);

  assert.equal(projection.type, "undirected");
  assert.equal(projection.multi, false);
  assert.equal(projection.order, semantic.order);
  assert.equal(projection.size, 2);

  const ab = projection.edge("a", "b")!;
  assert.equal(projection.getEdgeAttribute(ab, "layoutWeight"), 3);
  assert.deepEqual(projection.getEdgeAttribute(ab, "canonicalEdgeIds"), [
    "e-1",
    "e-2",
    "e-mutual",
  ]);
  assert.deepEqual(semantic.edges(), ["e-1", "e-2", "e-bc", "e-mutual"]);
  assert.equal(semantic.hasEdge(ab), false);
});

test("degree and seeded Louvain metadata are deterministic presentation data", () => {
  const semantic = buildAtlasGraphModel(input);
  const sourceBefore = JSON.stringify(
    semantic.mapNodes((_nodeId, attributes) => attributes.source),
  );
  const first = analyzeAtlasGraph(semantic, { seed: "fixed-test-seed" });
  const second = analyzeAtlasGraph(semantic, { seed: "fixed-test-seed" });

  assert.deepEqual(first.nodes, second.nodes);
  assert.equal(first.nodes.a?.degree, 1);
  assert.equal(first.nodes.a?.weightedDegree, 3);
  assert.equal(first.nodes.b?.degree, 2);
  assert.equal(first.nodes.b?.weightedDegree, 4);
  assert.equal(first.nodes.isolated?.degree, 0);
  assert.equal(
    JSON.stringify(semantic.mapNodes((_nodeId, attributes) => attributes.source)),
    sourceBefore,
  );
  assert.equal(
    (semantic.getNodeAttribute("a", "source").metadata as Record<string, unknown>).category,
    "official-a",
  );
  assert.equal("computedCommunity" in semantic.getNodeAttribute("a", "source"), false);
});

test("analysis results do not depend on canonical input order", () => {
  const forward = analyzeAtlasGraph(buildAtlasGraphModel(input), { seed: 42 });
  const reversed = analyzeAtlasGraph(buildAtlasGraphModel({
    nodes: [...input.nodes].reverse(),
    edges: [...input.edges].reverse(),
  }), { seed: 42 });

  assert.deepEqual(forward.nodes, reversed.nodes);
  assert.deepEqual(forward.projection.nodes(), reversed.projection.nodes());
  assert.deepEqual(forward.projection.edges(), reversed.projection.edges());
});
