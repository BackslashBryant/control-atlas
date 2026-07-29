import assert from "node:assert/strict";
import test from "node:test";

import { searchResourceDocuments } from "../src/ui/lib/resourceSearch.mjs";

const documents = [
  {
    id: "acme",
    name: "ACME Scanner",
    shortName: "ACME",
    summary: "Checks configuration files.",
    whyIncluded: "Published open-source utility.",
    searchableText: "scanner configuration",
  },
  {
    id: "oscal",
    name: "OSCAL Tools",
    shortName: "OSCAL",
    summary: "Works with OSCAL documents.",
    whyIncluded: "Public schema tooling.",
    searchableText: "oscal schema document",
  },
];

test("resource Search uses one MiniSearch owner with stable match evidence", () => {
  const result = searchResourceDocuments(documents, "OSCAL");
  assert.equal(result[0].document.id, "oscal");
  assert.ok(result[0].evidence.length > 0);
  assert.equal(searchResourceDocuments(documents, "not-present").length, 0);
});
