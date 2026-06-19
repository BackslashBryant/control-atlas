import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

import { displayNameFor } from "../../app/display-names.mjs";
import {
  buildGraphData,
  linkDashPattern,
  nodeColor,
  provenanceColor,
  type GraphData,
  type GraphLink,
  type GraphNode,
} from "../lib/graphTheme";

type RelationshipGraphProps = {
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
  centerNodeId: string;
  selectedNodeId: string | null;
  searchHighlightIds: Set<string>;
  onSelectNode: (nodeId: string) => void;
  reducedMotion: boolean;
};

export function RelationshipGraph(props: RelationshipGraphProps) {
  const {
    nodes,
    edges,
    centerNodeId,
    selectedNodeId,
    searchHighlightIds,
    onSelectNode,
    reducedMotion,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 420 });
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);

  const graphData: GraphData = useMemo(
    () => buildGraphData(nodes, edges, centerNodeId),
    [nodes, edges, centerNodeId],
  );

  const highlightIds = useMemo(() => {
    const focusId = hoverNodeId || selectedNodeId;
    if (!focusId) return searchHighlightIds;
    const ids = new Set<string>([focusId]);
    if (searchHighlightIds.size) {
      for (const id of searchHighlightIds) ids.add(id);
    }
    for (const link of graphData.links) {
      if (link.source === focusId || link.target === focusId) {
        ids.add(
          typeof link.source === "string"
            ? link.source
            : (link.source as GraphNode).id,
        );
        ids.add(
          typeof link.target === "string"
            ? link.target
            : (link.target as GraphNode).id,
        );
      }
    }
    return ids;
  }, [hoverNodeId, selectedNodeId, searchHighlightIds, graphData.links]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setDimensions({
        width: Math.max(320, Math.floor(entry.contentRect.width)),
        height: Math.max(320, Math.floor(entry.contentRect.height)),
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!graphRef.current || !graphData.nodes.length) return;
    const timer = window.setTimeout(
      () => {
        graphRef.current?.zoomToFit(400, 48);
      },
      reducedMotion ? 0 : 600,
    );
    return () => window.clearTimeout(timer);
  }, [graphData, reducedMotion]);

  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const radius = node.isCenter ? 8 : 6;
      const color = nodeColor(node, selectedNodeId, highlightIds);
      const dimmed = highlightIds.size > 0 && !highlightIds.has(node.id);

      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = dimmed ? "rgba(148, 163, 184, 0.35)" : color;
      ctx.fill();
      ctx.strokeStyle = node.id === selectedNodeId ? "#22D3EE" : "#334155";
      ctx.lineWidth =
        node.id === selectedNodeId ? 2 / globalScale : 1 / globalScale;
      ctx.stroke();

      if (globalScale > 1.2 || node.isCenter || node.id === selectedNodeId) {
        const label = node.itemId;
        ctx.font = `${10 / globalScale}px var(--ca-font-mono)`;
        ctx.fillStyle = dimmed ? "rgba(203, 213, 225, 0.5)" : "#F8FAFC";
        ctx.fillText(label, (node.x ?? 0) + radius + 2, (node.y ?? 0) + 3);
      }
    },
    [highlightIds, selectedNodeId],
  );

  const paintLink = useCallback(
    (link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const source = (
        typeof link.source === "object" ? link.source : null
      ) as GraphNode | null;
      const target = (
        typeof link.target === "object" ? link.target : null
      ) as GraphNode | null;
      if (
        !source ||
        !target ||
        source.x == null ||
        source.y == null ||
        target.x == null ||
        target.y == null
      )
        return;

      const highlighted =
        highlightIds.size === 0 ||
        (highlightIds.has(source.id) && highlightIds.has(target.id));

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = highlighted
        ? provenanceColor(link.provenanceClass)
        : "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = highlighted ? 1.5 / globalScale : 0.5 / globalScale;
      const dash = linkDashPattern(
        link.provenanceClass,
        link.publicationStatus,
      );
      ctx.setLineDash(dash ? dash.map((value) => value / globalScale) : []);
      ctx.stroke();
      ctx.setLineDash([]);
    },
    [highlightIds],
  );

  if (!graphData.nodes.length) {
    return (
      <p className="muted">
        No graph nodes to display with the current filters.
      </p>
    );
  }

  return (
    <div className="relationship-graph-canvas-wrap" ref={containerRef}>
      <div aria-hidden="true" className="relationship-graph-canvas">
        <ForceGraph2D
          ref={graphRef}
          backgroundColor="transparent"
          cooldownTicks={reducedMotion ? 0 : 80}
          d3AlphaDecay={reducedMotion ? 1 : 0.02}
          d3VelocityDecay={reducedMotion ? 1 : 0.3}
          graphData={graphData}
          height={dimensions.height}
          linkCanvasObject={paintLink}
          linkCanvasObjectMode={() => "replace"}
          linkDirectionalArrowLength={3}
          linkDirectionalArrowRelPos={1}
          linkLabel={(link: GraphLink) =>
            displayNameFor("relationship_type", link.relationshipType)
          }
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => "replace"}
          nodeLabel={(node: GraphNode) => `${node.itemId} — ${node.label}`}
          onEngineStop={() => {
            if (reducedMotion) graphRef.current?.zoomToFit(0, 48);
          }}
          onNodeClick={(node: GraphNode) => onSelectNode(node.id)}
          onNodeHover={(node: GraphNode | null) =>
            setHoverNodeId(node?.id ?? null)
          }
          width={dimensions.width}
        />
      </div>
    </div>
  );
}

export default RelationshipGraph;
