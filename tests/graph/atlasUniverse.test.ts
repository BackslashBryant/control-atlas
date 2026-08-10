import assert from "node:assert/strict";
import test from "node:test";

import { readFileSync } from "node:fs";

test("AtlasUniverse no longer contains the obsolete projection", () => {
  const source = readFileSync("src/ui/components/AtlasUniverse.tsx", "utf8");
  assert.match(source, /AtlasTree as AtlasUniverse/);
  assert.doesNotMatch(source, /AUTHORITY-ROOTS|junction|ATLAS_UNIVERSE_POSITIONS/);
});
