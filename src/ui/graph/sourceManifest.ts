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

export type SourceNoviceQuestion =
  | "why-apply"
  | "must-do"
  | "requirements-apply"
  | "implement"
  | "test"
  | "map-elsewhere";

export type RmfLifecycleStep =
  | "prepare"
  | "categorize"
  | "select"
  | "implement"
  | "assess"
  | "authorize"
  | "monitor";

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
  noviceQuestions: SourceNoviceQuestion[];
  rmfLifecycle: RmfLifecycleStep[];
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
  /**
   * One or two plain sentences answering "why does this apply to me?", written
   * from the document's own text. Empty when no one has written it yet — the UI
   * then shows nothing, rather than falling back to generated boilerplate.
   */
  plainSummary: string;
};
