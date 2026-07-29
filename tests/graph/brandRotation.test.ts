import assert from "node:assert/strict";
import test from "node:test";

import {
  BRAND_ACTIONS,
  BRAND_WORDS,
} from "../../src/shared/brand-rotation";

const PRODUCT_SURFACES = new Set([
  "atlas",
  "build",
  "catalogs",
  "compare",
  "learn",
  "search",
  "sources",
]);

const DECISION_OR_SELF_PRAISE_WORDS =
  /^(?:Approve|Assess|Audit|Authorize|Baseline|Clarify|Comply|Demystify|Inherit|Recommend|Secure|Simplify)$/i;

const EXPECTED_BRAND_WORDS = [
  "Trace",
  "Find",
  "Search",
  "Browse",
  "Read",
  "Explore",
  "Map",
  "Compare",
  "Connect",
  "Relate",
  "Filter",
  "Inspect",
  "Crosswalk",
  "Verify",
  "Cite",
  "Source",
  "Build",
  "Create",
  "Preview",
  "Download",
  "Export",
  "Document",
  "Reconcile",
  "Navigate",
  "Learn",
  "Share",
  "Recover",
] as const;

test("every rotating brand action names a real Control Atlas surface", () => {
  assert.equal(BRAND_ACTIONS.length, EXPECTED_BRAND_WORDS.length);
  assert.deepEqual(
    BRAND_WORDS,
    EXPECTED_BRAND_WORDS,
  );
  assert.equal(new Set(BRAND_WORDS).size, BRAND_WORDS.length);

  for (const action of BRAND_ACTIONS) {
    assert.ok(
      PRODUCT_SURFACES.has(action.surface),
      `${action.word} points to unsupported surface ${action.surface}`,
    );
    assert.doesNotMatch(action.word, DECISION_OR_SELF_PRAISE_WORDS);
  }
});

test("the rotation spans the seven launch surfaces", () => {
  assert.deepEqual(
    new Set(BRAND_ACTIONS.map(({ surface }) => surface)),
    PRODUCT_SURFACES,
  );
});
