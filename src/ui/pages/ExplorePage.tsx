import * as Accordion from "@radix-ui/react-accordion";
import { IconSearch, IconSparkles } from "@tabler/icons-react";
import { useMemo, useRef } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { ProvenanceTerm } from "../components/ProvenanceTerm";
import {
  buildCatalogCoverageList,
  catalogCoverageForId,
  isLowCatalogCoverage,
} from "../lib/catalogCoverage";
import { searchGlossary } from "../lib/glossarySearch.mjs";
import { searchExploreResources } from "../lib/exploreResourceSearch.mjs";
import {
  resourceAccessLabel,
  resourceTypeLabel,
} from "../lib/resourceBrands.mjs";
import { searchResourceDocuments } from "../lib/resourceSearch.mjs";
import { serializeHashUrl } from "../lib/hashRoutes";
import { recordDisplayTitle } from "../lib/recordTitle";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import type { ViewState } from "../lib/viewState";
import {
  Badge,
  CardTitle,
  DisclosurePanel,
  PATTERN_RENAMES,
  SelectField,
  openAtlasMapForNode,
} from "../lib/pagePrimitives";
import { Button, Panel } from "../components/lsm";

// W11 — every nonexact result must show why it matched; search relevance
// must never be presented as a graph relationship (that stays search-only,
// computed here, not written back into the runtime search index).
function matchReasonFor(document: any, query: string): string {
  const needle = query.trim().toLowerCase();
  if (!needle) return "Matches active filters";
  const itemId = String(document.item_id || document.id || "").toLowerCase();
  const title = String(document.title || "").toLowerCase();
  if (itemId === needle) return "Exact identifier";
  if (itemId.startsWith(needle)) return "Identifier match";
  if (title.includes(needle)) return "Title match";
  return "Official text match";
}

export function ExplorePage(props: {
  bundle: RuntimeBundle;
  graphReady: boolean;
  state: Extract<ViewState, { view: "search" }>;
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
  const connectionsOnly = state.connectedOnly === "true";
  const resultsRef = useRef<HTMLDivElement>(null);

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
  const hasQuery = Boolean(state.query.trim());
  const searchStarted = hasQuery || hasFilters;

  const documents = useMemo(() => {
    return searchStarted
      ? bundle.runtime.searchLibrary(state.query, filters)
      : [];
  }, [
    bundle.runtime,
    searchStarted,
    state.query,
    state.filter,
    state.objectType,
    state.sourceClass,
    state.controlFamily,
    state.severity,
  ]);

  const glossaryMatches = useMemo(
    () => (hasQuery ? searchGlossary(state.query) : []),
    [hasQuery, state.query],
  );
  const resourceMatches = useMemo(
    () =>
      !hasQuery || hasFilters
        ? { templates: [], artifacts: [] }
        : searchExploreResources(state.query, {
            templates: bundle.templateRegistry.templates || [],
            artifacts: bundle.officialArtifactRegistry?.artifacts || [],
          }),
    [
      bundle.officialArtifactRegistry,
      bundle.templateRegistry,
      hasQuery,
      hasFilters,
      state.query,
    ],
  );
  const directoryResources = useMemo(
    () =>
      !hasQuery || hasFilters
        ? []
        : searchResourceDocuments(
            bundle.commonsSearchIndex?.documents || [],
            state.query,
            8,
          ).map((entry) => entry.document),
    [bundle.commonsSearchIndex, hasFilters, hasQuery, state.query],
  );

  const catalogCoverage = useMemo(
    () => buildCatalogCoverageList(bundle.runtime.getCatalogs(), 1),
    [bundle.runtime],
  );

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
        const lowCoverage = isLowCatalogCoverage(
          catalogCoverageForId(catalogCoverage, document.catalog_id),
        );
        const matchReason = matchReasonFor(document, state.query);
        return { document, node, relationshipCount, source, lowCoverage, matchReason };
      }),
    [bundle.runtime, catalogCoverage, documents, state.query],
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
  // The runtime's own search returns ONLY exact identifier matches when any
  // exist (never mixed with partial text matches) — reusing that same rule
  // here, not inventing a new one, keeps this label honest.
  const isExactResultSet =
    hasQuery &&
    visibleDocumentRows.length > 0 &&
    visibleDocumentRows.every((row) => row.matchReason === "Exact identifier");
  const hasVisibleResults =
    visibleDocumentRows.length > 0 ||
    glossaryMatches.length > 0 ||
    directoryResources.length > 0 ||
    resourceMatches.templates.length > 0 ||
    resourceMatches.artifacts.length > 0;
  const directoryGroups = [
    {
      label: "Tools and resources",
      resources: directoryResources.filter(
        (resource) => resource.resourceType !== "community_forum",
      ),
    },
    {
      label: "Communities",
      resources: directoryResources.filter(
        (resource) => resource.resourceType === "community_forum",
      ),
    },
  ].filter((group) => group.resources.length > 0);

  // Bound the DOM: an empty query matches the whole library (9k+ records).
  // Open every group only for small result sets; always cap the cards
  // rendered per group so browsing stays responsive.
  const GROUP_RENDER_CAP = 5;
  const openAllGroups = visibleDocumentRows.length <= 10;
  const defaultOpenGroups = [
    ...directoryGroups.map((group) => group.label),
    ...(resourceMatches.templates.length ? ["Templates"] : []),
    ...(resourceMatches.artifacts.length ? ["Official resources"] : []),
    ...(glossaryMatches.length ? ["Glossary"] : []),
    ...(openAllGroups
      ? Object.keys(groupedDocuments)
      : Object.keys(groupedDocuments).slice(0, 1)),
  ];

  const facets = bundle.runtime.getLibraryFacets();

  return (
    <>
      <Panel className="search-results-panel border-0 !bg-transparent p-0">
        <header className="page-header">
          <div className="page-header-row">
            <div>
              <h1>Library</h1>
              <p className="page-summary">
                Search every published record, or browse the publications they
                come from.
              </p>
            </div>
            <div className="page-header-action">
              <Button
                onClick={() => onNavigate("catalog-detail", { catalog: "" })}
                type="button"
                variant="secondary"
              >
                Browse publications
              </Button>
            </div>
          </div>
        </header>
        <label className="catalog-search search-results-query">
          <IconSearch aria-hidden="true" size={18} />
          <input
            aria-label="Search query"
            onChange={(event) => onNavigate("search", { query: event.target.value })}
            placeholder="Search by identifier, title, or topic"
            type="search"
            value={state.query}
          />
        </label>
        <Accordion.Root className="accordion-root" collapsible type="single">
          <DisclosurePanel title="Refine results" value="filters">
            <div className="filter-grid">
              <SelectField
                label="Catalog"
                onChange={(value) =>
                  onNavigate("search", { filter: value })
                }
                options={bundle.runtime.getCatalogs().map((catalog: any) => ({
                  value: catalog.id,
                  label: catalog.name,
                }))}
                value={state.filter}
              />
              <SelectField
                label="Item type"
                onChange={(value) =>
                  onNavigate("search", { objectType: value })
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
                  onNavigate("search", { sourceClass: value })
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
                  onNavigate("search", { controlFamily: value })
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
                  onNavigate("search", { severity: value })
                }
                options={facets.severities.map((value: string) => ({
                  value,
                  label: value,
                }))}
                value={state.severity}
              />
              <label className="connections-only-filter" htmlFor="connections-only">
                <input
                  checked={connectionsOnly}
                  id="connections-only"
                  onChange={(event) => {
                    const checked = event.target.checked;
                    onNavigate("search", {
                      ...state,
                      connectedOnly: checked ? "true" : "",
                    });
                    if (checked && !graphReady) {
                      onRequestFullGraph();
                    }
                  }}
                  type="checkbox"
                />
                Only show items with published connections
              </label>
            </div>
          </DisclosurePanel>
        </Accordion.Root>
        {connectionsOnly && !graphReady ? (
          <p className="notice-inline" role="status">
            Loading connection data for this filter…
          </p>
        ) : null}

        {searchStarted && hasVisibleResults && visibleDocumentRows.length ? (
          <p className="notice-inline" role="status">
            {isExactResultSet
              ? `Exact match${visibleDocumentRows.length === 1 ? "" : "es"} for "${state.query}".`
              : `Published text matches for "${state.query}" — each result below shows why it matched.`}
          </p>
        ) : null}

        {searchStarted && hasVisibleResults ? (
          <Accordion.Root
            aria-label="Search results"
            className="accordion-root search-result-groups"
            defaultValue={defaultOpenGroups}
            id="library-results"
            key={state.query}
            ref={resultsRef}
            tabIndex={-1}
            type="multiple"
          >
            {visibleDocumentRows.length ? (
              <p className="result-meta search-result-section-label">
                Published records ({visibleDocumentRows.length})
              </p>
            ) : null}
            {Object.entries(groupedDocuments as Record<string, any[]>).map(
              ([group, entries]) => (
                <DisclosurePanel
                  key={group}
                  title={`${group} (${entries.length})`}
                  value={group}
                >
                  <div className="stack">
                    {entries
                      .slice(0, GROUP_RENDER_CAP)
                      .map(
                        ({
                          document,
                          node,
                          relationshipCount,
                          source,
                          lowCoverage,
                          matchReason,
                        }) => {
                        return (
                          <article
                            className="result-card"
                            key={document.id}
                            aria-labelledby={`title-${document.id}`}
                            // Only set when the description paragraph is
                            // actually rendered — a dangling reference points
                            // assistive tech at nothing.
                            aria-describedby={
                              document.description_available
                                ? undefined
                                : `desc-${document.id}`
                            }
                          >
                            <div className="result-card-header">
                              <div>
                                <p className="result-meta">
                                  {displayNameFor(
                                    "object_type",
                                    document.object_type,
                                  )}
                                </p>
                                <CardTitle
                                  id={`title-${document.id}`}
                                  onOpen={() =>
                                    onOpenNode(document.id, "search")
                                  }
                                >
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
                                </CardTitle>
                              </div>
                              <div className="result-card-badges">
                                {hasQuery && matchReason !== "Exact identifier" ? (
                                  <span className="result-match-reason">
                                    {matchReason}
                                  </span>
                                ) : null}
                                {relationshipCount > 0 ? (
                                  <Badge tone="info">
                                    {relationshipCount} connections
                                  </Badge>
                                ) : graphReady ? (
                                  <span className="no-connections">
                                    No connections yet
                                  </span>
                                ) : null}
                                {lowCoverage ? (
                                  <Badge tone="warning">Limited coverage</Badge>
                                ) : null}
                              </div>
                            </div>
                            {/* When a description exists the card used to say
                                "Open this record to read the published text."
                                on every single result — an instruction the
                                Open record button already gives. Only the
                                absence is worth stating. */}
                            {document.description_available ? null : (
                              <p className="result-summary" id={`desc-${document.id}`}>
                                No narrative description was published for this
                                record.
                              </p>
                            )}
                            <div className="result-support">
                              <span>
                                Source:{" "}
                                {source?.display_name ||
                                  source?.name ||
                                  document.source_name ||
                                  "Source unavailable"}
                              </span>
                              {source?.provenance_class ||
                              document.source_class ? (
                                <ProvenanceTerm
                                  kind="provenance"
                                  value={
                                    source?.provenance_class ||
                                    document.source_class
                                  }
                                />
                              ) : null}
                            </div>
                            <div className="card-actions">
                              <Button
                                variant="primary"
                                onClick={() => onOpenNode(document.id, "search")}
                                type="button"
                              >
                                Open record
                              </Button>
                              <details className="result-actions-menu">
                                <summary>More actions</summary>
                                <div className="result-actions-popover">
                                  {relationshipCount > 0 || !graphReady ? (
                                    <Button
                                      variant="secondary"
                                      onClick={() =>
                                        openAtlasMapForNode(
                                          onNavigate,
                                          document.id,
                                        )
                                      }
                                      type="button"
                                    >
                                      Open in the Atlas
                                    </Button>
                                  ) : null}
                                  <Button
                                    variant="secondary"
                                    onClick={() =>
                                      onNavigate("matrix", {
                                        crosswalk: "relationships",
                                        items: document.item_id,
                                      })
                                    }
                                    type="button"
                                  >
                                    Compare
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    onClick={() =>
                                      navigator.clipboard?.writeText(
                                        `${window.location.origin}${window.location.pathname}${serializeHashUrl(
                                          {
                                            view: "library-detail",
                                            node: document.id,
                                            from: "search",
                                          },
                                        )}`,
                                      )
                                    }
                                    type="button"
                                  >
                                    Copy link
                                  </Button>
                                </div>
                              </details>
                            </div>
                          </article>
                        );
                      })}
                    {entries.length > GROUP_RENDER_CAP ? (
                      <p className="muted">
                        Showing the first {GROUP_RENDER_CAP} of {entries.length}
                        . Search or use “Refine results” to narrow this list.
                      </p>
                    ) : null}
                  </div>
                </DisclosurePanel>
              ),
            )}
            {directoryGroups.map((group) => (
              <DisclosurePanel
                key={group.label}
                title={`${group.label} (${group.resources.length})`}
                value={group.label}
              >
                <div className="stack">
                  {group.resources.map((resource) => (
                    <article
                      aria-describedby={`desc-${resource.id}`}
                      aria-labelledby={`title-${resource.id}`}
                      className="result-card"
                      key={resource.id}
                    >
                      <div className="result-card-header">
                        <div>
                          <p className="result-meta">External resource</p>
                          <CardTitle
                            id={`title-${resource.id}`}
                            onOpen={() =>
                              onNavigate("commons-detail", {
                                id: resource.id,
                                from: "search",
                              })
                            }
                          >
                            {resource.name}
                          </CardTitle>
                        </div>
                        <Badge tone="info">
                          {resourceTypeLabel(resource.resourceType)}
                        </Badge>
                      </div>
                      <p className="result-summary" id={`desc-${resource.id}`}>
                        {resource.summary}
                      </p>
                      <p className="result-support">
                        Owner: {resource.publisher} · {resourceAccessLabel(resource)}
                      </p>
                    </article>
                  ))}
                </div>
              </DisclosurePanel>
            ))}
            {resourceMatches.templates.length ? (
              <DisclosurePanel
                title={`Templates (${resourceMatches.templates.length})`}
                value="Templates"
              >
                <div className="stack">
                  {resourceMatches.templates.map((template: any) => (
                    <article className="result-card" key={template.id} aria-labelledby={`title-${template.id}`} aria-describedby={`desc-${template.id}`}>
                      <div className="result-card-header">
                        <div>
                          <p className="result-meta">Starter template</p>
                          <CardTitle
                            id={`title-${template.id}`}
                            onOpen={() =>
                              onNavigate("templates", {
                                templateType: template.templateType,
                              })
                            }
                          >
                            {template.title}
                          </CardTitle>
                        </div>
                        <Badge tone="info">{template.classification}</Badge>
                      </div>
                      <p className="result-summary" id={`desc-${template.id}`}>{template.summary}</p>
                    </article>
                  ))}
                </div>
              </DisclosurePanel>
            ) : null}
            {resourceMatches.artifacts.length ? (
              <DisclosurePanel
                title={`Official resources (${resourceMatches.artifacts.length})`}
                value="Official resources"
              >
                <div className="stack">
                  {resourceMatches.artifacts.map((artifact: any) => (
                    <article className="result-card" key={artifact.id} aria-labelledby={`title-${artifact.id}`} aria-describedby={`desc-${artifact.id}`}>
                      <div className="result-card-header">
                        <div>
                          <p className="result-meta">Official resource</p>
                          <CardTitle id={`title-${artifact.id}`} href={artifact.href || undefined}>
                            {artifact.title}
                          </CardTitle>
                        </div>
                        <Badge
                          tone={
                            artifact.classification === "official_current"
                              ? "success"
                              : "warning"
                          }
                        >
                          {displayNameFor(
                            "compatibility_level",
                            artifact.classification,
                          )}
                        </Badge>
                      </div>
                      <p className="result-summary" id={`desc-${artifact.id}`}>{artifact.summary}</p>
                      <p className="result-support">
                        {artifact.version ? `Version: ${artifact.version}` : ""}
                      </p>
                    </article>
                  ))}
                </div>
              </DisclosurePanel>
            ) : null}
            {glossaryMatches.length ? (
              <DisclosurePanel
                title={`Glossary (${glossaryMatches.length})`}
                value="Glossary"
              >
                <div className="stack">
                  {glossaryMatches.map((entry) => (
                    <article className="result-card" key={entry.id} aria-labelledby={`title-${entry.id}`} aria-describedby={`desc-${entry.id}`}>
                      <div className="result-card-header">
                        <div>
                          <p className="result-meta">Glossary term</p>
                          <CardTitle id={`title-${entry.id}`} onOpen={() => onOpenGlossary(entry.id)}>
                            {entry.term}
                            {entry.expansion ? ` · ${entry.expansion}` : ""}
                          </CardTitle>
                        </div>
                        <Badge tone="info">Control Atlas explanation</Badge>
                      </div>
                      <p className="result-summary" id={`desc-${entry.id}`}>{entry.definition}</p>
                      <p className="result-meta">Reference: {entry.source}</p>
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
                    </article>
                  ))}
                </div>
              </DisclosurePanel>
            ) : null}
          </Accordion.Root>
        ) : connectionsOnly && documents.length > 0 ? (
          <section className="empty-state">
            <IconSparkles aria-hidden="true" size={24} stroke={1.8} />
            <h2>No matching connected records found.</h2>
            <p>
              Matching records exist, but none have published connections in the
              current data.
            </p>
            <Button
              variant="secondary"
              onClick={() =>
                onNavigate("search", { ...state, connectedOnly: "" })
              }
              type="button"
            >
              Show all matching records
            </Button>
          </section>
        ) : hasQuery || hasFilters ? (
          <section className="empty-state">
            <IconSparkles aria-hidden="true" size={24} stroke={1.8} />
            <h2>No matching records found.</h2>
            <p aria-live="polite">
              Try searching by control ID, topic, baseline, CCI, or source.
            </p>
            <div className="card-actions">
              <Button
                variant="primary"
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
              </Button>
              <details>
                <summary>Try another path</summary>
                <div className="card-actions disclosure-actions">
                  <Button variant="secondary" onClick={() => onNavigate("atlas-map")} type="button">Open the Atlas</Button>
                </div>
              </details>
            </div>
          </section>
        ) : (
          <section className="empty-state subtle">
            <p className="muted">
              Try encryption, access control, or passwords.
            </p>
          </section>
        )}
      </Panel>
    </>
  );
}
