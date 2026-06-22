import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import fcose from "cytoscape-fcose";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type { ClusterNodeMeta } from "../lib/graphClustering";
import {
  buildFcoseOptions,
  placeNewNodesNearAnchor,
  resolveLayoutMode,
  topologyFingerprint,
  truncateCanvasLabel,
  type LayoutMode,
} from "../lib/graphLayout";
import {
  buildGraphData,
  linkDashPattern,
  nodeColor,
  provenanceColor,
  type GraphNode,
} from "../lib/graphTheme";
import type { RelationshipGraphHandle } from "./RelationshipExplorer";

cytoscape.use(fcose);

const GRAPH_STYLESHEET = [
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
    selector:
      "node.hover-label, node.zoom-label-search, node.zoom-label-neighbor, node.search-match",
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
] as cytoscape.StylesheetJson;

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
  onLayoutRunningChange?: (running: boolean) => void;
};

function nodeShape(node: GraphNode) {
  if (node.isCluster) return "round-rectangle";
  if (node.nodeType === "baseline") return "triangle";
  if (node.nodeType === "template") return "diamond";
  if (node.nodeType === "source") return "hexagon";
  return "ellipse";
}

function buildTopologyElements(
  graphData: ReturnType<typeof buildGraphData>,
): ElementDefinition[] {
  const nodeElements = graphData.nodes.map((node) => ({
    data: {
      id: node.id,
      label: truncateCanvasLabel(node.itemId),
      title: node.label,
      nodeType: node.nodeType,
      isCluster: Boolean(node.isCluster),
      shape: nodeShape(node),
    },
    classes: [
      node.isCenter ? "center-node" : "",
      node.isCluster ? "cluster-node" : "",
    ]
      .filter(Boolean)
      .join(" "),
  }));

  const edgeElements = graphData.links.map((edge) => ({
    data: {
      id: edge.id,
      source: typeof edge.source === "string" ? edge.source : edge.source.id,
      target: typeof edge.target === "string" ? edge.target : edge.target.id,
      label: edge.relationshipType,
      color: provenanceColor(edge.provenanceClass),
      lineStyle: linkDashPattern(edge.provenanceClass, edge.publicationStatus)
        ? "dashed"
        : "solid",
    },
  }));

  return [...nodeElements, ...edgeElements];
}

function buildAdjacency(
  edges: RelationshipGraphProps["edges"],
): Map<string, string[]> {
  const adjacency = new Map<string, Set<string>>();

  function link(a: string, b: string) {
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    if (!adjacency.has(b)) adjacency.set(b, new Set());
    adjacency.get(a)!.add(b);
    adjacency.get(b)!.add(a);
  }

  for (const edge of edges) {
    link(edge.source_node_id, edge.target_node_id);
  }

  return new Map(
    [...adjacency.entries()].map(([id, neighbors]) => [
      id,
      [...neighbors].sort(),
    ]),
  );
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
    onLayoutRunningChange,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Core | null>(null);
  const layoutRef = useRef<{ stop: () => void } | null>(null);
  const topologyRef = useRef<{
    fingerprint: string | null;
    nodeIds: Set<string>;
  }>({ fingerprint: null, nodeIds: new Set() });
  const onSelectNodeRef = useRef(onSelectNode);
  const onClusterClickRef = useRef(onClusterClick);
  const onLayoutRunningChangeRef = useRef(onLayoutRunningChange);
  const reducedMotionRef = useRef(reducedMotion);
  const layoutShowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [layoutRunning, setLayoutRunning] = useState(false);
  const [layoutVisible, setLayoutVisible] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [focusedShortcutIndex, setFocusedShortcutIndex] = useState(0);

  onSelectNodeRef.current = onSelectNode;
  onClusterClickRef.current = onClusterClick;
  onLayoutRunningChangeRef.current = onLayoutRunningChange;
  reducedMotionRef.current = reducedMotion;

  const graphData = useMemo(
    () => buildGraphData(nodes, edges, centerNodeId, clusterMeta),
    [centerNodeId, clusterMeta, edges, nodes],
  );

  const topologyElements = useMemo(
    () => buildTopologyElements(graphData),
    [graphData],
  );

  const topologyKey = useMemo(
    () =>
      topologyFingerprint(
        centerNodeId,
        graphData.nodes.map((node) => node.id),
        graphData.links.map((link) => link.id),
      ),
    [centerNodeId, graphData],
  );

  const adjacency = useMemo(() => buildAdjacency(edges), [edges]);

  const neighborIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    return new Set(adjacency.get(selectedNodeId) ?? []);
  }, [adjacency, selectedNodeId]);

  const setLayoutRunningState = useCallback((running: boolean) => {
    setLayoutRunning(running);
    onLayoutRunningChangeRef.current?.(running);

    if (layoutShowTimerRef.current) {
      clearTimeout(layoutShowTimerRef.current);
      layoutShowTimerRef.current = null;
    }

    if (running) {
      layoutShowTimerRef.current = setTimeout(() => {
        setLayoutVisible(true);
      }, 150);
      return;
    }

    setLayoutVisible(false);
  }, []);

  const applyNodeStyles = useCallback(
    (graph: Core) => {
      const zoom = graph.zoom();
      const showSearchLabels = zoom > 1.5 && zoom <= 2;
      const showNeighborLabels = zoom > 2;

      graph.nodes().forEach((node) => {
        const graphNode = graphData.nodes.find((entry) => entry.id === node.id());
        if (!graphNode) {
          return;
        }

        node.data(
          "color",
          nodeColor(graphNode, selectedNodeId, searchHighlightIds),
        );
        node.toggleClass("selected-node", node.id() === selectedNodeId);
        node.toggleClass("search-match", searchHighlightIds.has(node.id()));
        node.toggleClass(
          "zoom-label-search",
          showSearchLabels && searchHighlightIds.has(node.id()),
        );
        node.toggleClass(
          "zoom-label-neighbor",
          showNeighborLabels && neighborIds.has(node.id()),
        );
      });
    },
    [graphData.nodes, neighborIds, searchHighlightIds, selectedNodeId],
  );

  const runLayout = useCallback(
    (graph: Core, mode: Exclude<LayoutMode, "none">, preserveViewport = false) => {
      layoutRef.current?.stop();

      const viewport = preserveViewport
        ? { pan: graph.pan(), zoom: graph.zoom() }
        : null;

      const layout = graph.layout(
        buildFcoseOptions(mode, reducedMotionRef.current),
      );
      layoutRef.current = layout;

      layout.on("layoutstart", () => {
        setLayoutRunningState(true);
        setLiveMessage(
          `Arranging ${graphData.nodes.length} nodes / ${graphData.links.length} links…`,
        );
      });

      layout.on("layoutstop", () => {
        if (preserveViewport && viewport) {
          graph.pan(viewport.pan);
          graph.zoom(viewport.zoom);
        }
        setLayoutRunningState(false);
        setLiveMessage(
          `Map ready: ${graphData.nodes.length} nodes / ${graphData.links.length} links.`,
        );
        layoutRef.current = null;
      });

      layout.run();
    },
    [graphData.links.length, graphData.nodes.length, setLayoutRunningState],
  );

  useImperativeHandle(ref, () => ({
    fitToScreen() {
      graphRef.current?.fit(undefined, 64);
    },
    resetView() {
      const graph = graphRef.current;
      if (graph) {
        runLayout(graph, "reset");
      }
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
    if (!containerRef.current) {
      return undefined;
    }

    const graph = cytoscape({
      container: containerRef.current,
      elements: [],
      minZoom: 0.25,
      maxZoom: 3,
      style: GRAPH_STYLESHEET,
    });
    graphRef.current = graph;

    graph.on("tap", "node", (event) => {
      const nodeId = event.target.id();
      if (nodeId.startsWith("cluster:") && onClusterClickRef.current) {
        onClusterClickRef.current(nodeId.replace("cluster:", ""));
      }
      onSelectNodeRef.current(nodeId);
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
      applyNodeStyles(graph);
    });

    return () => {
      layoutRef.current?.stop();
      graph.destroy();
      graphRef.current = null;
      topologyRef.current = { fingerprint: null, nodeIds: new Set() };
    };
  }, [applyNodeStyles]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !topologyElements.length) {
      return;
    }

    const nextNodeIds = new Set(graphData.nodes.map((node) => node.id));
    const prev = topologyRef.current;
    const layoutMode = resolveLayoutMode(
      prev.fingerprint,
      topologyKey,
      prev.nodeIds,
      nextNodeIds,
    );

    if (layoutMode === "none") {
      applyNodeStyles(graph);
      return;
    }

    const positions = new Map<string, { x: number; y: number }>();
    graph.nodes().forEach((node) => {
      positions.set(node.id(), { ...node.position() });
    });

    const removedClusterAnchors: Array<{ id: string; position: { x: number; y: number } }> =
      [];
    for (const nodeId of prev.nodeIds) {
      if (!nextNodeIds.has(nodeId) && nodeId.startsWith("cluster:")) {
        const position = positions.get(nodeId);
        if (position) {
          removedClusterAnchors.push({ id: nodeId, position });
        }
      }
    }

    const addedNodeIds = [...nextNodeIds].filter((id) => !prev.nodeIds.has(id));

    const nextElementIds = new Set(
      topologyElements.map((element) => element.data!.id as string),
    );

    graph.batch(() => {
      graph.elements().forEach((element) => {
        if (!nextElementIds.has(element.id())) {
          element.remove();
        }
      });

      for (const element of topologyElements) {
        const elementId = element.data!.id as string;
        const existing = graph.getElementById(elementId);
        if (existing.nonempty()) {
          existing.data(element.data);
          if (element.classes) {
            existing.classes(element.classes);
          }
        } else {
          graph.add(element);
        }
      }
    });

    for (const [nodeId, position] of positions) {
      if (nextNodeIds.has(nodeId) && graph.getElementById(nodeId).nonempty()) {
        graph.getElementById(nodeId).position(position);
      }
    }

    if (layoutMode === "incremental" && removedClusterAnchors.length > 0) {
      const anchor = removedClusterAnchors[0]!.position;
      placeNewNodesNearAnchor(graph, addedNodeIds, anchor);
    }

    applyNodeStyles(graph);

    topologyRef.current = {
      fingerprint: topologyKey,
      nodeIds: nextNodeIds,
    };

    runLayout(graph, layoutMode, layoutMode === "incremental");
  }, [
    applyNodeStyles,
    graphData.nodes,
    runLayout,
    topologyElements,
    topologyKey,
  ]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) {
      return;
    }
    applyNodeStyles(graph);
  }, [applyNodeStyles]);

  useEffect(() => {
    return () => {
      if (layoutShowTimerRef.current) {
        clearTimeout(layoutShowTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (focusedShortcutIndex >= graphData.nodes.length) {
      setFocusedShortcutIndex(0);
    }
  }, [focusedShortcutIndex, graphData.nodes.length]);

  if (!graphData.nodes.length) {
    return (
      <p className="muted">
        No graph nodes to display with the current filters.
      </p>
    );
  }

  function handleShortcutKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    node: GraphNode,
    index: number,
  ) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (index + 1) % graphData.nodes.length;
      setFocusedShortcutIndex(nextIndex);
      document
        .querySelector<HTMLButtonElement>(
          `[data-graph-shortcut="${graphData.nodes[nextIndex]!.id}"]`,
        )
        ?.focus();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex =
        (index - 1 + graphData.nodes.length) % graphData.nodes.length;
      setFocusedShortcutIndex(nextIndex);
      document
        .querySelector<HTMLButtonElement>(
          `[data-graph-shortcut="${graphData.nodes[nextIndex]!.id}"]`,
        )
        ?.focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (node.isCluster && onClusterClickRef.current) {
        onClusterClickRef.current(node.id.replace("cluster:", ""));
      }
      onSelectNodeRef.current(node.id);
    }
  }

  return (
    <div
      aria-roledescription="relationship map"
      className="relationship-graph-canvas-wrap"
      role="group"
    >
      <div className="relationship-graph-stage">
        <div
          aria-label="Interactive relationship map"
          className="relationship-graph-canvas"
          ref={containerRef}
          role="img"
        />
        {layoutVisible ? (
          <div
            aria-live="polite"
            className="relationship-map-layout-overlay"
            role="status"
          >
            <div aria-hidden="true" className="skeleton-map-canvas" />
            Arranging {graphData.nodes.length} nodes / {graphData.links.length}{" "}
            links…
          </div>
        ) : null}
      </div>
      <div
        aria-label="Map nodes"
        className="graph-node-shortcuts"
        role="group"
      >
        {graphData.nodes.map((node, index) => (
          <button
            className={node.id === selectedNodeId ? "selected" : ""}
            data-graph-shortcut={node.id}
            data-is-cluster={node.isCluster ? "true" : undefined}
            key={node.id}
            onClick={() => {
              if (node.isCluster && onClusterClickRef.current) {
                onClusterClickRef.current(node.id.replace("cluster:", ""));
              }
              onSelectNodeRef.current(node.id);
            }}
            onKeyDown={(event) => handleShortcutKeyDown(event, node, index)}
            tabIndex={index === focusedShortcutIndex ? 0 : -1}
            type="button"
          >
            {node.itemId}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="visually-hidden">
        {liveMessage ||
          `Map loaded: ${graphData.nodes.length} nodes / ${graphData.links.length} links.`}{" "}
        Map zoom level {zoomLevel.toFixed(1)}x.
        {layoutRunning ? " Arranging map." : ""}
      </p>
    </div>
  );
});

export default RelationshipGraphWithHandle;
