import * as Accordion from "@radix-ui/react-accordion";
import { IconSearch, IconSparkles } from "@tabler/icons-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { ProvenanceTerm } from "../components/ProvenanceTerm";
import { searchGlossary } from "../lib/glossarySearch.mjs";
import { serializeHashUrl } from "../lib/hashRoutes";
import { recordDisplayTitle } from "../lib/recordTitle";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import {
  Badge,
  DisclosurePanel,
  PageHeader,
  PATTERN_RENAMES,
  SelectField,
  openAtlasMapForNode,
} from "../lib/pagePrimitives";

export function ExplorePage(props: {
  bundle: RuntimeBundle;
  graphReady: boolean;
  state: Extract<ViewState, { view: "search" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
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
    onOpenGlossary,
  } = props;
  const [queryDraft, setQueryDraft] = useState(state.query);
  const [connectionsOnly, setConnectionsOnly] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQueryDraft(state.query);
  }, [state.query]);

  // CATL-17: when a committed query arrives (typed into the header overlay and
  // submitted, or a deep link), carry focus into the results region so keyboard
  // users continue into the results instead of the top of the page. The header
  // overlay and Explore then read as one search surface, not two.
  useEffect(() => {
    if (state.query.trim()) {
      resultsRef.current?.focus();
    }
  }, [state.query]);

  const filters = {
    catalog_id: state.filter || undefined,
    object_type: state.objectType || undefined,
    source_class: state.sourceClass || undefined,
    control_family: state.controlFamily || undefined,
    severity: state.severity || undefined,
  };

  const hasFilters = Boolean(
    state.filter ||
      state.objectType ||
      state.sourceClass ||
      state.controlFamily ||
      state.severity,
  );

  const documents = useMemo(() => {
    return bundle.runtime.searchLibrary(state.query, filters);
  }, [
    bundle.runtime,
    state.query,
    state.filter,
    state.objectType,
    state.sourceClass,
    state.controlFamily,
    state.severity,
  ]);

  const glossaryMatches = useMemo(
    () => searchGlossary(state.query),
    [state.query],
  );
  const hasQuery = Boolean(state.query.trim());

  const documentRows = useMemo(
    () =>
      documents.map((document: any) => {
        const source = bundle.runtime.getSource(document.source_id);
        const node = bundle.runtime.getNode(document.id);
        const relationshipCount = node
          ? bundle.runtime.getEdgesForNode(node.id, {
              publication_status: "published",
            }).length
          : 0;
        return { document, node, relationshipCount, source };
      }),
    [bundle.runtime, documents],
  );

  const visibleDocumentRows = useMemo(
    () =>
      connectionsOnly
        ? documentRows.filter((row) => row.relationshipCount > 0)
        : documentRows,
    [connectionsOnly, documentRows],
  );

  const groupedDocuments = useMemo<Record<string, typeof documentRows>>(() => {
    return visibleDocumentRows.reduce(
      (groups: Record<string, any[]>, document: any) => {
        const key = displayNameFor(
          "object_type",
          document.document.object_type,
        );
        groups[key] ||= [];
        groups[key].push(document);
        return groups;
      },
      {},
    );
  }, [visibleDocumentRows]);
  const hasVisibleResults =
    visibleDocumentRows.length > 0 || glossaryMatches.length > 0;

  // Bound the DOM: an empty query matches the whole library (9k+ records).
  // Open every group only for small result sets; always cap the cards
  // rendered per group so browsing stays responsive.
  const GROUP_RENDER_CAP = 30;
  const openAllGroups = visibleDocumentRows.length <= 60;
  const defaultOpenGroups = [
    ...(glossaryMatches.length ? ["Glossary"] : []),
    ...(openAllGroups
      ? Object.keys(groupedDocuments)
      : Object.keys(groupedDocuments).slice(0, 1)),
  ];

  const facets = bundle.runtime.getLibraryFacets();

  return (
    <>
      <section className="panel search-panel">
        <PageHeader
          eyebrow="Explore"
          action={
            <button
              className="secondary"
              onClick={() => onNavigate("start-here")}
              type="button"
            >
              Start guided path
            </button>
          }
          summary="Search controls, baselines, CCIs, STIGs, terms, templates, playbooks, and sources. Open a record to see what it means and how it connects."
          title="Explore the control landscape"
        />

        {!graphReady ? (
          <p className="notice-inline" role="status">
            Search is ready. Detail pages and comparisons unlock when
            connection data finishes loading.
          </p>
        ) : null}

        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            onNavigate("search", { ...state, query: queryDraft.trim() });
          }}
        >
          <label className="field grow" htmlFor="search-query">
            <span>Search by ID, title, or topic</span>
            <div className="search-input">
              <IconSearch aria-hidden="true" size={18} stroke={1.8} />
              <input
                id="search-query"
                onChange={(event) => setQueryDraft(event.target.value)}
                placeholder="AC-2, account management, FedRAMP High, CCI-000225"
                type="search"
                value={queryDraft}
              />
            </div>
          </label>
          <button className="primary" type="submit">
            Search
          </button>
        </form>

        <Accordion.Root className="accordion-root" collapsible type="single">
          <DisclosurePanel title="Refine results" value="filters">
            <div className="filter-grid">
              <SelectField
                label="Catalog"
                onChange={(value) =>
                  onNavigate("search", { ...state, filter: value })
                }
                options={bundle.runtime
                  .getCatalogs()
                  .map((catalog: any) => ({
                    value: catalog.id,
                    label: catalog.name,
                  }))}
                value={state.filter}
              />
              <SelectField
                label="Item type"
                onChange={(value) =>
                  onNavigate("search", { ...state, objectType: value })
                }
                options={facets.objectTypes.map((value: string) => ({
                  value,
                  label: displayNameFor("object_type", value),
                }))}
                value={state.objectType}
              />
              <SelectField
                label="Source type"
                onChange={(value) =>
                  onNavigate("search", { ...state, sourceClass: value })
                }
                options={facets.sourceClasses.map((value: string) => ({
                  value,
                  label: displayNameFor("provenance_class", value),
                }))}
                value={state.sourceClass}
              />
              <SelectField
                label="Control family"
                onChange={(value) =>
                  onNavigate("search", { ...state, controlFamily: value })
                }
                options={facets.controlFamilies.map((value: string) => ({
                  value,
                  label: value,
                }))}
                value={state.controlFamily}
              />
              <SelectField
                label="Severity"
                onChange={(value) =>
                  onNavigate("search", { ...state, severity: value })
                }
                options={facets.severities.map((value: string) => ({
                  value,
                  label: value,
                }))}
                value={state.severity}
              />
            </div>
          </DisclosurePanel>
        </Accordion.Root>

        <label className="connections-only-filter" htmlFor="connections-only">
          <input
            checked={connectionsOnly}
            id="connections-only"
            onChange={(event) => setConnectionsOnly(event.target.checked)}
            type="checkbox"
          />
          Show only items with connections
        </label>

        {hasVisibleResults ? (
          <Accordion.Root
            aria-label="Search results"
            className="accordion-root search-result-groups"
            defaultValue={defaultOpenGroups}
            id="library-results"
            key={`${state.query}|${Object.keys(groupedDocuments).join(",")}`}
            ref={resultsRef}
            tabIndex={-1}
            type="multiple"
          >
            {glossaryMatches.length ? (
              <DisclosurePanel
                title={`Glossary (${glossaryMatches.length})`}
                value="Glossary"
              >
                <div className="stack">
                  {glossaryMatches.map((entry) => (
                    <article className="result-card" key={entry.id}>
                      <div className="result-card-header">
                        <div>
                          <p className="result-meta">Glossary term</p>
                          <h3>
                            {entry.term}
                            {entry.expansion ? ` · ${entry.expansion}` : ""}
                          </h3>
                        </div>
                        <Badge tone={entry.consensus ? "warning" : "success"}>
                          {entry.consensus
                            ? "Practitioner consensus"
                            : "Official source"}
                        </Badge>
                      </div>
                      <p className="result-summary">{entry.definition}</p>
                      <div className="chip-row">
                        {entry.related_patterns.map((patternId) => (
                          <button
                            className="chip"
                            key={patternId}
                            onClick={() =>
                              onNavigate("patterns", { pattern: patternId })
                            }
                            type="button"
                          >
                            {PATTERN_RENAMES[patternId] || patternId}
                          </button>
                        ))}
                        {entry.relatedTemplateIds.map((templateId) => (
                          <button
                            className="chip"
                            key={templateId}
                            onClick={() =>
                              onNavigate("templates", {
                                templateType: templateId,
                              })
                            }
                            type="button"
                          >
                            {templateId.replaceAll("_", " ")}
                          </button>
                        ))}
                      </div>
                      <div className="card-actions">
                        <button
                          className="primary"
                          onClick={() => onOpenGlossary(entry.id)}
                          type="button"
                        >
                          Open term details
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </DisclosurePanel>
            ) : null}
            {Object.entries(groupedDocuments as Record<string, any[]>).map(
              ([group, entries]) => (
                <DisclosurePanel
                  key={group}
                  title={`${group} (${entries.length})`}
                  value={group}
                >
                  <div className="stack">
                    {entries.slice(0, GROUP_RENDER_CAP).map(({ document, node, relationshipCount, source }) => {
                      return (
                        <article className="result-card" key={document.id}>
                          <div className="result-card-header">
                            <div>
                              <p className="result-meta">
                                {displayNameFor(
                                  "object_type",
                                  document.object_type,
                                )}
                              </p>
                              <h3>
                                {recordDisplayTitle(
                                  node ?? {
                                    id: document.id,
                                    node_type: document.object_type,
                                    metadata: {
                                      item_id: document.item_id,
                                      title: document.title,
                                    },
                                  },
                                )}
                              </h3>
                            </div>
                            {relationshipCount > 0 ? (
                              <Badge tone="info">
                                {relationshipCount} connections
                              </Badge>
                            ) : (
                              <span className="no-connections">
                                No connections yet
                              </span>
                            )}
                          </div>
                          <p className="result-summary">
                            {document.plain_language_summary ||
                              node?.plain_language_summary ||
                              document.description}
                          </p>
                          <div className="result-support">
                            <span>
                              Source:{" "}
                              {source?.display_name ||
                                source?.name ||
                                "Source unavailable"}
                            </span>
                            {source?.provenance_class ? (
                              <ProvenanceTerm
                                kind="provenance"
                                value={source.provenance_class}
                              />
                            ) : null}
                          </div>
                          <div className="card-actions">
                            <button
                              className="primary"
                              disabled={!graphReady}
                              onClick={() => onOpenNode(document.id, "search")}
                              title={
                                graphReady
                                  ? undefined
                                  : "Detail views unlock when connections finish loading"
                              }
                              type="button"
                            >
                              Open record
                            </button>
                            <details className="result-actions-menu">
                              <summary role="button">More actions</summary>
                              <div className="result-actions-popover">
                                {relationshipCount > 0 ? (
                                  <button
                                    className="secondary"
                                    disabled={!graphReady}
                                    onClick={() =>
                                      openAtlasMapForNode(onNavigate, document.id)
                                    }
                                    type="button"
                                  >
                                    Open in Atlas Map
                                  </button>
                                ) : null}
                                <button
                                  className="secondary"
                                  disabled={!graphReady}
                                  onClick={() =>
                                    onNavigate("matrix", {
                                      workbench: "relationships",
                                      items: document.item_id,
                                    })
                                  }
                                  type="button"
                                >
                                  Compare
                                </button>
                                <button
                                  className="secondary"
                                  onClick={() =>
                                    navigator.clipboard?.writeText(
                                      `${window.location.origin}${window.location.pathname}${serializeHashUrl({
                                        view: "library-detail",
                                        node: document.id,
                                        from: "search",
                                      })}`,
                                    )
                                  }
                                  type="button"
                                >
                                  Copy link
                                </button>
                              </div>
                            </details>
                          </div>
                        </article>
                      );
                    })}
                    {entries.length > GROUP_RENDER_CAP ? (
                      <p className="muted">
                        Showing the first {GROUP_RENDER_CAP} of{" "}
                        {entries.length}. Search or use “Refine results” to
                        narrow this list.
                      </p>
                    ) : null}
                  </div>
                </DisclosurePanel>
              ),
            )}
          </Accordion.Root>
        ) : connectionsOnly && documents.length > 0 ? (
          <section className="empty-state">
            <IconSparkles aria-hidden="true" size={24} stroke={1.8} />
            <h2>No matching connected records found.</h2>
            <p>
              Matching records exist, but none have published connections in
              the current data.
            </p>
            <button
              className="secondary"
              onClick={() => setConnectionsOnly(false)}
              type="button"
            >
              Show all matching records
            </button>
          </section>
        ) : hasQuery || hasFilters ? (
          <section className="empty-state">
            <IconSparkles aria-hidden="true" size={24} stroke={1.8} />
            <h2>No matching records found.</h2>
            <p>
              Try searching by control ID, topic, baseline, CCI, or source.
            </p>
            <div className="card-actions">
              <button
                className="secondary"
                onClick={() =>
                  onNavigate("search", {
                    query: "",
                    filter: "",
                    objectType: "",
                    sourceClass: "",
                    controlFamily: "",
                    severity: "",
                  })
                }
                type="button"
              >
                Clear search
              </button>
              <button
                className="secondary"
                onClick={() => onNavigate("atlas-map")}
                type="button"
              >
                Open Atlas Map
              </button>
              <button
                className="primary"
                onClick={() => onNavigate("start-here")}
                type="button"
              >
                Start guided path
              </button>
            </div>
          </section>
        ) : (
          <section className="empty-state subtle">
            <p className="muted">
              Try AC-2, FedRAMP High, CCI-000225, or account management.
            </p>
          </section>
        )}
      </section>
    </>
  );
}
