export const RELATIONSHIP_CLASSES = Object.freeze({
  structural: "structural",
  applicability: "applicability",
  correlation: "correlation",
  // Control Atlas's own organizing spine (trunk, limbs, catalog->limb attachment,
  // and the derived CCI/assessment-procedure parentages). Never publisher-declared;
  // always badged "Control Atlas structure" in the UI. Kept fully separate from
  // `structural` so the same-catalog structural rule stays untouched.
  organizing: "organizing",
});

export const STRUCTURAL_RELATIONSHIP_TYPES = new Set([
  "contains",
  "parent_of",
  "decomposes_into",
]);

export const ORGANIZING_RELATIONSHIP_TYPES = new Set(["organizes"]);

// These node kinds may be connected to native records, but they are lenses,
// selections, aids, or process context. They can never own structural
// descendants in the publisher-declared tree.
export const NON_STRUCTURAL_PARENT_NODE_TYPES = new Set([
  "assessment_procedure",
  "baseline",
  "mapping",
  "evidence",
  "implementation_aid",
  "process",
  "resource",
  "rmf_step",
]);

export function catalogIdOf(node) {
  return String(node?.metadata?.catalog_id || "").trim();
}

export function canOwnStructuralChildren(node) {
  return Boolean(
    node?.node_type &&
      !NON_STRUCTURAL_PARENT_NODE_TYPES.has(String(node.node_type)),
  );
}

export function sharesNativeStructuralDomain(parent, child) {
  const parentCatalog = catalogIdOf(parent);
  const childCatalog = catalogIdOf(child);
  return Boolean(parentCatalog && childCatalog && parentCatalog === childCatalog);
}

export function isValidatedStructuralEdge(edge, parent, child) {
  return Boolean(
    edge?.relationship_class === RELATIONSHIP_CLASSES.structural &&
      STRUCTURAL_RELATIONSHIP_TYPES.has(edge?.relationship_type) &&
      canOwnStructuralChildren(parent) &&
      sharesNativeStructuralDomain(parent, child),
  );
}

export function isValidatedStructuralPointer(child, parent) {
  return Boolean(
    child?.parent_relationship_class === RELATIONSHIP_CLASSES.structural &&
      canOwnStructuralChildren(parent) &&
      sharesNativeStructuralDomain(parent, child),
  );
}

export function defaultRelationshipClass(relationshipType) {
  if (STRUCTURAL_RELATIONSHIP_TYPES.has(relationshipType)) {
    return RELATIONSHIP_CLASSES.structural;
  }
  if (
    relationshipType === "selected_by_baseline" ||
    relationshipType === "included_in_profile" ||
    relationshipType === "modified_by_overlay" ||
    relationshipType === "applicable_to" ||
    relationshipType === "selects"
  ) {
    return RELATIONSHIP_CLASSES.applicability;
  }
  if (ORGANIZING_RELATIONSHIP_TYPES.has(relationshipType)) {
    return RELATIONSHIP_CLASSES.organizing;
  }
  return RELATIONSHIP_CLASSES.correlation;
}
