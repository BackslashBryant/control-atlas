import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAtlasGraphPositions,
  layoutAtlasGraph,
  serializeAtlasGraphPositions,
} from "../../src/ui/lib/atlasGraphLayout";
import {
  buildAtlasGraphModel,
  type AtlasGraphModelInput,
} from "../../src/ui/lib/atlasGraphModel";

const input: AtlasGraphModelInput = {
  nodes: [
    { id: "n-4", metadata: { structural_descendant_record_count: 100 } },
    { id: "n-2" },
    { id: "n-6" },
    { id: "n-1" },
    { id: "n-5" },
    { id: "n-3" },
  ],
  edges: [
    { id: "e-12", source_node_id: "n-1", target_node_id: "n-2" },
    { id: "e-23", source_node_id: "n-2", target_node_id: "n-3" },
    { id: "e-34", source_node_id: "n-3", target_node_id: "n-4" },
    { id: "e-45", source_node_id: "n-4", target_node_id: "n-5" },
    { id: "e-56", source_node_id: "n-5", target_node_id: "n-6" },
    { id: "e-61", source_node_id: "n-6", target_node_id: "n-1" },
    { id: "e-14", source_node_id: "n-1", target_node_id: "n-4" },
  ],
};

const layoutOptions = {
  iterations: 40,
  noverlapIterations: 100,
  barnesHutThreshold: 4,
};

test("global network coordinates are deterministic and input-order independent", () => {
  const graph = buildAtlasGraphModel(input);
  const first = layoutAtlasGraph(graph, layoutOptions);
  const second = layoutAtlasGraph(graph, layoutOptions);
  const reversed = layoutAtlasGraph(buildAtlasGraphModel({
    nodes: [...input.nodes].reverse(),
    edges: [...input.edges].reverse(),
  }), layoutOptions);

  assert.equal(
    serializeAtlasGraphPositions(first),
    serializeAtlasGraphPositions(second),
  );
  assert.equal(
    serializeAtlasGraphPositions(first),
    serializeAtlasGraphPositions(reversed),
  );
  assert.ok(first.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
  assert.equal(new Set(first.map(({ x, y }) => `${x}:${y}`)).size, input.nodes.length);
});

test("positions apply without changing authoritative node or edge records", () => {
  const graph = buildAtlasGraphModel(input);
  const sourcesBefore = JSON.stringify({
    nodes: graph.mapNodes((_nodeId, attributes) => attributes.source),
    edges: graph.mapEdges((_edgeId, attributes) => attributes.source),
  });
  const positions = layoutAtlasGraph(graph, layoutOptions);

  applyAtlasGraphPositions(graph, positions);
  assert.equal(graph.getNodeAttribute("n-1", "x"), positions[0]?.x);
  assert.equal(graph.getNodeAttribute("n-1", "y"), positions[0]?.y);
  assert.equal(JSON.stringify({
    nodes: graph.mapNodes((_nodeId, attributes) => attributes.source),
    edges: graph.mapEdges((_edgeId, attributes) => attributes.source),
  }), sourcesBefore);
});

test("position application rejects partial coordinate sets before mutating", () => {
  const graph = buildAtlasGraphModel(input);
  const positions = layoutAtlasGraph(graph, layoutOptions);

  assert.throws(
    () => applyAtlasGraphPositions(graph, positions.slice(1)),
    /expected 6/,
  );
  assert.equal(graph.getNodeAttribute("n-1", "x"), undefined);
});
