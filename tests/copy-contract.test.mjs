import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { SITE_COPY } from "../src/shared/site-copy.mjs";

const read = (path) => readFileSync(path, "utf8");
const PUBLIC_COPY_FILES = [
  "src/shared/site-copy.mjs",
  "src/shared/home-content.mjs",
  "src/shared/disclaimer.mjs",
  "src/app/help-data.mjs",
  "src/app/learn-content.mjs",
  "src/app/start-here-guide.mjs",
  "src/app/template-engine.mjs",
  "src/index.html",
  "src/main.tsx",
  "src/public/progressive-shell.js",
  "src/ui/components/SearchOverlay.tsx",
  "src/ui/components/SiteFooter.tsx",
  "src/ui/App.tsx",
  "src/ui/components/AtlasTree.tsx",
  "src/ui/pages/AboutPage.tsx",
  "src/ui/pages/AtlasMapPage.tsx",
  "src/ui/pages/CatalogDetailPage.tsx",
  "src/ui/pages/CommonsDetailPage.tsx",
  "src/ui/pages/CommonsPage.tsx",
  "src/ui/pages/ComparePage.tsx",
  "src/ui/pages/ExplorePage.tsx",
  "src/ui/pages/HomePage.tsx",
  "src/ui/pages/ObjectDetailPage.tsx",
  "src/ui/pages/PlaybooksPage.tsx",
  "src/ui/pages/SourcesPage.tsx",
  "src/ui/pages/StartHerePage.tsx",
  "src/ui/pages/TemplatesPage.tsx",
  "src/ui/lib/buildRouteState.ts",
  "src/ui/lib/catalogProfiles.ts",
  "src/ui/lib/pagePrimitives.tsx",
  "src/ui/lib/recordTitle.ts",
  "src/shared/product-identity.ts",
  "data/curated/authority-spine.json",
];

test("site copy keeps every approved anchor exact", () => {
  assert.equal(SITE_COPY.home.headline, "Make federal cybersecurity compliance make sense.");
  assert.equal(SITE_COPY.home.definition, "Understand what applies, what it means, and what to do next.");
  assert.equal(SITE_COPY.product.searchPlaceholder, "Search by topic, title, or identifier.");
  assert.equal(SITE_COPY.product.definition, "Control Atlas is a public research tool for federal cybersecurity requirements, controls, techniques, and guidance.");
  assert.equal(SITE_COPY.product.boundary, "Use Control Atlas for research, not compliance or authorization decisions.");
  assert.deepEqual(
    SITE_COPY.home.destinations.map(({ label, description }) => [label, description]),
    [
      ["Browse the Atlas", "Start with a topic."],
      ["Search the Library", "Find a specific record."],
      ["Browse Resources", "Find tools, training, and guidance."],
    ],
  );
});

test("product-authored route copy excludes banned metaphor and generated guidance", () => {
  const copy = PUBLIC_COPY_FILES.map((path) => read(path)).join("\n");
  const prohibited = [
    /see the landscape/i,
    /drill (?:in|down|into)/i,
    /navigate the terrain/i,
    /move the work forward/i,
    /tell control atlas/i,
    /what you need to do/i,
    /how to satisfy it/i,
    /assign an implementation owner/i,
    /published structure/i,
    /source-backed/i,
    /already represented in (?:the )?Atlas/i,
    /being reviewed before public launch/i,
    /\b(?:proves?|ensures?|guarantees?|achieves?) compliance\b/i,
    /[\u00c2\u00c3]|\u00e2\u20ac/,
  ];
  for (const pattern of prohibited) assert.doesNotMatch(copy, pattern);
});

test("product-authored Resource collection summaries stay short and task-focused", () => {
  const dataset = JSON.parse(read("data/commons-resource-dataset.json"));
  for (const collection of dataset.collections) {
    assert.match(collection.summary, /^(?:Find|Check)\b/);
    assert.ok(
      collection.summary.trim().split(/\s+/).length <= 12,
      `${collection.id} summary is longer than one useful task sentence`,
    );
    assert.doesNotMatch(collection.summary, /(?:,[^,]+){2,}/);
  }
});

test("record page is profile-driven and contains no generic source or advice fallback", () => {
  const recordPage = read("src/ui/pages/ObjectDetailPage.tsx");
  assert.match(recordPage, /recordPresentationProfile/);
  assert.match(recordPage, /View official source/);
  assert.match(recordPage, /See connections/);
  assert.match(recordPage, /About This Record/);
  assert.doesNotMatch(recordPage, />Official text</i);
  assert.doesNotMatch(recordPage, /What this is|What you need to do|How to satisfy it/i);
});

test("generation excludes structural scaffolding from public records", () => {
  const generator = read("scripts/build-framework-data.mjs");
  assert.match(generator, /filter\(\(node\) => !NON_RECORD_NODE_TYPES\.has\(node\.node_type\)\)/);
});

test("Home has one centralized React and first-paint copy source", () => {
  assert.match(read("src/ui/pages/HomePage.tsx"), /HOME_CONTENT/);
  assert.match(read("vite.config.ts"), /HOME_CONTENT/);
  assert.doesNotMatch(read("src/ui/pages/HomePage.tsx"), /Make federal cybersecurity compliance make sense/);
  assert.doesNotMatch(read("vite.config.ts"), /Make federal cybersecurity compliance make sense/);
});
