import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { classifySource } from "../../src/ui/graph/classifySource.ts";
import { SOURCE_SEED_MANIFEST } from "../../src/ui/graph/sourceSeedManifest.ts";

const VALID_TIERS = new Set([
  "authority",
  "governance-risk-framework",
  "control-catalog-requirement-set",
  "baseline-overlay-program-profile",
  "assessment-scoping-procedure",
  "implementation-configuration-standard",
  "control-mapping-crosswalk",
  "threat-defensive-mapping",
  "supporting-reference",
]);

const VALID_DISPOSITIONS = new Set([
  "default-map",
  "add-to-default-map",
  "supporting-reference-only",
  "registry-only",
  "draft-gated",
]);

test("every source has the complete manifest contract", () => {
  assert.ok(SOURCE_SEED_MANIFEST.length >= 60);
  const ids = new Set<string>();

  for (const source of SOURCE_SEED_MANIFEST) {
    assert.ok(source.sourceId);
    assert.ok(source.displayName);
    assert.ok(source.artifactName);
    assert.ok(source.publisher);
    assert.equal(VALID_TIERS.has(source.hierarchyTier), true);
    assert.equal(VALID_DISPOSITIONS.has(source.disposition), true);
    assert.match(source.canonicalUrl, /^(https:\/\/|registry-local-only$)/);
    assert.equal(ids.has(source.sourceId), false, source.sourceId);
    ids.add(source.sourceId);
  }
});

test("classifySource returns known sources and rejects unknown sources", () => {
  assert.equal(classifySource("nist-sp-800-53-r5").displayName, "NIST SP 800-53 Rev. 5");
  assert.throws(
    () => classifySource("made-up-source"),
    /Unknown sourceId: made-up-source/,
  );
});

test("publisher metadata does not replace hierarchy classification", () => {
  assert.equal(classifySource("fips-199").publisher, "NIST");
  assert.equal(classifySource("fips-199").hierarchyTier, "authority");
  assert.equal(
    classifySource("nist-sp-800-53-r5").hierarchyTier,
    "control-catalog-requirement-set",
  );
});

test("source fixture includes at least one source from every hierarchy tier", () => {
  const fixture = JSON.parse(
    readFileSync("tests/fixtures/source-manifest.fixture.json", "utf8"),
  ) as Array<{ sourceId: string; hierarchyTier: string }>;
  assert.deepEqual(
    new Set(fixture.map((entry) => entry.hierarchyTier)),
    VALID_TIERS,
  );
  for (const entry of fixture) {
    assert.equal(classifySource(entry.sourceId).hierarchyTier, entry.hierarchyTier);
  }
});
