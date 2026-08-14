export type SourceLocatorKind =
  | "URL locator"
  | "Artifact path"
  | "Publisher registry path"
  | "Document locator"
  | "Source locator";

export function sourceLocatorKind(value: string): SourceLocatorKind {
  const locator = String(value || "").trim();
  if (/^https?:\/\//i.test(locator)) return "URL locator";
  if (/^(?:registry\/|[A-Z0-9_-]+\.zip\/)/i.test(locator)) {
    return locator.toLowerCase().startsWith("registry/")
      ? "Publisher registry path"
      : "Artifact path";
  }
  if (/\.(?:json|xml|xlsx?|csv|pdf)(?:#|$)|#(?:page=|[A-Z0-9_-]+$)/i.test(locator)) {
    return "Document locator";
  }
  return "Source locator";
}
