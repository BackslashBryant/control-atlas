import { useMemo } from "react";
import type { ReactNode } from "react";

import { CompareExportDisclosure } from "./LoadStatusPanel";
import { ProvenanceTerm } from "./ProvenanceTerm";
import { RelationshipExplorer } from "./RelationshipExplorer";
import {
  compareGraphTableRows,
  type CompareGraphResult,
} from "../lib/buildCompareGraph";
import { useClusteredGraph } from "../lib/useClusteredGraph";
import type { CompareViewMode, ViewState } from "../lib/viewState";
import type { RuntimeBundle } from "../lib/runtimeLoader";

type CompareResultsPanelProps = {
  bundle: RuntimeBundle;
  graph: CompareGraphResult;
  compareView: CompareViewMode;
  matrixWorkbench: Extract<ViewState, { view: "matrix" }>["workbench"];
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
    matrixWorkbench,
    onNavigate,
    onOpenNode,
    onExport,
    listContent,
  } = props;

  const staticTableRows = useMemo(() => compareGraphTableRows(graph), [graph]);
  const compareViewMode = compareView === "map" ? "map" : "list";

  const {
    nodes: clusteredNodes,
    edges: clusteredEdges,
    clusterMeta,
    expandedClusters,
    expandedClusterLabels,
    onClusterExpand,
    onClusterCollapse,
  } = useClusteredGraph({
    runtime: bundle.runtime,
    centerNodeId: graph.centerNodeId,
    nodes: graph.nodes,
    edges: graph.edges,
    enabled: compareView === "map" && graph.mapAvailable,
  });

  const setCompareView = (view: CompareViewMode) => {
    onNavigate("matrix", { compareView: view, workbench: matrixWorkbench });
  };

  const openAtlasMap = () => {
    if (!graph.atlasMapNode) return;
    onNavigate("atlas-map", { node: graph.atlasMapNode });
  };

  const compareUsesPathLayout =
    matrixWorkbench === "stig-chain" || matrixWorkbench === "threat-chain";

  return (
    <section className="compare-results-panel">
      <p className="notice-inline compare-trust-note" role="note">
        Reference aid only — not an official government mapping. Verify every
        row against the public source before you cite it in workpapers.
      </p>
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
        <article className="summary-card">
          <h3>Published</h3>
          <p>{graph.summary.sourceBacked}</p>
        </article>
        <article className="summary-card">
          <h3>Inferred</h3>
          <p>{graph.summary.inferred}</p>
        </article>
        <article className="summary-card">
          <h3>Deprecated</h3>
          <p>{graph.summary.deprecated}</p>
        </article>
      </div>

      <p className="compare-legend">
        <ProvenanceTerm
          kind="publication"
          label="Published mapping"
          value="published"
        />{" "}
        = published mapping.{" "}
        <ProvenanceTerm
          kind="publication"
          label="Candidate mapping"
          value="candidate"
        />{" "}
        = candidate mapping that still needs review.
      </p>

      <div className="card-actions">
        {graph.atlasMapNode ? (
          <button className="primary" onClick={openAtlasMap} type="button">
            Open in Atlas Map
          </button>
        ) : null}
        <button
          className={compareView === "map" ? "primary" : "secondary"}
          disabled={!graph.mapAvailable}
          onClick={() => setCompareView("map")}
          type="button"
        >
          Map
        </button>
        <button
          className={compareView === "list" ? "primary" : "secondary"}
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
                  workbench: "relationships",
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
        <RelationshipExplorer
          centerItemId={graph.atlasMapNode}
          centerNodeId={graph.centerNodeId}
          clusterMeta={clusterMeta}
          compareLegend
          expandedClusterLabels={expandedClusterLabels}
          expandedClusters={expandedClusters}
          filters={{
            relationshipType: "",
            provenance: "",
            confidence: "",
            nodeType: "",
            includeCandidates: false,
            search: "",
          }}
          heading="Compare map"
          introCopy={`Showing ${graph.stats.filtered} of ${graph.stats.nodeCount} items in this comparison.`}
          layoutMode={compareUsesPathLayout ? "hierarchy" : "expanded"}
          listLabel="List"
          mapControls
          onClusterCollapse={onClusterCollapse}
          onClusterExpand={onClusterExpand}
          onFilterChange={() => {}}
          onOpenNode={onOpenNode}
          onViewChange={(view) => setCompareView(view)}
          relationshipView={compareViewMode}
          runtime={bundle.runtime}
          showFilters={false}
          staticGraph={{
            nodes: clusteredNodes,
            edges: clusteredEdges,
            stats: graph.stats,
          }}
          staticTableRows={staticTableRows}
        />
      ) : (
        listContent || (
          <>
            <p className="compare-table-scroll-hint">
              Swipe horizontally to review every comparison column.
            </p>
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
