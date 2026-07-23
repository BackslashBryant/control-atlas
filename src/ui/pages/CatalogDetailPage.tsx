import { IconArrowLeft, IconExternalLink, IconSearch } from "@tabler/icons-react";
import { ContextualCommonsModule } from "../components/ContextualCommonsModule";
import { useMemo, useState } from "react";

import { catalogProfileFor } from "../lib/catalogProfiles";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

const RESULT_LIMIT = 100;

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
    ? bundle.runtime.getNodes({ catalog_id: catalog.id })
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
    return (
      <section className="panel catalog-index">
        <header className="page-header">
          <p className="eyebrow">Library</p>
          <h1>Browse public security catalogs</h1>
          <p className="page-summary">
            Open a framework or source collection, then search its records without losing context.
          </p>
        </header>
        <div className="catalog-index-list">
          {catalogs.map((entry: any) => (
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
              <span>{entry.node_count.toLocaleString()} records</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (!catalog) {
    return (
      <section className="notice">
        <h1>Catalog not found</h1>
        <p>This catalog is not available in the current public data set.</p>
        <button className="primary" onClick={() => onNavigate("catalog-detail", { catalog: "" })} type="button">
          Browse the Library
        </button>
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
          <span><strong>{catalog.node_count.toLocaleString()}</strong> {profile.recordLabel}</span>
          {families.length ? <span><strong>{families.length}</strong> families</span> : null}
          <span><strong>{catalog.connected_count.toLocaleString()}</strong> connected records</span>
          {source?.version ? <span>Version <strong>{source.version}</strong></span> : null}
        </div>
        {source?.artifact_url ? (
          <a className="secondary button-link" href={source.artifact_url} rel="noreferrer" target="_blank">
            View official source <IconExternalLink aria-hidden="true" size={16} />
          </a>
        ) : null}
        <p className="field-hint">This page organizes public reference data. It does not determine applicability or compliance.</p>
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
                <span className="sr-only">Filter by family</span>
                <select onChange={(event) => setFamily(event.target.value)} value={family}>
                  <option value="">All families</option>
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
            <button className="secondary" onClick={() => { setQuery(""); setFamily(""); }} type="button">Clear catalog filters</button>
          </div>
        )}
      </section>
    </section>
  );
}
