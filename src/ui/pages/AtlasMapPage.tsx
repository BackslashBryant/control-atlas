import { useCallback, useEffect, useMemo, useState } from "react";

import {
  RelationshipExplorer,
  relationshipFiltersFromState,
  relationshipFiltersToPatch,
} from "../components/RelationshipExplorer";
import { AtlasMatrix } from "../components/AtlasMatrix";
import {
  DEFAULT_MAP_WARNINGS,
} from "../graph/defaultMapFilter.ts";
import { expandFocusedControlCluster } from "../graph/buildFocusedControlRings.ts";
import {
  buildVisibleRelationshipModel,
  type SourceVisibilityFilters,
} from "../graph/buildVisibleRelationshipModel.ts";
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

export function AtlasMapPage(props: AtlasMapPageProps) {
  const node = props.state.node.trim();
  if (!node || node === "AC-2" || node === "nist-800-53:AC-2") {
    return <FoundationAtlasMapPage {...props} />;
  }
  return <RuntimeAtlasMapPage {...props} />;
}

function FoundationAtlasMapPage(props: AtlasMapPageProps) {
  const { bundle, state, onNavigate } = props;
  const focused = Boolean(state.node.trim());
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

  useEffect(() => {
    setVisibilityFilters(routeVisibilityFilters);
  }, [
    state.showDraftOrLegacy,
    state.showRegistryOnly,
    state.showSupportingReferences,
  ]);

  const model = useMemo(
    () => {
      let nextModel = buildVisibleRelationshipModel({
        nodeId: state.node,
        filters: visibilityFilters,
      });
      for (const clusterKey of foundationExpandedClusters) {
        nextModel = expandFocusedControlCluster(nextModel, clusterKey);
      }
      return nextModel;
    },
    [
      foundationExpandedClusters,
      state.node,
      visibilityFilters.showDraftOrLegacy,
      visibilityFilters.showRegistryOnly,
      visibilityFilters.showSupportingReferences,
    ],
  );
  const [selectedNodeId, setSelectedNodeId] = useState(model.centerNodeId);

  useEffect(() => {
    setSelectedNodeId(model.centerNodeId);
  }, [model.centerNodeId]);

  useEffect(() => {
    setFoundationExpandedClusters(new Set());
  }, [state.node]);

  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

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
  const relationshipView =
    state.relationshipView === "list" || state.relationshipView === "table"
      ? "list"
      : "map";
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
    <section className="panel atlas-map-page">
      <PageHeader
        eyebrow="ATLAS"
        summary={
          focused
            ? "See the control in context and explore its connections to baselines, assessments, implementation standards, and mappings."
            : "Explore the compliance ecosystem."
        }
        title="Atlas"
      />

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
            placeholder="AC-2, CCI-000225, FedRAMP High"
            type="search"
            value={mapSearchDraft}
          />
        </label>
        <button className="primary" type="submit">
          Open map
        </button>
      </form>

      {!focused ? (
        <>
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
        </>
      ) : null}

      <div className="atlas-map-layout">
        <div className="atlas-map-main">
          <RelationshipExplorer
            centerItemId={focused ? "AC-2" : "Control Catalog / Requirement Set"}
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
            heading={focused ? "AC-2 focused map" : "Source hierarchy"}
            hideHeading
            introCopy={
              focused
                ? "AC-2 stays central while dense implementation and mapping details remain clustered."
                : "Each node is a category of compliance source. Select one to see what it contributes and where to go next."
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
        </div>
        <AtlasMatrix
          edges={model.edges}
          nodes={model.nodes}
          onSelectNode={handleSelectNode}
          selectedNodeId={selectedNodeId}
        />
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

  const relationshipView =
    state.relationshipView === "list" ||
    state.relationshipView === "table" ||
    state.relationshipView === "map"
      ? (state.relationshipView === "map" ? "map" : "list")
      : "map";

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
    <section className="panel atlas-map-page">
      <PageHeader
        eyebrow="ATLAS"
        summary="Explore how controls, baselines, CCIs, STIGs, sources, templates, and playbooks connect."
        title={isStarter ? "Atlas" : center.centerItemId}
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
        </div>

        <AtlasMatrix
          edges={displayEdges}
          nodes={displayNodes}
          onSelectNode={setSelectedNodeId}
          selectedNodeId={selectedNodeId}
        />
      </div>

      <form
        className="atlas-map-search-form"
        onSubmit={(event) => {
          event.preventDefault();
          const resolved = nodeIdFromItemId(bundle.runtime, mapSearchDraft.trim());
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
            placeholder="AC-2, CCI-000225, FedRAMP High"
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
      {props.eyebrow ? (
        <p className="eyebrow">{props.eyebrow}</p>
      ) : null}
      <h1>{props.title}</h1>
      <p className="page-summary">{props.summary}</p>
    </header>
  );
}
