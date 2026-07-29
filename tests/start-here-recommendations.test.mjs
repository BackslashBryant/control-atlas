import assert from "node:assert/strict";
import test from "node:test";

import {
  SOURCE_STARTING_POINTS,
  validateSourceStartingPoints,
} from "../src/ui/lib/source-navigator.mjs";

test("Start here exposes fixed public source starting points without a questionnaire", () => {
  assert.deepEqual(validateSourceStartingPoints(), []);
  assert.ok(
    SOURCE_STARTING_POINTS.every(
      (point) =>
        point.catalogId &&
        point.label &&
        /^Listed because Control Atlas has public /.test(point.inclusionReason),
    ),
  );
  assert.ok(
    SOURCE_STARTING_POINTS.some((point) => point.catalogId === "nist-800-53"),
  );
  assert.ok(
    SOURCE_STARTING_POINTS.some((point) => point.catalogId === "disa-stig"),
  );
});

test("source starting points reject duplicate or unexplained entries", () => {
  const [first] = SOURCE_STARTING_POINTS;
  const errors = validateSourceStartingPoints([
    first,
    { ...first },
    { catalogId: "missing-explanation", label: "", inclusionReason: "" },
  ]);
  assert.ok(errors.some((error) => /duplicate/.test(error)));
  assert.ok(errors.some((error) => /lacks identity or inclusion reason/.test(error)));
});
