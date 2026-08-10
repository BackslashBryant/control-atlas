import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  atlasTreeCollisions,
  layoutAtlasTree,
  serializeAtlasCoordinates,
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

test("overview coordinates are deterministic, collision-free, and fit a legible workbench", () => {
  const rendered = renderedAtlasSet({ model });
  const first = layoutAtlasTree({ model, rendered });
  const second = layoutAtlasTree({ model, rendered });
  const serialized = serializeAtlasCoordinates(first);
  assert.equal(serialized, serializeAtlasCoordinates(second));
  assert.deepEqual(atlasTreeCollisions(first), []);
  assert.ok(Math.max(...first.map((node) => node.x + node.width)) <= 800);
  assert.ok(Math.max(...first.map((node) => node.y + node.height)) <= 700);
});

test("coordinates do not depend on the atlas-spine input order", () => {
  const reversedModel = buildAtlasTreeModel({ entries: [...spine.entries].reverse() });
  assert.equal(
    serializeAtlasCoordinates(layoutAtlasTree({ model, rendered: renderedAtlasSet({ model }) })),
    serializeAtlasCoordinates(layoutAtlasTree({ model: reversedModel, rendered: renderedAtlasSet({ model: reversedModel }) })),
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
  const overview = renderedAtlasSet({ model });
  const positions = new Map(layoutAtlasTree({ model, rendered: overview }).map((node) => [node.id, node]));
  const trunk = positions.get("atlas:TRUNK")!;
  assert.ok(overview.filter((node) => node.nodeType === "authority_aggregate").every((node) => positions.get(node.id)!.y < trunk.y));
  assert.ok(model.areas.every((node) => positions.get(node.id)!.y > trunk.y));
  assert.equal(model.trunk.parentId, null);
  assert.equal(canonicalAncestryIsAuthorityFree(model), true);
});
