import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  atlasTreeCollisions,
  layoutAtlasTree,
  serializeAtlasCoordinates,
  stableAtlasPositions,
} from "../../src/ui/lib/atlasTreeLayout";
import { renderedAtlasSet } from "../../src/ui/lib/atlasTreeAggregation";
import {
  buildAtlasTreeModel,
  canonicalAncestryIsAuthorityFree,
} from "../../src/ui/lib/atlasTreeModel";
import type { AtlasSpine } from "../../src/ui/lib/atlasDrilldown";

const spine = JSON.parse(
  readFileSync(new URL("../../data/generated/atlas-spine.json", import.meta.url), "utf8"),
).atlas_spine as AtlasSpine;
const model = buildAtlasTreeModel(spine);

test("L0-L2 coordinates are deterministic, collision-free, and snapshot-locked", () => {
  const first = [...stableAtlasPositions(model).values()];
  const second = [...stableAtlasPositions(model).values()];
  const serialized = serializeAtlasCoordinates(first);
  assert.equal(serialized, serializeAtlasCoordinates(second));
  assert.deepEqual(atlasTreeCollisions(first), []);
  assert.equal(
    createHash("sha256").update(serialized).digest("hex"),
    "ceb85d1f1f9956731e988f35e2537b3b7aa463930a808d8cd1e18fed9e1f8045",
  );
});

test("coordinates do not depend on the atlas-spine input order", () => {
  const reversedModel = buildAtlasTreeModel({ entries: [...spine.entries].reverse() });
  assert.equal(
    serializeAtlasCoordinates([...stableAtlasPositions(model).values()]),
    serializeAtlasCoordinates([...stableAtlasPositions(reversedModel).values()]),
  );
});

test("L3 child-band layout is byte-identical and collision-free", () => {
  const rendered = renderedAtlasSet({ model, focusId: "disa-srg:CATALOG" });
  const first = layoutAtlasTree({ model, rendered, focusId: "disa-srg:CATALOG" });
  const second = layoutAtlasTree({ model, rendered, focusId: "disa-srg:CATALOG" });
  assert.equal(serializeAtlasCoordinates(first), serializeAtlasCoordinates(second));
  assert.deepEqual(atlasTreeCollisions(first), []);
});

test("authority is above the trunk visually and absent from canonical ancestry", () => {
  const positions = stableAtlasPositions(model);
  const trunk = positions.get("atlas:TRUNK")!;
  assert.ok(model.authorityNodes.every((node) => positions.get(node.id)!.y < trunk.y));
  assert.equal(model.trunk.parentId, null);
  assert.equal(canonicalAncestryIsAuthorityFree(model), true);
});
