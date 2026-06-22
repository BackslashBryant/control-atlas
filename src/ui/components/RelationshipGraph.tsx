import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import fcose from "cytoscape-fcose";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ClusterNodeMeta } from "../lib/graphClustering";
import {
  buildGraphData,
  linkDashPattern,
  nodeColor,
  provenanceColor,
  type GraphNode,
} from "../lib/graphTheme";
import type { RelationshipGraphHandle } from "./RelationshipExplorer";

cytoscape.use(fcose);

type RelationshipGraphProps = {
  nodes: Array<{
    id: string;
    node_type?: string;
    label?: string;
    metadata?: { item_id?: string; title?: string };
    compareRole?: import("../lib/graphTheme").CompareRole;
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
  centerNodeId: string;
  selectedNodeId: string | null;
  searchHighlightIds: Set<string>;
  onSelectNode: (nodeId: string) => void;
  reducedMotion: boolean;
  clusterMeta?: Map<string, ClusterNodeMeta>;
  onClusterClick?: (clusterKey: string) => void;
};

function nodeShape(node: GraphNode) {
  if (node.isCluster) return "round-rectangle";
  if (node.nodeType === "baseline") return "triangle";
  if (node.nodeType === "template") return "diamond";
  if (node.nodeType === "source") return "hexagon";
  return "ellipse";
}

export const RelationshipGraphWithHandle = forwardRef<
  RelationshipGraphHandle,
  RelationshipGraphProps
>(function RelationshipGraphWithHandle(props, ref) {
  const {
    nodes,
    edges,
    centerNodeId,
    selectedNodeId,
    searchHighlightIds,
    onSelectNode,
    reducedMotion,
    clusterMeta,
    onClusterClick,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Core | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const graphData = useMemo(
    () => buildGraphData(nodes, edges, centerNodeId, clusterMeta),
    [centerNodeId, clusterMeta, edges, nodes],
  );

  const elements = useMemo<ElementDefinition[]>(() => {
    const nodeElements = graphData.nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.itemId,
        title: node.label,
        nodeType: node.nodeType,
        isCluster: Boolean(node.isCluster),
        color: nodeColor(node, selectedNodeId, searchHighlightIds),
        shape: nodeShape(node),
      },
      classes: [
        node.isCenter ? "center-node" : "",
        node.isCluster ? "cluster-node" : "",
        node.id === selectedNodeId ? "selected-node" : "",
        searchHighlightIds.has(node.id) ? "search-match" : "",
      ]
        .filter(Boolean)
        .join(" "),
    }));
    const edgeElements = graphData.links.map((edge) => ({
      data: {
        id: edge.id,
        source:
          typeof edge.source === "string" ? edge.source : edge.source.id,
        target:
          typeof edge.target === "string" ? edge.target : edge.target.id,
        label: edge.relationshipType,
        color: provenanceColor(edge.provenanceClass),
        lineStyle: linkDashPattern(
          edge.provenanceClass,
          edge.publicationStatus,
        )
          ? "dashed"
          : "solid",
      },
    }));
    return [...nodeElements, ...edgeElements];
  }, [graphData, searchHighlightIds, selectedNodeId]);

  function runLayout(graph: Core) {
    graph
      .layout({
        name: "fcose",
        nodeDimensionsIncludeLabels: true,
        quality: "default",
        packComponents: true,
        animate: !reducedMotion,
        animationDuration: 400,
        fit: true,
        padding: 48,
        randomize: true,
      } as cytoscape.LayoutOptions)
      .run();
  }

  useImperativeHandle(ref, () => ({
    fitToScreen() {
      graphRef.current?.fit(undefined, 48);
    },
    resetView() {
      const graph = graphRef.current;
      if (graph) runLayout(graph);
    },
    zoomIn() {
      const graph = graphRef.current;
      if (graph) graph.zoom(graph.zoom() * 1.2);
    },
    zoomOut() {
      const graph = graphRef.current;
      if (graph) graph.zoom(graph.zoom() / 1.2);
    },
  }));

  useEffect(() => {
    if (!containerRef.current || !elements.length) {
      return undefined;
    }

    const graph = cytoscape({
      container: containerRef.current,
      elements,
      minZoom: 0.25,
      maxZoom: 3,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            "border-color": "#334155",
            "border-width": 1,
            height: 22,
            label: "",
            shape: "data(shape)",
            width: 22,
          },
        },
        {
          selector: "node.center-node, node.cluster-node, node.selected-node",
          style: {
            label: "data(label)",
            "font-size": 10,
            color: "#F8FAFC",
            "text-background-color": "#0B1020",
            "text-background-opacity": 0.88,
            "text-background-padding": 3,
            "text-margin-y": -18,
          },
        },
        {
          selector: "node.selected-node",
          style: {
            "border-color": "#22D3EE",
            "border-width": 4,
            height: 32,
            width: 32,
          },
        },
        {
          selector: "node.cluster-node",
          style: {
            height: 34,
            width: 34,
          },
        },
        {
          selector: "node.hover-label, node.zoom-label, node.search-match",
          style: {
            label: "data(label)",
            "font-size": 10,
            color: "#F8FAFC",
            "text-background-color": "#0B1020",
            "text-background-opacity": 0.88,
            "text-background-padding": 3,
            "text-margin-y": -16,
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "line-color": "data(color)",
            "line-style": "data(lineStyle)",
            opacity: 0.72,
            "target-arrow-color": "data(color)",
            "target-arrow-shape": "triangle",
            width: 1.5,
          },
        },
      ] as cytoscape.StylesheetJson,
    });
    graphRef.current = graph;
    runLayout(graph);

    graph.on("tap", "node", (event) => {
      const nodeId = event.target.id();
      if (nodeId.startsWith("cluster:") && onClusterClick) {
        onClusterClick(nodeId.replace("cluster:", ""));
      }
      onSelectNode(nodeId);
    });
    graph.on("mouseover", "node", (event) => {
      event.target.addClass("hover-label");
    });
    graph.on("mouseout", "node", (event) => {
      event.target.removeClass("hover-label");
    });
    graph.on("zoom", () => {
      const zoom = graph.zoom();
      setZoomLevel(zoom);
      graph.nodes().toggleClass("zoom-label", zoom > 1.5);
    });

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [elements, onClusterClick, onSelectNode, reducedMotion]);

  if (!graphData.nodes.length) {
    return <p className="muted">No graph nodes to display with the current filters.</p>;
  }

  return (
    <div className="relationship-graph-canvas-wrap">
      <div
        aria-label="Interactive relationship map"
        className="relationship-graph-canvas"
        ref={containerRef}
        role="img"
      />
      <div className="graph-node-shortcuts" aria-label="Map nodes">
        {graphData.nodes.map((node) => (
          <button
            className={node.id === selectedNodeId ? "selected" : ""}
            key={node.id}
            onClick={() => {
              if (node.isCluster && onClusterClick) {
                onClusterClick(node.id.replace("cluster:", ""));
              }
              onSelectNode(node.id);
            }}
            type="button"
          >
            {node.itemId}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="visually-hidden">
        Map loaded: {graphData.nodes.length} nodes / {graphData.links.length} edges.
        Map zoom level {zoomLevel.toFixed(1)}x.
      </p>
    </div>
  );
});

export default RelationshipGraphWithHandle;
