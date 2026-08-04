import assert from "node:assert/strict";
import test from "node:test";

import {
  ATLAS_UNIVERSE_POSITIONS,
  atlasUniverseCollisions,
} from "../../src/ui/components/AtlasUniverse";

test("Atlas universe places every area exactly once without collisions", () => {
  assert.equal(ATLAS_UNIVERSE_POSITIONS.length, 9);
  assert.equal(new Set(ATLAS_UNIVERSE_POSITIONS.map((area) => area.id)).size, 9);
  assert.deepEqual(atlasUniverseCollisions(), []);
});
