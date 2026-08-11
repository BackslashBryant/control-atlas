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

test("overview coordinates are deterministic, collision-free, and fit a legible workbench", async () => {
  const rendered = renderedAtlasSet({ model });
  const first = await layoutAtlasTree({ model, rendered });
  const second = await layoutAtlasTree({ model, rendered });
  const serialized = serializeAtlasCoordinates(first);
  assert.equal(serialized, serializeAtlasCoordinates(second));
  assert.deepEqual(atlasTreeCollisions(first), []);
  assert.ok(Math.max(...first.map((node) => node.x + node.width)) <= 1_000);
  assert.ok(Math.max(...first.map((node) => node.y + node.height)) <= 900);
});

test("coordinates do not depend on the atlas-spine input order", async () => {
  const reversedModel = buildAtlasTreeModel({ entries: [...spine.entries].reverse() });
  const forward = await layoutAtlasTree({ model, rendered: renderedAtlasSet({ model }) });
  const reversed = await layoutAtlasTree({
    model: reversedModel,
    rendered: renderedAtlasSet({ model: reversedModel }),
  });
  assert.equal(
    serializeAtlasCoordinates(forward),
    serializeAtlasCoordinates(reversed),
  );
});

test("L3 child-band layout is byte-identical and collision-free", async () => {
  const rendered = renderedAtlasSet({ model, focusId: "disa-srg:CATALOG" });
  const first = await layoutAtlasTree({ model, rendered, focusId: "disa-srg:CATALOG" });
  const second = await layoutAtlasTree({ model, rendered, focusId: "disa-srg:CATALOG" });
  assert.equal(serializeAtlasCoordinates(first), serializeAtlasCoordinates(second));
  assert.deepEqual(atlasTreeCollisions(first), []);
});

test("authority is left of the trunk visually and absent from canonical ancestry", async () => {
  const overview = renderedAtlasSet({ model });
  const positions = new Map(
    (await layoutAtlasTree({ model, rendered: overview })).map((node) => [node.id, node]),
  );
  const trunk = positions.get("atlas:TRUNK")!;
  assert.ok(
    overview
      .filter((node) => node.nodeType === "authority_aggregate")
      .every((node) => positions.get(node.id)!.x < trunk.x),
  );
  assert.ok(model.areas.every((node) => positions.get(node.id)!.x > trunk.x));
  assert.equal(model.trunk.parentId, null);
  assert.equal(canonicalAncestryIsAuthorityFree(model), true);
});
