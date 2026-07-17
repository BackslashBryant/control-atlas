import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { searchExploreResources } from "../src/ui/lib/exploreResourceSearch.mjs";

const templateRegistry = JSON.parse(
  readFileSync("data/template-registry.json", "utf8"),
);
const officialArtifactRegistry = JSON.parse(
  readFileSync("data/official-artifact-registry.json", "utf8"),
);

test("POA&M finds the working register instead of one-letter noise", () => {
  const results = searchExploreResources("POA&M", {
    templates: templateRegistry.templates,
    artifacts: officialArtifactRegistry.artifacts,
  });

  assert.equal(results.templates[0].templateType, "poam_starter");
  assert.equal(results.templates[0].title, "POA&M Working Register");
});

test("FedRAMP 2026 requires both terms and ranks the current source first", () => {
  const results = searchExploreResources("FedRAMP 2026", {
    templates: templateRegistry.templates,
    artifacts: officialArtifactRegistry.artifacts,
  });

  assert.equal(
    results.artifacts[0].id,
    "fedramp-2026-consolidated-rules-json",
  );
  assert.equal(results.artifacts[0].classification, "official_current");
  assert.ok(
    results.artifacts.every((artifact) =>
      `${artifact.title} ${artifact.version}`.toLowerCase().includes("2026"),
    ),
  );
});
