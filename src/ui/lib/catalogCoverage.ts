export type CatalogCoverage = {
  id: string;
  name: string;
  total: number;
  connected: number;
  pct: number;
};

type CatalogEntry = {
  id: string;
  name: string;
  node_count: number;
  connected_count?: number;
};

export function buildCatalogCoverageList(
  catalogs: CatalogEntry[],
  minNodes = 1,
): CatalogCoverage[] {
  return catalogs
    .filter((catalog) => catalog.node_count >= minNodes)
    .map((catalog) => ({
      id: catalog.id,
      name: catalog.name,
      total: catalog.node_count,
      connected: catalog.connected_count ?? 0,
      pct: catalog.node_count
        ? Math.round(
            ((catalog.connected_count ?? 0) / catalog.node_count) * 100,
          )
        : 0,
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
  return coverage !== undefined && coverage.pct < 75;
}
