import assert from "node:assert/strict";
import test from "node:test";

import { relationshipExplanation } from "../../src/ui/lib/relationshipProvenance";

test("relationship explanations preserve their provenance boundary", () => {
  const fixtures = [
    {
      edge: { rationale: "The publication explicitly maps this requirement." },
      expected: {
        label: "Published rationale",
        text: "The publication explicitly maps this requirement.",
      },
    },
    {
      edge: { navigation_note: "Grouped here to make the published connection easier to browse." },
      expected: {
        label: "Navigation note",
        text: "Grouped here to make the published connection easier to browse.",
      },
    },
    {
      edge: {},
      expected: null,
    },
  ] as const;

  for (const fixture of fixtures) {
    assert.deepEqual(relationshipExplanation(fixture.edge), fixture.expected);
  }
});
