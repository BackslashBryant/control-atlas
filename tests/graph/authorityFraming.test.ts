import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const atlasUniverse = readFileSync("src/ui/components/AtlasUniverse.tsx", "utf8");
const sourcesPage = readFileSync("src/ui/pages/SourcesPage.tsx", "utf8");

test("the Atlas explains the federal sprawl once at orientation zoom", () => {
  const explanation =
    "Federal cybersecurity work is spread across separate laws, agencies, and publications that were never organized together; Control Atlas connects them in one structure.";

  assert.equal(atlasUniverse.split(explanation).length - 1, 1);
  assert.doesNotMatch(
    atlasUniverse,
    /The roots show why the work exists; the canopy shows where the work lives\./,
  );
});

test("curated organization is positively attributed to Control Atlas", () => {
  assert.match(sourcesPage, /Control Atlas structure/);
  assert.match(
    sourcesPage,
    /Control Atlas's organizing spine connects federal authority/,
  );
  assert.doesNotMatch(sourcesPage, /Not a publisher source|never a publisher/i);
});
