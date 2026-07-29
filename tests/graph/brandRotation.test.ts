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
  /^(?:Assess|Audit|Authorize|Baseline|Clarify|Comply|Demystify|Inherit|Recommend|Simplify|Verify)$/i;

test("every rotating brand action names a real Control Atlas surface", () => {
  assert.equal(BRAND_ACTIONS.length, 20);
  assert.deepEqual(
    BRAND_WORDS,
    BRAND_ACTIONS.map(({ word }) => word),
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
