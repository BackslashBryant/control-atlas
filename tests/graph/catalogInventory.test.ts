import assert from "node:assert/strict";
import test from "node:test";

import {
  paginateCatalogRecords,
  publicationSourceForCatalog,
} from "../../src/ui/lib/catalogInventory";

test("catalog identity resolves only from the catalog root publication source", () => {
  const sources = new Map([
    ["nist-oscal", { id: "nist-oscal" }],
    ["nist-csf-2", { id: "nist-csf-2" }],
  ]);
  const runtime = {
    getNodes: () => [
      {
        node_type: "catalog",
        source_id: "nist-csf-2",
        metadata: { catalog_id: "csf-2" },
      },
    ],
    getSource: (id: string) => sources.get(id),
  };

  assert.equal(
    publicationSourceForCatalog(runtime, "csf-2")?.id,
    "nist-csf-2",
  );
});

test("catalog identity fails closed when the catalog root has no exact source", () => {
  const runtime = {
    getNodes: () => [
      {
        node_type: "catalog",
        metadata: { catalog_id: "csf-2" },
      },
    ],
    getSource: () => ({ id: "nist-oscal" }),
  };
  assert.equal(publicationSourceForCatalog(runtime, "csf-2"), null);
});

test("catalog pagination exposes every eligible record exactly once", () => {
  const records = Array.from({ length: 237 }, (_, index) => `record-${index}`);
  const first = paginateCatalogRecords(records, 1, 100);
  const second = paginateCatalogRecords(records, 2, 100);
  const third = paginateCatalogRecords(records, 3, 100);

  assert.equal(first.pageCount, 3);
  assert.deepEqual(
    [...first.records, ...second.records, ...third.records],
    records,
  );
  assert.equal(new Set([...first.records, ...second.records, ...third.records]).size, 237);
  assert.equal(paginateCatalogRecords(records, 4, 100).valid, false);
});
