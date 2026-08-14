export type SourceIdentityPresentation = {
  primaryName: string;
  familyName: string;
  stableId: string;
};

function recordedIdentityValue(value: unknown, stableId: string): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed && trimmed !== stableId ? trimmed : "";
}

function normalizedIdentity(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

export function sourceIdentityPresentationFor(source: any): SourceIdentityPresentation {
  const stableId = typeof source?.id === "string" ? source.id.trim() : "";
  const specificName = recordedIdentityValue(source?.name, stableId);
  const displayName = recordedIdentityValue(source?.display_name, stableId);
  const primaryName = specificName || displayName || "Source detail";
  return {
    primaryName,
    familyName:
      displayName && normalizedIdentity(displayName) !== normalizedIdentity(primaryName)
        ? displayName
        : "",
    stableId,
  };
}
