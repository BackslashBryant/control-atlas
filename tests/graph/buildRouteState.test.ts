import assert from "node:assert/strict";
import test from "node:test";

import {
  baselineCatalogForBuildContext,
  BUILD_SOURCE_CONTEXTS,
  isValidBuildSourceContext,
} from "../../src/ui/lib/buildRouteState";

test("Build contexts keep baseline catalogs out of the source-context selector", () => {
  assert.deepEqual(
    BUILD_SOURCE_CONTEXTS.map((context) => context.id),
    ["nist-800-53", "fedramp-rev5"],
  );
  assert.equal(isValidBuildSourceContext("nist-800-53b"), false);
  assert.equal(baselineCatalogForBuildContext("nist-800-53"), "nist-800-53b");
  assert.equal(
    baselineCatalogForBuildContext("fedramp-rev5"),
    "fedramp-rev5",
  );
  assert.equal(baselineCatalogForBuildContext("nist-800-53b"), "");
});
