import { useEffect, useMemo, useState } from "react";

import {
  RelationshipExplorer,
  relationshipFiltersFromState,
  relationshipFiltersToPatch,
} from "../components/RelationshipExplorer";
import { SelectedItemPanel } from "../components/SelectedItemPanel";
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
  const { state, onNavigate } = props;
  const focused = Boolean(state.node.trim());
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
        summary={
          focused
            ? "See the control in context without losing the source hierarchy behind it."
            : "The map starts with source categories so you can understand where requirements come from before drilling into controls, baselines, assessments, implementation guidance, mappings, and supporting references."
        }
        title="Atlas Map"
      />

      {!focused ? (
        <>
          <div className="atlas-foundation-intro">
            <h2>Explore the compliance ecosystem.</h2>
            <p>
              The map starts with source categories so you can understand where
              requirements come from before drilling into controls, baselines,
              assessments, implementation guidance, mappings, and supporting
              references.
            </p>
          </div>
          <div
            aria-label="Source visibility filters"
            className="atlas-source-filters"
            role="group"
          >
            <label>
              <input
                checked={visibilityFilters.showSupportingReferences}
                onChange={(event) =>
                  patchVisibility(
                    "showSupportingReferences",
                    event.target.checked,
                  )
                }
                type="checkbox"
              />
              Show supporting references
            </label>
            <label>
              <input
                checked={visibilityFilters.showDraftOrLegacy}
                onChange={(event) =>
                  patchVisibility("showDraftOrLegacy", event.target.checked)
                }
                type="checkbox"
              />
              Show draft / legacy sources
            </label>
            <label>
              <input
                checked={visibilityFilters.showRegistryOnly}
                onChange={(event) =>
                  patchVisibility("showRegistryOnly", event.target.checked)
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
            introCopy={
              focused
                ? "AC-2 stays central while dense implementation and mapping details remain clustered."
                : "Authority flows left-to-right through governance, controls, baselines, assessment, implementation, mappings, threat context, and supporting references."
            }
            layoutEngine={model.layoutEngine}
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
            onOpenNode={setSelectedNodeId}
            onSelectNode={setSelectedNodeId}
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
        <FoundationSidePanel
          focused={focused}
          onNavigate={onNavigate}
          selectedNodeId={selectedNodeId}
        />
      </div>
    </section>
  );
}

function FoundationSidePanel(props: {
  focused: boolean;
  selectedNodeId: string;
  onNavigate: AtlasMapPageProps["onNavigate"];
}) {
  if (props.focused) {
    return (
      <aside aria-label="Selected item" className="atlas-selected-panel">
        <h2>AC-2</h2>
        <p className="atlas-control-title">Account Management</p>
        <p>Type: NIST Control</p>
        <p>Catalog: SP 800-53 Rev. 5</p>
        <p>Family: Access Control</p>
        <h3>Connected context:</h3>
        <ul>
          <li>Baselines</li>
          <li>Assessment procedures</li>
          <li>Implementation standards</li>
          <li>Mappings</li>
          <li>Templates</li>
          <li>Playbooks</li>
          <li>Sources</li>
        </ul>
      </aside>
    );
  }

  const isControlCatalog =
    props.selectedNodeId === "hierarchy:control-catalog-requirement-set";
  if (!isControlCatalog) {
    const label =
      props.selectedNodeId.replace("hierarchy:", "").replaceAll("-", " ") ||
      "Source category";
    return (
      <aside aria-label="Selected item" className="atlas-selected-panel">
        <h2 className="capitalize">{label}</h2>
        <p>
          Select a source category to understand what it contributes and what
          to explore next.
        </p>
      </aside>
    );
  }

  return (
    <aside aria-label="Selected item" className="atlas-selected-panel">
      <h2>Control Catalog / Requirement Set</h2>
      <p>
        Primary requirement sources that define controls or security
        requirements.
      </p>
      <p>Examples:</p>
      <ul>
        <li>NIST SP 800-53 Rev. 5</li>
        <li>NIST SP 800-171 Rev. 3</li>
        <li>NIST SP 800-172 Rev. 3</li>
        <li>NIST SSDF</li>
      </ul>
      <div className="card-actions">
        <button
          className="primary"
          onClick={() => props.onNavigate("sources")}
          type="button"
        >
          Explore sources
        </button>
        <button
          className="secondary"
          onClick={() =>
            props.onNavigate("atlas-map", { relationshipView: "list" })
          }
          type="button"
        >
          View as list
        </button>
        <button
          className="secondary"
          onClick={() =>
            props.onNavigate("search", {
              objectType: "control",
              query: "",
              filter: "",
            })
          }
          type="button"
        >
          Open related controls
        </button>
      </div>
    </aside>
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
