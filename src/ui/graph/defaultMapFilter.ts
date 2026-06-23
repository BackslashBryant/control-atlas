import { DEFAULT_MAP_DISPOSITIONS } from "./sourceDisposition.ts";
import type { SourceManifestRecord } from "./sourceManifest.ts";

export const DEFAULT_MAP_WARNINGS = {
  draftOrLegacy:
    "Draft and legacy sources may not represent current authoritative guidance.",
  supportingReferences:
    "Supporting references add context but do not drive authoritative mappings.",
  registryOnly:
    "Registry-only entries are retained for provenance and discovery, not default map navigation.",
} as const;

export function isDefaultMapVisible(source: SourceManifestRecord): boolean {
  return DEFAULT_MAP_DISPOSITIONS.has(source.disposition);
}

export function isVisibleWithOptionalFilters(
  source: SourceManifestRecord,
  filters: {
    showSupportingReferences: boolean;
    showDraftOrLegacy: boolean;
    showRegistryOnly: boolean;
  },
): boolean {
  if (isDefaultMapVisible(source)) return true;

  if (
    filters.showSupportingReferences &&
    source.disposition === "supporting-reference-only"
  ) {
    return true;
  }

  if (filters.showDraftOrLegacy && source.disposition === "draft-gated") {
    return true;
  }

  if (filters.showRegistryOnly && source.disposition === "registry-only") {
    return true;
  }

  return false;
}
