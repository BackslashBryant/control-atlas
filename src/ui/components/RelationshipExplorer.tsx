import { lazy, Suspense, useMemo, useState } from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import { ProvenanceBadge } from "../lib/compareHelpers";
import { PROVENANCE_LEGEND, provenanceCssVar } from "../lib/graphTheme";
import {
  useRelationshipFilters,
  type RelationshipFilterState,
} from "../lib/useRelationshipFilters";
import { RelationshipGraphTable } from "./RelationshipGraphTable";

const RelationshipGraph = lazy(() => import("./RelationshipGraph"));

type RelationshipExplorerProps = {
  runtime: Parameters<typeof useRelationshipFilters>[0];
  centerNodeId: string;
  centerItemId: string;
  relationshipView: "map" | "table";
  filters: RelationshipFilterState;
  onFilterChange: (patch: Partial<RelationshipFilterState>) => void;
  onViewChange: (view: "map" | "table") => void;
  onOpenNode: (nodeId: string) => void;
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
  } = props;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    centerNodeId,
  );
  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const { neighborhood, filterOptions, tableRows } = useRelationshipFilters(
    runtime,
    centerNodeId,
    filters,
  );

  const searchHighlightIds = useMemo(() => {
    if (!filters.search.trim()) return new Set<string>();
    return new Set(tableRows.map((row) => row!.counterpart.id));
  }, [filters.search, tableRows]);

  const selectedNode =
    neighborhood.nodes.find((node) => node.id === selectedNodeId) || null;
  const summaryId = "relationship-map-summary";

  return (
    <section
      aria-labelledby="relationship-map-heading"
      className="relationship-map-panel"
    >
      <div className="relationship-map-intro">
        <h3 id="relationship-map-heading">Relationship map</h3>
        <p id={summaryId}>
          This map shows published connections around {centerItemId}.{" "}
          {neighborhood.stats.nodeCount} items and {neighborhood.stats.filtered}{" "}
          links are visible
          {neighborhood.stats.truncated
            ? " (view truncated for performance)"
            : ""}
          . Use the table view for full screen-reader access to every
          connection.
        </p>
      </div>

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
          Search connections
          <input
            id="graph-filter-search"
            onChange={(event) => onFilterChange({ search: event.target.value })}
            placeholder="Filter by ID or title"
            type="search"
            value={filters.search}
          />
        </label>
      </div>

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
          aria-selected={relationshipView === "table"}
          className={relationshipView === "table" ? "tab active" : "tab"}
          onClick={() => onViewChange("table")}
          role="tab"
          type="button"
        >
          Table
        </button>
      </div>

      <div
        className="relationship-map-legend"
        role="list"
        aria-label="Provenance legend"
      >
        {PROVENANCE_LEGEND.map((entry) => (
          <span className="legend-item" key={entry.key} role="listitem">
            <span
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
            {entry.label}
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
            fallback={<p className="muted">Loading relationship map…</p>}
          >
            <RelationshipGraph
              centerNodeId={centerNodeId}
              edges={neighborhood.edges}
              nodes={neighborhood.nodes}
              onSelectNode={setSelectedNodeId}
              reducedMotion={reducedMotion}
              searchHighlightIds={searchHighlightIds}
              selectedNodeId={selectedNodeId}
            />
          </Suspense>
          {selectedNode ? (
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
                  Open detail
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
