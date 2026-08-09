import {
  buildCatalogCoverageList,
  catalogCoverageForId,
  isLowCatalogCoverage,
  type CatalogCoverage,
} from "../lib/catalogCoverage";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import { AppLink } from "./AppLink";

export function useCatalogCoverage(bundle: RuntimeBundle) {
  return buildCatalogCoverageList(bundle.runtime.getCatalogs(), 1);
}

export function CatalogCoverageNotice(props: {
  catalogId: string;
  coverageList: CatalogCoverage[];
  onNavigateSources: () => void;
}) {
  const { catalogId, coverageList, onNavigateSources } = props;
  if (!catalogId) {
    return null;
  }

  const coverage = catalogCoverageForId(coverageList, catalogId);
  if (!isLowCatalogCoverage(coverage)) {
    return null;
  }

  return (
    <p className="catalog-coverage-chip" role="note">
      <span className="catalog-coverage-chip-label">
        {coverage?.name}: {coverage?.connected}/{coverage?.total} connected (
        {coverage?.pct}%)
      </span>
      <span className="catalog-coverage-chip-detail">
        Low map coverage — a missing link is not proof that no relationship
        exists.{" "}
        <AppLink className="text-link" onNavigate={onNavigateSources} view="sources">
          Review sources
        </AppLink>
      </span>
    </p>
  );
}
