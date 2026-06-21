import { useMemo } from "react";
import type { ReactNode } from "react";

import { CompareExportDisclosure } from "./LoadStatusPanel";
import { ProvenanceTerm } from "./ProvenanceTerm";
import { RelationshipExplorer } from "./RelationshipExplorer";
import {
  compareGraphTableRows,
  type CompareGraphResult,
} from "../lib/buildCompareGraph";
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

  const setCompareView = (view: CompareViewMode) => {
    onNavigate("matrix", { compareView: view, workbench: matrixWorkbench });
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
        <article className="summary-card">
          <h3>Source-backed</h3>
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
        <ProvenanceTerm kind="publication" label="Official link" value="published" /> = published mapping.{" "}
        <ProvenanceTerm kind="publication" label="Inferred link" value="candidate" /> = candidate mapping that still needs review.
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
                onNavigate("matrix", { workbench: "intent", compareView: "list" })
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
          compareLegend
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
          listLabel="List"
          mapControls
          onFilterChange={() => {}}
          onOpenNode={onOpenNode}
          onViewChange={(view) => setCompareView(view)}
          relationshipView={compareViewMode}
          runtime={bundle.runtime}
          showFilters={false}
          staticGraph={{
            nodes: graph.nodes,
            edges: graph.edges,
            stats: graph.stats,
          }}
          staticTableRows={staticTableRows}
        />
      ) : (
        listContent || (
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
        )
      )}
    </section>
  );
}
