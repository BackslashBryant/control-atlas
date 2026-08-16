import assert from "node:assert/strict";
import test from "node:test";

import { catalogDisplayNameFor } from "../../src/ui/lib/catalogProfiles";
import { CATALOG_STRUCTURE_IDS } from "../../src/shared/catalog-structure.mjs";

test("catalog display names replace raw catalog identifiers", () => {
  assert.equal(catalogDisplayNameFor("nist-mobile-threats"), "NIST Mobile Threat Catalogue");
  assert.equal(catalogDisplayNameFor("nist-zt", "nist-zt"), "NIST Zero Trust");
  assert.equal(catalogDisplayNameFor("nist-800-53", "Publisher-provided name"), "Publisher-provided name");
  for (const catalogId of CATALOG_STRUCTURE_IDS) {
    assert.notEqual(catalogDisplayNameFor(catalogId, catalogId), catalogId, catalogId);
  }
});
