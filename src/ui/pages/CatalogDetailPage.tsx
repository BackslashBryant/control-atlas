import { IconArrowLeft, IconExternalLink, IconSearch } from "@tabler/icons-react";
import { ContextualCommonsModule } from "../components/ContextualCommonsModule";
import { Button, ButtonLink } from "../components/lsm/Button";
import { useMemo, useState } from "react";

import { catalogProfileFor } from "../lib/catalogProfiles";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

const RESULT_LIMIT = 100;

// Grouping-tier node types (see CATALOG_TIERS in scripts/build-framework-data.mjs)
// and the catalog summary node itself carry the same catalog_id as their leaf
// records, so a raw catalog_id query returns both — excluded here so the
// browsable/searchable list only ever shows actual records, never a
// "benchmark" or "family" tier row mixed in as if it were one.
const NON_LEAF_NODE_TYPES = new Set([
  "catalog",
  "family",
  "benchmark",
  "function",
  "category",
  "tactic",
  "group",
]);

export function CatalogDetailPage(props: {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "catalog-detail" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("");
  const catalogs = bundle.runtime.getCatalogs();
  const catalog = catalogs.find((entry: any) => entry.id === state.catalog);
  const records = catalog
    ? bundle.runtime
        .getNodes({ catalog_id: catalog.id })
        .filter((record: any) => !NON_LEAF_NODE_TYPES.has(record.node_type))
    : [];
  const families = useMemo(
    () =>
      [...new Set(records.map((record: any) => record.metadata?.family).filter(Boolean))].sort() as string[],
    [records],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const matchingRecords = useMemo(
    () =>
      records.filter((record: any) =>
        (!family || record.metadata?.family === family) &&
        (!normalizedQuery ||
          [
            record.metadata?.item_id,
            record.metadata?.title,
            record.metadata?.family,
            record.plain_language_summary,
            record.description,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery))),
      ),
    [family, normalizedQuery, records],
  );

  if (!state.catalog) {
    const groupOrder = ["NIST", "DISA", "MITRE", "DoD", "Other"];
    const catalogsByGroup = groupOrder
      .map((group) => ({
        group,
        entries: catalogs.filter((entry: any) => (entry.display_group || "Other") === group),
      }))
      .filter((section) => section.entries.length > 0);

    return (
      <section className="panel catalog-index">
        <header className="page-header">
          <p className="eyebrow">Library</p>
          <h1>Official rules and frameworks</h1>
          <p className="page-summary">
            These are the source documents themselves, grouped by the agency that publishes them.
            Not sure where to start? <button className="link-button" onClick={() => onNavigate("atlas-map")} type="button">Try Atlas</button> — it asks what you're working on and finds the record for you.
          </p>
        </header>
        {catalogsByGroup.map((section) => (
          <div className="catalog-index-group" key={section.group}>
            <h2 className="catalog-index-group-label">{section.group}</h2>
            <div className="catalog-index-list">
              {section.entries.map((entry: any) => (
                <button
                  className="catalog-index-row"
                  key={entry.id}
                  onClick={() => onNavigate("catalog-detail", { catalog: entry.id })}
                  type="button"
                >
                  <span>
                    <strong>{entry.name}</strong>
                    <small>{catalogProfileFor(entry.id, entry.name).synopsis}</small>
                  </span>
                  <span>{(entry.leaf_record_count ?? entry.node_count).toLocaleString()} records</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }

  if (!catalog) {
    return (
      <section className="notice">
        <h1>Catalog not found</h1>
        <p>This catalog is not available in the current public data set.</p>
        <Button variant="primary" onClick={() => onNavigate("catalog-detail", { catalog: "" })} type="button">
          Browse the Library
        </Button>
      </section>
    );
  }

  const profile = catalogProfileFor(catalog.id, catalog.name);
  const source =
    bundle.runtime.getSource(catalog.id) ||
    bundle.runtime
      .getSources()
      .find((entry: any) => entry.metadata?.frameworks?.includes(catalog.id));
  return (
    <section className="panel catalog-detail-page">
      <button className="back-link" onClick={() => onNavigate("catalog-detail", { catalog: "" })} type="button">
        <IconArrowLeft aria-hidden="true" size={17} /> Back to Library
      </button>

      <header className="catalog-detail-hero">
        <p className="eyebrow">{catalog.display_group} catalog</p>
        <h1>{catalog.name}</h1>
        <p className="catalog-synopsis">{profile.synopsis}</p>
        <p className="catalog-applicability"><strong>When to use it:</strong> {profile.appliesWhen}</p>
        <div className="catalog-facts" aria-label="Catalog summary">
          <span><strong>{(catalog.leaf_record_count ?? catalog.node_count).toLocaleString()}</strong> {profile.recordLabel}</span>
          {catalog.tier_count ? (
            <span>across <strong>{catalog.tier_count.toLocaleString()}</strong> {catalog.tier_count === 1 ? catalog.tier_label : catalog.tier_label_plural}</span>
          ) : null}
          <span><strong>{catalog.connected_count.toLocaleString()}</strong> connected records</span>
          {source?.version ? <span>Version <strong>{source.version}</strong></span> : null}
        </div>
        {source?.artifact_url ? (
          <ButtonLink variant="secondary" href={source.artifact_url} rel="noreferrer" target="_blank">
            View official source <IconExternalLink aria-hidden="true" size={16} />
          </ButtonLink>
        ) : null}
      </header>

      <ContextualCommonsModule
        bundle={bundle}
        contextType="catalog"
        contextId={catalog.id}
        query={catalog.name}
        onNavigate={onNavigate}
      />

      <section className="catalog-records" aria-labelledby="catalog-records-title">
        <div className="catalog-records-heading">
          <div>
            <h2 id="catalog-records-title">{catalog.name} {profile.recordLabel}</h2>
            <p>{matchingRecords.length.toLocaleString()} matching records</p>
          </div>
          <div className="catalog-record-filters">
            {families.length ? (
              <label>
                <span className="sr-only">Filter by {catalog.tier_label || "family"}</span>
                <select onChange={(event) => setFamily(event.target.value)} value={family}>
                  <option value="">All {catalog.tier_label_plural || "families"}</option>
                  {families.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
            ) : null}
            <label className="catalog-search">
              <span className="sr-only">Search this catalog</span>
              <IconSearch aria-hidden="true" size={18} />
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${catalog.name}`}
                type="search"
                value={query}
              />
            </label>
          </div>
        </div>

        {matchingRecords.length ? (
          <div className="catalog-record-list">
            {matchingRecords.slice(0, RESULT_LIMIT).map((record: any) => {
              const itemId = record.metadata?.item_id || record.id;
              const title = record.metadata?.title || itemId;
              const synopsis =
                record.plain_language_summary || record.description || "No synopsis is available for this record.";
              return (
                <article className="catalog-record-row" key={record.id} aria-labelledby={`title-${record.id}`} aria-describedby={`desc-${record.id}`}>
                  <button className="catalog-record-title" id={`title-${record.id}`} onClick={() => onOpenNode(record.id, "catalog-detail")} type="button">
                    <strong>{itemId}</strong>
                    {title !== itemId ? <span>{title}</span> : null}
                  </button>
                  <p id={`desc-${record.id}`}>{synopsis}</p>
                  {record.metadata?.family ? <small>{record.metadata.family}</small> : null}
                </article>
              );
            })}
            {matchingRecords.length > RESULT_LIMIT ? (
              <p className="field-hint">Showing the first {RESULT_LIMIT} records. Refine the catalog search to narrow the list.</p>
            ) : null}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No records match “{query}”</h3>
            <p>Try an identifier, title, family, or a broader term.</p>
            <Button variant="secondary" onClick={() => { setQuery(""); setFamily(""); }} type="button">Clear catalog filters</Button>
          </div>
        )}
      </section>
    </section>
  );
}
