import {
  IconAdjustmentsHorizontal,
  IconArrowUpRight,
  IconGitCompare,
  IconList,
  IconMap,
  IconSearch,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { displayNameFor } from "../../app/display-names.mjs";
import { practitionerGuides } from "../../app/learn-content.mjs";
import { LibraryAtlasMap, type LibraryMapItem } from "../components/LibraryAtlasMap";
import { Button, Panel } from "../components/lsm";
import { AppLink } from "../components/AppLink";
import { buildCatalogCoverageList, catalogCoverageForId, isLowCatalogCoverage } from "../lib/catalogCoverage";
import { searchExploreResources } from "../lib/exploreResourceSearch.mjs";
import { searchGlossary } from "../lib/glossarySearch.mjs";
import { serializeHashUrl } from "../lib/hashRoutes";
import { LIBRARY_KINDS, libraryKindForRawType, libraryKindLabel, rawTypesForKind } from "../lib/informationArchitecture";
import { Badge, PageHeader, SelectField } from "../lib/pagePrimitives";
import { recordDisplayTitle } from "../lib/recordTitle";
import { resourceAccessLabel, resourceTypeLabel } from "../lib/resourceBrands.mjs";
import { filterDirectoryResources } from "../lib/resourcesDirectory.mjs";
import { searchResourceDocuments } from "../lib/resourceSearch.mjs";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import { CLOSE_OVERLAYS_EVENT } from "../../shared/navigation-events";
import { connectionSummary, MarkedSearchText, publisherPublicationLabel, searchPreviewText } from "../lib/searchPresentation";
import { normalizeViewState, type ViewState } from "../lib/viewState";

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

function TypeaheadFilter(props: {
  id: string;
  label: string;
  options: Array<{ label: string; value: string; disabled?: boolean }>;
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = props.options.find((option) => option.value === props.value);
  const [draft, setDraft] = useState(selected?.label || "");
  useEffect(() => setDraft(selected?.label || ""), [selected?.label]);
  return (
    <label className="typeahead-filter" htmlFor={props.id}>
      <span>{props.label}</span>
      <input
        autoComplete="off"
        id={props.id}
        list={`${props.id}-options`}
        onBlur={() => {
          const match = props.options.find((option) => !option.disabled && (option.label === draft || option.value === draft));
          props.onChange(match?.value || "");
          setDraft(match?.label || "");
        }}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={`Type to find a ${props.label.toLocaleLowerCase()}`}
        type="text"
        value={draft}
      />
      <datalist id={`${props.id}-options`}>
        {props.options.map((option) => <option disabled={option.disabled} key={option.value} value={option.label}>{option.value}</option>)}
      </datalist>
    </label>
  );
}

function FilterControls(props: {
  allDocuments: any[];
  bundle: RuntimeBundle;
  connectedOnly: boolean;
  graphReady: boolean;
  state: SearchState;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onRequestFullGraph: () => void;
}) {
  const { allDocuments, bundle, connectedOnly, graphReady, state, onNavigate, onRequestFullGraph } = props;
  const facets = bundle.runtime.getLibraryFacets();
  const catalogs = [...new Map(allDocuments.map((document) => [
    document.catalog_id,
    { id: document.catalog_id, name: document.catalog_name || document.catalog_id },
  ])).values()].filter((catalog) => catalog.id).sort((left, right) => left.name.localeCompare(right.name));
  const kindOptions = LIBRARY_KINDS.map((kind) => ({
    ...(() => {
      const count = kind.id === "tools-communities"
        ? bundle.commonsSearchIndex?.documents?.length || 0
        : allDocuments.filter((document) => libraryKindForRawType(document.object_type) === kind.id).length;
      return { label: `${kind.label} (${count})`, disabled: count === 0 };
    })(),
    value: kind.id,
  })).sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base" }));
  const rawOptions = rawTypesForKind(state.kind)
    .filter((rawType) => facets.objectTypes.includes(rawType))
    .filter((rawType) => allDocuments.some((document) => document.object_type === rawType))
    .map((rawType) => ({
      label: `${displayNameFor("object_type", rawType)} (${allDocuments.filter((document) => document.object_type === rawType).length})`,
      value: rawType,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base" }));
  const familyOptions = state.filter
    ? [...new Set(allDocuments.filter((document) => document.catalog_id === state.filter).map((document) => document.control_family).filter(Boolean))]
      .sort((left, right) => String(left).localeCompare(String(right)))
      .map((value) => ({ label: String(value), value: String(value) }))
    : [];

  return (
    <div className="search-filter-controls" data-stable-filter-set="publisher,kind,raw-type,publication,family,connections">
      {(facets.publishers || []).length >= 2 ? (
        <TypeaheadFilter
          id="library-publisher-filter"
          label="Publisher"
          onChange={(publisher) => onNavigate("search", { publisher })}
          options={(facets.publishers || [])
            .map((value: string) => ({
              value,
              label: `${value} (${allDocuments.filter((document) => document.publisher_name === value).length})`,
            }))
            .sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: "base" }))}
          value={state.publisher}
        />
      ) : null}
      {kindOptions.filter((option) => !option.disabled).length >= 2 ? (
        <SelectField label="Content kind" onChange={(kind) => onNavigate("search", { kind, objectType: "" })} options={kindOptions} value={state.kind} />
      ) : null}
      {rawOptions.length >= 2 ? <SelectField label="Refine record type" onChange={(objectType) => onNavigate("search", { objectType })} options={rawOptions} value={state.objectType} /> : null}
      <TypeaheadFilter
        id="library-publication-filter"
        label="Publication"
        onChange={(filter) => onNavigate("search", { filter, controlFamily: "" })}
        options={catalogs.map((catalog: any) => {
          const count = allDocuments.filter((document) => document.catalog_id === catalog.id).length;
          return { label: `${catalog.name} (${count})`, value: catalog.id, disabled: count === 0 };
        })}
        value={state.filter}
      />
      {familyOptions.length >= 2 ? <TypeaheadFilter id="library-family-filter" label="Family or section" onChange={(controlFamily) => onNavigate("search", { controlFamily })} options={familyOptions} value={state.controlFamily} /> : null}
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
  onOpenNode: (nodeId: string) => void;
  onRequestFullGraph: () => void;
  onOpenGlossary: (termId?: string) => void;
}) {
  const { bundle, graphReady, state, onNavigate, onOpenNode, onRequestFullGraph, onOpenGlossary } = props;
  const resultsRef = useRef<HTMLUListElement>(null);
  const composingRef = useRef(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [queryDraft, setQueryDraft] = useState(state.query);
  const [detailsReady, setDetailsReady] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const connectedOnly = state.connectedOnly === "true";
  const hasQuery = Boolean(state.query.trim());
  const hasFilters = Boolean(state.filter || state.publisher || state.kind || state.objectType || state.controlFamily || state.collection || connectedOnly);
  const searchStarted = hasQuery || hasFilters;
  const allDocuments = useMemo(() => bundle.runtime.searchLibrary(""), [bundle.runtime]);

  useEffect(() => setQueryDraft(state.query), [state.query]);

  useEffect(() => {
    setDetailsReady(false);
    setVisibleCount(0);
    let detailsFrame = 0;
    const resultsFrame = window.requestAnimationFrame(() => {
      setVisibleCount(25);
      detailsFrame = window.requestAnimationFrame(() => setDetailsReady(true));
    });
    return () => {
      window.cancelAnimationFrame(resultsFrame);
      window.cancelAnimationFrame(detailsFrame);
    };
  }, [state.query, state.filter, state.publisher, state.kind, state.objectType, state.controlFamily, state.connectedOnly, state.sort, state.collection]);

  useEffect(() => {
    const closeFilters = () => setFiltersOpen(false);
    window.addEventListener(CLOSE_OVERLAYS_EVENT, closeFilters);
    return () => window.removeEventListener(CLOSE_OVERLAYS_EVENT, closeFilters);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setFiltersOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [filtersOpen]);

  const documents = useMemo(() => {
    // No query and no filters is the default browse state: return the full
    // record corpus so #/library opens non-empty and browsable. The
    // tools-communities kind is served from the directory index below, not here.
    if (state.kind === "tools-communities") return [];
    const base = bundle.runtime.searchLibrary(state.query, {
      catalog_id: state.filter || undefined,
      publisher_name: state.publisher || undefined,
      object_type: state.objectType || undefined,
      control_family: state.controlFamily || undefined,
    });
    return base.filter((document: any) => !state.kind || libraryKindForRawType(document.object_type) === state.kind);
  }, [bundle.runtime, state.query, state.filter, state.publisher, state.kind, state.objectType, state.controlFamily]);
  const catalogs = useMemo(() => new Map(bundle.runtime.getCatalogs().map((catalog: any) => [catalog.id, catalog.name])), [bundle.runtime]);
  const catalogCoverage = useMemo(() => buildCatalogCoverageList(bundle.runtime.getCatalogs(), 1), [bundle.runtime]);
  const recordRows = useMemo(() => documents.map((document: any) => ({
    document,
    matchReason: matchReasonFor(document, state.query),
    title: recordDisplayTitle({ id: document.id, node_type: document.object_type, metadata: { item_id: document.item_id, title: document.title } }),
    publication: catalogs.get(document.catalog_id) || document.catalog_name || document.catalog_id || "Publication unavailable",
    publisherPublication: publisherPublicationLabel(document),
  })).filter((row: any) => !connectedOnly || bundle.runtime.getEdgesForNode(row.document.id, { publication_status: "published" }).length > 0), [bundle.runtime, catalogs, connectedOnly, documents, state.query]);

  const directoryResources = useMemo(() => {
    if (!searchStarted || (state.kind && state.kind !== "tools-communities")) return [];
    const matches = searchResourceDocuments(bundle.commonsSearchIndex?.documents || [], state.query).map((entry) => entry.document);
    return filterDirectoryResources(matches, { collection: state.collection });
  }, [bundle.commonsSearchIndex, searchStarted, state.collection, state.kind, state.query]);
  const allowExplanations = hasQuery && !hasFilters;
  const guideMatches = useMemo(() => {
    const query = state.query.trim().toLocaleLowerCase();
    return allowExplanations ? practitionerGuides.filter((guide) => [guide.title, guide.summary, guide.whereItSits, guide.whenItMatters].join(" ").toLocaleLowerCase().includes(query)).slice(0, 8) : [];
  }, [allowExplanations, state.query]);
  const sourceMatches = useMemo(() => {
    const query = state.query.trim().toLocaleLowerCase();
    return allowExplanations ? (bundle.runtime.dataset.sources || []).filter((source: any) => [source.id, source.display_name, source.name, source.publisher, source.agency].filter(Boolean).join(" ").toLocaleLowerCase().includes(query)).slice(0, 8) : [];
  }, [allowExplanations, bundle.runtime, state.query]);
  const resourceMatches = useMemo(() => allowExplanations ? searchExploreResources(state.query, { templates: bundle.templateRegistry.templates || [], artifacts: bundle.officialArtifactRegistry?.artifacts || [] }) : { templates: [], artifacts: [] }, [allowExplanations, bundle.officialArtifactRegistry, bundle.templateRegistry, state.query]);
  const glossaryMatches = useMemo(() => allowExplanations ? searchGlossary(state.query).slice(0, 8) : [], [allowExplanations, state.query]);

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

  const openResult = useCallback((result: any) => {
    const item = result.payload;
    if (result.kind === "record") return onOpenNode(item.document.id);
    if (result.kind === "guide") return onNavigate("patterns", { pattern: item.id });
    if (result.kind === "resource") return onNavigate("commons-detail", { id: item.id });
    if (result.kind === "source") return onNavigate("sources", { source: item.id });
    if (result.kind === "template") return onNavigate("templates", { templateType: item.templateType });
    if (result.kind === "artifact" && item.href) return window.open(item.href, "_blank", "noopener,noreferrer");
    if (result.kind === "glossary") return onOpenGlossary(item.id);
  }, [onNavigate, onOpenGlossary, onOpenNode]);
  // Only materialise the map projection when the map view is active. The
  // default Library corpus is large; building this on every list-view render
  // would be wasted work.
  const mapItems: LibraryMapItem[] = useMemo(() => state.viewMode !== "map" ? [] : unifiedResults.map((result: any) => ({
    id: result.kind === "record" ? result.payload.document.id : result.identifier,
    kind: result.kind === "record" ? displayNameFor("object_type", result.payload.document.object_type) : result.kind,
    label: result.title,
    group: result.publication,
    destination: result.kind === "record"
      ? { view: "atlas-map" as const, patch: { node: result.payload.document.id, relationshipView: "map" } }
      : result.kind === "guide"
        ? { view: "patterns" as const, patch: { pattern: result.payload.id } }
        : result.kind === "resource"
          ? { view: "commons-detail" as const, patch: { id: result.payload.id } }
          : result.kind === "source"
            ? { view: "sources" as const, patch: { source: result.payload.id } }
            : result.kind === "template"
              ? { view: "templates" as const, patch: { templateType: result.payload.templateType } }
              : undefined,
    externalHref: result.kind === "artifact" ? result.payload.href : undefined,
    onAction: result.kind === "glossary" ? () => openResult(result) : undefined,
  })), [openResult, state.viewMode, unifiedResults]);
  const activeFilters = [
    state.filter && { key: "filter", label: catalogs.get(state.filter) || state.filter },
    state.publisher && { key: "publisher", label: state.publisher },
    state.kind && { key: "kind", label: libraryKindLabel(state.kind) },
    state.objectType && { key: "objectType", label: displayNameFor("object_type", state.objectType) },
    state.controlFamily && { key: "controlFamily", label: state.controlFamily },
    state.collection && { key: "collection", label: state.collection },
    connectedOnly && { key: "connectedOnly", label: "Has connections" },
  ].filter(Boolean) as Array<{ key: keyof SearchState; label: string }>;
  const clearFilters = () => onNavigate("search", { filter: "", publisher: "", kind: "", objectType: "", controlFamily: "", collection: "", connectedOnly: "" });
  const filterProps = { allDocuments, bundle, connectedOnly, graphReady, state, onNavigate, onRequestFullGraph };
  const switchView = (viewMode: "list" | "map") => {
    const scrollY = window.scrollY;
    onNavigate("search", { viewMode });
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: "auto" })));
  };

  return (
    <Panel className="search-results-panel border-0 !bg-transparent p-0" data-visual-identity="classified-research-search">
      <PageHeader primary summary="One ranked view across published records, guides, documents, resources, communities, and sources." title="Library" />
      <form className="search-results-query-row" onSubmit={(event) => { event.preventDefault(); if (composingRef.current) return; const query = queryDraft.trim(); if (query !== state.query) onNavigate("search", { query }); window.requestAnimationFrame(() => resultsRef.current?.focus()); }} role="search">
        <label className="catalog-search search-results-query">
          <IconSearch aria-hidden="true" size={18} />
          <input aria-label="Filter results by ID, title, or topic" id="library-search-query" name="query" onChange={(event) => setQueryDraft(event.target.value)} onCompositionEnd={() => { composingRef.current = false; }} onCompositionStart={() => { composingRef.current = true; }} placeholder="Filter results by identifier, title, or topic" type="search" value={queryDraft} />
        </label>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      <div className="search-toolbar">
        <div aria-live="polite" className="search-result-count">{`${unifiedResults.length.toLocaleString()} result${unifiedResults.length === 1 ? "" : "s"}`}</div>
        <div aria-label="Library view" className="library-view-toggle" role="group">
          <button aria-pressed={state.viewMode !== "map"} onClick={() => switchView("list")} type="button"><IconList aria-hidden="true" size={16} />List</button>
          <button aria-pressed={state.viewMode === "map"} onClick={() => switchView("map")} type="button"><IconMap aria-hidden="true" size={16} />Atlas map</button>
        </div>
        <label className="search-sort"><span>Sort</span><select aria-label="Sort search results" onChange={(event) => onNavigate("search", { sort: event.target.value })} value={state.sort || "relevance"}><option value="identifier">Identifier</option><option value="publication">Publication or source</option><option value="relevance">Relevance</option><option value="title">Title</option></select></label>
        <Button aria-pressed={compareMode} onClick={() => { setCompareMode((value) => !value); setSelectedRecords([]); }} type="button" variant="secondary"><IconGitCompare aria-hidden="true" size={17} />Compare records</Button>
        {compareMode && selectedRecords.length >= 2 ? <AppLink onNavigate={onNavigate} patch={{ crosswalk: "relationships", items: selectedRecords.join(",") }} variant="primary" view="matrix">Compare {selectedRecords.length}</AppLink> : null}
        <Button className="search-mobile-filter-button" onClick={() => setFiltersOpen(true)} type="button" variant="secondary"><IconAdjustmentsHorizontal aria-hidden="true" size={17} /> Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}</Button>
      </div>

      {activeFilters.length ? <div aria-label="Active filters" className="active-filter-row">{activeFilters.map((filter) => <button className="active-filter-chip" key={filter.key} onClick={() => onNavigate("search", { [filter.key]: "" })} type="button">{filter.label}<IconX aria-hidden="true" size={13} /></button>)}<button className="clear-filter-link" onClick={clearFilters} type="button">Clear all</button></div> : null}

      <div className="search-results-layout">
        <aside aria-label="Search filters" className="search-filter-rail"><div className="search-filter-heading"><strong>Filter results</strong>{activeFilters.length ? <button onClick={clearFilters} type="button">Clear all</button> : null}</div><FilterControls {...filterProps} /></aside>
        <ul aria-busy={visibleCount > 0 && !detailsReady} aria-label="Search results" className="search-result-list" id="library-results" ref={resultsRef} tabIndex={-1}>
          {connectedOnly && !graphReady ? <p className="notice-inline" role="status">Loading connection data for this filter…</p> : null}
          {state.viewMode === "map" ? <li className="search-result-list-item search-result-list-map"><LibraryAtlasMap items={mapItems} onNavigate={onNavigate} /></li> : unifiedResults.slice(0, visibleCount).map((result: any) => {
            if (result.kind === "record") {
              const row = result.payload;
              const node = detailsReady ? bundle.runtime.getNode(row.document.id) : null;
              const relationshipCount = detailsReady ? Number(row.document.published_connection_count || 0) : 0;
              const relationshipCatalogCount = detailsReady ? Number(row.document.published_connection_catalog_count || 0) : 0;
              const path = detailsReady ? (node?.ancestor_path || []).slice(-3).map((entry: any) => entry.label).filter(Boolean).join(" › ") : "";
              const lowCoverage = detailsReady ? isLowCatalogCoverage(catalogCoverageForId(catalogCoverage, row.document.catalog_id)) : false;
              const excerpt = searchPreviewText(row.document);
              const titleLine = `${row.publisherPublication} · ${row.title}`;
              const recordType = displayNameFor("object_type", row.document.object_type);
              const selected = selectedRecords.includes(row.document.item_id);
              return (
                <li className="search-result-list-item" key={result.key}><article aria-label={row.title} className="search-result-row" data-publisher={row.document.publisher_name || row.publisherPublication} data-published-connection-count={relationshipCount} data-record-id={row.document.id} data-result-class="published-record">
                  <div className="search-result-row__type">{compareMode ? <input aria-label={`Select ${row.document.item_id} for comparison`} checked={selected} onChange={() => setSelectedRecords((items) => selected ? items.filter((id) => id !== row.document.item_id) : [...items, row.document.item_id])} type="checkbox" /> : null}{recordType}</div>
                  <div className="search-result-row__body"><h3 id={`title-${row.document.id}`}><AppLink aria-label={row.title} className="search-result-primary" onNavigate={onNavigate} patch={{ node: row.document.id }} view="library-detail"><MarkedSearchText query={state.query} text={titleLine} /></AppLink></h3><p className="search-result-row__source">{row.document.item_id || row.document.id} · {recordType}</p>{detailsReady && path ? <p className="search-result-row__path">{path}</p> : null}{detailsReady ? <p className="search-result-row__excerpt"><MarkedSearchText query={state.query} text={excerpt} /></p> : null}{detailsReady ? <div className="search-result-row__signals"><span>{row.matchReason}</span><span>{connectionSummary(relationshipCount, relationshipCatalogCount)}</span>{lowCoverage ? <Badge tone="warning">Limited coverage</Badge> : null}</div> : null}</div>
                  {detailsReady ? <div className="search-result-row__actions"><AppLink aria-label={`Compare ${row.document.item_id || row.title}`} onNavigate={onNavigate} patch={{ crosswalk: "relationships", items: row.document.item_id }} view="matrix">Compare</AppLink><button aria-label={`Copy link to ${row.document.item_id || row.title}`} onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}${serializeHashUrl(normalizeViewState("library-detail", { view: "library-detail", node: row.document.id }))}`)} type="button">Copy link</button></div> : null}
                </article></li>
              );
            }
            const item = result.payload;
            const type = result.kind === "guide" ? "Practitioner guide" : result.kind === "resource" ? (item.resourceType === "community_forum" ? "Community" : resourceTypeLabel(item.resourceType)) : result.kind === "source" ? "Source register" : result.kind === "template" ? "Starter document" : result.kind === "artifact" ? "Official resource" : "Glossary · Control Atlas explanation";
            const summary = result.kind === "source" ? `Publisher: ${item.publisher || item.agency || "Source owner"}` : result.kind === "glossary" ? `${item.definition} Reference: ${item.source}` : item.summary;
            const publisher = result.publication || "Publisher unavailable";
            const titleLine = `${publisher} · ${result.title}`;
            const titleContent = <><MarkedSearchText query={state.query} text={titleLine} /><IconArrowUpRight aria-hidden="true" size={15} /></>;
            const titleTarget = result.kind === "artifact" && item.href
              ? <a aria-label={`Open ${titleLine}`} className="search-result-primary" href={item.href} rel="noopener noreferrer" target="_blank">{titleContent}</a>
              : result.kind === "glossary"
                ? <button aria-label={`Open ${titleLine}`} className="search-result-primary" onClick={() => openResult(result)} type="button">{titleContent}</button>
                : <AppLink aria-label={`Open ${titleLine}`} className="search-result-primary" onNavigate={onNavigate} patch={result.kind === "guide" ? { pattern: item.id } : result.kind === "resource" ? { id: item.id } : result.kind === "source" ? { source: item.id } : { templateType: item.templateType }} view={result.kind === "guide" ? "patterns" : result.kind === "resource" ? "commons-detail" : result.kind === "source" ? "sources" : "templates"}>{titleContent}</AppLink>;
            return <li className="search-result-list-item" key={result.key}><article aria-labelledby={`title-${result.key}`} className="search-result-row search-result-row--universal" data-publisher={publisher} data-result-class={result.kind}><div className="search-result-row__type">{type}</div><div className="search-result-row__body"><h3 id={`title-${result.key}`}>{titleTarget}</h3><p className="search-result-row__source">{result.identifier} · {type}{result.kind === "resource" ? ` · ${resourceAccessLabel(item)}` : ""}</p>{detailsReady ? <p className="search-result-row__excerpt"><MarkedSearchText query={state.query} text={summary} /></p> : null}{detailsReady ? <div className="search-result-row__signals"><span>Matched {type.toLocaleLowerCase()} metadata</span></div> : null}</div></article></li>;
          })}
          {state.viewMode !== "map" && visibleCount > 0 && unifiedResults.length > visibleCount ? <li className="search-result-list-action"><Button onClick={() => setVisibleCount((count) => count + 25)} type="button" variant="secondary">Show 25 more</Button></li> : null}
          {state.viewMode !== "map" && unifiedResults.length === 0 ? <li className="search-result-list-item"><section className="empty-state"><IconSparkles aria-hidden="true" size={24} /><h2>No matching results found.</h2><p>Try an identifier, title, topic, publication, or remove a filter.</p><Button onClick={() => onNavigate("search", { query: "", filter: "", publisher: "", kind: "", objectType: "", controlFamily: "", collection: "", connectedOnly: "", sort: "relevance", viewMode: "list" })} type="button" variant="primary">Clear search</Button></section></li> : null}
        </ul>
      </div>

      {filtersOpen ? createPortal(<div className="search-filter-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}><section aria-label="Filter search results" aria-modal="true" className="search-filter-drawer" role="dialog"><header><div><p className="eyebrow">Library</p><h2>Filter results</h2></div><button aria-label="Close filters" onClick={() => setFiltersOpen(false)} type="button"><IconX aria-hidden="true" size={20} /></button></header><FilterControls {...filterProps} /><footer><Button onClick={() => setFiltersOpen(false)} type="button" variant="primary">Show {unifiedResults.length.toLocaleString()} results</Button>{activeFilters.length ? <Button onClick={clearFilters} type="button" variant="secondary">Clear all</Button> : null}</footer></section></div>, document.body) : null}
    </Panel>
  );
}
