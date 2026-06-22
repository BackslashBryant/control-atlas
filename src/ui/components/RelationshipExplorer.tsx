import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";

import type { ClusterNodeMeta } from "../lib/graphClustering";
import {
  COMPARE_ROLE_LEGEND,
  ITEM_TYPE_LEGEND,
  PROVENANCE_LEGEND,
  provenanceCssVar,
} from "../lib/graphTheme";
import { ProvenanceTerm } from "./ProvenanceTerm";
import { useClusteredGraph } from "../lib/useClusteredGraph";
import {
  useRelationshipFilters,
  type RelationshipFilterState,
} from "../lib/useRelationshipFilters";
import { RelationshipGraphTable } from "./RelationshipGraphTable";
const RelationshipGraphWithHandle = lazy(() => import("./RelationshipGraph"));

export type RelationshipGraphHandle = {
  fitToScreen: () => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

type StaticGraph = {
  nodes: Array<{
    id: string;
    node_type?: string;
    label?: string;
    metadata?: { item_id?: string; title?: string };
  }>;
  edges: Array<{
    id: string;
    source_node_id: string;
    target_node_id: string;
    relationship_type: string;
    provenance_class: string;
    publication_status: string;
    confidence: string;
    plain_language_rationale?: string;
  }>;
  stats: {
    nodeCount: number;
    filtered: number;
    truncated: boolean;
  };
};

type RelationshipExplorerProps = {
  runtime: Parameters<typeof useRelationshipFilters>[0];
  centerNodeId: string;
  centerItemId: string;
  relationshipView: "map" | "list";
  filters: RelationshipFilterState;
  onFilterChange: (patch: Partial<RelationshipFilterState>) => void;
  onViewChange: (view: "map" | "list") => void;
  onOpenNode: (nodeId: string) => void;
  heading?: string;
  introCopy?: string;
  listLabel?: string;
  mapControls?: boolean;
  onCopyMapLink?: () => void;
  onOpenCompare?: (itemId: string) => void;
  onOpenRecord?: (nodeId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  staticGraph?: StaticGraph;
  staticTableRows?: Array<{
    edge: {
      relationship_type: string;
      provenance_class: string;
      publication_status: string;
      confidence: string;
      plain_language_rationale?: string;
    };
    counterpart: { id: string };
    itemId: string;
    title: string;
  }>;
  clusterMeta?: Map<string, ClusterNodeMeta>;
  expandedClusters?: Set<string>;
  expandedClusterLabels?: Map<string, string>;
  onClusterExpand?: (clusterKey: string) => void;
  onClusterCollapse?: (clusterKey: string) => void;
  clusteringEnabled?: boolean;
  showEmptyState?: boolean;
  showFilters?: boolean;
  compareLegend?: boolean;
};

function FilterSelect(props: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-label" htmlFor={props.id}>
      {props.label}
      <select
        id={props.id}
        onChange={(event) => props.onChange(event.target.value)}
        value={props.value}
      >
        <option value="">All</option>
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RelationshipExplorer(props: RelationshipExplorerProps) {
  const {
    runtime,
    centerNodeId,
    centerItemId,
    relationshipView,
    filters,
    onFilterChange,
    onViewChange,
    onOpenNode,
    heading = "Atlas Map",
    introCopy,
    listLabel = "List",
    mapControls = false,
    onCopyMapLink,
    onOpenCompare,
    onOpenRecord,
    onSelectNode,
    selectedNodeId: controlledSelectedNodeId,
    staticGraph,
    staticTableRows,
    clusterMeta,
    expandedClusters,
    expandedClusterLabels,
    onClusterExpand,
    onClusterCollapse,
    clusteringEnabled = true,
    showEmptyState,
    showFilters = true,
    compareLegend = false,
  } = props;

  const graphRef = useRef<RelationshipGraphHandle>(null);
  const [layoutRunning, setLayoutRunning] = useState(false);
  const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<
    string | null
  >(centerNodeId);
  const selectedNodeId =
    controlledSelectedNodeId !== undefined
      ? controlledSelectedNodeId
      : internalSelectedNodeId;

  const setSelectedNodeId = useCallback(
    (nodeId: string) => {
      if (onSelectNode) onSelectNode(nodeId);
      else setInternalSelectedNodeId(nodeId);
    },
    [onSelectNode],
  );

  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const filtered = useRelationshipFilters(runtime, centerNodeId, filters);
  const sourceNeighborhood = staticGraph || filtered.neighborhood;
  const isStarter = sourceNeighborhood.nodes.some((node) =>
    node.id.startsWith("starter:"),
  );

  const internalClustering = useClusteredGraph({
    runtime,
    centerNodeId,
    nodes: sourceNeighborhood.nodes,
    edges: sourceNeighborhood.edges,
    enabled: !staticGraph && clusteringEnabled && !isStarter,
  });

  const usesExternalClustering = Boolean(staticGraph);

  const neighborhood = usesExternalClustering
    ? sourceNeighborhood
    : {
        ...sourceNeighborhood,
        nodes: internalClustering.nodes,
        edges: internalClustering.edges,
      };

  const clustering = usesExternalClustering
    ? {
        clusterMeta,
        expandedClusters,
        expandedClusterLabels,
        onClusterExpand,
        onClusterCollapse,
      }
    : {
        clusterMeta: internalClustering.clusterMeta,
        expandedClusters: internalClustering.expandedClusters,
        expandedClusterLabels: internalClustering.expandedClusterLabels,
        onClusterExpand: internalClustering.onClusterExpand,
        onClusterCollapse: internalClustering.onClusterCollapse,
      };

  const filterOptions = filtered.filterOptions;
  const tableRows = staticTableRows || filtered.tableRows;

  const searchHighlightIds = useMemo(() => {
    if (!filters.search.trim()) return new Set<string>();
    return new Set(tableRows.map((row) => row!.counterpart.id));
  }, [filters.search, tableRows]);

  const selectedNode =
    neighborhood.nodes.find((node) => node.id === selectedNodeId) || null;
  const selectedHasRecord =
    selectedNode &&
    selectedNode.id !== centerNodeId &&
    !selectedNode.id.startsWith("cluster:") &&
    !selectedNode.id.startsWith("starter:");
  const summaryId = "relationship-map-summary";

  const collapseLabels = useMemo(() => {
    if (!clustering.expandedClusters?.size) {
      return [];
    }
    return [...clustering.expandedClusters].map((clusterKey) => ({
      clusterKey,
      label: clustering.expandedClusterLabels?.get(clusterKey) ?? clusterKey,
    }));
  }, [clustering.expandedClusterLabels, clustering.expandedClusters]);

  if (showEmptyState) {
    return (
      <section className="relationship-map-panel">
        <p className="muted">
          No connections found for this item. Try searching for another record,
          turning on inferred links, or opening the source record.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="relationship-map-heading"
      className="relationship-map-panel"
    >
      <div className="relationship-map-intro">
        <h3 id="relationship-map-heading">{heading}</h3>
        <p id={summaryId}>
          {introCopy ||
            `This map shows connections around ${centerItemId}.`}{" "}
          {neighborhood.stats.nodeCount} items and {neighborhood.stats.filtered}{" "}
          links are visible
          {neighborhood.stats.truncated
            ? " (view truncated for performance)"
            : ""}
          . Use the list view for full screen-reader access to every connection.
        </p>
      </div>

      {showFilters ? (
      <div
        aria-label="Relationship filters"
        className="relationship-map-filters"
        role="group"
      >
        <FilterSelect
          id="graph-filter-relationship-type"
          label="Connection type"
          onChange={(value) => onFilterChange({ relationshipType: value })}
          options={filterOptions.relationshipTypes}
          value={filters.relationshipType}
        />
        <FilterSelect
          id="graph-filter-provenance"
          label="Source basis"
          onChange={(value) => onFilterChange({ provenance: value })}
          options={filterOptions.provenanceClasses}
          value={filters.provenance}
        />
        <FilterSelect
          id="graph-filter-confidence"
          label="Trust level"
          onChange={(value) => onFilterChange({ confidence: value })}
          options={filterOptions.confidenceLevels}
          value={filters.confidence}
        />
        <FilterSelect
          id="graph-filter-node-type"
          label="Item type"
          onChange={(value) => onFilterChange({ nodeType: value })}
          options={filterOptions.nodeTypes}
          value={filters.nodeType}
        />
        <label
          className="field-label checkbox-field"
          htmlFor="graph-filter-inferred"
        >
          <input
            checked={filters.includeCandidates}
            id="graph-filter-inferred"
            onChange={(event) =>
              onFilterChange({ includeCandidates: event.target.checked })
            }
            type="checkbox"
          />
          Include inferred links
        </label>
        <label className="field-label" htmlFor="graph-filter-search">
          Search map
          <input
            id="graph-filter-search"
            onChange={(event) => onFilterChange({ search: event.target.value })}
            placeholder="Filter by ID or title"
            type="search"
            value={filters.search}
          />
        </label>
      </div>
      ) : null}

      {mapControls ? (
        <div aria-label="Map controls" className="relationship-map-controls" role="group">
          <button
            className="secondary quiet"
            disabled={layoutRunning}
            onClick={() => graphRef.current?.fitToScreen()}
            type="button"
          >
            Fit to screen
          </button>
          <button
            className="secondary quiet"
            disabled={layoutRunning}
            onClick={() => graphRef.current?.resetView()}
            type="button"
          >
            Reset view
          </button>
          <button
            className="secondary quiet"
            disabled={layoutRunning}
            onClick={() => graphRef.current?.zoomIn()}
            type="button"
          >
            Zoom in
          </button>
          <button
            className="secondary quiet"
            disabled={layoutRunning}
            onClick={() => graphRef.current?.zoomOut()}
            type="button"
          >
            Zoom out
          </button>
          {selectedHasRecord && onOpenRecord ? (
            <button
              className="secondary"
              onClick={() => onOpenRecord(selectedNode!.id)}
              type="button"
            >
              Open selected record
            </button>
          ) : null}
          {selectedHasRecord && onOpenCompare && selectedNode?.metadata?.item_id ? (
            <button
              className="secondary"
              onClick={() => onOpenCompare(selectedNode.metadata!.item_id!)}
              type="button"
            >
              Compare selected item
            </button>
          ) : null}
          {onCopyMapLink ? (
            <button className="secondary quiet" onClick={onCopyMapLink} type="button">
              Copy map link
            </button>
          ) : null}
        </div>
      ) : null}

      {collapseLabels.length > 0 && clustering.onClusterCollapse ? (
        <div
          aria-label="Expanded connection groups"
          className="cluster-collapse-row"
          role="group"
        >
          {collapseLabels.map(({ clusterKey, label }) => (
            <button
              className="secondary quiet"
              disabled={layoutRunning}
              key={clusterKey}
              onClick={() => clustering.onClusterCollapse?.(clusterKey)}
              type="button"
            >
              Collapse {label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        aria-label="Relationship views"
        className="relationship-view-tabs"
        role="tablist"
      >
        <button
          aria-selected={relationshipView === "map"}
          className={relationshipView === "map" ? "tab active" : "tab"}
          onClick={() => onViewChange("map")}
          role="tab"
          type="button"
        >
          Map
        </button>
        <button
          aria-selected={relationshipView === "list"}
          className={relationshipView === "list" ? "tab active" : "tab"}
          onClick={() => onViewChange("list")}
          role="tab"
          type="button"
        >
          {listLabel}
        </button>
      </div>

      <div
        className="relationship-map-legend"
        role="list"
        aria-label="Map legend"
      >
        {compareLegend
          ? COMPARE_ROLE_LEGEND.map((entry) => (
              <span className="legend-item" key={entry.key} role="listitem">
                <span
                  aria-hidden="true"
                  className="legend-swatch"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.label}
              </span>
            ))
          : ITEM_TYPE_LEGEND.map((entry) => (
              <span className="legend-item" key={entry.key} role="listitem">
                <span
                  aria-hidden="true"
                  className={`legend-shape legend-shape-${entry.shape}`}
                />
                {entry.label}
              </span>
            ))}
        {PROVENANCE_LEGEND.map((entry) => (
          <span className="legend-item" key={entry.key} role="listitem">
            <span
              aria-hidden="true"
              className="legend-swatch"
              style={{
                backgroundColor: provenanceCssVar(entry.key),
                borderStyle:
                  entry.pattern === "dashed"
                    ? "dashed"
                    : entry.pattern === "dotted"
                      ? "dotted"
                      : "solid",
              }}
            />
            <ProvenanceTerm kind="provenance" label={entry.label} value={entry.key} />
          </span>
        ))}
      </div>

      {relationshipView === "map" ? (
        <div
          aria-describedby={summaryId}
          className="relationship-map-body"
          role="tabpanel"
        >
          <Suspense
            fallback={
              <div aria-live="polite" className="relationship-map-loading" role="status">
                <div aria-hidden="true" className="skeleton-map-canvas" />
                Loading {neighborhood.nodes.length} nodes /{" "}
                {neighborhood.edges.length} edges…
              </div>
            }
          >
            <RelationshipGraphWithHandle
              centerNodeId={centerNodeId}
              clusterMeta={clustering.clusterMeta}
              edges={neighborhood.edges}
              nodes={neighborhood.nodes}
              onClusterClick={clustering.onClusterExpand}
              onLayoutRunningChange={setLayoutRunning}
              onSelectNode={setSelectedNodeId}
              reducedMotion={reducedMotion}
              ref={graphRef}
              searchHighlightIds={searchHighlightIds}
              selectedNodeId={selectedNodeId}
            />
          </Suspense>
          {!mapControls && selectedNode ? (
            <aside className="relationship-map-selection">
              <p className="eyebrow">Selected item</p>
              <strong>
                {selectedNode.metadata?.item_id || selectedNode.id}
              </strong>
              <p>
                {selectedNode.metadata?.title ||
                  selectedNode.label ||
                  selectedNode.id}
              </p>
              {selectedNode.id !== centerNodeId ? (
                <button
                  className="secondary"
                  onClick={() => onOpenNode(selectedNode.id)}
                  type="button"
                >
                  Open record
                </button>
              ) : (
                <p className="muted">Center of this map.</p>
              )}
            </aside>
          ) : null}
        </div>
      ) : (
        <div
          aria-describedby={summaryId}
          className="relationship-map-body"
          role="tabpanel"
        >
          <RelationshipGraphTable
            onOpenNode={onOpenNode}
            rows={
              tableRows as Parameters<typeof RelationshipGraphTable>[0]["rows"]
            }
          />
        </div>
      )}
    </section>
  );
}

export function relationshipFiltersFromState(state: {
  relationshipType?: string;
  provenance?: string;
  confidence?: string;
  nodeType?: string;
  includeCandidates?: string;
  relationshipSearch?: string;
}): RelationshipFilterState {
  return {
    relationshipType: state.relationshipType || "",
    provenance: state.provenance || "",
    confidence: state.confidence || "",
    nodeType: state.nodeType || "",
    includeCandidates: state.includeCandidates === "true",
    search: state.relationshipSearch || "",
  };
}

export function relationshipFiltersToPatch(
  filters: Partial<RelationshipFilterState>,
): Record<string, string> {
  const patch: Record<string, string> = {};
  if (filters.relationshipType !== undefined)
    patch.relationshipType = filters.relationshipType;
  if (filters.provenance !== undefined) patch.provenance = filters.provenance;
  if (filters.confidence !== undefined) patch.confidence = filters.confidence;
  if (filters.nodeType !== undefined) patch.nodeType = filters.nodeType;
  if (filters.includeCandidates !== undefined) {
    patch.includeCandidates = filters.includeCandidates ? "true" : "";
  }
  if (filters.search !== undefined) patch.relationshipSearch = filters.search;
  return patch;
}
