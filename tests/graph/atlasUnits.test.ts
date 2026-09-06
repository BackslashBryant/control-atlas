import assert from "node:assert/strict";
import test from "node:test";

import { catalogProfileFor } from "../../src/ui/lib/catalogProfiles";
import { unitNounFor, withUnitNoun } from "../../src/ui/lib/atlasUnits";
import dependencySpine from "../../data/curated/framework-dependency-spine.json";

/**
 * The map counts in the publisher's own word rather than in "records".
 * These pin the two ways that goes wrong: a noun that reads as database
 * vocabulary, and a plural bent into a singular nobody writes.
 */

/** The same roster atlasLensFamilies uses: the spine has to name all 28. */
const CATALOG_IDS = [
  ...new Set([
    ...dependencySpine.roots.map((root) => root.catalogId),
    ...Object.keys(dependencySpine.children),
    ...dependencySpine.unconnected,
  ]),
].sort();

test("a plural label is lowercased and left plural for a plural count", () => {
  assert.equal(unitNounFor("Controls", 148), "controls");
  assert.equal(unitNounFor("Assessment procedures", 1034), "assessment procedures");
  assert.equal(unitNounFor("Techniques", 823), "techniques");
});

test("acronyms keep their case", () => {
  assert.equal(unitNounFor("STIG rules", 17375), "STIG rules");
  assert.equal(unitNounFor("SRG requirements", 12), "SRG requirements");
  assert.equal(unitNounFor("STIG rules", 1), "STIG rule");
});

test("a count of one singularises the last word", () => {
  assert.equal(unitNounFor("Controls", 1), "control");
  assert.equal(unitNounFor("Requirements", 1), "requirement");
  assert.equal(unitNounFor("Baselines", 1), "baseline");
  assert.equal(unitNounFor("Activities", 1), "activity");
  assert.equal(unitNounFor("Categorization records", 1), "categorization record");
});

/**
 * Three catalogs name several kinds of thing at once. Singularising only the
 * last word of "Capabilities and elements" invents a phrase, so a compound
 * stays as written and the sentence reads a little oddly instead of wrongly.
 */
test("a compound label is never bent into a singular", () => {
  assert.equal(
    unitNounFor("Capabilities and elements", 1),
    "capabilities and elements",
  );
  assert.equal(
    unitNounFor("Principles, components, and builds", 1),
    "principles, components, and builds",
  );
  assert.equal(unitNounFor("Rules and definitions", 1), "rules and definitions");
});

test("withUnitNoun formats the count and falls back to a bare number", () => {
  assert.equal(withUnitNoun(1216, "Controls"), "1,216 controls");
  assert.equal(withUnitNoun(1, "Controls"), "1 control");
  assert.equal(withUnitNoun(28, "Frameworks"), "28 frameworks");
  assert.equal(withUnitNoun(28, ""), "28");
  assert.equal(withUnitNoun(28), "28");
});

/**
 * The whole point of the change: no cell anywhere in the map may fall back to
 * "records" or "publications". Every catalog has to supply a real noun, and a
 * new catalog arriving without one has to fail here rather than quietly
 * reintroducing the database word on the landing.
 */
test("every catalog names what it holds in words a practitioner uses", () => {
  assert.ok(CATALOG_IDS.length >= 28, `expected the full corpus, saw ${CATALOG_IDS.length}`);
  const offenders: string[] = [];
  for (const catalogId of CATALOG_IDS) {
    const label = catalogProfileFor(catalogId).recordLabel;
    if (!label || /^records$/i.test(label) || /^publications?$/i.test(label)) {
      offenders.push(`${catalogId} -> ${label || "(none)"}`);
    }
    // A noun that survives both forms is one the map can print either way.
    assert.equal(typeof unitNounFor(label, 1), "string");
    assert.notEqual(unitNounFor(label, 2), "");
  }
  assert.deepEqual(offenders, []);
});
