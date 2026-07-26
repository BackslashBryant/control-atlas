import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { AtlasConnectionMap } from "./AtlasConnectionMap";
import { CompareExportDisclosure } from "./LoadStatusPanel";
import { ProvenanceTerm } from "./ProvenanceTerm";
import { RelationshipExplorer } from "./RelationshipExplorer";
import {
  compareGraphTableRows,
  type CompareGraphResult,
  type CompareRole,
} from "../lib/buildCompareGraph";
import type {
  AtlasConnectionGroup,
  AtlasRelationshipRow,
} from "../lib/atlasModel";
import type { CompareViewMode, ViewState } from "../lib/viewState";
import type { RuntimeBundle } from "../lib/runtimeLoader";

function useCompactMapViewport() {
  const [compact, setCompact] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return compact;
}

const COMPARE_GROUP_ORDER: CompareRole[] = [
  "shared",
  "uniqueA",
  "uniqueB",
  "neutral",
];

function buildCompareMapGroups(
  graph: CompareGraphResult,
): AtlasConnectionGroup[] {
  const edgeByNode = new Map(
    graph.edges.flatMap((edge) => [
      [edge.source_node_id, edge],
      [edge.target_node_id, edge],
    ]) as Array<[string, (typeof graph.edges)[number]]>,
  );
  const byRole = new Map<CompareRole, AtlasRelationshipRow[]>();
  for (const node of graph.nodes) {
    if (node.id === graph.centerNodeId) {
      continue;
    }
    const role: CompareRole = node.compareRole || "neutral";
    const edge = edgeByNode.get(node.id);
    const row = {
      edge: (edge ? { ...edge, id: edge.id } : { id: `compare-${node.id}` }) as
        AtlasRelationshipRow["edge"],
      counterpart: node as AtlasRelationshipRow["counterpart"],
      itemId: node.metadata?.item_id || node.id,
      title: node.metadata?.title || node.label || node.id,
    };
    const rows = byRole.get(role) || [];
    rows.push(row);
    byRole.set(role, rows);
  }
  const labelFor = (role: CompareRole) =>
    role === "shared"
      ? graph.labels.shared
      : role === "uniqueA"
        ? graph.labels.uniqueA
        : role === "uniqueB"
          ? graph.labels.uniqueB
          : "Related records";
  return COMPARE_GROUP_ORDER.filter((role) => byRole.get(role)?.length).map(
    (role) => ({
      id: role,
      label: labelFor(role),
      description: labelFor(role),
      placement: "lateral" as const,
      stage: "control" as const,
      rmfStage: "select" as const,
      items: byRole.get(role) || [],
    }),
  );
}

type CompareResultsPanelProps = {
  bundle: RuntimeBundle;
  graph: CompareGraphResult;
  compareView: CompareViewMode;
  matrixCrosswalk: Extract<ViewState, { view: "matrix" }>["crosswalk"];
  onNavigate: (view: ViewState["view"], patch?: Partial<ViewState>) => void;
  onOpenNode: (nodeId: string) => void;
  onExport: (format: "csv" | "markdown" | "json") => void;
  listContent?: ReactNode;
};

export function CompareResultsPanel(props: CompareResultsPanelProps) {
  const {
    bundle,
    graph,
    compareView,
    matrixCrosswalk,
    onNavigate,
    onOpenNode,
    onExport,
    listContent,
  } = props;

  const staticTableRows = useMemo(() => compareGraphTableRows(graph), [graph]);
  const totalMappingRows = useMemo(
    () => graph.edges.filter((edge) => edge.id !== "baseline-a").length,
    [graph],
  );
  const hiddenMappingRows = totalMappingRows - staticTableRows.length;
  const compact = useCompactMapViewport();
  const [expandedGroupId, setExpandedGroupId] = useState("");
  const compareMapGroups = useMemo(
    () => buildCompareMapGroups(graph),
    [graph],
  );
  const centerNode = useMemo(
    () =>
      (graph.nodes.find((node) => node.id === graph.centerNodeId) || {
        id: graph.centerNodeId,
        metadata: { item_id: graph.atlasMapNode, title: "Comparison scope" },
        label: graph.atlasMapNode || "Comparison scope",
      }) as Parameters<typeof AtlasConnectionMap>[0]["center"],
    [graph],
  );

  const setCompareView = (view: CompareViewMode) => {
    onNavigate("matrix", { compareView: view, crosswalk: matrixCrosswalk });
  };

  const openAtlasMap = () => {
    if (!graph.atlasMapNode) return;
    onNavigate("atlas-map", { node: graph.atlasMapNode });
  };

  return (
    <section className="compare-results-panel">
      <div className="compare-summary-grid summary-grid">
        <article className="summary-card">
          <h3>{graph.labels.shared}</h3>
          <p>{graph.summary.shared}</p>
        </article>
        <article className="summary-card">
          <h3>{graph.labels.uniqueA}</h3>
          <p>{graph.summary.uniqueA}</p>
        </article>
        <article className="summary-card">
          <h3>{graph.labels.uniqueB}</h3>
          <p>{graph.summary.uniqueB}</p>
        </article>
      </div>

      {/* Provenance is a quality note about the mappings, not a fourth thing
          being compared. It used to occupy three more full-size tiles, two of
          which usually read 0 — equal visual weight for nothing. */}
      <p className="compare-provenance-note">
        {[
          graph.summary.sourceBacked
            ? `${graph.summary.sourceBacked} published`
            : "",
          graph.summary.inferred ? `${graph.summary.inferred} candidate` : "",
          graph.summary.deprecated
            ? `${graph.summary.deprecated} deprecated`
            : "",
        ]
          .filter(Boolean)
          .join(" · ") || "No mapping provenance recorded for this comparison."}
        {graph.summary.sourceBacked ? " mappings." : ""}
      </p>

      {/* This legend used to define each term as itself ("Published mapping =
          published mapping"), which tells a newcomer nothing. */}
      <p className="compare-legend">
        <ProvenanceTerm
          kind="publication"
          label="Published mapping"
          value="published"
        />{" "}
        the publisher states this relationship.{" "}
        <ProvenanceTerm
          kind="publication"
          label="Candidate mapping"
          value="candidate"
        />{" "}
        proposed but not published — confirm it against the source before you
        rely on it.
      </p>

      <div className="card-actions">
        {graph.atlasMapNode ? (
          <button className="secondary" onClick={openAtlasMap} type="button">
            Open in Atlas Map
          </button>
        ) : null}
        <button
          aria-pressed={compareView === "map"}
          className="secondary"
          disabled={!graph.mapAvailable}
          onClick={() => setCompareView("map")}
          type="button"
        >
          Map
        </button>
        <button
          aria-pressed={compareView === "list"}
          className="secondary"
          onClick={() => setCompareView("list")}
          type="button"
        >
          List
        </button>
      </div>

      <CompareExportDisclosure onExport={onExport} />

      {compareView === "map" && !graph.mapAvailable ? (
        <section className="empty-state compare-map-unavailable">
          <h2>Map view is not available for this comparison yet.</h2>
          <p>You can still review the detailed list.</p>
          <div className="card-actions">
            <button
              className="primary"
              onClick={() => setCompareView("list")}
              type="button"
            >
              View list
            </button>
            <button
              className="secondary"
              onClick={() =>
                onNavigate("matrix", {
                  crosswalk: "relationships",
                  compareView: "list",
                })
              }
              type="button"
            >
              Change comparison
            </button>
          </div>
        </section>
      ) : compareView === "map" ? (
        <section aria-label="Compare map" className="stack" id="compare-detail">
          <h3>Compare map</h3>
          <p className="muted">
            {graph.stats.nodeCount} items across {compareMapGroups.length}{" "}
            groups. Open a group to see its records; the List holds every
            connection.
          </p>
          <AtlasConnectionMap
            center={centerNode}
            compact={compact}
            expandedGroupId={expandedGroupId}
            groups={compareMapGroups}
            onExpandedGroupChange={setExpandedGroupId}
            onOpenList={() => setCompareView("list")}
            onSelectItem={(row) => onOpenNode(row.counterpart.id)}
            selectedItemId=""
          />
        </section>
      ) : (
        listContent || (
          <>
            <p className="compare-table-scroll-hint">
              Swipe horizontally to review every comparison column.
            </p>
            {hiddenMappingRows > 0 ? (
              <p className="notice-inline" role="note">
                Showing the first {staticTableRows.length.toLocaleString()} of{" "}
                {totalMappingRows.toLocaleString()} mappings. Export the results
                to work with every row.
              </p>
            ) : null}
            <RelationshipExplorer
              centerItemId={graph.atlasMapNode}
              centerNodeId={graph.centerNodeId}
              filters={{
                relationshipType: "",
                provenance: "",
                confidence: "",
                nodeType: "",
                includeCandidates: false,
                search: "",
              }}
              heading="Compare list"
              listLabel="List"
              onFilterChange={() => {}}
              onOpenNode={onOpenNode}
              onViewChange={(view) => setCompareView(view)}
              relationshipView="list"
              runtime={bundle.runtime}
              showFilters={false}
              staticGraph={{
                nodes: graph.nodes,
                edges: graph.edges,
                stats: graph.stats,
              }}
              staticTableRows={staticTableRows}
            />
          </>
        )
      )}
    </section>
  );
}
