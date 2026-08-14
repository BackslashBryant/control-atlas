import assert from "node:assert/strict";
import test from "node:test";

import { catalogDisplayNameFor } from "../../src/ui/lib/catalogProfiles";
import { sourceLocatorKind } from "../../src/ui/lib/sourceLocator";
import { CATALOG_STRUCTURE_IDS } from "../../src/shared/catalog-structure.mjs";

test("catalog display names replace raw catalog identifiers", () => {
  assert.equal(catalogDisplayNameFor("nist-mobile-threats"), "NIST Mobile Threat Catalogue");
  assert.equal(catalogDisplayNameFor("nist-zt", "nist-zt"), "NIST Zero Trust");
  assert.equal(catalogDisplayNameFor("nist-800-53", "Publisher-provided name"), "Publisher-provided name");
  for (const catalogId of CATALOG_STRUCTURE_IDS) {
    assert.notEqual(catalogDisplayNameFor(catalogId, catalogId), catalogId, catalogId);
  }
});

test("source locator labels describe retained evidence without creating links", () => {
  assert.equal(sourceLocatorKind("https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final"), "URL locator");
  assert.equal(sourceLocatorKind("U_STIG.zip/manual-xccdf.xml#V-256609"), "Artifact path");
  assert.equal(sourceLocatorKind("registry/category-detail/terrorist-screening"), "Publisher registry path");
  assert.equal(sourceLocatorKind("catalog.json#AC-2"), "Document locator");
  assert.equal(sourceLocatorKind("32-CFR-170.14(c)(2)"), "Source locator");
});
