import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  PRIMARY_BROWSE_CATEGORIES,
  filterDirectoryResources,
  primaryBrowseCategory,
  primaryBrowseCategoryCounts,
  searchDirectoryResources,
} from "../src/ui/lib/resourcesDirectory.mjs";
import { contextualResourceRecommendations } from "../src/ui/lib/contextualResourceRecommendations.mjs";

const dataset = JSON.parse(readFileSync(resolve("data/commons-resource-dataset.json"), "utf8"));
const resources = dataset.resources;

test("CA-RES-001/002: Resources retains its directory identity and six primary browse categories", () => {
  assert.equal(resources.length, 96);
  const categories = resources.map(primaryBrowseCategory);
  assert.equal(categories.filter(Boolean).length, resources.length);
  assert.deepEqual(
    primaryBrowseCategoryCounts(resources).map(({ id, count }) => [id, count]),
    [["rules", 17], ["catalogs", 26], ["templates", 8], ["tools", 33], ["community", 6], ["reference", 6]],
  );
  assert.equal(new Set(PRIMARY_BROWSE_CATEGORIES.map(({ id }) => id)).size, 6);
});

test("CA-RES-003: directory search establishes evidence eligibility before recommendation ranking", () => {
  const recommended = resources.filter((resource) => resource.editorialRecommendation);
  assert.ok(recommended.length > 0);
  assert.deepEqual(searchDirectoryResources(resources, "zzzzqqqq"), []);
  assert.deepEqual(searchDirectoryResources(recommended, "zzzzqqqq"), []);
  assert.ok(searchDirectoryResources(resources, "OSCAL").some((resource) => resource.id === "official-nist-oscal"));
});

test("clearing a query restores the previous browse scope", () => {
  const scope = filterDirectoryResources(resources, { category: "tools", lane: "open_source" }, dataset.collections);
  const searched = searchDirectoryResources(scope, "STIG");
  assert.ok(searched.length > 0);
  assert.deepEqual(searchDirectoryResources(scope, "").map((resource) => resource.id), scope.map((resource) => resource.id));
});

test("contextual recommendations expose derived provenance without structural parentage", () => {
  const recommendations = contextualResourceRecommendations({
    resources,
    contextType: "template",
    contextId: "security-plan-starter",
    maxItems: 3,
  });
  assert.ok(recommendations.length > 0);
  for (const recommendation of recommendations) {
    assert.match(recommendation.target, /^template:/);
    assert.equal(recommendation.relation, "contextual metadata match");
    assert.match(recommendation.reason, /^Derived from /);
    assert.equal(recommendation.provenance, "Derived from existing Resources metadata");
    assert.match(recommendation.reviewDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(recommendation.structural, false);
    assert.equal("parent" in recommendation, false);
  }
});
