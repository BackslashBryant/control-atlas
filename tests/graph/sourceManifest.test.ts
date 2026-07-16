import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { classifySource } from "../../src/ui/graph/classifySource.ts";
import { SOURCE_SEED_MANIFEST } from "../../src/ui/graph/sourceSeedManifest.ts";
import { SOURCE_VIEW_DEFINITIONS } from "../../src/ui/graph/sourceViews.ts";

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
    assert.ok(source.noviceQuestions.length > 0, source.sourceId);
    assert.ok(source.rmfLifecycle.length > 0, source.sourceId);
    assert.equal(
      source.noviceQuestions.every((question) =>
        SOURCE_VIEW_DEFINITIONS.novice.groups.some((group) => group.id === question),
      ),
      true,
      source.sourceId,
    );
    assert.equal(
      source.rmfLifecycle.every((step) =>
        SOURCE_VIEW_DEFINITIONS.rmf.groups.some((group) => group.id === step),
      ),
      true,
      source.sourceId,
    );
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

test("purpose stays canonical while novice and RMF memberships are alternate views", () => {
  const fips199 = classifySource("fips-199");
  assert.equal(fips199.hierarchyTier, "authority");
  assert.deepEqual(fips199.noviceQuestions, ["why-apply"]);
  assert.ok(fips199.rmfLifecycle.includes("categorize"));

  const assessment = classifySource("nist-sp-800-53a-r5");
  assert.equal(assessment.hierarchyTier, "assessment-scoping-procedure");
  assert.deepEqual(assessment.noviceQuestions, ["test"]);
  assert.ok(assessment.rmfLifecycle.includes("assess"));
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
