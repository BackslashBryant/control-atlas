import type {
  SourceManifestRecord,
  SourceMapDisposition,
} from "./sourceManifest.ts";

export const DEFAULT_MAP_DISPOSITIONS = new Set<SourceMapDisposition>([
  "default-map",
  "add-to-default-map",
]);

export function sourceDispositionReason(
  source: Pick<SourceManifestRecord, "disposition" | "hierarchyTier">,
): string {
  switch (source.disposition) {
    case "default-map":
      return "Core source for the default compliance ecosystem map.";
    case "add-to-default-map":
      return "Authoritative context included in the default compliance ecosystem map.";
    case "supporting-reference-only":
      return "Useful context that does not drive authoritative mappings.";
    case "draft-gated":
      return "Draft or legacy mapping available only when explicitly requested.";
    case "registry-only":
      return "Retained for provenance and discovery, not default map navigation.";
  }
}
