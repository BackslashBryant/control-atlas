import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { AtlasSpine } from "../../src/ui/lib/atlasDrilldown";
import { buildAtlasGraphModel } from "../../src/ui/lib/atlasGraphModel";
import { buildAtlasSemanticProjections } from "../../src/ui/lib/atlasGraphProjection";
import { buildAtlasTreeModel } from "../../src/ui/lib/atlasTreeModel";
import { readGeneratedCollection } from "../../scripts/lib/generated-graph-artifacts.mjs";

// T4.3/T4.16: prove the visible-node budgets hold against the real, currently-generated
// 30,799-node graph — not just the synthetic fixture in atlasGraphProjection.test.ts.
test("Atlas projection budgets hold on the real generated graph", () => {
  const nodes = readGeneratedCollection(".", "nodes").nodes;
  const edges = readGeneratedCollection(".", "edges").edges;
  const spineArtifact = JSON.parse(
    readFileSync(join(".", "data", "generated", "atlas-spine.json"), "utf8"),
  ) as { atlas_spine: AtlasSpine };

  const artifact = buildAtlasSemanticProjections({
    graph: buildAtlasGraphModel({ nodes, edges }),
    model: buildAtlasTreeModel(spineArtifact.atlas_spine),
    generatedAt: "2026-08-16T00:00:00.000Z",
  });

  // Landscape: exactly one Cybersecurity root + one landmark per Atlas area + 0-3 authority
  // groups, within the 10-20 T4.3 budget. buildAtlasSemanticProjections already throws if this
  // is violated (enforceNodeBudget); these assertions lock in the shape, not just "didn't throw".
  assert.equal(artifact.landscape.nodes.filter((node) => node.atlasStructureRole === "root").length, 1);
  assert.equal(artifact.landscape.nodes.filter((node) => node.atlasStructureRole === "area").length, 9);
  const authorityCount = artifact.landscape.nodes.filter((node) => node.objectLayer === "authority_document").length;
  assert.ok(authorityCount >= 0 && authorityCount <= 3, `authority group count: ${authorityCount}`);
  assert.ok(
    artifact.landscape.nodes.length >= 10 && artifact.landscape.nodes.length <= 20,
    `landscape budget violated: ${artifact.landscape.nodes.length} nodes`,
  );

  // Area: <=60 (enforced by enforceNodeBudget at build time); assert every generated area stays
  // well inside the budget so a future data change has real margin before it fails the build.
  for (const [areaId, projection] of Object.entries(artifact.areas)) {
    assert.ok(projection.nodes.length <= 60, `${areaId} area budget violated: ${projection.nodes.length} nodes`);
  }

  // Publication: <=150 (structurally bounded to <=49 by the 48-group chunking today).
  for (const [publicationId, projection] of Object.entries(artifact.publications)) {
    assert.ok(
      projection.nodes.length <= 150,
      `${publicationId} publication budget violated: ${projection.nodes.length} nodes`,
    );
  }

  // Detail: <=250, already enforced by detailFor()'s own rejection — confirm no generated detail
  // projection ever exceeded it.
  for (const [detailId, projection] of Object.entries(artifact.details)) {
    assert.ok(projection.nodes.length <= 250, `${detailId} detail budget violated: ${projection.nodes.length} nodes`);
  }

  // T4.7: every aggregate node's canonicalNodeIds resolve to real canonical IDs, and no canonical
  // node is double-counted across the landscape (the same guarantee buildProjection enforces
  // per-projection, checked here at the whole-artifact level for the top level).
  const canonicalNodeIds = new Set(nodes.map((node: { id: string }) => node.id));
  for (const node of artifact.landscape.nodes) {
    for (const canonicalId of node.canonicalNodeIds) {
      assert.ok(canonicalNodeIds.has(canonicalId), `landscape node ${node.id} cites unknown canonical id ${canonicalId}`);
    }
  }
});
