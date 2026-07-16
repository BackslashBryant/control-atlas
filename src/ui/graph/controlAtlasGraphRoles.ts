export type AtlasGraphRole =
  | "authority"
  | "governance-framework"
  | "control-catalog"
  | "requirement-set"
  | "nist-control"
  | "baseline-overlay-profile"
  | "assessment-scoping"
  | "implementation-standard"
  | "mapping-crosswalk"
  | "threat-defense"
  | "supporting-reference"
  | "other";

export const ATLAS_GRAPH_ROLE_RANK: Record<AtlasGraphRole, number> = {
  authority: 0,
  "governance-framework": 1,
  "control-catalog": 2,
  "requirement-set": 2,
  "nist-control": 0,
  "baseline-overlay-profile": 3,
  "implementation-standard": 4,
  "assessment-scoping": 5,
  "mapping-crosswalk": 6,
  "threat-defense": 7,
  "supporting-reference": 8,
  other: 9,
};
