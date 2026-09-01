import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateGeneratedDataCacheKey,
  discoverGenerationEntrypoints,
  generatedDataCacheInputs,
} from "../tools/generated-data-cache-key.mjs";

const EXPECTED_PIPELINE_ENTRYPOINTS = [
  "scripts/build-catalog-source-inventory.mjs",
  "scripts/build-commons-index.mjs",
  "scripts/build-discovery-index.mjs",
  "scripts/build-fedramp-2026-catalog.mjs",
  "scripts/build-framework-data.mjs",
  "scripts/build-publication-audit-report.mjs",
  "scripts/build-publication-identity-index.mjs",
  "scripts/build-source-semantic-audit.mjs",
  "scripts/build-source-truth-migration-manifest.mjs",
  "scripts/build-taxonomy-registry.mjs",
  "scripts/migrate-source-truth-profiles.mjs",
  "scripts/reconcile-artifact-counts.mjs",
  "scripts/sync-catalog-inventory-contracts.mjs",
  "scripts/verify-ingestion-pipeline.mjs",
  "scripts/verify-manifests.mjs",
  "scripts/verify-resource-ingestion.mjs",
];

test("generated data cache key covers the canonical package-script pipeline", () => {
  const inputs = generatedDataCacheInputs();
  assert.deepEqual(inputs, [...new Set(inputs)].sort());
  assert.ok(inputs.includes("package.json"));
  assert.ok(inputs.includes("data/source-registry.json"));
  assert.ok(inputs.includes("maps/800-53-to-csf.json"));
  for (const entrypoint of EXPECTED_PIPELINE_ENTRYPOINTS) {
    assert.ok(inputs.includes(entrypoint), `${entrypoint} is not a cache input`);
  }
  assert.ok(inputs.includes("src/app/runtime.mjs"));
  assert.ok(inputs.every((path) => !path.startsWith("data/generated/")));
  assert.match(calculateGeneratedDataCacheKey(), /^[0-9a-f]{64}$/);
});

test("generated data producer discovery follows nested npm scripts", () => {
  const entrypoints = discoverGenerationEntrypoints({
    "build:data": "node ./scripts/build-one.mjs && npm run migrate:data",
    "generate:data": "npm run build:data && tsx ./scripts/build-two.ts",
    "migrate:data": "node ./scripts/new-producer.mjs",
  });

  assert.deepEqual(entrypoints, [
    "scripts/build-one.mjs",
    "scripts/build-two.ts",
    "scripts/new-producer.mjs",
  ]);
});

test("generated data producer discovery fails closed on unsupported commands", () => {
  assert.throws(
    () => discoverGenerationEntrypoints({
      "build:data": "node ./scripts/build-one.mjs | tee build.log",
      "generate:data": "npm run build:data",
    }),
    /Unsupported generated-data command/,
  );
});
