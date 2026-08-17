const SHA256 = /^sha256:[a-f0-9]{64}$/i;

export const DATA_TRUST_CONTRACT_VERSION = "1.0";

// --- Canonical layer contract (Phase 1: Canonical Domain Model) -----------
// Every node belongs to exactly one objectLayer. Atlas structure (the
// Control Atlas-owned trunk/limb organizing overlay) and authority documents
// (statutes, regulations, policy directives) are never publisher content,
// and publisher content is never re-labeled as either. These sets are the
// single source of truth for that classification — build-framework-data.mjs
// stamps every node from them via attachNodeProvenance, and the validators
// below re-derive the same answer to catch drift rather than trusting a
// stored value that could go stale.
export const OBJECT_LAYERS = new Set([
  "atlas_structure",
  "authority_document",
  "publisher_content",
]);
export const ATLAS_STRUCTURE_ROLES = new Set(["root", "area"]);
export const ATLAS_STRUCTURE_NODE_TYPES = new Set(["trunk", "limb"]);
export const AUTHORITY_DOCUMENT_NODE_TYPES = new Set([
  "statute",
  "regulation",
  "policy_directive",
]);

export function resolveObjectLayer(node) {
  if (ATLAS_STRUCTURE_NODE_TYPES.has(node?.node_type)) return "atlas_structure";
  if (AUTHORITY_DOCUMENT_NODE_TYPES.has(node?.node_type)) return "authority_document";
  return "publisher_content";
}

export function resolveAtlasStructureRole(node) {
  if (node?.node_type === "trunk") return "root";
  if (node?.node_type === "limb") return "area";
  return "";
}

/**
 * The publisher's own record kind, source-faithful and never collapsed to a
 * generic Control Atlas bucket. DISA's CCI list overloads its native `type`
 * field for the policy/technical classification (see cciClassificationLabel),
 * not the record kind, so that one catalog must assert its kind explicitly
 * rather than trusting the ingested `type` value. Atlas structure has no
 * publisher-native kind at all — it is Control Atlas's own organizing
 * overlay, never a publisher record type — so nativeType is empty there.
 */
export function resolveNativeType(node) {
  if (resolveObjectLayer(node) === "atlas_structure") return "";
  if (node?.metadata?.catalog_id === "disa-cci") return "cci";
  return String(node?.metadata?.type || node?.node_type || "");
}

/**
 * An optional Control Atlas discovery facet. It may only be populated from
 * an explicit upstream assertion (record.metadata.atlas_class) and must
 * never be inferred from, or used to overwrite, nativeType.
 */
export function resolveAtlasClass(node) {
  return String(node?.metadata?.atlas_class || "");
}

/**
 * The canonical publication identity a record belongs to. Only publisher
 * content belongs to a publication; Atlas structure and authority documents
 * must not be assigned a fabricated one merely to satisfy a UI grouping.
 */
export function resolvePublicationId(node) {
  if (resolveObjectLayer(node) !== "publisher_content") return "";
  return String(node?.metadata?.catalog_id || "");
}

/** The primary retrieved artifact that supports this record's existence. */
export function resolveSourceMaterialId(node) {
  return String(node?.source_material_id || node?.artifact_ids?.[0] || "");
}

/**
 * The connection-evidence citations that support a relationship. Mirrors the
 * mechanical-default omission build-framework-data.mjs applies to
 * edge.evidence_ids (see tests/federal-graph-contract.test.mjs) so callers
 * see the same evidence set whether or not the array was materialized.
 */
export function connectionEvidenceIdsForEdge(edge) {
  if (Array.isArray(edge?.evidence_ids)) return edge.evidence_ids;
  const id = String(edge?.id || "");
  return id.startsWith("edge:") ? [`evidence:${id.slice("edge:".length)}`] : [];
}

export function validateCanonicalLayerAssignment(node) {
  const failures = [];
  const layer = node?.metadata?.object_layer;
  const expectedLayer = resolveObjectLayer(node);
  if (!OBJECT_LAYERS.has(layer)) {
    failures.push(`object_layer must be one of ${[...OBJECT_LAYERS].join(", ")}, got ${layer || "(missing)"}`);
  } else if (layer !== expectedLayer) {
    failures.push(`object_layer ${layer} drifted from the derived layer ${expectedLayer}`);
  }
  const role = node?.metadata?.atlas_structure_role;
  const expectedRole = resolveAtlasStructureRole(node);
  if (expectedLayer === "atlas_structure") {
    if (!ATLAS_STRUCTURE_ROLES.has(role) || role !== expectedRole) {
      failures.push(`atlas_structure node requires atlas_structure_role ${expectedRole}, got ${role || "(missing)"}`);
    }
  } else if (role) {
    failures.push(`atlas_structure_role must be empty outside the atlas_structure layer, got ${role}`);
  }
  return failures;
}

export function validateNativeTypeAssignment(node) {
  const failures = [];
  const nativeType = node?.metadata?.native_type;
  const expected = resolveNativeType(node);
  if (nativeType !== expected) {
    failures.push(`native_type ${nativeType ?? "(missing)"} does not match the resolved source-faithful type ${expected || "(none)"}`);
  }
  if (resolveObjectLayer(node) !== "atlas_structure" && !String(nativeType || "").trim()) {
    failures.push("publisher content and authority documents require a non-empty native_type");
  }
  return failures;
}

export function validatePublicationIdAssignment(node) {
  const failures = [];
  const publicationId = node?.metadata?.publication_id;
  const expected = resolvePublicationId(node);
  if (publicationId !== expected) {
    failures.push(`publication_id ${publicationId ?? "(missing)"} does not match the resolved publication_id ${expected || "(none)"}`);
  }
  if (resolveObjectLayer(node) === "publisher_content" && !String(publicationId || "").trim()) {
    failures.push("publisher content requires a non-empty publication_id");
  }
  return failures;
}

export function validateSourceMaterialIdAssignment(node) {
  const failures = [];
  if (!String(node?.source_material_id || "").trim()) {
    failures.push("node requires a non-empty source_material_id");
  }
  return failures;
}

export function validateConnectionEvidenceIsolation(edge, nodeIds, edgeIds) {
  const failures = [];
  for (const evidenceId of connectionEvidenceIdsForEdge(edge)) {
    if (nodeIds.has(evidenceId)) {
      failures.push(`connection evidence id ${evidenceId} collides with a canonical node id`);
    }
    if (edgeIds.has(evidenceId)) {
      failures.push(`connection evidence id ${evidenceId} collides with a canonical edge id`);
    }
  }
  return failures;
}

// --- Relationship evidence attachment (Phase 2 T2.10) ---------------------
// Every canonical relationship must cite the source material it came from
// (source_artifact_id or source_refs), unless it is an explicitly labeled
// Control Atlas organizing relationship (publication_status "editorial" —
// the trunk/limb/catalog-attachment spine, which carries no publisher
// citation because Control Atlas, not a publisher, asserts it).
export function validateRelationshipEvidenceAttachment(edge) {
  const failures = [];
  if (edge?.publication_status === "editorial") return failures;
  const hasArtifact = Boolean(edge?.source_artifact_id);
  const hasSourceRefs = Array.isArray(edge?.source_refs) && edge.source_refs.length > 0;
  if (!hasArtifact && !hasSourceRefs) {
    failures.push(
      "relationship has no source_artifact_id or source_refs and is not labeled publication_status \"editorial\"",
    );
  }
  return failures;
}

export function sourceRecordEnvelopeForNode(node) {
  return {
    record_id: node?.id || "",
    publication_id: node?.metadata?.catalog_id || "",
    publication_source_id: node?.publication_source_id || "",
    source_artifact_id: node?.artifact_ids?.[0] || "",
    source_locator: node?.metadata?.source_locator || "",
  };
}

export function validateSourceRecordEnvelope(envelope) {
  const failures = [];
  for (const field of [
    "record_id",
    "publication_id",
    "publication_source_id",
    "source_artifact_id",
    "source_locator",
  ]) {
    if (!String(envelope?.[field] || "").trim()) failures.push(`${field} is required`);
  }
  if (envelope?.source_artifact_id && !String(envelope.source_artifact_id).startsWith("artifact-")) {
    failures.push("source_artifact_id must be a registered artifact id");
  }
  return failures;
}

export function publisherStructureMembershipForEdge(edge, nodesById) {
  const parent = nodesById.get(edge?.source_node_id);
  const child = nodesById.get(edge?.target_node_id);
  return {
    membership_id: edge?.id || "",
    publication_id: child?.metadata?.catalog_id || parent?.metadata?.catalog_id || "",
    parent_id: edge?.source_node_id || "",
    child_id: edge?.target_node_id || "",
    order: edge?.publisher_order,
    source_artifact_id: edge?.source_artifact_id || "",
    source_locator: edge?.source_locator || "",
    source_refs: edge?.source_refs || [],
  };
}

export function validatePublisherStructureMembership(membership) {
  const failures = [];
  for (const field of [
    "membership_id",
    "publication_id",
    "parent_id",
    "child_id",
    "source_artifact_id",
    "source_locator",
  ]) {
    if (!String(membership?.[field] || "").trim()) failures.push(`${field} is required`);
  }
  if (!Number.isInteger(membership?.order) || membership.order < 0) {
    failures.push("order must be a non-negative integer");
  }
  if (!Array.isArray(membership?.source_refs) || !membership.source_refs.length) {
    failures.push("source_refs must contain publisher evidence");
  }
  return failures;
}

export function validateSourceFragment(fragment) {
  const failures = [];
  if (!String(fragment?.text || "").trim()) failures.push("text is required");
  if (!SHA256.test(String(fragment?.checksum || ""))) failures.push("checksum must be a full sha256");
  if (!String(fragment?.extraction_method || "").trim()) failures.push("extraction_method is required");

  const hasPdfLocation = Number.isInteger(fragment?.page) && fragment.page > 0 &&
    ((Array.isArray(fragment?.bbox) && fragment.bbox.length === 4) ||
      (String(fragment?.table || "").trim() && Number.isInteger(fragment?.row)));
  const hasWorkbookLocation = String(fragment?.sheet || "").trim() && String(fragment?.cell || "").trim();
  const hasDocumentLocation = String(fragment?.locator || "").trim();
  if (!hasPdfLocation && !hasWorkbookLocation && !hasDocumentLocation) {
    failures.push("an exact PDF, workbook, or document locator is required");
  }
  return failures;
}
