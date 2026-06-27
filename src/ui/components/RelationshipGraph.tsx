import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import dagre from "cytoscape-dagre";
import fcose from "cytoscape-fcose";
import popper from "cytoscape-popper";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";
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
  buildConcentricOptions,
  buildDagreOptions,
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
cytoscape.use(dagre);

function tippyFactory(
  reference: Pick<Element, "getBoundingClientRect">,
  content: HTMLElement,
): TippyInstance {
  const anchor = document.createElement("div");
  return tippy(anchor, {
    appendTo: () => document.body,
    content,
    getReferenceClientRect: reference.getBoundingClientRect,
    trigger: "manual",
  });
}

cytoscape.use(popper(tippyFactory));

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") {
    return fallback;
  }
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function buildGraphStylesheet(): cytoscape.StylesheetJson {
  const border = cssVar("--ca-border", "#334155");
  const text = cssVar("--ca-text", "#F8FAFC");
  const bg = cssVar("--ca-bg", "#0B1020");
  const selected = cssVar("--ca-secondary", "#22D3EE");

  return [
    {
      selector: "node",
      style: {
        "background-color": "data(color)",
        "border-color": border,
        "border-width": 1,
        height: 22,
        label: "",
        shape: "data(shape)",
        width: 22,
      },
    },
    {
      selector:
        "node.center-node, node.cluster-node, node.selected-node, node.hover-label, node.zoom-label-search, node.zoom-label-neighbor, node.search-match, node.always-label",
      style: {
        label: "data(label)",
        "font-size": 10,
        color: text,
        "text-background-color": bg,
        "text-background-opacity": 0.88,
        "text-background-padding": 3,
        "text-margin-y": -18,
      },
    },
    {
      selector: "node.selected-node",
      style: {
        "border-color": selected,
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
      selector: "node.role-nist-control",
      style: {
        "border-color": selected,
        "border-width": 5,
        height: 56,
        width: 56,
        "font-size": 14,
        "font-weight": 700,
      },
    },
    {
      selector: "node.role-supporting-reference",
      style: {
        opacity: 0.46,
        height: 16,
        width: 16,
      },
    },
    {
      selector: "node.role-authority, node.role-governance-framework",
      style: {
        height: 30,
        width: 30,
      },
    },
    {
      selector: "node.role-control-catalog, node.role-requirement-set",
      style: {
        height: 26,
        width: 26,
      },
    },
    {
      selector:
        "node.hover-label, node.zoom-label-search, node.zoom-label-neighbor, node.search-match",
      style: {
        label: "data(label)",
        "font-size": 10,
        color: text,
        "text-background-color": bg,
        "text-background-opacity": 0.88,
        "text-background-padding": 3,
        "text-margin-y": -16,
      },
    },
    {
      selector: ":parent",
      style: {
        "background-color": bg,
        "background-opacity": 0.33,
        "border-color": border,
        "border-width": 2,
        "border-style": "dashed",
        shape: "round-rectangle",
        label: "data(label)",
        "text-valign": "top",
        "text-halign": "center",
        "font-size": 12,
        color: text,
        "text-margin-y": -6,
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
        width: 2,
      },
    },
  ] as cytoscape.StylesheetJson;
}

const GRAPH_STYLESHEET = buildGraphStylesheet();

type RelationshipGraphProps = {
  nodes: Array<{
    id: string;
    node_type?: string;
    label?: string;
    metadata?: { item_id?: string; title?: string };
    compareRole?: import("../lib/graphTheme").CompareRole;
    graphRole?: string;
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
  layoutEngine?: "fcose" | "dagre" | "concentric";
  canvasOverlay?: React.ReactNode;
};

function nodeShape(node: GraphNode) {
  if (node.isCluster) return "round-rectangle";
  if (node.nodeType === "baseline") return "triangle";
  if (node.nodeType === "template") return "diamond";
  if (node.nodeType === "source") return "hexagon";
  return "ellipse";
}

// When a map is small enough, every node label fits without overlapping, so
// we show them all by default instead of gating labels behind hover/zoom.
// Above this count the canvas gets too dense and labels are revealed on
// hover, zoom, or selection instead.
const ALWAYS_LABEL_MAX_NODES = 28;

function buildTopologyElements(
  graphData: ReturnType<typeof buildGraphData>,
): ElementDefinition[] {
  const showAllLabels = graphData.nodes.length <= ALWAYS_LABEL_MAX_NODES;

  const nodeElements = graphData.nodes.map((node) => ({
    data: {
      id: node.id,
      label: truncateCanvasLabel(node.itemId),
      title: node.label,
      nodeType: node.nodeType,
      isCluster: Boolean(node.isCluster),
      graphRole: node.graphRole || "",
      shape: nodeShape(node),
      parent: node.parent,
    },
    classes: [
      node.isCenter ? "center-node" : "",
      node.isCluster ? "cluster-node" : "",
      node.graphRole ? `role-${node.graphRole}` : "",
      showAllLabels ? "always-label" : "",
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
    layoutEngine = "fcose",
    canvasOverlay,
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
  const applyNodeStylesRef = useRef<(graph: Core) => void>(() => {});
  const layoutShowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileLayoutRef = useRef(
    typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches,
  );

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
      const nodesById = new Map(
        graphData.nodes.map((entry) => [entry.id, entry]),
      );

      graph.nodes().forEach((node) => {
        const graphNode = nodesById.get(node.id());
        if (!graphNode) {
          return;
        }

        node.data(
          "color",
          nodeColor(graphNode, selectedNodeId, searchHighlightIds),
        );
        node.toggleClass("selected-node", node.id() === selectedNodeId);
        if (node.id() === selectedNodeId) {
          node.addClass("center-node");
        }
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

  applyNodeStylesRef.current = applyNodeStyles;

  const runLayout = useCallback(
    (graph: Core, mode: Exclude<LayoutMode, "none">, preserveViewport = false) => {
      layoutRef.current?.stop();

      const viewport = preserveViewport
        ? { pan: graph.pan(), zoom: graph.zoom() }
        : null;

      const layoutOptions =
        layoutEngine === "dagre"
          ? buildDagreOptions(reducedMotionRef.current, mobileLayoutRef.current ? "TB" : "LR")
          : layoutEngine === "concentric"
            ? buildConcentricOptions(reducedMotionRef.current)
          : buildFcoseOptions(mode, reducedMotionRef.current);
      const layout = graph.layout(layoutOptions);
      layoutRef.current = layout;

      layout.on("layoutstart", () => {
        setLayoutRunningState(true);
        setLiveMessage(
          `Loading ${graphData.nodes.length} nodes / ${graphData.links.length} edges…`,
        );
      });

      layout.on("layoutstop", () => {
        if (preserveViewport && viewport) {
          graph.pan(viewport.pan);
          graph.zoom(viewport.zoom);
        } else {
          graph.fit(undefined, 64);
        }
        setLayoutRunningState(false);
        setLiveMessage(
          `Map ready: ${graphData.nodes.length} nodes / ${graphData.links.length} links.`,
        );
        layoutRef.current = null;
      });

      layout.run();
    },
    [
      graphData.links.length,
      graphData.nodes.length,
      layoutEngine,
      setLayoutRunningState,
    ],
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
      const content = document.createElement("div");
      content.textContent = String(
        event.target.data("title") || event.target.data("label"),
      );
      const tooltip = event.target.popper({
        content: () => content,
      }) as TippyInstance;
      tooltip.show();
      event.target.scratch("_atlasTooltip", tooltip);
    });
    graph.on("mouseout", "node", (event) => {
      event.target.removeClass("hover-label");
      const tooltip = event.target.scratch("_atlasTooltip") as
        | TippyInstance
        | undefined;
      tooltip?.destroy();
      event.target.removeScratch("_atlasTooltip");
    });
    graph.on("zoom", () => {
      const zoom = graph.zoom();
      setZoomLevel(zoom);
      applyNodeStylesRef.current(graph);
    });

    return () => {
      layoutRef.current?.stop();
      graph.destroy();
      graphRef.current = null;
      topologyRef.current = { fingerprint: null, nodeIds: new Set() };
    };
  }, []);

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
      if (!nextNodeIds.has(nodeId)) {
        continue;
      }
      const element = graph.getElementById(nodeId);
      if (element.nonempty()) {
        element.position(position);
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
  }, [applyNodeStyles, runLayout, topologyElements, topologyKey]);

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
    if (layoutEngine !== "dagre") return;
    const mq = window.matchMedia("(max-width: 700px)");
    mobileLayoutRef.current = mq.matches;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const handler = (e: MediaQueryListEvent) => {
      mobileLayoutRef.current = e.matches;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const graph = graphRef.current;
        if (graph) runLayout(graph, "full");
      }, 300);
    };
    mq.addEventListener("change", handler);
    return () => {
      mq.removeEventListener("change", handler);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [layoutEngine, runLayout]);

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
        {canvasOverlay}
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
            data-graph-role={node.graphRole || "other"}
            data-layout-rank={graphRoleRank(node.graphRole)}
            data-deemphasized={
              node.graphRole === "supporting-reference" ? "true" : undefined
            }
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

function graphRoleRank(role?: string): number {
  const ranks: Record<string, number> = {
    authority: 0,
    "governance-framework": 1,
    "control-catalog": 2,
    "requirement-set": 2,
    "baseline-overlay-profile": 3,
    "assessment-scoping": 4,
    "implementation-standard": 5,
    "mapping-crosswalk": 6,
    "threat-defense": 7,
    "supporting-reference": 8,
    "nist-control": 0,
  };
  return ranks[role || ""] ?? 9;
}

export default RelationshipGraphWithHandle;
