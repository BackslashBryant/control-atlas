export const RELATIONSHIP_CLASSES = Object.freeze({
  structural: "structural",
  applicability: "applicability",
  correlation: "correlation",
});

export const STRUCTURAL_RELATIONSHIP_TYPES = new Set([
  "contains",
  "parent_of",
  "decomposes_into",
]);

export function catalogIdOf(node) {
  return String(node?.metadata?.catalog_id || "").trim();
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
      sharesNativeStructuralDomain(parent, child),
  );
}

export function isValidatedStructuralPointer(child, parent) {
  return Boolean(
    child?.parent_relationship_class === RELATIONSHIP_CLASSES.structural &&
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
  return RELATIONSHIP_CLASSES.correlation;
}
