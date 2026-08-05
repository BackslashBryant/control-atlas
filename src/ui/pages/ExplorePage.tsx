import {
  IconAdjustmentsHorizontal,
  IconArrowUpRight,
  IconSearch,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { displayNameFor } from "../../app/display-names.mjs";
import { practitionerGuides } from "../../app/learn-content.mjs";
import { searchGlossary } from "../lib/glossarySearch.mjs";
import { searchExploreResources } from "../lib/exploreResourceSearch.mjs";
import { resourceAccessLabel, resourceTypeLabel } from "../lib/resourceBrands.mjs";
import { searchResourceDocuments } from "../lib/resourceSearch.mjs";
import { serializeHashUrl } from "../lib/hashRoutes";
import { recordDisplayTitle } from "../lib/recordTitle";
import {
  officialDescriptionOrStatus,
  officialTextPreview,
} from "../lib/officialText";
import {
  buildCatalogCoverageList,
  catalogCoverageForId,
  isLowCatalogCoverage,
} from "../lib/catalogCoverage";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import { Badge, SelectField, openAtlasMapForNode } from "../lib/pagePrimitives";
import { Button, Panel } from "../components/lsm";

type SearchState = Extract<ViewState, { view: "search" }>;

function matchReasonFor(document: any, query: string): string {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return "Matches active filters";
  const itemId = String(document.item_id || document.id || "").toLocaleLowerCase();
  const title = String(document.title || "").toLocaleLowerCase();
  if (itemId === needle) return "Exact identifier";
  if (title === needle) return "Exact title";
  if (itemId.startsWith(needle)) return "Identifier match";
  if (title.includes(needle)) return "Title or alias match";
  return "Official text match";
}

const RELEVANCE_ORDER: Record<string, number> = {
  "Exact identifier": 0,
  "Exact title": 1,
  "Identifier match": 2,
  "Title or alias match": 3,
  "Official text match": 4,
  "Matches active filters": 5,
};

function FilterControls(props: {
  bundle: RuntimeBundle;
  connectedOnly: boolean;
  graphReady: boolean;
  state: SearchState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onRequestFullGraph: () => void;
}) {
  const { bundle, connectedOnly, graphReady, state, onNavigate, onRequestFullGraph } = props;
  const facets = bundle.runtime.getLibraryFacets();
  return (
    <div className="search-filter-controls">
      <SelectField
        label="Publication"
        onChange={(filter) => onNavigate("search", { filter })}
        options={bundle.runtime.getCatalogs().map((catalog: any) => ({ value: catalog.id, label: catalog.name }))}
        value={state.filter}
      />
      <SelectField
        label="Object type"
        onChange={(objectType) => onNavigate("search", { objectType })}
        options={facets.objectTypes.map((value: string) => ({ value, label: displayNameFor("object_type", value) }))}
        value={state.objectType}
      />
      <SelectField
        label="Source type"
        onChange={(sourceClass) => onNavigate("search", { sourceClass })}
        options={facets.sourceClasses.map((value: string) => ({ value, label: displayNameFor("provenance_class", value) }))}
        value={state.sourceClass}
      />
      <SelectField
        label="Control family"
        onChange={(controlFamily) => onNavigate("search", { controlFamily })}
        options={facets.controlFamilies.map((value: string) => ({ value, label: value }))}
        value={state.controlFamily}
      />
      <SelectField
        label="Severity"
        onChange={(severity) => onNavigate("search", { severity })}
        options={facets.severities.map((value: string) => ({ value, label: value }))}
        value={state.severity}
      />
      <label className="connections-only-filter" htmlFor="connections-only">
        <input
          checked={connectedOnly}
          id="connections-only"
          onChange={(event) => {
            const checked = event.target.checked;
            onNavigate("search", { connectedOnly: checked ? "true" : "" });
            if (checked && !graphReady) onRequestFullGraph();
          }}
          type="checkbox"
        />
        Has published connections
      </label>
    </div>
  );
}

export function ExplorePage(props: {
  bundle: RuntimeBundle;
  graphReady: boolean;
  state: SearchState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
  onRequestFullGraph: () => void;
  onOpenGlossary: (termId?: string) => void;
  onOpenHelp: () => void;
  setHelpOpen: (open: boolean) => void;
}) {
  const {
    bundle,
    graphReady,
    state,
    onNavigate,
    onOpenNode,
    onRequestFullGraph,
    onOpenGlossary,
  } = props;
  const resultsRef = useRef<HTMLDivElement>(null);
  const composingRef = useRef(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailsReady, setDetailsReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const connectedOnly = state.connectedOnly === "true";
  const hasQuery = Boolean(state.query.trim());
  const hasFilters = Boolean(state.filter || state.objectType || state.sourceClass || state.controlFamily || state.severity || connectedOnly);
  const searchStarted = hasQuery || hasFilters;

  useEffect(() => {
    setDetailsReady(false);
    setVisibleCount(0);
    let detailsFrame = 0;
    const resultsFrame = window.requestAnimationFrame(() => {
      setVisibleCount(10);
      detailsFrame = window.requestAnimationFrame(() => setDetailsReady(true));
    });
    return () => {
      window.cancelAnimationFrame(resultsFrame);
      window.cancelAnimationFrame(detailsFrame);
    };
  }, [state.query, state.filter, state.objectType, state.sourceClass, state.controlFamily, state.severity, state.connectedOnly, state.sort]);
  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [filtersOpen]);

  const filters = {
    catalog_id: state.filter || undefined,
    object_type: state.objectType || undefined,
    source_class: state.sourceClass || undefined,
    control_family: state.controlFamily || undefined,
    severity: state.severity || undefined,
  };
  const documents = useMemo(
    () => (searchStarted ? bundle.runtime.searchLibrary(state.query, filters) : []),
    [bundle.runtime, searchStarted, state.query, state.filter, state.objectType, state.sourceClass, state.controlFamily, state.severity],
  );
  const catalogCoverage = useMemo(() => buildCatalogCoverageList(bundle.runtime.getCatalogs(), 1), [bundle.runtime]);
  const catalogs = useMemo(() => new Map(bundle.runtime.getCatalogs().map((catalog: any) => [catalog.id, catalog.name])), [bundle.runtime]);

  const recordRows = useMemo(() => documents.map((document: any) => ({
    document,
    matchReason: matchReasonFor(document, state.query),
    title: recordDisplayTitle({
      id: document.id,
      node_type: document.object_type,
      metadata: { item_id: document.item_id, title: document.title },
    }),
    publication: catalogs.get(document.catalog_id) || document.catalog_name || document.catalog_id || "Publication unavailable",
  })).filter((row: any) => {
    if (!connectedOnly) return true;
    return bundle.runtime.getEdgesForNode(row.document.id, { publication_status: "published" }).length > 0;
  }), [bundle.runtime, catalogs, connectedOnly, documents, state.query]);

  const directoryResources = useMemo(() => !hasQuery || hasFilters ? [] : searchResourceDocuments(bundle.commonsSearchIndex?.documents || [], state.query, 12).map((entry) => entry.document), [bundle.commonsSearchIndex, hasFilters, hasQuery, state.query]);
  const guideMatches = useMemo(() => {
    const query = state.query.trim().toLocaleLowerCase();
    return !query || hasFilters ? [] : practitionerGuides.filter((guide) => [guide.title, guide.summary, guide.whereItSits, guide.whenItMatters].join(" ").toLocaleLowerCase().includes(query)).slice(0, 8);
  }, [hasFilters, state.query]);
  const sourceMatches = useMemo(() => {
    const query = state.query.trim().toLocaleLowerCase();
    return !query || hasFilters ? [] : (bundle.runtime.dataset.sources || []).filter((source: any) => [source.id, source.display_name, source.name, source.publisher, source.agency].filter(Boolean).join(" ").toLocaleLowerCase().includes(query)).slice(0, 8);
  }, [bundle.runtime, hasFilters, state.query]);
  const resourceMatches = useMemo(() => !hasQuery || hasFilters ? { templates: [], artifacts: [] } : searchExploreResources(state.query, { templates: bundle.templateRegistry.templates || [], artifacts: bundle.officialArtifactRegistry?.artifacts || [] }), [bundle.officialArtifactRegistry, bundle.templateRegistry, hasFilters, hasQuery, state.query]);
  useEffect(() => {
    (window as any).debugBundle = bundle;
  }, [bundle]);
  const glossaryMatches = useMemo(() => hasQuery && !hasFilters ? searchGlossary(state.query).slice(0, 8) : [], [hasFilters, hasQuery, state.query]);

  const unifiedResults = useMemo(() => {
    const rows: any[] = [
      ...recordRows.map((row: any) => ({ key: `record:${row.document.id}`, kind: "record", title: row.title, identifier: row.document.item_id || row.document.id, publication: row.publication, rank: RELEVANCE_ORDER[row.matchReason] ?? 9, payload: row })),
      ...guideMatches.map((guide) => ({ key: `guide:${guide.id}`, kind: "guide", title: guide.title, identifier: guide.id, publication: "Control Atlas", rank: 6, payload: guide })),
      ...directoryResources.map((resource: any) => ({ key: `resource:${resource.id}`, kind: "resource", title: resource.name, identifier: resource.id, publication: resource.publisher, rank: 6, payload: resource })),
      ...sourceMatches.map((source: any) => ({ key: `source:${source.id}`, kind: "source", title: source.display_name || source.name || source.id, identifier: source.id, publication: source.publisher || source.agency || "Source owner", rank: 6, payload: source })),
      ...resourceMatches.templates.map((template: any) => ({ key: `template:${template.id}`, kind: "template", title: template.title, identifier: template.id, publication: "Control Atlas", rank: 7, payload: template })),
      ...resourceMatches.artifacts.map((artifact: any) => ({ key: `artifact:${artifact.id}`, kind: "artifact", title: artifact.title, identifier: artifact.id, publication: artifact.publisher || "Publisher record", rank: 7, payload: artifact })),
      ...glossaryMatches.map((entry: any) => ({ key: `glossary:${entry.id}`, kind: "glossary", title: entry.term, identifier: entry.id, publication: "Control Atlas glossary", rank: 8, payload: entry })),
    ];
    const byText = (key: "title" | "identifier" | "publication") => (left: any, right: any) => String(left[key]).localeCompare(String(right[key]), undefined, { numeric: true, sensitivity: "base" });
    if (state.sort === "identifier") return rows.sort(byText("identifier"));
    if (state.sort === "title") return rows.sort(byText("title"));
    if (state.sort === "publication") return rows.sort(byText("publication"));
    return rows.sort((left, right) => left.rank - right.rank || byText("title")(left, right));
  }, [directoryResources, glossaryMatches, guideMatches, recordRows, resourceMatches.artifacts, resourceMatches.templates, sourceMatches, state.sort]);

  const activeFilters = [
    state.filter && { key: "filter", label: catalogs.get(state.filter) || state.filter },
    state.objectType && { key: "objectType", label: displayNameFor("object_type", state.objectType) },
    state.sourceClass && { key: "sourceClass", label: displayNameFor("provenance_class", state.sourceClass) },
    state.controlFamily && { key: "controlFamily", label: state.controlFamily },
    state.severity && { key: "severity", label: state.severity },
    connectedOnly && { key: "connectedOnly", label: "Has connections" },
  ].filter(Boolean) as Array<{ key: keyof SearchState; label: string }>;

  const clearFilters = () => onNavigate("search", { filter: "", objectType: "", sourceClass: "", controlFamily: "", severity: "", connectedOnly: "" });
  const filterProps = { bundle, connectedOnly, graphReady, state, onNavigate, onRequestFullGraph };

  return (
    <Panel className="search-results-panel border-0 !bg-transparent p-0" data-visual-identity="classified-research-search">
      <header className="page-header" data-route-primary-header="true">
        <div className="page-header-row">
          <div><h1>Library</h1><p className="page-summary">One ranked view across published records, guides, documents, resources, communities, and sources.</p></div>
          <Button onClick={() => onNavigate("catalog-detail", { catalog: "" })} type="button" variant="secondary">Browse publications</Button>
        </div>
      </header>

      <form className="search-results-query-row" onSubmit={(event) => { event.preventDefault(); if (!composingRef.current) resultsRef.current?.focus(); }} role="search">
        <label className="catalog-search search-results-query">
          <IconSearch aria-hidden="true" size={18} />
          <input aria-label="Search query" id="library-search-query" name="query" onChange={(event) => onNavigate("search", { query: event.target.value })} onCompositionEnd={() => { composingRef.current = false; }} onCompositionStart={() => { composingRef.current = true; }} placeholder="Search by identifier, title, or topic" type="search" value={state.query} />
        </label>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <div className="search-toolbar">
        <div aria-live="polite" className="search-result-count">
          {searchStarted ? `${unifiedResults.length.toLocaleString()} result${unifiedResults.length === 1 ? "" : "s"}` : "Enter a search or choose a filter"}
        </div>
        <label className="search-sort">
          <span>Sort</span>
          <select aria-label="Sort search results" onChange={(event) => onNavigate("search", { sort: event.target.value })} value={state.sort || "relevance"}>
            <option value="relevance">Relevance</option><option value="identifier">Identifier</option><option value="title">Title</option><option value="publication">Publication or source</option>
          </select>
        </label>
        <Button className="search-mobile-filter-button" onClick={() => setFiltersOpen(true)} type="button" variant="secondary">
          <IconAdjustmentsHorizontal aria-hidden="true" size={17} /> Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}
        </Button>
      </div>

      {activeFilters.length ? (
        <div aria-label="Active filters" className="active-filter-row">
          {activeFilters.map((filter) => <button className="active-filter-chip" key={filter.key} onClick={() => onNavigate("search", { [filter.key]: "" })} type="button">{filter.label}<IconX aria-hidden="true" size={13} /></button>)}
          <button className="clear-filter-link" onClick={clearFilters} type="button">Clear all</button>
        </div>
      ) : null}

      <div className="search-results-layout">
        <aside aria-label="Search filters" className="search-filter-rail">
          <div className="search-filter-heading"><strong>Filter results</strong>{activeFilters.length ? <button onClick={clearFilters} type="button">Clear all</button> : null}</div>
          <FilterControls {...filterProps} />
        </aside>

        <div aria-busy={visibleCount > 0 && !detailsReady} aria-label="Search results" className="search-result-list" id="library-results" ref={resultsRef} tabIndex={-1}>
          {connectedOnly && !graphReady ? <p className="notice-inline" role="status">Loading connection data for this filter…</p> : null}
          {unifiedResults.slice(0, visibleCount).map((result: any) => {
            if (result.kind === "record") {
              const row = result.payload;
              const node = detailsReady ? bundle.runtime.getNode(row.document.id) : null;
              const source = detailsReady ? bundle.runtime.getSource(row.document.source_id) : null;
              const relationshipCount = detailsReady
                ? bundle.runtime.getEdgesForNode(row.document.id, { publication_status: "published" }).length
                : 0;
              const path = detailsReady
                ? (node?.ancestor_path || []).slice(-3).map((entry: any) => entry.label).filter(Boolean).join(" › ")
                : "";
              const lowCoverage = detailsReady
                ? isLowCatalogCoverage(catalogCoverageForId(catalogCoverage, row.document.catalog_id))
                : false;
              const excerpt = officialTextPreview(
                row.document.summary || officialDescriptionOrStatus(row.document),
                220,
              ).preview;
              return (
                <article aria-labelledby={`title-${row.document.id}`} className="search-result-row" data-result-class="published-record" key={result.key}>
                  <div className="search-result-row__type">{displayNameFor("object_type", row.document.object_type)}</div>
                  <div className="search-result-row__body">
                    <h2 id={`title-${row.document.id}`}><button className="search-result-primary" onClick={() => onOpenNode(row.document.id, "search")} type="button">{row.title}</button></h2>
                    <p className="search-result-row__source">{source?.display_name || source?.name || row.document.source_name || "Source unavailable"} · {row.publication}</p>
                    {detailsReady && path ? <p className="search-result-row__path">{path}</p> : null}
                    {detailsReady ? <p className="search-result-row__excerpt">{excerpt}</p> : null}
                    {detailsReady ? <div className="search-result-row__signals">
                      <span>{row.matchReason}</span>
                      <span>{relationshipCount.toLocaleString()} published connection{relationshipCount === 1 ? "" : "s"}</span>
                      {lowCoverage ? <Badge tone="warning">Limited coverage</Badge> : null}
                    </div> : null}
                  </div>
                  {detailsReady ? <div className="search-result-row__actions">
                    <button onClick={() => openAtlasMapForNode(onNavigate, row.document.id)} type="button">Open in Atlas</button>
                    <button onClick={() => onNavigate("matrix", { crosswalk: "relationships", items: row.document.item_id })} type="button">Compare</button>
                    <button onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}${serializeHashUrl({ view: "library-detail", node: row.document.id, from: "search" })}`)} type="button">Copy link</button>
                  </div> : null}
                </article>
              );
            }
            const item = result.payload;
            const meta: Record<string, { type: string; summary: string; action: () => void }> = {
              guide: { type: "Practitioner guide", summary: item.summary, action: () => onNavigate("patterns", { pattern: item.id }) },
              resource: { type: item.resourceType === "community_forum" ? "Community" : resourceTypeLabel(item.resourceType), summary: item.summary, action: () => onNavigate("commons-detail", { id: item.id, from: "search" }) },
              source: { type: "Source register", summary: `Publisher: ${item.publisher || item.agency || "Source owner"}`, action: () => onNavigate("sources", { source: item.id }) },
              template: { type: "Starter document", summary: item.summary, action: () => onNavigate("templates", { templateType: item.templateType }) },
              artifact: { type: "Official resource", summary: item.summary, action: () => { if (item.href) window.open(item.href, "_blank", "noopener,noreferrer"); } },
              glossary: {
                type: "Glossary · Control Atlas explanation",
                summary: `${item.definition} Reference: ${item.source}`,
                action: () => onOpenGlossary(item.id),
              },
            };
            const view = meta[result.kind];
            return (
              <article aria-labelledby={`title-${result.key}`} className="search-result-row search-result-row--universal" data-result-class={result.kind} key={result.key}>
                <div className="search-result-row__type">{view.type}</div>
                <div className="search-result-row__body">
                  <h2 id={`title-${result.key}`}><button className="search-result-primary" onClick={view.action} type="button">{result.title}<IconArrowUpRight aria-hidden="true" size={15} /></button></h2>
                  <p className="search-result-row__source">{result.publication}{result.kind === "resource" ? ` · ${resourceAccessLabel(item)}` : ""}</p>
                  {detailsReady ? <p className="search-result-row__excerpt">{view.summary}</p> : null}
                  {detailsReady ? <div className="search-result-row__signals"><span>Matched {view.type.toLocaleLowerCase()} metadata</span></div> : null}
                </div>
              </article>
            );
          })}

          {visibleCount > 0 && unifiedResults.length > visibleCount ? <Button onClick={() => setVisibleCount((count) => count + 15)} type="button" variant="secondary">Show 15 more</Button> : null}
          {searchStarted && unifiedResults.length === 0 ? (
            <section className="empty-state"><IconSparkles aria-hidden="true" size={24} /><h2>No matching results found.</h2><p>Try an identifier, title, topic, publication, or remove a filter.</p><Button onClick={() => onNavigate("search", { query: "", filter: "", objectType: "", sourceClass: "", controlFamily: "", severity: "", connectedOnly: "", sort: "relevance" })} type="button" variant="primary">Clear search</Button></section>
          ) : !searchStarted ? <section className="empty-state subtle"><p className="muted">Try T1195.002, access control, encryption, or supply chain.</p></section> : null}
        </div>
      </div>

      {filtersOpen ? createPortal((
        <div className="search-filter-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}>
          <section aria-label="Filter search results" aria-modal="true" className="search-filter-drawer" role="dialog">
            <header><div><p className="eyebrow">Library</p><h2>Filter results</h2></div><button aria-label="Close filters" onClick={() => setFiltersOpen(false)} type="button"><IconX aria-hidden="true" size={20} /></button></header>
            <FilterControls {...filterProps} />
            <footer><Button onClick={() => setFiltersOpen(false)} type="button" variant="primary">Show {unifiedResults.length.toLocaleString()} results</Button>{activeFilters.length ? <Button onClick={clearFilters} type="button" variant="secondary">Clear all</Button> : null}</footer>
          </section>
        </div>
      ), document.body) : null}
    </Panel>
  );
}
