import ELK from "elkjs/lib/elk.bundled.js";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { displayNameFor } from "../../app/display-names.mjs";
import type { ClusterNodeMeta } from "../lib/graphClustering";
import type { RelationshipLayoutMode } from "../graph/sourceRegistryTypes";
import {
  topologyFingerprint,
  truncateCanvasLabel,
} from "../lib/graphLayout";
import {
  buildGraphData,
  linkDashPattern,
  nodeColor,
  provenanceColor,
  type GraphNode,
} from "../lib/graphTheme";
import type { RelationshipGraphHandle } from "./RelationshipExplorer";

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
  layoutMode?: RelationshipLayoutMode;
  canvasOverlay?: ReactNode;
};

type DiagramNodeData = {
  graphNode: GraphNode;
  color: string;
  selected: boolean;
  dimmed: boolean;
  label: string;
  title: string;
  subtitle: string;
};

/**
 * Second-line text for a node: the human name with any leading ID prefix
 * stripped, or — when the label is just the ID again — a one-line role from the
 * node type. Never repeats the ID, so nodes read "AC-2 / Account Management",
 * not "AC-2AC-2" (CATL-50/21).
 */
function nodeSubtitle(graphNode: GraphNode): string {
  const itemId = (graphNode.itemId || "").trim();
  const rawTitle = (graphNode.label || "").trim();
  const role = graphNode.nodeType
    ? displayNameFor("node_type", graphNode.nodeType)
    : "";
  if (!rawTitle || rawTitle === itemId) {
    return role;
  }
  if (itemId && rawTitle.startsWith(itemId)) {
    const stripped = rawTitle.slice(itemId.length).replace(/^[\s:–—-]+/, "").trim();
    return stripped || role;
  }
  return rawTitle;
}

type DiagramNode = Node<DiagramNodeData, "controlAtlas">;
type DiagramEdge = Edge<{ relationshipType: string }>;

type ElkNode = {
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
};

type ElkEdge = {
  id: string;
  sources: string[];
  targets: string[];
};

type ElkGraph = ElkNode & {
  layoutOptions?: Record<string, string>;
  children?: ElkNode[];
  edges?: ElkEdge[];
};

const elk = new ELK();
const NODE_WIDTH = 172;
const NODE_HEIGHT = 74;
const CENTER_NODE_HEIGHT = 84;
const CLUSTER_NODE_WIDTH = 196;

const nodeTypes = {
  controlAtlas: memo(ControlAtlasNode),
};

function ControlAtlasNode(props: NodeProps<DiagramNode>) {
  const { data } = props;
  const node = data.graphNode;
  return (
    <div
      className={[
        "ca-flow-node",
        node.isCenter ? "ca-flow-node--center" : "",
        node.isCluster ? "ca-flow-node--cluster" : "",
        data.selected ? "ca-flow-node--selected" : "",
        data.dimmed ? "ca-flow-node--dimmed" : "",
        node.graphRole ? `ca-flow-node--${node.graphRole}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--ca-flow-node-color": data.color } as CSSProperties}
      title={data.title}
    >
      <Handle
        className="ca-flow-handle"
        isConnectable={false}
        position={Position.Left}
        type="target"
      />
      <span className="ca-flow-node-label">{data.label}</span>
      {data.subtitle ? (
        <span className="ca-flow-node-title">{data.subtitle}</span>
      ) : null}
      <Handle
        className="ca-flow-handle"
        isConnectable={false}
        position={Position.Right}
        type="source"
      />
    </div>
  );
}

function resolveDirection(
  layoutMode: RelationshipGraphProps["layoutMode"],
  narrowViewport: boolean,
) {
  // Narrow screens read top-to-bottom; the left-to-right authority flow only
  // works with horizontal room.
  if (narrowViewport) return "DOWN";
  if (layoutMode === "focus") return "DOWN";
  // Drill views fan a handful of sources off one category; stacking them to
  // the right keeps every node full-size in a tall canvas.
  return "RIGHT";
}

const NARROW_VIEWPORT_QUERY = "(max-width: 700px)";

function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(NARROW_VIEWPORT_QUERY).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(NARROW_VIEWPORT_QUERY);
    const onChange = (event: MediaQueryListEvent) => setNarrow(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return narrow;
}

function nodeDimensions(node: GraphNode) {
  if (node.isCluster) {
    return { width: CLUSTER_NODE_WIDTH, height: NODE_HEIGHT };
  }
  return {
    width: NODE_WIDTH,
    height: node.isCenter ? CENTER_NODE_HEIGHT : NODE_HEIGHT,
  };
}

function buildElkGraph(
  graphNodes: GraphNode[],
  graphEdges: ReturnType<typeof buildGraphData>["links"],
  layoutMode: RelationshipGraphProps["layoutMode"],
  narrowViewport: boolean,
): ElkGraph {
  const isFocus = layoutMode === "focus" || layoutMode === "drill";
  const direction = resolveDirection(layoutMode, narrowViewport);
  // The default overview is a long, mostly-linear chain of category nodes.
  // Laid out as a single row it fits to a microscopic zoom in a square-ish
  // canvas, so wrap it into a balanced snake that fills the viewport with
  // readable nodes. Wrapping only applies to the horizontal layered layout;
  // a vertical chain on narrow screens scrolls naturally.
  const wrappingOptions: Record<string, string> =
    isFocus || direction === "DOWN"
      ? {}
      : {
          "elk.layered.wrapping.strategy": "SINGLE_EDGE",
          "elk.layered.wrapping.correctionFactor": "1.4",
          "elk.aspectRatio": "1.3",
        };
  return {
    id: "control-atlas-relationship-diagram",
    layoutOptions: {
      "elk.algorithm": isFocus ? "mrtree" : "layered",
      "elk.direction": direction,
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.spacing.nodeNode": "44",
      "elk.padding": "[top=40,left=40,bottom=40,right=40]",
      ...wrappingOptions,
    },
    children: graphNodes.map((node) => ({
      id: node.id,
      ...nodeDimensions(node),
    })),
    edges: graphEdges.map((edge) => ({
      id: edge.id,
      sources: [String(edge.source)],
      targets: [String(edge.target)],
    })),
  };
}

function buildDiagramNodes(
  graphNodes: GraphNode[],
  selectedNodeId: string | null,
  searchHighlightIds: Set<string>,
  layout: ElkGraph | null,
): DiagramNode[] {
  const layoutById = new Map(
    (layout?.children ?? []).map((node) => [node.id, node]),
  );

  return graphNodes.map((graphNode, index) => {
    const layoutNode = layoutById.get(graphNode.id);
    const dimmed =
      searchHighlightIds.size > 0 && !searchHighlightIds.has(graphNode.id);
    return {
      id: graphNode.id,
      type: "controlAtlas",
      data: {
        graphNode,
        color: nodeColor(graphNode, selectedNodeId, searchHighlightIds),
        selected: graphNode.id === selectedNodeId,
        dimmed,
        label: truncateCanvasLabel(graphNode.itemId, 28),
        title: graphNode.label,
        subtitle: truncateCanvasLabel(nodeSubtitle(graphNode), 30),
      },
      draggable: true,
      position: {
        x: layoutNode?.x ?? (index % 4) * 220,
        y: layoutNode?.y ?? Math.floor(index / 4) * 130,
      },
      selected: graphNode.id === selectedNodeId,
    };
  });
}

function buildDiagramEdges(
  graphEdges: ReturnType<typeof buildGraphData>["links"],
): DiagramEdge[] {
  return graphEdges.map((edge) => {
    const dashed = linkDashPattern(
      edge.provenanceClass,
      edge.publicationStatus,
    );
    return {
      id: edge.id,
      source: String(edge.source),
      target: String(edge.target),
      label: edge.relationshipType,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { relationshipType: edge.relationshipType },
      style: {
        stroke: provenanceColor(edge.provenanceClass),
        strokeDasharray: dashed ? dashed.join(" ") : undefined,
        strokeWidth: 2,
      },
      type: "smoothstep",
      ariaLabel: `Connection from ${edge.source} to ${edge.target}: ${edge.relationshipType}`,
    };
  });
}

const RelationshipGraphInner = forwardRef<
  RelationshipGraphHandle,
  RelationshipGraphProps
>(function RelationshipGraphInner(props, ref) {
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
    layoutMode = "hierarchy",
    canvasOverlay,
  } = props;

  const reactFlow = useReactFlow<DiagramNode, DiagramEdge>();
  const instanceRef = useRef<ReactFlowInstance<DiagramNode, DiagramEdge> | null>(
    null,
  );
  const layoutRunRef = useRef(0);
  const layoutShowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [layout, setLayout] = useState<ElkGraph | null>(null);
  const [layoutRunning, setLayoutRunning] = useState(false);
  const [layoutVisible, setLayoutVisible] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [focusedShortcutIndex, setFocusedShortcutIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const narrowViewport = useNarrowViewport();

  const graphData = useMemo(
    () => buildGraphData(nodes, edges, centerNodeId, clusterMeta),
    [centerNodeId, clusterMeta, edges, nodes],
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

  const diagramNodes = useMemo(
    () =>
      buildDiagramNodes(
        graphData.nodes,
        selectedNodeId,
        searchHighlightIds,
        layout,
      ),
    [graphData.nodes, layout, searchHighlightIds, selectedNodeId],
  );

  const diagramEdges = useMemo(
    () => buildDiagramEdges(graphData.links),
    [graphData.links],
  );

  const setLayoutRunningState = useCallback(
    (running: boolean) => {
      setLayoutRunning(running);
      onLayoutRunningChange?.(running);

      if (layoutShowTimerRef.current) {
        clearTimeout(layoutShowTimerRef.current);
        layoutShowTimerRef.current = null;
      }

      if (running) {
        layoutShowTimerRef.current = setTimeout(() => {
          setLayoutVisible(true);
        }, reducedMotion ? 0 : 150);
        return;
      }

      setLayoutVisible(false);
    },
    [onLayoutRunningChange, reducedMotion],
  );

  useImperativeHandle(ref, () => ({
    fitToScreen() {
      void reactFlow.fitView({ padding: 0.18, duration: reducedMotion ? 0 : 180 });
    },
    resetView() {
      setLayout(null);
      setLiveMessage("Rebuilding relationship diagram.");
      void reactFlow.fitView({ padding: 0.18, duration: reducedMotion ? 0 : 180 });
    },
    zoomIn() {
      void reactFlow.zoomIn({ duration: reducedMotion ? 0 : 120 });
    },
    zoomOut() {
      void reactFlow.zoomOut({ duration: reducedMotion ? 0 : 120 });
    },
  }));

  useEffect(() => {
    if (!graphData.nodes.length) return;

    const runId = layoutRunRef.current + 1;
    layoutRunRef.current = runId;
    setLayoutRunningState(true);
    setLiveMessage(
      `Arranging ${graphData.nodes.length} nodes / ${graphData.links.length} links.`,
    );

    elk
      .layout(
        buildElkGraph(graphData.nodes, graphData.links, layoutMode, narrowViewport),
      )
      .then((nextLayout) => {
        if (layoutRunRef.current !== runId) return;
        setLayout(nextLayout as ElkGraph);
        setLiveMessage(
          `Diagram ready: ${graphData.nodes.length} nodes / ${graphData.links.length} links.`,
        );
        window.setTimeout(() => {
          void reactFlow.fitView({
            padding: 0.18,
            duration: reducedMotion ? 0 : 180,
          });
        }, 0);
      })
      .catch(() => {
        if (layoutRunRef.current !== runId) return;
        setLiveMessage(
          "Diagram layout failed. The accessible list still contains every connection.",
        );
      })
      .finally(() => {
        if (layoutRunRef.current === runId) {
          setLayoutRunningState(false);
        }
      });
  }, [
    graphData.links,
    graphData.nodes,
    layoutMode,
    narrowViewport,
    reactFlow,
    reducedMotion,
    setLayoutRunningState,
    topologyKey,
  ]);

  useEffect(() => {
    if (focusedShortcutIndex >= graphData.nodes.length) {
      setFocusedShortcutIndex(0);
    }
  }, [focusedShortcutIndex, graphData.nodes.length]);

  useEffect(() => {
    return () => {
      if (layoutShowTimerRef.current) {
        clearTimeout(layoutShowTimerRef.current);
      }
    };
  }, []);

  if (!graphData.nodes.length) {
    return (
      <p className="muted">
        No graph nodes to display with the current filters.
      </p>
    );
  }

  function selectNode(nodeId: string) {
    if (nodeId.startsWith("cluster:") && onClusterClick) {
      onClusterClick(nodeId.replace("cluster:", ""));
    }
    onSelectNode(nodeId);
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
      selectNode(node.id);
    }
  }

  return (
    <div
      aria-roledescription="relationship diagram"
      className="relationship-graph-canvas-wrap ca-flow-wrap"
      role="group"
    >
      <div className="relationship-graph-stage ca-flow-stage">
        <ReactFlow
          aria-label="Interactive relationship diagram"
          className="relationship-graph-canvas ca-flow-canvas"
          colorMode="dark"
          edges={diagramEdges}
          fitView
          fitViewOptions={{ padding: 0.18, duration: reducedMotion ? 0 : 180 }}
          maxZoom={2.5}
          minZoom={0.4}
          nodes={diagramNodes}
          nodeTypes={nodeTypes}
          nodesDraggable={!reducedMotion}
          nodesFocusable
          onInit={(instance) => {
            instanceRef.current = instance;
          }}
          onMoveEnd={(_, viewport) => {
            setZoomLevel(viewport.zoom);
          }}
          onNodeClick={(_, node) => selectNode(node.id)}
          panOnScroll
          preventScrolling
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(148, 163, 184, 0.18)" gap={24} />
          <Controls showInteractive={false} />
          {graphData.nodes.length > 14 ? (
            <MiniMap
              ariaLabel="Relationship diagram overview"
              maskColor="rgba(2, 6, 23, 0.72)"
              nodeColor={(node) =>
                typeof node.data.color === "string"
                  ? node.data.color
                  : "var(--ca-text-muted)"
              }
              pannable
              zoomable
            />
          ) : null}
        </ReactFlow>
        {layoutVisible ? (
          <div
            aria-live="polite"
            className="relationship-map-layout-overlay"
            role="status"
          >
            <div aria-hidden="true" className="skeleton-map-canvas" />
            Arranging {graphData.nodes.length} nodes / {graphData.links.length}{" "}
            links...
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
            onClick={() => selectNode(node.id)}
            onKeyDown={(event) => handleShortcutKeyDown(event, node, index)}
            tabIndex={index === focusedShortcutIndex ? 0 : -1}
            title={node.label}
            type="button"
          >
            {node.itemId}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="visually-hidden">
        {liveMessage ||
          `Diagram loaded: ${graphData.nodes.length} nodes / ${graphData.links.length} links.`}{" "}
        Diagram zoom level {zoomLevel.toFixed(1)}x.
        {layoutRunning ? " Arranging diagram." : ""}
      </p>
    </div>
  );
});

export const RelationshipGraphWithHandle = forwardRef<
  RelationshipGraphHandle,
  RelationshipGraphProps
>(function RelationshipGraphWithHandle(props, ref) {
  return (
    <ReactFlowProvider>
      <RelationshipGraphInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

function graphRoleRank(role?: string): number {
  const ranks: Record<string, number> = {
    authority: 0,
    "governance-framework": 1,
    "control-catalog": 2,
    "requirement-set": 2,
    "baseline-overlay-profile": 3,
    "implementation-standard": 4,
    "assessment-scoping": 5,
    "mapping-crosswalk": 6,
    "threat-defense": 7,
    "supporting-reference": 8,
    "nist-control": 0,
  };
  return ranks[role || ""] ?? 9;
}

export default RelationshipGraphWithHandle;
