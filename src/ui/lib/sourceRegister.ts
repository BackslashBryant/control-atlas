import { humanizeSlug } from "../../app/display-names.mjs";

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

/**
 * W5 — split the flat register into the three layers the default table used
 * to mix: publication identity, connection/mapping sources, and ingestion
 * artifacts, plus Control Atlas's own organizing source kept out of the
 * publisher list entirely. A source is a canonical publication when a real
 * ingested catalog names it as that catalog's own `source_id` — the build
 * pipeline's own authoritative pointer, not a guess. Everything else is a
 * connection source (crosswalk/mapping/OLIR/reference id or name) or falls
 * through to ingestion provenance (alternate mirrors, viewers, downloads,
 * API endpoints for a publication already registered above).
 */
export type SourceLayerId = "publication" | "connection" | "ingestion" | "organization";

export type CatalogSummary = {
  id: string;
  name: string;
  source_id: string;
  leaf_record_count: number;
};

export function canonicalSourceIdsFromCatalogs(
  catalogs: CatalogSummary[],
): Set<string> {
  return new Set(catalogs.map((catalog) => catalog.source_id));
}

export function classifySourceLayer(
  source: any,
  canonicalSourceIds: Set<string>,
): SourceLayerId {
  if (source.provenance_class === "control_atlas_derived" || source.source_role === "editorial") {
    return "organization";
  }
  if (source.source_role === "mapping" || source.source_role === "enrichment") {
    return "connection";
  }
  if (source.source_role === "primary_data" || source.source_role === "reconciliation" || source.source_role === "assessment" || source.source_role === "automation" || source.metadata?.identity_kind === "ingestion") {
    return "ingestion";
  }
  if (source.source_role === "publication" || canonicalSourceIds.has(source.id) || source.metadata?.identity_kind === "publication") {
    return "publication";
  }
  return "ingestion";
}

/** Resolve raw framework/catalog ids (e.g. "disa-cci") to their published
 * display name (e.g. "DISA CCI") — the default view must never show a raw
 * schema/coverage identifier. */
export function resolveCoverageLabel(
  frameworkIds: string[],
  catalogsById: Map<string, CatalogSummary>,
): string {
  if (!frameworkIds.length) return "Coverage not recorded";
  return frameworkIds
    .map((id) => catalogsById.get(id)?.name || humanizeSlug(id))
    .join(", ");
}

export type LayeredSourceRow = SourceRegisterRow & {
  recordsRepresented: number | null;
  officialLink: string;
  artifactType: string;
  rawCoverageKeys: string;
};

export function buildSourceLayers(
  sources: any[],
  catalogs: CatalogSummary[],
  filters: SourceRegisterFilters = {},
): Record<SourceLayerId, LayeredSourceRow[]> {
  const rows = buildSourceRegister(sources, filters);
  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  const catalogsById = new Map(catalogs.map((catalog) => [catalog.id, catalog]));
  const canonicalSourceIds = canonicalSourceIdsFromCatalogs(catalogs);

  const layers: Record<SourceLayerId, LayeredSourceRow[]> = {
    organization: [],
    publication: [],
    connection: [],
    ingestion: [],
  };
  for (const row of rows) {
    const source = sourcesById.get(row.id);
    if (!source) continue;
    const layer = classifySourceLayer(source, canonicalSourceIds);
    const catalog = catalogs.find((entry) => entry.source_id === source.id) || null;
    layers[layer].push({
      ...row,
      publication: source.name || source.display_name || source.id,
      coverage: resolveCoverageLabel(source.metadata?.frameworks || [], catalogsById),
      recordsRepresented: catalog ? catalog.leaf_record_count : null,
      officialLink: source.artifact_url || source.catalog_browse_url || "",
      artifactType: source.format || source.artifact_type || "Not recorded",
      rawCoverageKeys: (source.metadata?.frameworks || []).join(", ") || "Not recorded",
    });
  }
  return layers;
}
