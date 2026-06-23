import type { SourceHierarchyTier } from "./sourceManifest.ts";

export const SOURCE_HIERARCHY_ORDER: SourceHierarchyTier[] = [
  "authority",
  "governance-risk-framework",
  "control-catalog-requirement-set",
  "baseline-overlay-program-profile",
  "assessment-scoping-procedure",
  "implementation-configuration-standard",
  "control-mapping-crosswalk",
  "threat-defensive-mapping",
  "supporting-reference",
];

export const SOURCE_HIERARCHY_LABELS: Record<SourceHierarchyTier, string> = {
  authority: "Authority",
  "governance-risk-framework": "Governance / Risk Framework",
  "control-catalog-requirement-set": "Control Catalog / Requirement Set",
  "baseline-overlay-program-profile": "Baseline / Overlay / Program Profile",
  "assessment-scoping-procedure": "Assessment / Scoping Procedure",
  "implementation-configuration-standard":
    "Implementation / Configuration Standard",
  "control-mapping-crosswalk": "Control Mapping / Crosswalk",
  "threat-defensive-mapping": "Threat / Defensive Mapping",
  "supporting-reference": "Supporting Reference",
};
