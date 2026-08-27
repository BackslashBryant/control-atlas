import { displayNameFor } from "../../app/display-names.mjs";

export type SourceFreshnessPresentation = {
  label: "Source last checked" | "Source retrieved" | "Source freshness";
  value: string;
  dateTime: string;
  state: "checked" | "retrieved" | "missing";
};

const PUBLISHER_DISPLAY_NAMES: Record<string, string> = {
  dod: "Department of Defense",
};

export function sourcePublisherDisplayName(value: unknown): string {
  const recorded = String(value || "").trim();
  if (!recorded) return "";
  return PUBLISHER_DISPLAY_NAMES[recorded.toLocaleLowerCase()] || recorded;
}

export function sourcePublicationTitle(source: any, fallback = ""): string {
  return String(source?.name || source?.display_name || fallback || "").trim();
}

export function formatSourceDate(value: unknown): string {
  const recorded = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(recorded)) return recorded;
  const [year, month, day] = recorded.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function sourceLifecycleDisplayName(value: unknown): string {
  const recorded = String(value || "").trim();
  return recorded ? displayNameFor("lifecycle_status", recorded) : "Not recorded";
}

export function sourceFieldAbsenceDisplayName(
  state: string,
  notApplicable = "Not applicable",
): string {
  return state === "not_applicable" ? notApplicable : "Not recorded";
}

export function sourceFreshnessPresentation(source: any): SourceFreshnessPresentation {
  const lastChecked = String(source?.last_checked || "").trim();
  if (lastChecked) {
    return {
      label: "Source last checked",
      value: formatSourceDate(lastChecked),
      dateTime: lastChecked,
      state: "checked",
    };
  }

  const retrievedAt = String(source?.retrieved_at || "").trim();
  if (retrievedAt) {
    return {
      label: "Source retrieved",
      value: formatSourceDate(retrievedAt),
      dateTime: retrievedAt,
      state: "retrieved",
    };
  }

  return {
    label: "Source freshness",
    value: "Not recorded",
    dateTime: "",
    state: "missing",
  };
}
