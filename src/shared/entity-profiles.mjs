import registry from "../../data/profiles/profile-registry.json" with { type: "json" };

const profilesById = new Map(registry.profiles.map((profile) => [profile.profile_id, profile]));

export const ENTITY_PROFILE_REGISTRY = registry;

export function normalizeProfileToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function profileById(profileId) {
  return profilesById.get(profileId) || null;
}

export function effectiveProfile(profileId, trail = new Set()) {
  const profile = profileById(profileId);
  if (!profile) return null;
  if (trail.has(profileId)) throw new Error(`Profile inheritance cycle at ${profileId}`);
  if (!profile.parent_profile_id) return profile;
  const parent = effectiveProfile(profile.parent_profile_id, new Set([...trail, profileId]));
  if (!parent) throw new Error(`Profile ${profileId} references missing parent ${profile.parent_profile_id}`);
  return {
    ...parent,
    ...profile,
    required_fields: profile.required_fields || parent.required_fields || [],
    optional_fields: profile.optional_fields || parent.optional_fields || [],
    prohibited_fields: profile.prohibited_fields || parent.prohibited_fields || [],
    conditional_fields: profile.conditional_fields || parent.conditional_fields || [],
    allowed_origins: profile.allowed_origins || parent.allowed_origins || [],
    field_origins: { ...(parent.field_origins || {}), ...(profile.field_origins || {}) },
    evidence_required_fields: profile.evidence_required_fields || parent.evidence_required_fields || [],
    evidence_rules: { ...(parent.evidence_rules || {}), ...(profile.evidence_rules || {}) },
    lifecycle_rules: profile.lifecycle_rules || parent.lifecycle_rules,
    source_expectations: profile.source_expectations || parent.source_expectations,
    search_presentation: profile.search_presentation || parent.search_presentation,
    display_sections: profile.display_sections || parent.display_sections || [],
    display_rules: profile.display_rules || parent.display_rules,
    allowed_incoming_predicates: profile.allowed_incoming_predicates || parent.allowed_incoming_predicates || [],
    allowed_outgoing_predicates: profile.allowed_outgoing_predicates || parent.allowed_outgoing_predicates || [],
    allowed_assertion_classes: profile.allowed_assertion_classes || parent.allowed_assertion_classes || [],
    validation: profile.validation || parent.validation,
  };
}

export function recordProfileId(nodeType) {
  return `record.${normalizeProfileToken(nodeType)}`;
}

export function resourceProfileId(resourceType) {
  return `resource.${normalizeProfileToken(resourceType)}`;
}

export function artifactProfileId(format) {
  return `artifact.${normalizeProfileToken(format)}`;
}

export function publicationProfileId(identityKind) {
  return `publication.${normalizeProfileToken(identityKind || "publication")}`;
}

export function assertionProfileId(relationshipType) {
  return `assertion.${normalizeProfileToken(relationshipType)}`;
}

export function assertionClassForEdge(edge) {
  if (edge?.publication_status === "editorial") return "atlas_navigation";
  if (edge?.publication_status === "candidate" || edge?.provenance_class === "inferred") return "atlas_inferred";
  if (edge?.relationship_class === "structural") return "structural";
  if (edge?.provenance_class === "control_atlas_derived") return "atlas_navigation";
  if (edge?.publication_status === "published") return "published_mapping";
  return "publisher_derived";
}

export function originForNode(node) {
  if (node?.metadata?.object_layer === "atlas_structure") return "atlas_editorial";
  return node?.metadata?.origin || "publisher_normalized";
}

export function assertionEnvelopeForEdge(edge) {
  const assertionClass = assertionClassForEdge(edge);
  const evidenceRefs = Array.isArray(edge?.source_refs)
    ? edge.source_refs.map((reference) => `${reference.source_id}#${reference.locator}`).filter(Boolean)
    : [];
  return {
    id: edge.id,
    profile_id: assertionProfileId(edge.relationship_type),
    subject_id: edge.source_node_id,
    predicate: normalizeProfileToken(edge.relationship_type),
    object_id: edge.target_node_id,
    directionality: "directed",
    assertion_class: assertionClass,
    authority: edge.authority_class || edge.provenance_class || "unknown",
    lifecycle: edge.status || "active",
    evidence_refs: evidenceRefs,
    ...(assertionClass === "atlas_inferred"
      ? {
          transformation: edge.inference_rule_id || edge.rationale || "Atlas inference rule",
          confidence: String(edge.confidence || "").includes("high") ? 0.8 : 0.5,
        }
      : {}),
  };
}
