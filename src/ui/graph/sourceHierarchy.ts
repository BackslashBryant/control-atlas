import type { SourceHierarchyTier } from "./sourceManifest.ts";

export const SOURCE_HIERARCHY_ORDER: SourceHierarchyTier[] = [
  "authority",
  "governance-risk-framework",
  "control-catalog-requirement-set",
  "baseline-overlay-program-profile",
  "implementation-configuration-standard",
  "assessment-scoping-procedure",
  "control-mapping-crosswalk",
  "threat-defensive-mapping",
  "supporting-reference",
];

export const SOURCE_HIERARCHY_LABELS: Record<SourceHierarchyTier, string> = {
  authority: "Rules",
  "governance-risk-framework": "Frameworks",
  "control-catalog-requirement-set": "Controls",
  "baseline-overlay-program-profile": "Baselines",
  "implementation-configuration-standard": "Implementation",
  "assessment-scoping-procedure": "Assessment",
  "control-mapping-crosswalk": "Mappings",
  "threat-defensive-mapping": "Threat / Defense",
  "supporting-reference": "Supporting Sources",
};
