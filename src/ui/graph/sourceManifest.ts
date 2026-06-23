export type SourceHierarchyTier =
  | "authority"
  | "governance-risk-framework"
  | "control-catalog-requirement-set"
  | "baseline-overlay-program-profile"
  | "assessment-scoping-procedure"
  | "implementation-configuration-standard"
  | "control-mapping-crosswalk"
  | "threat-defensive-mapping"
  | "supporting-reference";

export type SourceMapDisposition =
  | "default-map"
  | "add-to-default-map"
  | "supporting-reference-only"
  | "registry-only"
  | "draft-gated";

export type SourceManifestRecord = {
  sourceId: string;
  displayName: string;
  artifactName: string;
  publisher: string;
  hierarchyTier: SourceHierarchyTier;
  subcategory: string;
  disposition: SourceMapDisposition;
  canonicalUrl: string;
  dataUrl?: string;
  repoUrl?: string;
  isAuthoritative: boolean;
  isActive: boolean;
  isDefaultMapEligible: boolean;
  sourceBasis: "official" | "source-backed" | "inferred" | "deprecated";
  defaultMapReason: string;
};
