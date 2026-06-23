import type { AtlasGraphRole } from "./controlAtlasGraphRoles.ts";
import type { SourceManifestRecord } from "./sourceManifest.ts";

export function sourceToGraphRole(source: SourceManifestRecord): AtlasGraphRole {
  switch (source.hierarchyTier) {
    case "authority":
      return "authority";
    case "governance-risk-framework":
      return "governance-framework";
    case "control-catalog-requirement-set":
      if (source.sourceId === "nist-sp-800-53-r5") return "control-catalog";
      return "requirement-set";
    case "baseline-overlay-program-profile":
      return "baseline-overlay-profile";
    case "assessment-scoping-procedure":
      return "assessment-scoping";
    case "implementation-configuration-standard":
      return "implementation-standard";
    case "control-mapping-crosswalk":
      return "mapping-crosswalk";
    case "threat-defensive-mapping":
      return "threat-defense";
    case "supporting-reference":
      return "supporting-reference";
    default:
      return "other";
  }
}
