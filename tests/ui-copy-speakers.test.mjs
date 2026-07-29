import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const manifest = JSON.parse(
  readFileSync("data/ui-copy-speaker-manifest.json", "utf8"),
);

test("speaker manifest separates product copy from official source text", () => {
  assert.deepEqual(
    Object.keys(manifest.speakerClasses).sort(),
    [
      "control_atlas_brand",
      "generated-artifact",
      "official-source",
      "product-explanation",
      "product-interface",
      "resource-register",
    ],
  );
  for (const rule of manifest.rules) {
    assert.ok(manifest.speakerClasses[rule.speaker]);
    for (const file of rule.files || []) {
      assert.ok(existsSync(file), `Missing copy source ${file}`);
    }
  }
  assert.ok(
    manifest.exemptions.some(
      (entry) =>
        entry.root === "data/generated" &&
        entry.speaker === "official-source",
    ),
  );
});

test("product-authored copy rejects personalized determinations", () => {
  const files = [
    "src/app/help-data.mjs",
    "src/app/learn-content.mjs",
    "src/shared/product-identity.ts",
    "src/ui/lib/source-navigator.mjs",
    "src/ui/pages/ObjectDetailPage.tsx",
    "src/ui/pages/TemplatesPage.tsx",
  ];
  const copy = files.map((file) => readFileSync(file, "utf8")).join("\n");
  for (const claim of [
    /recommended (?:library|baseline|framework|authorization)/i,
    /what implementing it also satisfies/i,
    /right starting point for you/i,
    /controls? you (?:can|should) inherit/i,
    /you (?:are|will be) compliant/i,
    /you (?:will|should) receive an? ato/i,
  ]) {
    assert.doesNotMatch(copy, claim);
  }
});

test("superseded editorial collection claims stay absent", () => {
  const dataset = JSON.parse(
    readFileSync("data/commons-resource-dataset.json", "utf8"),
  );
  assert.deepEqual(dataset.collections, []);
  assert.equal(
    dataset.resources.some((resource) =>
      Object.hasOwn(resource, "editorialRecommendation"),
    ),
    false,
  );
  assert.doesNotMatch(
    readFileSync("src/ui/pages/CommonsPage.tsx", "utf8"),
    /curated|collection/i,
  );
});
