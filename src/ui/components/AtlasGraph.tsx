import { useEffect, useMemo, useState } from "react";
import Graph from "graphology";
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  useRegisterEvents,
  useSetSettings,
  useSigma,
  ZoomControl,
} from "@react-sigma/core";
import { EdgeArrowProgram, EdgeLineProgram } from "sigma/rendering";
import "@react-sigma/core/lib/style.css";

import type {
  AtlasGraphProjection,
  AtlasProjectionDrill,
  AtlasProjectionNode,
} from "../lib/atlasGraphProjection";
import {
  areaPresentationFor,
  areaPresentationForCatalog,
} from "../lib/areaVisualLanguage";

type AtlasGraphProps = {
  projection: AtlasGraphProjection;
  selectedCanonicalId?: string;
  onDrill: (drill: AtlasProjectionDrill) => void;
  onHome: () => void;
  onUp: () => void;
  canGoUp: boolean;
};

type NetworkNode = AtlasProjectionNode & Record<string, any>;
type NetworkEdge = Record<string, any>;
type NetworkGraph = Graph<NetworkNode, NetworkEdge>;

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function nodeColor(node: AtlasProjectionNode) {
  if (node.objectLayer === "authority_document") return token("--ca-area-authority");
  if (node.nativeType === "catalog") return token("--ca-action-primary");
  const area = areaPresentationFor(node.areaId)
    || areaPresentationForCatalog(node.publicationId);
  return area ? token(area.token) : token("--ca-primary");
}

function nodeSize(node: AtlasProjectionNode) {
  if (node.nativeType === "catalog") return 10.5;
  const layerWeight = node.objectLayer === "atlas_structure" ? 2.2 : 0;
  return Math.min(18, Math.max(3.4, 2.7 + node.importance * 1.15 + layerWeight));
}

function relationshipColor(classes: string[]) {
  if (classes.includes("structural")) return token("--ca-text-muted");
  if (classes.includes("applicability")) return token("--ca-applicability");
  if (classes.includes("organizing")) return token("--ca-accent");
  return token("--ca-border-strong");
}

function edgeLabel(edge: NetworkEdge) {
  const types = edge.relationshipTypes as string[];
  const count = Number(edge.relationshipCount || 0);
  return `${types.slice(0, 2).join(" / ")} · ${count.toLocaleString()}`;
}

function prepareGraph(projection: AtlasGraphProjection): NetworkGraph {
  const graph = new Graph<NetworkNode, NetworkEdge>({
    type: "mixed",
    multi: true,
    allowSelfLoops: false,
  });
  for (const node of projection.nodes) {
    graph.addNode(node.id, {
      ...node,
      label: node.label,
      color: nodeColor(node),
      size: nodeSize(node),
    });
  }
  for (const edge of projection.edges) {
    if (!graph.hasNode(edge.source) || !graph.hasNode(edge.target)) continue;
    const attributes = {
      ...edge,
      sourceId: edge.source,
      targetId: edge.target,
      color: relationshipColor(edge.relationshipClasses),
      label: edgeLabel(edge),
      size: Math.min(3.4, Math.max(.9, .8 + Math.log1p(edge.relationshipCount) * .35)),
      type: edge.directedCount > 0 && edge.undirectedCount === 0 ? "arrow" : "line",
    };
    if (edge.directedCount > 0 && edge.undirectedCount === 0) {
      graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target, attributes);
    } else {
      graph.addUndirectedEdgeWithKey(edge.id, edge.source, edge.target, attributes);
    }
  }
  return graph;
}

function GraphController({
  graph,
  projectionLevel,
  focusedId,
  selectedCanonicalId,
  relationshipClass,
  onHover,
  onSelect,
}: {
  graph: NetworkGraph;
  projectionLevel: AtlasGraphProjection["level"];
  focusedId: string;
  selectedCanonicalId?: string;
  relationshipClass: string;
  onHover: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
}) {
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();
  const sigma = useSigma();

  useEffect(() => registerEvents({
    clickNode: ({ node }) => onSelect(node),
    enterNode: ({ node }) => onHover(node),
    leaveNode: () => onHover(""),
    clickStage: () => onHover(""),
  }), [onHover, onSelect, registerEvents]);

  useEffect(() => {
    const neighbors = focusedId && graph.hasNode(focusedId)
      ? new Set(graph.neighbors(focusedId))
      : new Set<string>();
    setSettings({
      nodeReducer: (node, data) => {
        const focused = node === focusedId;
        const related = focused || neighbors.has(node);
        const landmark = (projectionLevel === "landscape" && data.objectLayer !== "publisher_content")
          || data.nativeType === "catalog";
        return {
          ...data,
          color: focusedId && !related ? token("--ca-surface-lifted") : data.color,
          forceLabel: focused || landmark,
          zIndex: related ? 2 : 0,
        };
      },
      edgeReducer: (edge, data) => {
        const matchesClass = !relationshipClass
          || (data.relationshipClasses as string[]).includes(relationshipClass);
        const incident = focusedId && (data.sourceId === focusedId || data.targetId === focusedId);
        return {
          ...data,
          hidden: !matchesClass || Boolean(focusedId && !incident),
          label: incident ? data.label : "",
          size: incident ? Math.max(2, Number(data.size || 1)) : data.size,
        };
      },
    });
  }, [focusedId, graph, projectionLevel, relationshipClass, setSettings]);

  useEffect(() => {
    if (!selectedCanonicalId || !graph.hasNode(selectedCanonicalId)) return;
    const target = sigma.getNodeDisplayData(selectedCanonicalId);
    if (target) sigma.getCamera().animate({ ...target, ratio: .62 }, { duration: 160 });
  }, [graph, selectedCanonicalId, sigma]);

  return null;
}

function roleLabel(node: AtlasProjectionNode) {
  if (node.objectLayer === "atlas_structure") {
    return node.atlasStructureRole === "root" ? "Atlas root" : "Atlas area";
  }
  if (node.objectLayer === "authority_document") return "Authority";
  if (node.nodeType === "publisher_group") return "Publisher group";
  return (node.nativeType || node.atlasClass || "Publisher record")
    .replace(/[-_]/g, " ");
}

export function AtlasGraph({
  projection,
  selectedCanonicalId,
  onDrill,
  onHome,
  onUp,
  canGoUp,
}: AtlasGraphProps) {
  const graph = useMemo(() => prepareGraph(projection), [projection]);
  const [hoveredId, setHoveredId] = useState("");
  const [localSelectedId, setLocalSelectedId] = useState("");
  const [relationshipClass, setRelationshipClass] = useState("");
  const [listOpen, setListOpen] = useState(projection.level === "landscape");

  useEffect(() => {
    setListOpen(projection.level === "landscape");
  }, [projection.id, projection.level]);
  const externalSelectedId = selectedCanonicalId && graph.hasNode(selectedCanonicalId)
    ? selectedCanonicalId
    : "";
  const focusedId = hoveredId || localSelectedId || externalSelectedId;
  const focusedNode = focusedId && graph.hasNode(focusedId)
    ? graph.getNodeAttributes(focusedId)
    : null;
  const relationshipClasses = useMemo(
    () => [...new Set(projection.edges.flatMap((edge) => edge.relationshipClasses))].sort(),
    [projection.edges],
  );

  useEffect(() => {
    setHoveredId("");
    setLocalSelectedId("");
    setRelationshipClass("");
  }, [projection.id]);

  function select(nodeId: string) {
    const node = projection.nodes.find((entry) => entry.id === nodeId);
    if (!node) return;
    if (node.drill) {
      onDrill(node.drill);
      return;
    }
    setLocalSelectedId(nodeId);
  }

  const publishedRelationships = projection.edges.reduce(
    (total, edge) => total + edge.relationshipCount,
    0,
  );

  return (
    <section
      aria-labelledby="atlas-network-title"
      className="atlas-network atlas-network--semantic"
      data-projection-id={projection.id}
      data-projection-level={projection.level}
      data-projection-node-count={projection.nodes.length}
      data-projection-edge-count={projection.edges.length}
      data-selected-canonical={selectedCanonicalId || ""}
      data-testid="atlas-network"
    >
      <div className="atlas-network-heading">
        <div>
          <p className="eyebrow">Semantic Atlas · {projection.level}</p>
          <h2 id="atlas-network-title">{projection.label}</h2>
          <p>{projection.description}</p>
          <p className="atlas-network-measure">
            {projection.nodes.length.toLocaleString()} visible landmarks represent {projection.representedCanonicalNodeCount.toLocaleString()} published records and {publishedRelationships.toLocaleString()} relationships.
          </p>
        </div>
        <div className="atlas-network-controls">
          <nav aria-label="Atlas location" className="atlas-network-breadcrumb">
            <button disabled={projection.level === "landscape"} onClick={onHome} type="button">Landscape</button>
            <button disabled={!canGoUp} onClick={onUp} type="button">Up one level</button>
          </nav>
          <label className="atlas-network-filter">Relationship class
            <select onChange={(event) => setRelationshipClass(event.target.value)} value={relationshipClass}>
              <option value="">All displayed connections</option>
              {relationshipClasses.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="atlas-network-stage">
        <SigmaContainer
          key={projection.id}
          graph={graph}
          settings={{
            allowInvalidContainer: true,
            labelDensity: projection.level === "landscape" ? .32 : .12,
            labelColor: { color: token("--ca-text") },
            labelGridCellSize: 160,
            labelRenderedSizeThreshold: 8,
            edgeLabelColor: { color: token("--ca-text-muted") },
            edgeProgramClasses: { arrow: EdgeArrowProgram, line: EdgeLineProgram },
            renderEdgeLabels: true,
            zIndex: true,
          }}
        >
          <GraphController
            focusedId={focusedId}
            graph={graph}
            onHover={setHoveredId}
            onSelect={select}
            projectionLevel={projection.level}
            relationshipClass={relationshipClass}
            selectedCanonicalId={externalSelectedId}
          />
          <ControlsContainer position="bottom-right"><ZoomControl /><FullScreenControl /></ControlsContainer>
        </SigmaContainer>
        {focusedNode ? (
          <aside className="atlas-network-tooltip" data-testid="atlas-network-tooltip">
            <strong>{focusedNode.label}</strong>
            <span>{roleLabel(focusedNode)}</span>
            <span>{focusedNode.canonicalRecordCount.toLocaleString()} records</span>
            {focusedNode.internalRelationshipCount ? <span>{focusedNode.internalRelationshipCount.toLocaleString()} internal published relationships</span> : null}
            {focusedNode.drill ? <span>Open to continue</span> : null}
          </aside>
        ) : null}
      </div>
      {projection.suppressedRelationshipCount ? (
        <p className="atlas-network-suppression">{projection.suppressedRelationshipCount.toLocaleString()} lower-priority aggregate relationships stay out of this view. Drill in or select a landmark to reveal relevant context.</p>
      ) : null}
      <details
        className="atlas-network-list"
        open={listOpen}
        onToggle={(event) => setListOpen(event.currentTarget.open)}
      >
        <summary>Accessible landmarks ({projection.nodes.length.toLocaleString()})</summary>
        <p>Use this list to navigate the same bounded Atlas projection.</p>
        <ol>
          {projection.nodes.map((node) => (
            <li key={node.id}>
              <button
                aria-current={node.id === focusedId ? "true" : undefined}
                onClick={() => select(node.id)}
                type="button"
              >
                <span>{node.label}</span>
                <small>{roleLabel(node)} · {node.canonicalRecordCount.toLocaleString()} records</small>
              </button>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
