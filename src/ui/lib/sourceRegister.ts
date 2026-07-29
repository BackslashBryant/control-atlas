export type SourceRegisterRow = {
  id: string;
  publication: string;
  publisher: string;
  coverage: string;
  version: string;
  currentThrough: string;
  status: string;
};

export type SourceRegisterFilters = {
  query?: string;
  provenance?: string;
  eligibility?: string;
  lifecycle?: string;
  access?: string;
};

export function buildSourceRegister(
  sources: any[],
  filters: SourceRegisterFilters = {},
): SourceRegisterRow[] {
  const query = (filters.query || "").trim().toLocaleLowerCase();
  return sources
    .filter((source) => {
      if (filters.provenance && source.provenance_class !== filters.provenance) return false;
      if (filters.eligibility && source.eligibility_status !== filters.eligibility) return false;
      if (filters.lifecycle && source.lifecycle_status !== filters.lifecycle) return false;
      if (filters.access && source.access_status !== filters.access) return false;
      if (!query) return true;
      return [
        source.id,
        source.name,
        source.display_name,
        source.owner,
        ...(source.metadata?.frameworks || []),
      ].some((value) => String(value || "").toLocaleLowerCase().includes(query));
    })
    .map((source) => ({
      id: source.id,
      publication: source.display_name || source.name || source.id,
      publisher: source.owner || "Publisher not recorded",
      coverage:
        source.metadata?.frameworks?.join(", ") ||
        source.artifact_type ||
        "Coverage not recorded",
      version: source.version || "Not recorded",
      currentThrough:
        source.last_checked || source.retrieved_at || "Not recorded",
      status: source.lifecycle_status || "Not recorded",
    }))
    .sort((left, right) =>
      left.publisher.localeCompare(right.publisher) ||
      left.publication.localeCompare(right.publication),
    );
}
