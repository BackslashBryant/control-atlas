import assert from "node:assert/strict";
import test from "node:test";

import {
  SOURCE_HIERARCHY_EDGES,
  SOURCE_HIERARCHY_NODES,
} from "../../src/ui/graph/sourceHierarchyEdges.ts";

test("source hierarchy has nine category nodes and eight ordered edges", () => {
  assert.equal(SOURCE_HIERARCHY_NODES.length, 9);
  assert.equal(SOURCE_HIERARCHY_EDGES.length, 8);
  assert.deepEqual(SOURCE_HIERARCHY_EDGES[0], [
    "authority",
    "governance-risk-framework",
  ]);
  assert.deepEqual(SOURCE_HIERARCHY_EDGES.at(-1), [
    "threat-defensive-mapping",
    "supporting-reference",
  ]);
});

test("source hierarchy uses the required plain-language labels", () => {
  assert.deepEqual(
    SOURCE_HIERARCHY_NODES.map((node) => node.displayName),
    [
      "Authority",
      "Governance / Risk Framework",
      "Control Catalog / Requirement Set",
      "Baseline / Overlay / Program Profile",
      "Assessment / Scoping Procedure",
      "Implementation / Configuration Standard",
      "Control Mapping / Crosswalk",
      "Threat / Defensive Mapping",
      "Supporting Reference",
    ],
  );
});
