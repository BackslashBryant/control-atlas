import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateGeneratedDataCacheKey,
  generatedDataCacheInputs,
} from "../tools/generated-data-cache-key.mjs";

test("generated data cache key is deterministic and excludes generated output", () => {
  const inputs = generatedDataCacheInputs();
  assert.deepEqual(inputs, [...new Set(inputs)].sort());
  assert.ok(inputs.includes("data/source-registry.json"));
  assert.ok(inputs.includes("maps/800-53-to-csf.json"));
  assert.ok(inputs.includes("scripts/build-framework-data.mjs"));
  assert.ok(inputs.includes("src/app/runtime.mjs"));
  assert.ok(inputs.every((path) => !path.startsWith("data/generated/")));
  assert.match(calculateGeneratedDataCacheKey(), /^[0-9a-f]{64}$/);
});
