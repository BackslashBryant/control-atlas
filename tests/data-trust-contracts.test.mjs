import assert from "node:assert/strict";
import test from "node:test";

import {
  connectionEvidenceIdsForEdge,
  publisherStructureMembershipForEdge,
  resolveAtlasClass,
  resolveAtlasStructureRole,
  resolveNativeType,
  resolveObjectLayer,
  resolvePublicationId,
  resolveSourceMaterialId,
  sourceRecordEnvelopeForNode,
  validateCanonicalLayerAssignment,
  validateConnectionEvidenceIsolation,
  validateNativeTypeAssignment,
  validatePublicationIdAssignment,
  validatePublisherStructureMembership,
  validateSourceFragment,
  validateRelationshipEvidenceAttachment,
  validateSourceMaterialIdAssignment,
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

test("resolveObjectLayer separates Atlas structure, authority documents, and publisher content", () => {
  assert.equal(resolveObjectLayer({ node_type: "trunk" }), "atlas_structure");
  assert.equal(resolveObjectLayer({ node_type: "limb" }), "atlas_structure");
  assert.equal(resolveObjectLayer({ node_type: "statute" }), "authority_document");
  assert.equal(resolveObjectLayer({ node_type: "regulation" }), "authority_document");
  assert.equal(resolveObjectLayer({ node_type: "policy_directive" }), "authority_document");
  assert.equal(resolveObjectLayer({ node_type: "requirement" }), "publisher_content");
  assert.equal(resolveObjectLayer({ node_type: "control" }), "publisher_content");
});

test("resolveAtlasStructureRole assigns root to the trunk and area to limbs only", () => {
  assert.equal(resolveAtlasStructureRole({ node_type: "trunk" }), "root");
  assert.equal(resolveAtlasStructureRole({ node_type: "limb" }), "area");
  assert.equal(resolveAtlasStructureRole({ node_type: "control" }), "");
});

test("resolveNativeType stays source-faithful and never collapses to a generic bucket", () => {
  const csfSubcategory = { node_type: "requirement", metadata: { catalog_id: "csf-2", type: "csf-subcategory" } };
  assert.equal(resolveNativeType(csfSubcategory), "csf-subcategory");
  const ssdfTask = { node_type: "requirement", metadata: { catalog_id: "nist-ssdf", type: "ssdf-task" } };
  assert.equal(resolveNativeType(ssdfTask), "ssdf-task");
  // DISA's CCI list overloads `type` for the policy/technical classification,
  // not the record kind, so the record kind must be asserted explicitly.
  const cci = { node_type: "requirement", metadata: { catalog_id: "disa-cci", type: "policy" } };
  assert.equal(resolveNativeType(cci), "cci");
  // Atlas structure has no publisher-native kind — it is Control Atlas's own
  // organizing overlay, never a publisher record type.
  assert.equal(resolveNativeType({ node_type: "trunk", metadata: { type: "trunk" } }), "");
});

test("resolveAtlasClass only reads an explicit upstream assertion and never infers one", () => {
  assert.equal(resolveAtlasClass({ metadata: {} }), "");
  assert.equal(resolveAtlasClass({ node_type: "requirement", metadata: {} }), "");
  assert.equal(resolveAtlasClass({ metadata: { atlas_class: "framework-requirement" } }), "framework-requirement");
});

test("resolvePublicationId is populated for publisher content only", () => {
  assert.equal(resolvePublicationId({ node_type: "control", metadata: { catalog_id: "nist-800-53" } }), "nist-800-53");
  assert.equal(resolvePublicationId({ node_type: "trunk", metadata: { catalog_id: "nist-800-53" } }), "");
  assert.equal(resolvePublicationId({ node_type: "statute", metadata: {} }), "");
});

test("resolveSourceMaterialId prefers the stamped field over a derived artifact id", () => {
  assert.equal(resolveSourceMaterialId({ source_material_id: "artifact-x", artifact_ids: ["artifact-y"] }), "artifact-x");
  assert.equal(resolveSourceMaterialId({ artifact_ids: ["artifact-y"] }), "artifact-y");
  assert.equal(resolveSourceMaterialId({}), "");
});

test("validateCanonicalLayerAssignment catches drift, missing roles, and fabricated roles", () => {
  const trunk = { node_type: "trunk", metadata: { object_layer: "atlas_structure", atlas_structure_role: "root" } };
  assert.deepEqual(validateCanonicalLayerAssignment(trunk), []);
  assert.ok(validateCanonicalLayerAssignment({ node_type: "trunk", metadata: { object_layer: "publisher_content" } }).length > 0);
  assert.ok(validateCanonicalLayerAssignment({ node_type: "trunk", metadata: { object_layer: "atlas_structure" } }).length > 0);
  assert.ok(validateCanonicalLayerAssignment({ node_type: "control", metadata: { object_layer: "publisher_content", atlas_structure_role: "root" } }).length > 0);
});

test("validateNativeTypeAssignment requires the stamped value to match the resolved value", () => {
  const csfSubcategory = { node_type: "requirement", metadata: { catalog_id: "csf-2", type: "csf-subcategory", native_type: "csf-subcategory" } };
  assert.deepEqual(validateNativeTypeAssignment(csfSubcategory), []);
  assert.ok(validateNativeTypeAssignment({ node_type: "requirement", metadata: { catalog_id: "csf-2", type: "csf-subcategory", native_type: "requirement" } }).length > 0);
  assert.ok(validateNativeTypeAssignment({ node_type: "control", metadata: { type: "800-53-control" } }).length > 0);
});

test("validatePublicationIdAssignment requires publisher content to resolve and structure to stay empty", () => {
  assert.deepEqual(validatePublicationIdAssignment({ node_type: "control", metadata: { catalog_id: "nist-800-53", publication_id: "nist-800-53" } }), []);
  assert.ok(validatePublicationIdAssignment({ node_type: "control", metadata: { catalog_id: "nist-800-53" } }).length > 0);
  assert.ok(validatePublicationIdAssignment({ node_type: "trunk", metadata: { publication_id: "nist-800-53" } }).length > 0);
});

test("validateSourceMaterialIdAssignment requires a non-empty pointer on every node", () => {
  assert.deepEqual(validateSourceMaterialIdAssignment({ source_material_id: "artifact-x" }), []);
  assert.ok(validateSourceMaterialIdAssignment({}).length > 0);
});

test("connectionEvidenceIdsForEdge derives the mechanical default when evidence_ids was omitted", () => {
  assert.deepEqual(connectionEvidenceIdsForEdge({ id: "edge:x", evidence_ids: ["evidence:custom"] }), ["evidence:custom"]);
  assert.deepEqual(connectionEvidenceIdsForEdge({ id: "edge:x" }), ["evidence:x"]);
});

test("connection evidence never becomes a canonical relationship target merely because it supports the edge", () => {
  const nodeIds = new Set(["catalog:R-1", "catalog:R-2"]);
  const edgeIds = new Set(["edge:catalog:R-1->R-2"]);
  assert.deepEqual(
    validateConnectionEvidenceIsolation({ id: "edge:catalog:R-1->R-2", evidence_ids: ["evidence:catalog:R-1->R-2"] }, nodeIds, edgeIds),
    [],
  );
  assert.ok(
    validateConnectionEvidenceIsolation({ id: "edge:catalog:R-1->R-2", evidence_ids: ["catalog:R-1"] }, nodeIds, edgeIds).length > 0,
  );
});

test("every canonical relationship cites source material unless it is a labeled organizing relationship (T2.10)", () => {
  assert.deepEqual(
    validateRelationshipEvidenceAttachment({ id: "edge:x", source_artifact_id: "artifact-x", publication_status: "published" }),
    [],
  );
  assert.deepEqual(
    validateRelationshipEvidenceAttachment({
      id: "edge:x",
      source_refs: [{ source_id: "artifact-x", ref_type: "primary" }],
      publication_status: "published",
    }),
    [],
  );
  assert.deepEqual(
    validateRelationshipEvidenceAttachment({ id: "atlas:organizes:1", publication_status: "editorial" }),
    [],
  );
  assert.ok(
    validateRelationshipEvidenceAttachment({ id: "edge:x", publication_status: "published" }).length > 0,
  );
});
