export type CatalogCoverage = {
  id: string;
  name: string;
  total: number;
  connected: number;
  pct: number;
  mandate?:
    | "statutory"
    | "contractual"
    | "federal_policy_or_regulatory_mandate"
    | "issued_without_federal_mandate";
  mandateNote?: string;
};

type CatalogEntry = {
  id: string;
  name: string;
  node_count: number;
  connected_count?: number;
  cross_catalog_connected_count: number;
  mandate?: CatalogCoverage["mandate"];
  mandate_note?: string;
};

export function buildCatalogCoverageList(
  catalogs: CatalogEntry[],
  minNodes = 1,
): CatalogCoverage[] {
  return catalogs
    .filter(
      (catalog) =>
        catalog.node_count >= minNodes &&
        typeof catalog.cross_catalog_connected_count === "number",
    )
    .map((catalog) => ({
      id: catalog.id,
      name: catalog.name,
      total: catalog.node_count,
      connected: catalog.cross_catalog_connected_count,
      pct: catalog.node_count
        ? Math.round(
            (catalog.cross_catalog_connected_count / catalog.node_count) *
              100,
          )
        : 0,
      mandate: catalog.mandate,
      mandateNote: catalog.mandate_note,
    }))
    .sort((left, right) => right.total - left.total);
}

export function catalogCoverageForId(
  coverageList: CatalogCoverage[],
  catalogId: string,
): CatalogCoverage | undefined {
  return coverageList.find((entry) => entry.id === catalogId);
}

export function isLowCatalogCoverage(coverage: CatalogCoverage | undefined) {
  return coverage !== undefined && coverage.pct <= 75;
}

export function catalogCoverageMessage(coverage: CatalogCoverage) {
  if (coverage.mandate === "issued_without_federal_mandate") {
    return coverage.mandateNote
      ? `Issued without a federal mandate — no crosswalk is published. ${coverage.mandateNote}`
      : "Issued without a federal mandate — no crosswalk is published.";
  }
  if (
    coverage.mandate === "statutory" ||
    coverage.mandate === "contractual" ||
    coverage.mandate === "federal_policy_or_regulatory_mandate"
  ) {
    return "No published mappings yet.";
  }
  return "Low map coverage — a missing link is not proof that no relationship exists.";
}
