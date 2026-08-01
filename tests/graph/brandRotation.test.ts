import assert from "node:assert/strict";
import test from "node:test";

import {
  BRAND_ACTIONS,
  BRAND_SURFACE_VIEWS,
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
  "Explore",
  "Trace",
  "Crosswalk",
  "Browse",
  "Draft",
  "Find",
  "Verify",
  "Reconcile",
  "Learn",
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

test("every rotating word resolves to a distinct, routable keyboard shortcut", () => {
  // The keycap advertises Ctrl+Alt+<first letter>; App.tsx matches the word on
  // display. Unique first letters keep the promise unambiguous even so.
  const initials = BRAND_WORDS.map((word) => word[0].toUpperCase());
  assert.equal(new Set(initials).size, initials.length);

  for (const action of BRAND_ACTIONS) {
    const view = BRAND_SURFACE_VIEWS[action.surface];
    assert.ok(view, `${action.surface} has no view to navigate to`);
    assert.match(view, /^[a-z-]+$/);
  }
  assert.deepEqual(
    new Set(Object.keys(BRAND_SURFACE_VIEWS)),
    PRODUCT_SURFACES,
  );
});

test("the rotation spans the seven launch surfaces", () => {
  assert.deepEqual(
    new Set(BRAND_ACTIONS.map(({ surface }) => surface)),
    PRODUCT_SURFACES,
  );
});
