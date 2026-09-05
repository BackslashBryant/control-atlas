import assert from "node:assert/strict";
import test from "node:test";

import dependencySpine from "../../data/curated/framework-dependency-spine.json";
import {
  ATLAS_LENS_GROUPING_IDS,
  isAtlasLensGroupingId,
  jobFamiliesFor,
  kindFamiliesFor,
  unclaimedPublicationKinds,
  unknownJobCatalogIds,
  unplacedByJob,
} from "../../src/ui/lib/atlasLensFamilies";

/**
 * Every publication the Atlas knows about. The dependency spine is the one
 * curated file that has to name all of them — including the ones carrying no
 * crosswalk — so it doubles as the corpus roster here.
 */
const CATALOG_IDS = [
  ...new Set([
    ...dependencySpine.roots.map((root) => root.catalogId),
    ...Object.keys(dependencySpine.children),
    ...dependencySpine.unconnected,
  ]),
].sort();

test("the corpus roster is the twenty-eight publications the Atlas draws", () => {
  assert.equal(CATALOG_IDS.length, 28);
});

// A lens that quietly drops a publication is worse than no lens: the reader is
// told they are looking at the whole landscape. These four assertions are the
// only thing standing between a new catalog and its silent disappearance from
// the landing, so they check both directions of both authored groupings.
test("every publication kind in the corpus belongs to a kind family", () => {
  assert.deepEqual(unclaimedPublicationKinds(CATALOG_IDS), []);
});

test("the kind lens places every publication exactly once", () => {
  const placed = kindFamiliesFor(CATALOG_IDS).flatMap((family) => family.catalogIds);
  assert.deepEqual([...placed].sort(), CATALOG_IDS);
  assert.equal(new Set(placed).size, placed.length);
});

test("the job lens places every publication exactly once", () => {
  assert.deepEqual(unplacedByJob(CATALOG_IDS), []);
  assert.deepEqual(unknownJobCatalogIds(CATALOG_IDS), []);
  const placed = jobFamiliesFor(CATALOG_IDS).flatMap((family) => family.catalogIds);
  assert.deepEqual([...placed].sort(), CATALOG_IDS);
  assert.equal(new Set(placed).size, placed.length);
});

// The point of grouping is that a screen holds a readable number of things. A
// family that grows past this is a signal the grouping stopped working, not a
// number to raise.
test("no family is larger than a reader can take in at a glance", () => {
  for (const family of [...kindFamiliesFor(CATALOG_IDS), ...jobFamiliesFor(CATALOG_IDS)]) {
    assert.ok(
      family.catalogIds.length >= 1 && family.catalogIds.length <= 8,
      `${family.id} holds ${family.catalogIds.length} publications`,
    );
  }
});

test("every authored job family says why its members belong together", () => {
  for (const family of jobFamiliesFor(CATALOG_IDS)) {
    assert.ok(family.rationale.length > 20, `${family.id} has no rationale`);
  }
});

test("the lens ids are the three the landing offers", () => {
  assert.deepEqual([...ATLAS_LENS_GROUPING_IDS], ["kind", "publishers", "job"]);
  assert.ok(isAtlasLensGroupingId("kind"));
  assert.ok(!isAtlasLensGroupingId("frameworks"));
});
