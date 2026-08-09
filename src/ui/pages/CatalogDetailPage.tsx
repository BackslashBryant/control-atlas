import {
  IconArrowLeft,
  IconExternalLink,
  IconSearch,
} from "@tabler/icons-react";
import { useMemo } from "react";

import { Button, ButtonLink } from "../components/lsm/Button";
import {
  paginateCatalogRecords,
  publicationSourceForCatalog,
} from "../lib/catalogInventory";
import { catalogProfileFor } from "../lib/catalogProfiles";
import { PageHeader, WorkbenchControlSurface } from "../lib/pagePrimitives";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";

const PAGE_SIZE = 100;
const NON_LEAF_NODE_TYPES = new Set([
  "catalog",
  "family",
  "benchmark",
  "function",
  "category",
  "tactic",
  "group",
]);

type CatalogState = Extract<ViewState, { view: "catalog-detail" }>;

export function CatalogDetailPage(props: {
  bundle: RuntimeBundle;
  state: CatalogState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
}) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const catalogs =
    bundle.catalogSummaries?.length
      ? bundle.catalogSummaries
      : bundle.runtime.getCatalogs();
  const catalog = catalogs.find((entry: any) => entry.id === state.catalog);

  if (!state.catalog) {
    return (
      <CatalogInventory
        bundle={bundle}
        catalogs={catalogs}
        onNavigate={onNavigate}
        state={state}
      />
    );
  }

  if (!catalog) {
    return (
      <section className="notice">
        <h1>Catalog not found</h1>
        <p>This catalog is not available in the current public data set.</p>
        <Button
          onClick={() => onNavigate("catalog-detail", emptyCatalogState())}
          type="button"
          variant="primary"
        >
          Back to Library
        </Button>
      </section>
    );
  }

  const profile = catalogProfileFor(catalog.id, catalog.name);
  const source = publicationSourceForCatalog(bundle.runtime, catalog.id);
  const records = bundle.runtime
    .getNodes({ catalog_id: catalog.id })
    .filter((record: any) => !NON_LEAF_NODE_TYPES.has(record.node_type));
  const publishedGroups = bundle.catalogPublishedGroups || [];
  const families = [
    ...new Set(
      publishedGroups.length
        ? publishedGroups.map((group) => group.name)
        : records.map((record: any) => record.metadata?.family).filter(Boolean),
    ),
  ].sort() as string[];
  const query = state.query.trim().toLowerCase();
  const matchingRecords = records.filter(
    (record: any) =>
      (!state.family || record.metadata?.family === state.family) &&
      (!query ||
        [
          record.metadata?.item_id,
          record.metadata?.title,
          record.metadata?.family,
          record.description,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))),
  );
  const tierGroups = publishedGroups.length
    ? publishedGroups.map((group) => ({
        name: group.name,
        count: group.record_count,
      }))
    : families.map((name) => ({
        name,
        count: records.filter(
          (record: any) => record.metadata?.family === name,
        ).length,
      }));
  const showTierBrowser =
    families.length > 1 &&
    state.browseAll !== "true" &&
    !state.family &&
    !query;
  const requestedPage = Number.parseInt(state.page || "1", 10);
  const page = paginateCatalogRecords(
    matchingRecords,
    requestedPage,
    PAGE_SIZE,
  );
  const pageCount = page.pageCount;
  const pageIsValid = page.valid;
  const pageRecords = page.records;

  const update = (patch: Partial<CatalogState>) =>
    onNavigate("catalog-detail", { ...state, ...patch });

  return (
    <section className="panel catalog-detail-page" data-visual-identity="publisher-research-library">
      <button
        className="back-link"
        onClick={() => onNavigate("catalog-detail", emptyCatalogState())}
        type="button"
      >
        <IconArrowLeft aria-hidden="true" size={17} /> Back to Catalog
      </button>

      <header className="catalog-detail-hero" data-route-primary-header="true">
        <p className="eyebrow" data-route-primary-copy="true">Published structure · {catalog.display_group}</p>
        <h1 data-route-primary-copy="true">{catalog.name}</h1>
        <p className="catalog-synopsis" data-route-primary-copy="true">
          Control Atlas note: {profile.synopsis}
        </p>
        <div className="catalog-facts" aria-label="Catalog summary" data-route-primary-support="true">
          <span>
            <strong>
              {(catalog.leaf_record_count ?? catalog.node_count).toLocaleString()}
            </strong>{" "}
            {profile.recordLabel}
          </span>
          <span>
            <strong>{catalog.connected_count.toLocaleString()}</strong>{" "}
            connected records
          </span>
          {source?.version ? (
            <span>
              Version <strong>{source.version}</strong>
            </span>
          ) : null}
        </div>
        {source?.artifact_url ? (
          <ButtonLink
            className="catalog-source-link"
            data-route-primary-support="true"
            href={source.artifact_url}
            rel="noreferrer"
            target="_blank"
            variant="secondary"
          >
            View official source
            <IconExternalLink aria-hidden="true" size={16} />
          </ButtonLink>
        ) : null}
      </header>

      <section aria-labelledby="catalog-records-title" className="catalog-records">
        <div className="catalog-records-heading">
          <div>
            <h2 id="catalog-records-title">
              {catalog.name} {profile.recordLabel}
            </h2>
            <p>
              {showTierBrowser
                ? `${tierGroups.length} published groups`
                : `${matchingRecords.length.toLocaleString()} matching records`}
            </p>
          </div>
        </div>
        <WorkbenchControlSurface
          className="catalog-detail-control-surface"
          label={`Filter ${catalog.name} ${profile.recordLabel}`}
          targetId="catalog-record-results"
        >
          <div
            aria-label="Catalog record controls"
            className="catalog-record-toolbar"
            role="group"
          >
            <div className="catalog-record-filters">
              {families.length > 1 && !showTierBrowser ? (
                <label className="catalog-record-filter">
                  <span>Published group</span>
                  <select
                    aria-label="Filter by published group"
                    onChange={(event) =>
                      update({
                        family: event.target.value,
                        browseAll: "true",
                        page: "",
                      })
                    }
                    value={state.family}
                  >
                    <option value="">All published groups</option>
                    {families.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="catalog-record-filter catalog-record-search-filter">
                <span>Search records</span>
                <span className="catalog-search">
                  <IconSearch aria-hidden="true" size={18} />
                  <input
                    aria-label="Search this catalog"
                    onChange={(event) =>
                      update({
                        query: event.target.value,
                        browseAll: "true",
                        page: "",
                      })
                    }
                    placeholder={`Identifier or title in ${catalog.name}`}
                    type="search"
                    value={state.query}
                  />
                </span>
              </label>
            </div>
          </div>
        </WorkbenchControlSurface>

        <div data-control-results id="catalog-record-results">
          {bundle.catalogRecordsReady === false ? (
            <p className="notice-inline" role="status">
              Loading this publication's records…
            </p>
          ) : showTierBrowser ? (
            <>
              <div className="catalog-index-list">
                {tierGroups.map((group) => (
                  <button
                    className="catalog-index-row"
                    key={group.name}
                    onClick={() =>
                      update({
                        family: group.name,
                        browseAll: "true",
                        page: "",
                      })
                    }
                    type="button"
                  >
                    <span><strong>{group.name}</strong></span>
                    <span>
                      {group.count.toLocaleString()} {profile.recordLabel}
                    </span>
                  </button>
                ))}
              </div>
              {publishedGroups.length ? null : (
                <button
                  className="link-button"
                  onClick={() => update({ browseAll: "true", page: "" })}
                  type="button"
                >
                  Browse all {records.length.toLocaleString()} {profile.recordLabel}
                </button>
              )}
            </>
          ) : !pageIsValid ? (
            <div className="empty-state">
              <h3>That result page is not available.</h3>
              <p>
                This filter has {pageCount} page{pageCount === 1 ? "" : "s"}.
              </p>
              <Button
                onClick={() => update({ page: String(pageCount) })}
                type="button"
                variant="secondary"
              >
                Open the last available page
              </Button>
            </div>
          ) : pageRecords.length ? (
            <>
              <div className="catalog-record-list">
                {pageRecords.map((record: any) => {
                  const itemId = record.metadata?.item_id || record.id;
                  const title = record.metadata?.title || itemId;
                  return (
                    <article className="catalog-record-row" key={record.id}>
                      <button
                        className="catalog-record-title"
                        onClick={() => onOpenNode(record.id, "catalog-detail")}
                        type="button"
                      >
                        <strong>{itemId}</strong>
                        {title !== itemId ? <span>{title}</span> : null}
                      </button>
                      <p>
                        {record.description ||
                          "No narrative description was published for this record."}
                      </p>
                      {record.metadata?.family ? (
                        <small>{record.metadata.family}</small>
                      ) : null}
                    </article>
                  );
                })}
              </div>
              <nav aria-label="Catalog result pages" className="catalog-pagination">
                <Button
                  disabled={requestedPage === 1}
                  onClick={() =>
                    update({
                      page:
                        requestedPage - 1 === 1
                          ? ""
                          : String(requestedPage - 1),
                    })
                  }
                  type="button"
                  variant="secondary"
                >
                  Previous
                </Button>
                <span>
                  Page {requestedPage} of {pageCount} · showing{" "}
                  {(requestedPage - 1) * PAGE_SIZE + 1}–
                  {(requestedPage - 1) * PAGE_SIZE + pageRecords.length} of{" "}
                  {matchingRecords.length.toLocaleString()}
                </span>
                <Button
                  disabled={requestedPage === pageCount}
                  onClick={() => update({ page: String(requestedPage + 1) })}
                  type="button"
                  variant="secondary"
                >
                  Next
                </Button>
              </nav>
            </>
          ) : (
            <div className="empty-state">
              <h3>No records match these filters.</h3>
              <p>Try an identifier, official title, published group, or broader term.</p>
              <Button
                onClick={() =>
                  update({
                    query: "",
                    family: "",
                    browseAll: "",
                    page: "",
                  })
                }
                type="button"
                variant="secondary"
              >
                Clear catalog filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function CatalogInventory(props: {
  bundle: RuntimeBundle;
  catalogs: any[];
  state: CatalogState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
}) {
  const { bundle, catalogs, state, onNavigate } = props;
  const rows = useMemo(
    () =>
      catalogs.map((entry) => {
        const profile = catalogProfileFor(entry.id, entry.name);
        // The bootstrap entry names its source directly; the node-walk only
        // resolves once the full graph is loaded, so on this page it returned
        // null and the row fell back to display_group — which is a grouping
        // bucket, printing "Other" as the publisher of FedRAMP, CMMC, and CUI.
        const source =
          (entry.source_id ? bundle.runtime.getSource(entry.source_id) : null) ||
          publicationSourceForCatalog(bundle.runtime, entry.id);
        return {
          entry,
          profile,
          // Absent metadata is omitted from the row, not printed as a
          // "Not recorded" placeholder (voice pass B.3).
          publisher: source?.owner || "",
          lifecycle: source?.lifecycle_status || "",
        };
      }),
    [bundle.runtime, catalogs],
  );
  const query = state.query.trim().toLowerCase();
  const eligible = rows.filter(
    (row) =>
      (!query ||
        [row.entry.id, row.entry.name, row.publisher, row.profile.recordLabel, row.profile.publicationKind]
          .some((value) => String(value).toLowerCase().includes(query))) &&
      (!state.type || row.profile.recordLabel === state.type) &&
      (!state.area || row.profile.area === state.area) &&
      (!state.publisher || row.publisher === state.publisher) &&
      (!state.lifecycle || row.lifecycle === state.lifecycle),
  );
  // W10: publication kind is the primary grouping — a newcomer can tell
  // FedRAMP (an authorization program) from a STIG (an implementation
  // standard) from this heading alone. Record type moves to its own
  // secondary filter below, not the section headers.
  const grouped = [
    ...new Set(eligible.map((row) => row.profile.publicationKind)),
  ]
    .sort()
    .map((label) => ({
      label,
      rows: eligible.filter((row) => row.profile.publicationKind === label),
    }));
  const update = (patch: Partial<CatalogState>) =>
    onNavigate("catalog-detail", { ...state, ...patch });

  return (
    <section className="panel catalog-index" data-visual-identity="publisher-research-library">
      <PageHeader
        primary
        summary="Search every published record, or browse the publications they come from."
        title="Library"
      />
      {/* Library merge: searching records and browsing publications are the
          same destination, so the record search runs from here instead of
          making the reader pick a surface first. */}
      <form
        className="library-record-search"
        onSubmit={(event) => {
          event.preventDefault();
          const query = String(
            new FormData(event.currentTarget).get("libraryQuery") || "",
          ).trim();
          if (query) onNavigate("search", { query });
        }}
        role="search"
      >
        <label className="catalog-search">
          <IconSearch aria-hidden="true" size={18} />
          <input
            aria-label="Search published records"
            name="libraryQuery"
            placeholder="Search by identifier, title, or topic"
            type="search"
          />
        </label>
        <Button type="submit" variant="primary">
          Search records
        </Button>
      </form>
      <h2 className="library-browse-heading">Browse publications</h2>
      <WorkbenchControlSurface
        className="catalog-inventory-control-surface"
        label="Filter published structures"
        targetId="catalog-inventory-results"
      >
        <div className="catalog-inventory-controls">
        <label className="catalog-search">
          <IconSearch aria-hidden="true" size={18} />
          <input
            aria-label="Search the catalog inventory"
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Publication, publisher, or record type"
            type="search"
            value={state.query}
          />
        </label>
        <InventorySelect
          label="Area"
          onChange={(area) => update({ area })}
          options={[...new Set(rows.map((row) => row.profile.area))]
            .filter(Boolean)
            .sort()}
          value={state.area}
        />
        <InventorySelect
          label="Publisher"
          onChange={(publisher) => update({ publisher })}
          options={[...new Set(rows.map((row) => row.publisher))]
            .filter(Boolean)
            .sort()}
          value={state.publisher}
        />
        <InventorySelect
          label="Lifecycle"
          onChange={(lifecycle) => update({ lifecycle })}
          options={[...new Set(rows.map((row) => row.lifecycle))]
            .filter(Boolean)
            .sort()}
          value={state.lifecycle}
        />
        <InventorySelect
          label="Record type (advanced)"
          onChange={(type) => update({ type })}
          options={[...new Set(rows.map((row) => row.profile.recordLabel))].sort()}
          value={state.type}
        />
        </div>
        <p className="catalog-inventory-total" aria-live="polite">
          {eligible.length} of {rows.length} published structures
        </p>
      </WorkbenchControlSurface>
      <div data-control-results id="catalog-inventory-results">
        {grouped.map((group) => (
        <section className="catalog-index-group" key={group.label}>
          <h2 className="catalog-index-group-label">{group.label}</h2>
          <div className="catalog-index-list">
            {group.rows.map(({ entry, profile, publisher, lifecycle }) => (
              <button
                className="catalog-index-row"
                key={entry.id}
                onClick={() =>
                  onNavigate("catalog-detail", {
                    ...emptyCatalogState(),
                    catalog: entry.id,
                  })
                }
                type="button"
              >
                <span>
                  <strong>{entry.name}</strong>
                  <small>{profile.synopsis}</small>
                  {[publisher, profile.area, lifecycle].filter(Boolean).length ? (
                    <small className="catalog-index-row-meta">
                      {[publisher, profile.area, lifecycle].filter(Boolean).join(" · ")}
                    </small>
                  ) : null}
                </span>
                <span>
                  {(entry.leaf_record_count ?? entry.node_count).toLocaleString()}{" "}
                  {profile.recordLabel}
                </span>
              </button>
            ))}
          </div>
        </section>
        ))}
        {eligible.length === 0 ? (
          <div className="empty-state">
            <h2>No published structures match these filters.</h2>
            <Button
              onClick={() => onNavigate("catalog-detail", emptyCatalogState())}
              type="button"
              variant="secondary"
            >
              Clear catalog filters
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function InventorySelect(props: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{props.label}</span>
      <select
        onChange={(event) => props.onChange(event.target.value)}
        value={props.value}
      >
        <option value="">All</option>
        {props.options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function emptyCatalogState(): Omit<CatalogState, "view"> {
  return {
    catalog: "",
    query: "",
    family: "",
    browseAll: "",
    type: "",
    area: "",
    publisher: "",
    lifecycle: "",
    page: "",
  };
}
