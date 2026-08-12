import assert from "node:assert/strict";
import test from "node:test";

import {
  publisherStructureMembershipForEdge,
  sourceRecordEnvelopeForNode,
  validatePublisherStructureMembership,
  validateSourceFragment,
  validateSourceRecordEnvelope,
} from "../src/shared/data-trust-contracts.mjs";

test("SourceRecordEnvelope requires exact publication, artifact, and locator identity", () => {
  const node = {
    id: "x:R-1",
    publication_source_id: "publisher-x",
    artifact_ids: ["artifact-x"],
    metadata: { catalog_id: "x", source_locator: "catalog.json#R-1" },
  };
  assert.deepEqual(validateSourceRecordEnvelope(sourceRecordEnvelopeForNode(node)), []);
  assert.ok(validateSourceRecordEnvelope(sourceRecordEnvelopeForNode({ id: "x:R-2", metadata: { catalog_id: "x" } })).length > 0);
});

test("PublisherStructureMembership carries ordering and source evidence", () => {
  const nodes = new Map([
    ["x:CATALOG", { metadata: { catalog_id: "x" } }],
    ["x:R-1", { metadata: { catalog_id: "x" } }],
  ]);
  const edge = {
    id: "edge:x",
    source_node_id: "x:CATALOG",
    target_node_id: "x:R-1",
    publisher_order: 0,
    source_artifact_id: "artifact-x",
    source_locator: "catalog.json#R-1",
    source_refs: [{ source_id: "publisher-x", locator: "catalog.json#R-1" }],
  };
  assert.deepEqual(validatePublisherStructureMembership(publisherStructureMembershipForEdge(edge, nodes)), []);
});

test("SourceFragment accepts precise PDF and workbook coordinates and rejects loose prose", () => {
  const checksum = `sha256:${"a".repeat(64)}`;
  assert.deepEqual(validateSourceFragment({ text: "Cell", checksum, extraction_method: "pdfplumber", page: 4, bbox: [1, 2, 3, 4] }), []);
  assert.deepEqual(validateSourceFragment({ text: "Cell", checksum, extraction_method: "xlsx", sheet: "Mappings", cell: "B7" }), []);
  assert.ok(validateSourceFragment({ text: "Loose", checksum, extraction_method: "copy" }).length > 0);
});
