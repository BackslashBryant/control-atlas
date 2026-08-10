import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const atlasTree = readFileSync("src/ui/components/AtlasTree.tsx", "utf8");
const sourcesPage = readFileSync("src/ui/pages/SourcesPage.tsx", "utf8");
const atlasPage = readFileSync("src/ui/pages/AtlasMapPage.tsx", "utf8");
const explorePage = readFileSync("src/ui/pages/ExplorePage.tsx", "utf8");
const objectDetailPage = readFileSync("src/ui/pages/ObjectDetailPage.tsx", "utf8");
const routeIdentity = readFileSync("src/ui/lib/routeIdentity.ts", "utf8");

test("the Atlas explains the federal sprawl once at orientation zoom", () => {
  const explanation =
    "Federal cybersecurity material is spread across separate laws, agencies, and publications that were never organized together. Publishers wrote their own documents; Control Atlas drew the lines between them.";

  assert.equal(atlasTree.split(explanation).length - 1, 1);
  assert.doesNotMatch(
    atlasTree,
    /The roots show why the work exists; the canopy shows where the work lives\./,
  );
});

test("orientation names all four mandate kinds", () => {
  assert.match(atlasTree, /statutory/);
  assert.match(atlasTree, /contractual/);
  assert.match(atlasTree, /federal_policy_or_regulatory_mandate/);
  assert.match(atlasTree, /issued_without_federal_mandate/);
});

test("curated organization is positively attributed to Control Atlas", () => {
  assert.match(sourcesPage, /Control Atlas structure/);
  assert.match(
    sourcesPage,
    /Control Atlas's organizing spine connects federal authority/,
  );
  assert.doesNotMatch(sourcesPage, /Not a publisher source|never a publisher/i);
});

test("Atlas names the product surface consistently", () => {
  assert.match(explorePage, />Atlas map<\/button>/);
  assert.match(objectDetailPage, /See this in the Atlas map/);
  assert.match(atlasPage, /: "Atlas map"/);
  assert.match(routeIdentity, /label: "Atlas"/);
  assert.match(atlasTree, /<h2 id="atlas-tree-title">Federal cybersecurity, from authority to action<\/h2>/);
});

test("Atlas map copy does not imply progression or visitor applicability", () => {
  const atlasTree = readFileSync(new URL("../../src/ui/components/AtlasTree.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(atlasTree, /\b(?:locks?|unlocks?|prerequisites?|completion|progression|applies to you|applicable to you)\b/i);
});
