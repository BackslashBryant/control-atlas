import assert from "node:assert/strict";
import test from "node:test";

import dependencySpine from "../../data/curated/framework-dependency-spine.json";
import {
  ATLAS_LENS_GROUPING_IDS,
  ATLAS_LENS_LABELS,
  isAtlasLensGroupingId,
  jobFamiliesFor,
  kindFamiliesFor,
  publicationsWithoutPublisher,
  publisherFamiliesFor,
  publisherStrips,
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

/**
 * The publisher ecosystems as the build emits them. Membership is not curated,
 * so this mirrors the artifact rather than a file under data/curated.
 */
const ECOSYSTEMS = [
  { id: "ecosystem:nist", label: "NIST", catalogIds: [
    "csf-2", "fips-199", "fips-200", "nist-800-171-rev2", "nist-800-171",
    "nist-800-172", "nist-800-37", "nist-800-53", "nist-800-53a",
    "nist-800-53b", "nist-ai-rmf", "nist-iot-cybersecurity",
    "nist-mobile-threats", "nist-ssdf", "nist-zt",
  ] },
  { id: "ecosystem:disa", label: "DISA", catalogIds: ["disa-cci", "disa-srg", "disa-stig"] },
  { id: "ecosystem:mitre", label: "MITRE", catalogIds: ["mitre-attack-ics", "mitre-attack", "mitre-d3fend"] },
  { id: "ecosystem:fedramp", label: "FedRAMP", catalogIds: ["fedramp-2026", "fedramp-rev5"] },
  { id: "ecosystem:dod", label: "DoD", catalogIds: ["cmmc-2"] },
  { id: "ecosystem:dod-cio", label: "DoD CIO", catalogIds: ["dod-zt"] },
  { id: "ecosystem:isoo", label: "ISOO", catalogIds: ["cui-policy"] },
  { id: "ecosystem:cdao", label: "CDAO", catalogIds: ["dod-rai"] },
];

test("the publisher lens names every publisher and drops no publication", () => {
  const families = publisherFamiliesFor(ECOSYSTEMS, CATALOG_IDS);
  assert.equal(families.length, 8);
  // Ordered by how much each issues, which is what the card's count says.
  assert.deepEqual(families.map((family) => family.label), [
    "NIST", "DISA", "MITRE", "FedRAMP", "CDAO", "DoD", "DoD CIO", "ISOO",
  ]);
  for (const family of families) {
    assert.ok(family.blurb.length > 10, `${family.id} has no description`);
  }
  const placed = families.flatMap((family) => family.catalogIds);
  const orphaned = publicationsWithoutPublisher(ECOSYSTEMS, CATALOG_IDS);
  // Every publication is either under a publisher or named as having none.
  assert.deepEqual([...placed, ...orphaned].sort(), CATALOG_IDS);
  assert.equal(new Set(placed).size, placed.length);
});

test("a publication with no federal publisher is named rather than dropped", () => {
  assert.deepEqual(publicationsWithoutPublisher(ECOSYSTEMS, CATALOG_IDS), [
    "microsoft-zt-maturity",
  ]);
  const strips = publisherStrips();
  assert.deepEqual(strips.map((strip) => strip.id), ["authority", "no-publisher"]);
  // The authority landmarks are obligations, not publishers, and nobody
  // crosswalks to them — so the board names them instead of grouping them.
  assert.deepEqual(strips[0].landmarkIds, [
    "authority:statutes",
    "authority:regulations",
    "authority:directives",
  ]);
  for (const strip of strips) {
    assert.ok(strip.heading.length > 3, `${strip.id} has no heading`);
    assert.ok(strip.note.length > 30, `${strip.id} does not say why`);
  }
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

test("the lens ids are the three the landing offers, and each is labelled", () => {
  assert.deepEqual([...ATLAS_LENS_GROUPING_IDS], ["kind", "publishers", "job"]);
  assert.ok(isAtlasLensGroupingId("kind"));
  assert.ok(!isAtlasLensGroupingId("frameworks"));
  for (const id of ATLAS_LENS_GROUPING_IDS) {
    assert.ok(ATLAS_LENS_LABELS[id]?.blurb, `${id} has no blurb for the board`);
  }
});
