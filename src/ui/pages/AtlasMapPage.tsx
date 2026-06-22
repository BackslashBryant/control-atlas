import { useEffect, useMemo, useState } from "react";

import {
  RelationshipExplorer,
  relationshipFiltersFromState,
  relationshipFiltersToPatch,
} from "../components/RelationshipExplorer";
import { SelectedItemPanel } from "../components/SelectedItemPanel";
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

  if (!center || !neighborhood) {
    return (
      <section className="panel atlas-map-page">
        <PageHeader
          summary="Explore how controls, baselines, CCIs, STIGs, sources, templates, and playbooks connect."
          title="Atlas Map"
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
  const connectionCount = neighborhood.stats.filtered;
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
        summary="Explore how controls, baselines, CCIs, STIGs, sources, templates, and playbooks connect."
        title="Atlas Map"
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

        <SelectedItemPanel
          centerNodeId={center.centerNodeId}
          connectionCount={connectionCount}
          onCopyLink={copyMapLink}
          onOpenCompare={(itemId) =>
            onNavigate("matrix", { workbench: "relationships", items: itemId })
          }
          onOpenRecord={onOpenNode}
          onOpenTemplates={() => onNavigate("templates")}
          runtime={bundle.runtime}
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
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{props.title}</h1>
        <p>{props.summary}</p>
      </div>
    </header>
  );
}
