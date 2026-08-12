const SHA256 = /^sha256:[a-f0-9]{64}$/i;

export const DATA_TRUST_CONTRACT_VERSION = "1.0";

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
