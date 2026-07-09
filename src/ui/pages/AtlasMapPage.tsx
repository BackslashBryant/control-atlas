import { useCallback, useEffect, useMemo, useState } from "react";

import {
  RelationshipExplorer,
  relationshipFiltersFromState,
  relationshipFiltersToPatch,
} from "../components/RelationshipExplorer";
import { AtlasMatrix } from "../components/AtlasMatrix";
import { DEFAULT_MAP_WARNINGS } from "../graph/defaultMapFilter.ts";
import { expandFocusedControlCluster } from "../graph/buildFocusedControlRings.ts";
import { SOURCE_HIERARCHY_LABELS } from "../graph/sourceHierarchy.ts";
import { SOURCE_RUNTIME_ANCHORS } from "../graph/sourceRuntimeAnchors.ts";
import { SOURCE_SEED_MANIFEST } from "../graph/sourceSeedManifest.ts";
import type { SourceHierarchyTier } from "../graph/sourceManifest.ts";
import {
  buildVisibleRelationshipModel,
  type SourceVisibilityFilters,
} from "../graph/buildVisibleRelationshipModel.ts";
import { IconSearch, IconFocusCentered, IconMap } from "@tabler/icons-react";
import { QuickIntentCard } from "../components/QuickIntentCard";
import { AtlasLeverageInspector } from "../components/AtlasLeverageInspector";
import {
  buildCrossFrameworkEquivalents,
  buildImpactBreakdown,
  recordDisplayTitle,
} from "../lib/recordTitle";
import type { RuntimeBundle } from "../lib/runtimeLoader";
import { useClusteredGraph } from "../lib/useClusteredGraph";
import {
  buildAtlasMapUrl,
  nodeIdFromItemId,
  serializeViewState,
  type ViewState,
} from "../lib/viewState";

type AtlasMapPageProps = {
  bundle: RuntimeBundle;
  state: Extract<ViewState, { view: "atlas-map" }>;
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string, from?: string) => void;
};

function resolveCenterNode(
  runtime: RuntimeBundle["runtime"],
  nodeParam: string,
): { centerNodeId: string; centerItemId: string } | null {
  if (!nodeParam.trim()) {
    const starter = runtime.buildStarterMap();
    return {
      centerNodeId: starter.centerNodeId,
      centerItemId: "Control landscape",
    };
  }

  const direct = runtime.getNode(nodeParam);
  if (direct) {
    const doc = runtime.getLibraryDocument(nodeParam);
    return {
      centerNodeId: direct.id,
      centerItemId: doc?.item_id || direct.metadata?.item_id || direct.id,
    };
  }

  const resolvedId = nodeIdFromItemId(runtime, nodeParam);
  if (!resolvedId) return null;
  const node = runtime.getNode(resolvedId);
  const doc = runtime.getLibraryDocument(resolvedId);
  return {
    centerNodeId: resolvedId,
    centerItemId: doc?.item_id || node?.metadata?.item_id || resolvedId,
  };
}

/**
 * Resolve the active relationship view (CATL-57): an explicit choice wins;
 * otherwise the graph is the default on desktop and the list on narrow
 * viewports, where the canvas is hard to read.
 */
function resolveRelationshipView(
  raw: string | undefined,
  narrow: boolean,
): "map" | "list" {
  if (raw === "list" || raw === "table") return "list";
  if (raw === "map") return "map";
  return narrow ? "list" : "map";
}

function useIsNarrowViewport(query = "(max-width: 768px)"): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setNarrow(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);
  return narrow;
}

export function AtlasMapPage(props: AtlasMapPageProps) {
  const node = props.state.node?.trim();
  if (!node) {
    return <AtlasPresetMenu {...props} />;
  }
  if (
    node === "AC-2" ||
    node === "nist-800-53:AC-2" ||
    node.startsWith("hierarchy:") ||
    node === "foundation"
  ) {
    return <FoundationAtlasMapPage {...props} />;
  }
  return <RuntimeAtlasMapPage {...props} />;
}

function AtlasPresetMenu(props: AtlasMapPageProps) {
  const { onNavigate } = props;
  return (
    <section className="panel">
      <header className="page-header">
        <p className="eyebrow">Atlas Map</p>
        <div>
          <h1>Where would you like to start?</h1>
          <p className="page-summary">
            Visualize connections across frameworks, templates, and playbooks.
            Choose a preset below to start.
          </p>
        </div>
      </header>
      <div className="intent-grid">
        <QuickIntentCard
          actionLabel="Open map"
          body="Explore the full framework taxonomy from the top down."
          icon={<IconMap size={20} stroke={1.8} />}
          onClick={() => onNavigate("atlas-map", { node: "foundation" })}
          title="Framework Map"
        />
        <QuickIntentCard
          actionLabel="Open map"
          body="See how a single control connects to everything else, using AC-2 as an example."
          icon={<IconFocusCentered size={20} stroke={1.8} />}
          onClick={() => onNavigate("atlas-map", { node: "AC-2" })}
          title="Focused Control"
        />
        <QuickIntentCard
          actionLabel="Search"
          body="Find a specific control, baseline, or template and view its connections."
          icon={<IconSearch size={20} stroke={1.8} />}
          onClick={() => onNavigate("search")}
          title="Search for a node"
        />
      </div>
    </section>
  );
}

function FoundationAtlasMapPage(props: AtlasMapPageProps) {
  const { bundle, state, onNavigate } = props;
  const trimmedNode = state.node.trim();
  const drillTier = trimmedNode.startsWith("hierarchy:")
    ? trimmedNode.slice("hierarchy:".length)
    : null;
  const drillLabel = drillTier
    ? (SOURCE_HIERARCHY_LABELS[drillTier as SourceHierarchyTier] ?? drillTier)
    : null;
  const focused =
    Boolean(trimmedNode) &&
    !drillTier &&
    trimmedNode !== "foundation" &&
    trimmedNode !== "landscape";
  const [mapSearchDraft, setMapSearchDraft] = useState("");
  const routeVisibilityFilters: SourceVisibilityFilters = {
    showSupportingReferences: state.showSupportingReferences === "true",
    showDraftOrLegacy: state.showDraftOrLegacy === "true",
    showRegistryOnly: state.showRegistryOnly === "true",
  };
  const [visibilityFilters, setVisibilityFilters] =
    useState<SourceVisibilityFilters>(routeVisibilityFilters);
  const [foundationExpandedClusters, setFoundationExpandedClusters] = useState<
    Set<string>
  >(() => new Set());
  const [mapViewLoading, setMapViewLoading] = useState(false);

  useEffect(() => {
    if (!focused) {
      setMapViewLoading(false);
      return;
    }
    setMapViewLoading(true);
    const timer = window.setTimeout(() => setMapViewLoading(false), 1200);
    return () => window.clearTimeout(timer);
  }, [focused, trimmedNode]);

  useEffect(() => {
    setVisibilityFilters(routeVisibilityFilters);
  }, [
    state.showDraftOrLegacy,
    state.showRegistryOnly,
    state.showSupportingReferences,
  ]);

  const model = useMemo(() => {
    let nextModel = buildVisibleRelationshipModel({
      nodeId: state.node,
      filters: visibilityFilters,
    });
    for (const clusterKey of foundationExpandedClusters) {
      nextModel = expandFocusedControlCluster(nextModel, clusterKey);
    }
    return nextModel;
  }, [
    foundationExpandedClusters,
    state.node,
    visibilityFilters.showDraftOrLegacy,
    visibilityFilters.showRegistryOnly,
    visibilityFilters.showSupportingReferences,
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState(model.centerNodeId);

  useEffect(() => {
    setSelectedNodeId(model.centerNodeId);
  }, [model.centerNodeId]);

  useEffect(() => {
    setFoundationExpandedClusters(new Set());
  }, [state.node]);

  const handleSelectNode = useCallback(
    (nodeId: string) => {
      // On the overview, choosing a category drills into it — the map opens
      // that layer and shows the sources inside. Everything else selects.
      if (!drillTier && !focused && nodeId.startsWith("hierarchy:")) {
        onNavigate("atlas-map", { ...state, node: nodeId });
        return;
      }
      setSelectedNodeId(nodeId);
    },
    [drillTier, focused, onNavigate, state],
  );

  const selectedSource = selectedNodeId?.startsWith("source:")
    ? SOURCE_SEED_MANIFEST.find(
        (source) => `source:${source.sourceId}` === selectedNodeId,
      )
    : null;
  const selectedSourceAnchor = selectedSource
    ? SOURCE_RUNTIME_ANCHORS[selectedSource.sourceId]
    : undefined;
  const anchorAvailable = useMemo(() => {
    if (!selectedSourceAnchor) return false;
    try {
      return Boolean(bundle.runtime.getNode(selectedSourceAnchor));
    } catch {
      return false;
    }
  }, [bundle.runtime, selectedSourceAnchor]);

  const foundationRuntime = useMemo(
    () => ({
      buildNeighborhood: () => ({
        centerNode:
          model.nodes.find((node) => node.id === model.centerNodeId) ?? null,
        nodes: model.nodes,
        edges: model.edges,
        stats: {
          total: model.edges.length,
          filtered: model.edges.length,
          truncated: false,
          nodeCount: model.nodes.length,
        },
      }),
    }),
    [model],
  );
  const narrowViewport = useIsNarrowViewport();
  const relationshipView = resolveRelationshipView(
    state.relationshipView,
    narrowViewport,
  );

  // Leverage for the focused control (e.g. AC-2), computed from the runtime's
  // real published edges rather than the curated foundation cluster.
  const foundationLeverage = useMemo(() => {
    const empty = {
      impact: { total: 0, byType: [] },
      equivalents: [],
      nodeId: "",
      title: "",
    };
    if (!focused) {
      return empty;
    }
    const nodeId = bundle.runtime.getNode(trimmedNode)
      ? trimmedNode
      : nodeIdFromItemId(bundle.runtime, trimmedNode) || trimmedNode;
    const node = bundle.runtime.getNode(nodeId);
    if (!node) {
      return { ...empty, nodeId, title: trimmedNode };
    }
    const edges = bundle.runtime.getEdgesForNode(nodeId, {
      publication_status: "published",
    });
    const getNode = (id: string) => bundle.runtime.getNode(id);
    return {
      impact: buildImpactBreakdown(nodeId, edges, getNode),
      equivalents: buildCrossFrameworkEquivalents(nodeId, edges, getNode),
      nodeId,
      title: recordDisplayTitle(node) || trimmedNode,
    };
  }, [bundle.runtime, focused, trimmedNode]);

  const emptyRelationshipFilters = {
    relationshipType: "",
    provenance: "",
    confidence: "",
    nodeType: "",
    includeCandidates: false,
    search: "",
  };

  function patchVisibility(key: keyof SourceVisibilityFilters, value: boolean) {
    const stateKey = {
      showSupportingReferences: "showSupportingReferences",
      showDraftOrLegacy: "showDraftOrLegacy",
      showRegistryOnly: "showRegistryOnly",
    }[key];
    setVisibilityFilters((current) => ({ ...current, [key]: value }));
    onNavigate("atlas-map", {
      ...state,
      [stateKey]: value ? "true" : "",
    });
  }

  function copyMapLink() {
    const url = `${window.location.origin}${window.location.pathname}${serializeViewState(state)}`;
    void navigator.clipboard?.writeText(url);
  }

  return (
    <section
      className={`panel atlas-map-page${focused ? " atlas-map-page--focused" : ""}`}
    >
      <PageHeader
        eyebrow="ATLAS"
        summary={
          focused
            ? "See the control in context and explore its connections to baselines, assessments, implementation standards, and mappings."
            : drillLabel
              ? `Inside ${drillLabel}. Select a source to see who publishes it and what it covers.`
              : "Nine layers make up federal cyber compliance. Select a layer to open it and see the sources inside."
        }
        title={drillLabel ?? "Atlas"}
      />

      {drillTier ? (
        <nav aria-label="Atlas breadcrumb" className="ca-atlas-drill-bar">
          <button
            className="secondary quiet"
            onClick={() =>
              onNavigate("atlas-map", { ...state, node: "foundation" })
            }
            type="button"
          >
            ← All layers
          </button>
        </nav>
      ) : null}

      <form
        className="atlas-map-command"
        onSubmit={(event) => {
          event.preventDefault();
          const query = mapSearchDraft.trim();
          if (!query) return;
          const resolved = nodeIdFromItemId(bundle.runtime, query);
          if (resolved) {
            onNavigate("atlas-map", { ...state, node: resolved });
            return;
          }
          onNavigate("search", { query });
        }}
      >
        <label className="field grow" htmlFor="foundation-atlas-map-search">
          <span>Find a control, CCI, baseline, STIG, or source.</span>
          <input
            aria-label="Search Atlas Map"
            id="foundation-atlas-map-search"
            onChange={(event) => setMapSearchDraft(event.target.value)}
            placeholder="account management, AC-2, CCI-000225"
            type="search"
            value={mapSearchDraft}
          />
        </label>
        <button className="primary" type="submit">
          Search
        </button>
      </form>

      {!focused ? (
        <details className="atlas-display-options">
          <summary>Display options</summary>
          <div
            aria-label="Source visibility filters"
            className="ca-source-filter-group atlas-source-filters"
            role="group"
          >
            <span className="atlas-source-filters-label">Show:</span>
            <label className="ca-source-filter-label">
              <input
                checked={visibilityFilters.showSupportingReferences}
                onChange={(e) =>
                  patchVisibility("showSupportingReferences", e.target.checked)
                }
                type="checkbox"
              />
              Show supporting references
            </label>
            <label className="ca-source-filter-label">
              <input
                checked={visibilityFilters.showDraftOrLegacy}
                onChange={(e) =>
                  patchVisibility("showDraftOrLegacy", e.target.checked)
                }
                type="checkbox"
              />
              Show draft / legacy sources
            </label>
            <label className="ca-source-filter-label">
              <input
                checked={visibilityFilters.showRegistryOnly}
                onChange={(e) =>
                  patchVisibility("showRegistryOnly", e.target.checked)
                }
                type="checkbox"
              />
              Show registry-only entries
            </label>
          </div>
          <div aria-live="polite" className="atlas-source-warnings">
            {visibilityFilters.showSupportingReferences ? (
              <p>{DEFAULT_MAP_WARNINGS.supportingReferences}</p>
            ) : null}
            {visibilityFilters.showDraftOrLegacy ? (
              <p>{DEFAULT_MAP_WARNINGS.draftOrLegacy}</p>
            ) : null}
            {visibilityFilters.showRegistryOnly ? (
              <p>{DEFAULT_MAP_WARNINGS.registryOnly}</p>
            ) : null}
          </div>
        </details>
      ) : null}

      <div className="atlas-map-layout">
        <div className="atlas-map-main">
          {mapViewLoading ? (
            <p className="notice-inline" role="status">
              Loading map view…
            </p>
          ) : null}
          <RelationshipExplorer
            centerItemId={
              focused ? "AC-2" : (drillLabel ?? "Control landscape")
            }
            centerNodeId={model.centerNodeId}
            filters={emptyRelationshipFilters}
            expandedClusterLabels={
              new Map(
                [...foundationExpandedClusters].map((clusterKey) => [
                  clusterKey,
                  `${clusterKey.replaceAll("-", " ")} cluster`,
                ]),
              )
            }
            expandedClusters={foundationExpandedClusters}
            heading={
              focused
                ? "AC-2 focused map"
                : drillLabel
                  ? `${drillLabel} sources`
                  : "Source hierarchy"
            }
            hideHeading
            introCopy={
              focused
                ? "AC-2 stays central while dense implementation and mapping details remain clustered."
                : drillLabel
                  ? `These are the sources inside the ${drillLabel} layer. Select one for a plain-language summary.`
                  : "Each node is a layer of the compliance ecosystem. Select a layer to open it and see the sources inside."
            }
            layoutMode={model.layoutMode}
            mapControls
            onCopyMapLink={copyMapLink}
            onFilterChange={() => undefined}
            onClusterCollapse={(clusterKey) =>
              setFoundationExpandedClusters((current) => {
                const next = new Set(current);
                next.delete(clusterKey);
                return next;
              })
            }
            onClusterExpand={(clusterKey) =>
              setFoundationExpandedClusters((current) => {
                const next = new Set(current);
                next.add(clusterKey);
                return next;
              })
            }
            onOpenNode={handleSelectNode}
            onSelectNode={handleSelectNode}
            onViewChange={(view) =>
              onNavigate("atlas-map", { ...state, relationshipView: view })
            }
            relationshipView={relationshipView}
            runtime={foundationRuntime}
            selectedNodeId={selectedNodeId}
            showFilters={false}
            staticGraph={{
              nodes: model.nodes,
              edges: model.edges,
              stats: {
                nodeCount: model.nodes.length,
                filtered: model.edges.length,
                truncated: false,
              },
            }}
          />

          {focused ? (
            <AtlasLeverageInspector
              equivalents={foundationLeverage.equivalents}
              impact={foundationLeverage.impact}
              onOpenNode={(nodeId) =>
                onNavigate("atlas-map", { ...state, node: nodeId })
              }
              onOpenRecord={() =>
                onNavigate("library-detail", {
                  node: foundationLeverage.nodeId,
                })
              }
              title={foundationLeverage.title}
            />
          ) : null}

          {selectedSource ? (
            <aside aria-label="Selected source" className="ca-source-detail">
              <p className="eyebrow">Selected source</p>
              <strong>{selectedSource.displayName}</strong>
              <p className="muted">
                {selectedSource.publisher} · {selectedSource.subcategory}
              </p>
              {selectedSource.defaultMapReason ? (
                <p>{selectedSource.defaultMapReason}</p>
              ) : null}
              <div className="card-actions">
                {anchorAvailable && selectedSourceAnchor ? (
                  <button
                    className="primary"
                    onClick={() =>
                      onNavigate("atlas-map", {
                        ...state,
                        node: selectedSourceAnchor,
                      })
                    }
                    type="button"
                  >
                    Explore its records
                  </button>
                ) : null}
                {selectedSource.canonicalUrl.startsWith("http") ? (
                  <a
                    className="link-action"
                    href={selectedSource.canonicalUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open official source ↗
                  </a>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
        <details className="atlas-coverage-drawer">
          <summary>Coverage matrix</summary>
          <AtlasMatrix
            edges={model.edges}
            nodes={model.nodes}
            onSelectNode={handleSelectNode}
            selectedNodeId={selectedNodeId}
          />
        </details>
      </div>
    </section>
  );
}

function RuntimeAtlasMapPage(props: AtlasMapPageProps) {
  const { bundle, state, onNavigate, onOpenNode } = props;
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    setExpandedClusters(new Set());
  }, [state.node]);

  const [mapSearchDraft, setMapSearchDraft] = useState(
    state.relationshipSearch || "",
  );

  const center = useMemo(
    () => resolveCenterNode(bundle.runtime, state.node),
    [bundle.runtime, state.node],
  );

  // Leverage: how many requirements does implementing the focused control also
  // satisfy? Counted from every published edge, not just the visible cluster.
  const leverage = useMemo(() => {
    if (!center || !state.node.trim()) {
      return { impact: { total: 0, byType: [] }, equivalents: [] };
    }
    const edges = bundle.runtime.getEdgesForNode(center.centerNodeId, {
      publication_status: "published",
    });
    const getNode = (id: string) => bundle.runtime.getNode(id);
    return {
      impact: buildImpactBreakdown(center.centerNodeId, edges, getNode),
      equivalents: buildCrossFrameworkEquivalents(
        center.centerNodeId,
        edges,
        getNode,
      ),
    };
  }, [bundle.runtime, center, state.node]);

  const narrowViewport = useIsNarrowViewport();
  const relationshipView = resolveRelationshipView(
    state.relationshipView,
    narrowViewport,
  );

  const filters = useMemo(
    () => relationshipFiltersFromState(state),
    [
      state.relationshipType,
      state.provenance,
      state.confidence,
      state.nodeType,
      state.includeCandidates,
      state.relationshipSearch,
    ],
  );

  const neighborhood = useMemo(() => {
    if (!center) return null;
    if (!state.node.trim()) {
      return bundle.runtime.buildStarterMap();
    }
    return bundle.runtime.buildNeighborhood(center.centerNodeId, {
      relationship_type: filters.relationshipType || undefined,
      provenance_class: filters.provenance || undefined,
      confidence: filters.confidence || undefined,
      node_type: filters.nodeType || undefined,
      include_candidates: filters.includeCandidates,
    });
  }, [bundle.runtime, center, filters, state.node]);

  const {
    nodes: clusteredNodes,
    edges: clusteredEdges,
    clusterMeta,
    expandedClusterLabels,
    onClusterExpand,
    onClusterCollapse,
  } = useClusteredGraph({
    runtime: bundle.runtime,
    centerNodeId: center?.centerNodeId ?? "",
    nodes: neighborhood?.nodes ?? [],
    edges: neighborhood?.edges ?? [],
    enabled: Boolean(center && neighborhood && state.node.trim()),
    expandedClusters,
    onExpandedClustersChange: setExpandedClusters,
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    center?.centerNodeId ?? null,
  );

  useEffect(() => {
    setSelectedNodeId(center?.centerNodeId ?? null);
  }, [center?.centerNodeId]);

  useEffect(() => {
    setMapSearchDraft(state.relationshipSearch || "");
  }, [state.relationshipSearch]);

  if (!center || !neighborhood) {
    return (
      <section className="panel atlas-map-page">
        <PageHeader
          eyebrow="ATLAS"
          summary="Explore how controls, baselines, CCIs, STIGs, sources, templates, and playbooks connect."
          title="No connections found"
        />
        <div className="notice">
          <h2>No connections found for this item.</h2>
          <p>
            Try searching for another record, turning on inferred links, or
            opening the source record.
          </p>
          <div className="card-actions">
            <button
              className="secondary"
              onClick={() =>
                onNavigate("atlas-map", {
                  node: "",
                  relationshipType: "",
                  provenance: "",
                  confidence: "",
                  nodeType: "",
                  includeCandidates: "",
                  relationshipSearch: "",
                })
              }
              type="button"
            >
              Clear filters
            </button>
            <button
              className="secondary"
              onClick={() =>
                onNavigate("atlas-map", { includeCandidates: "true" })
              }
              type="button"
            >
              Turn on inferred links
            </button>
            <button
              className="primary"
              onClick={() => onNavigate("search")}
              type="button"
            >
              Search records
            </button>
          </div>
        </div>
      </section>
    );
  }

  const isStarter = !state.node.trim();
  const displayNodes = isStarter ? neighborhood.nodes : clusteredNodes;
  const displayEdges = isStarter ? neighborhood.edges : clusteredEdges;

  function patchFilters(patch: Partial<typeof filters>) {
    onNavigate("atlas-map", {
      ...state,
      ...relationshipFiltersToPatch({ ...filters, ...patch }),
    });
  }

  function copyMapLink() {
    const url = `${window.location.origin}${window.location.pathname}${serializeViewState(state)}`;
    void navigator.clipboard?.writeText(url);
  }

  return (
    <section
      className={`panel atlas-map-page${isStarter ? "" : " atlas-map-page--focused"}`}
    >
      <PageHeader
        eyebrow="ATLAS"
        summary="Explore how controls, baselines, CCIs, STIGs, sources, templates, and playbooks connect."
        title={
          isStarter
            ? "Atlas"
            : recordDisplayTitle(bundle.runtime.getNode(center.centerNodeId)) ||
              center.centerItemId
        }
      />

      {isStarter ? (
        <div className="atlas-starter-banner">
          <p>
            Search for an item or select a group to begin exploring the control
            landscape.
          </p>
          <div className="chip-row">
            <button
              className="chip"
              onClick={() => onNavigate("search", { query: "AC-2" })}
              type="button"
            >
              Search AC-2
            </button>
            <button
              className="chip"
              onClick={() => onNavigate("start-here")}
              type="button"
            >
              Start with RMF lifecycle
            </button>
            <button
              className="chip"
              onClick={() =>
                onNavigate("search", { query: "FedRAMP High", filter: "" })
              }
              type="button"
            >
              Explore FedRAMP High
            </button>
          </div>
        </div>
      ) : null}

      <div className="atlas-map-layout">
        <div className="atlas-map-main">
          <RelationshipExplorer
            centerItemId={center.centerItemId}
            centerNodeId={center.centerNodeId}
            clusterMeta={clusterMeta}
            expandedClusterLabels={expandedClusterLabels}
            expandedClusters={expandedClusters}
            filters={filters}
            heading="Atlas Map"
            introCopy={
              isStarter
                ? "Select a starter group or search to explore the control landscape."
                : `This map shows connections around ${center.centerItemId}.`
            }
            listLabel="List"
            mapControls
            onClusterCollapse={onClusterCollapse}
            onClusterExpand={onClusterExpand}
            onCopyMapLink={copyMapLink}
            onFilterChange={patchFilters}
            onOpenCompare={(itemId) =>
              onNavigate("matrix", {
                workbench: "relationships",
                items: itemId,
              })
            }
            onOpenNode={(nodeId) => {
              if (nodeId.startsWith("starter:")) {
                const key = nodeId.replace("starter:", "");
                onNavigate("search", {
                  query: "",
                  objectType:
                    key === "controls"
                      ? "control"
                      : key === "templates"
                        ? "template"
                        : "",
                });
                return;
              }
              if (nodeId.startsWith("cluster:")) {
                onClusterExpand(nodeId.replace("cluster:", ""));
                return;
              }
              onNavigate("atlas-map", { ...state, node: nodeId });
              setSelectedNodeId(nodeId);
            }}
            onOpenRecord={onOpenNode}
            onViewChange={(view) =>
              onNavigate("atlas-map", {
                ...state,
                relationshipView: view,
              })
            }
            onSelectNode={setSelectedNodeId}
            relationshipView={relationshipView}
            runtime={bundle.runtime}
            selectedNodeId={selectedNodeId}
            showEmptyState={!displayNodes.length}
            staticGraph={{
              edges: displayEdges,
              nodes: displayNodes,
              stats: neighborhood.stats,
            }}
          />
          {!isStarter ? (
            <AtlasLeverageInspector
              equivalents={leverage.equivalents}
              impact={leverage.impact}
              onExploreType={(nodeType) => patchFilters({ nodeType })}
              onOpenNode={(nodeId) => {
                onNavigate("atlas-map", { ...state, node: nodeId });
                setSelectedNodeId(nodeId);
              }}
              onOpenRecord={() => onOpenNode(center.centerNodeId)}
              title={
                recordDisplayTitle(
                  bundle.runtime.getNode(center.centerNodeId),
                ) || center.centerItemId
              }
            />
          ) : null}
        </div>

        <details className="atlas-coverage-drawer">
          <summary>Coverage matrix</summary>
          <AtlasMatrix
            edges={displayEdges}
            nodes={displayNodes}
            onSelectNode={setSelectedNodeId}
            selectedNodeId={selectedNodeId}
          />
        </details>
      </div>

      <form
        className="atlas-map-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          const resolved = nodeIdFromItemId(
            bundle.runtime,
            mapSearchDraft.trim(),
          );
          if (resolved) {
            onNavigate("atlas-map", {
              ...state,
              node: resolved,
              relationshipSearch: mapSearchDraft.trim(),
            });
          } else {
            onNavigate("search", { query: mapSearchDraft.trim() });
          }
        }}
      >
        <label className="field grow" htmlFor="atlas-map-search">
          <span>Search map</span>
          <input
            id="atlas-map-search"
            onChange={(event) => setMapSearchDraft(event.target.value)}
            placeholder="account management, AC-2, CCI-000225"
            type="search"
            value={mapSearchDraft}
          />
        </label>
        <button className="primary" type="submit">
          Search
        </button>
      </form>
    </section>
  );
}

function PageHeader(props: {
  title: string;
  summary: string;
  eyebrow?: string;
}) {
  return (
    <header className="page-header">
      {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
      <h1>{props.title}</h1>
      <p className="page-summary">{props.summary}</p>
    </header>
  );
}
