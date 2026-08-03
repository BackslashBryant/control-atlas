import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const manifest = JSON.parse(
  readFileSync("config/experience-guardian/copy-ownership.json", "utf8"),
);

test("speaker manifest separates product copy from official source text", () => {
  assert.deepEqual(
    Object.keys(manifest.classes).sort(),
    [
      "accessibility-label",
      "control-atlas-brand",
      "generated-artifact",
      "legal-license",
      "official-source",
      "product-explanation",
      "product-interface",
      "resource-register",
      "test-developer",
    ],
  );
  for (const rule of manifest.rules) {
    assert.ok(manifest.classes[rule.class]);
    for (const file of rule.files || []) {
      assert.ok(existsSync(file), `Missing copy source ${file}`);
    }
  }
  assert.ok(
    manifest.exemptions.some(
      (entry) =>
        entry.root === "data/generated" &&
        entry.class === "official-source",
    ),
  );
});

test("product-authored copy rejects personalized determinations", () => {
  const files = [
    "src/app/glossary-data.mjs",
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

test("glossary guidance stays source-labeled and cannot assign outcomes", () => {
  const source = readFileSync("src/app/glossary-data.mjs", "utf8");
  const drawer = readFileSync("src/ui/components/GlossaryDrawer.tsx", "utf8");
  const explore = readFileSync("src/ui/pages/ExplorePage.tsx", "utf8");
  assert.doesNotMatch(source, /source:\s*"Practitioner-consensus"/i);
  for (const consumer of [drawer, explore]) {
    assert.match(consumer, /Control Atlas explanation/);
    assert.match(consumer, /Reference:/);
    assert.doesNotMatch(consumer, /Official source/);
    assert.doesNotMatch(consumer, /Practitioner consensus/);
  }
  for (const claim of [
    /cannot legally process data or go live/i,
    /doesn't need a from-scratch reassessment/i,
    /controls apply at all/i,
    /most of them don't need/i,
    /pulls a system into .* requirements/i,
    /keeps an ATO valid/i,
    /have every system .* inherit/i,
  ]) {
    assert.doesNotMatch(source, claim);
  }
});

test("resource collections stay editorial and outside the published graph", () => {
  const dataset = JSON.parse(
    readFileSync("data/commons-resource-dataset.json", "utf8"),
  );
  assert.ok(dataset.collections.length > 0);
  assert.ok(dataset.collections.every((collection) => collection.whyCurated));
  assert.equal(
    dataset.resources.some((resource) =>
      Object.hasOwn(resource, "editorialRecommendation"),
    ),
    false,
  );
  assert.equal(
    dataset.collections.some((collection) =>
      Object.hasOwn(collection, "relationshipType") ||
      Object.hasOwn(collection, "source_node_id") ||
      Object.hasOwn(collection, "target_node_id"),
    ),
    false,
  );
});
