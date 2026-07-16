import {
  SOURCE_HIERARCHY_LABELS,
  SOURCE_HIERARCHY_ORDER,
} from "./sourceHierarchy.ts";

export const SOURCE_HIERARCHY_EDGES = [
  ["authority", "governance-risk-framework"],
  ["governance-risk-framework", "control-catalog-requirement-set"],
  ["control-catalog-requirement-set", "baseline-overlay-program-profile"],
  ["baseline-overlay-program-profile", "implementation-configuration-standard"],
  ["implementation-configuration-standard", "assessment-scoping-procedure"],
  ["assessment-scoping-procedure", "control-mapping-crosswalk"],
  ["control-mapping-crosswalk", "threat-defensive-mapping"],
  ["threat-defensive-mapping", "supporting-reference"],
] as const;

export const SOURCE_HIERARCHY_NODES = SOURCE_HIERARCHY_ORDER.map(
  (hierarchyTier) => ({
    hierarchyTier,
    displayName: SOURCE_HIERARCHY_LABELS[hierarchyTier],
  }),
);
