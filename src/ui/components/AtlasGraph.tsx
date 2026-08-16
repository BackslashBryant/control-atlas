import { useEffect, useMemo, useState } from "react";
import Graph from "graphology";
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  useCamera,
  useRegisterEvents,
  useSetSettings,
  ZoomControl,
} from "@react-sigma/core";
import { EdgeArrowProgram, EdgeLineProgram } from "sigma/rendering";
import "@react-sigma/core/lib/style.css";

import type { AtlasNetworkArtifact } from "../lib/runtimeLoader";
import {
  AREA_PRESENTATIONS,
  areaPresentationFor,
  areaPresentationForCatalog,
} from "../lib/areaVisualLanguage";

type AtlasGraphProps = {
  artifact: AtlasNetworkArtifact;
  selectedId?: string;
  onSelect: (nodeId: string) => void;
};

type NetworkNode = Record<string, any>;
type NetworkEdge = Record<string, any>;
type NetworkGraph = Graph<NetworkNode, NetworkEdge>;

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function nodeSize(attributes: NetworkNode) {
  const descendants = Number(attributes.display?.descendantRecordCount || 0);
  const degree = Number(attributes.analysis?.weightedDegree || 0);
  return Math.min(18, Math.max(2.5, 2.5 + Math.log1p(descendants || degree) * 1.8));
}

function presentationLabel(nodeId: string, attributes: NetworkNode) {
  const sourceTitle = attributes.source?.metadata?.title;
  const label = String(attributes.display?.label || "");
  const generatedItemId = attributes.source?.metadata?.item_id;
  if (
    typeof sourceTitle === "string" &&
    typeof generatedItemId === "string" &&
    label.startsWith(generatedItemId)
  ) {
    return sourceTitle;
  }
  return label || nodeId;
}

function prepareGraph(artifact: AtlasNetworkArtifact): NetworkGraph {
  const graph = Graph.from({
    attributes: artifact.graph.attributes || {},
    options: artifact.graph.options || {},
    nodes: artifact.graph.nodes,
    edges: artifact.graph.edges,
  }) as NetworkGraph;
  const colors = [
    token("--ca-area-governance"), token("--ca-area-assessment"),
    token("--ca-area-risk"), token("--ca-area-operations"),
    token("--ca-area-compliance"), token("--ca-area-threats-defense"),
    token("--ca-area-architecture"), token("--ca-area-knowledge"),
    token("--ca-area-implementation"), token("--ca-area-authority"),
  ];
  graph.forEachNode((nodeId, attributes) => {
    const community = Number(attributes.analysis?.computedCommunity || 0);
    const area = areaPresentationFor(nodeId) ||
      areaPresentationForCatalog(String(attributes.display?.catalogId || ""));
    const nodeType = String(attributes.display?.nodeType || "");
    const authoritativeColor = area
      ? token(area.token)
      : ["statute", "regulation", "policy_directive"].includes(nodeType)
        ? token("--ca-area-authority")
        : "";
    graph.mergeNodeAttributes(nodeId, {
      label: presentationLabel(nodeId, attributes),
      size: nodeSize(attributes),
      color: authoritativeColor || colors[Math.abs(community) % colors.length],
      areaId: area?.id || "",
      areaLabel: area?.label || "",
      publicationId: attributes.display?.catalogId || attributes.display?.sourceId || "",
    });
  });
  graph.forEachEdge((edgeId, attributes) => {
    const relationshipClass = String(attributes.display?.relationshipClass || "");
    const color = relationshipClass === "structural"
      ? token("--ca-text-muted")
      : relationshipClass === "applicability"
        ? token("--ca-applicability")
        : relationshipClass === "organizing"
          ? token("--ca-accent")
          : token("--ca-border-strong");
    graph.mergeEdgeAttributes(edgeId, {
      color,
      label: attributes.display?.label || edgeId,
      size: relationshipClass === "structural" ? 1.2 : 0.7,
      type: attributes.display?.directed ? "arrow" : "line",
    });
  });
  return graph;
}

function GraphController({
  graph,
  selectedId,
  hoveredId,
  nodeType,
  relationshipClass,
  areaId,
  publicationId,
  onHover,
  onSelect,
}: {
  graph: NetworkGraph;
  selectedId?: string;
  hoveredId: string;
  nodeType: string;
  relationshipClass: string;
  areaId: string;
  publicationId: string;
  onHover: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
}) {
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();
  const { gotoNode } = useCamera({ duration: 420 });

  useEffect(() => registerEvents({
    clickNode: ({ node }) => onSelect(node),
    enterNode: ({ node }) => onHover(node),
    leaveNode: () => onHover(""),
    clickStage: () => onHover(""),
  }), [onHover, onSelect, registerEvents]);

  useEffect(() => {
    if (selectedId && graph.hasNode(selectedId)) gotoNode(selectedId);
  }, [gotoNode, graph, selectedId]);

  useEffect(() => {
    const focusId = hoveredId || selectedId || "";
    const neighbors = focusId && graph.hasNode(focusId)
      ? new Set(graph.neighbors(focusId))
      : new Set<string>();
    setSettings({
      nodeReducer: (node, data) => {
        const typeHidden = nodeType && data.display?.nodeType !== nodeType;
        const areaHidden = areaId && data.areaId !== areaId;
        const publicationHidden = publicationId && data.publicationId !== publicationId;
        const emphasized = node === focusId || neighbors.has(node);
        return {
          ...data,
          hidden: Boolean(typeHidden || areaHidden || publicationHidden),
          forceLabel: node === focusId || (Boolean(selectedId) && emphasized),
          color: focusId && !emphasized ? token("--ca-surface-lifted") : data.color,
          zIndex: emphasized ? 2 : 0,
        };
      },
      edgeReducer: (edge, data) => {
        const classHidden = relationshipClass && data.display?.relationshipClass !== relationshipClass;
        const incident = focusId && graph.hasExtremity(edge, focusId);
        return {
          ...data,
          hidden: Boolean(classHidden || (focusId && !incident)),
          label: incident ? data.display?.label : "",
          size: incident ? Math.max(2, Number(data.size || 1)) : data.size,
        };
      },
    });
  }, [areaId, graph, hoveredId, nodeType, publicationId, relationshipClass, selectedId, setSettings]);

  return null;
}

export function AtlasGraph({ artifact, selectedId, onSelect }: AtlasGraphProps) {
  const graph = useMemo(() => prepareGraph(artifact), [artifact]);
  const [hoveredId, setHoveredId] = useState("");
  const [nodeType, setNodeType] = useState("");
  const [relationshipClass, setRelationshipClass] = useState("");
  const [areaId, setAreaId] = useState("");
  const [publicationId, setPublicationId] = useState("");
  const [listPage, setListPage] = useState(0);
  const nodeTypes = useMemo(() => [...new Set(graph.mapNodes((_id, data) => String(data.display?.nodeType || "Other")))].sort(), [graph]);
  const publications = useMemo(() => [...new Set(graph.mapNodes((_id, data) => String(data.publicationId || "")))].filter(Boolean).sort(), [graph]);
  const visibleNodes = useMemo(() => graph.nodes().filter((id) => {
    const data = graph.getNodeAttributes(id);
    return (!nodeType || data.display?.nodeType === nodeType) &&
      (!areaId || data.areaId === areaId) &&
      (!publicationId || data.publicationId === publicationId);
  }), [areaId, graph, nodeType, publicationId]);
  const pageCount = Math.max(1, Math.ceil(visibleNodes.length / 50));
  const listNodes = visibleNodes.slice(listPage * 50, listPage * 50 + 50);
  const tooltipId = hoveredId || (selectedId && graph.hasNode(selectedId) ? selectedId : "");
  const tooltip = tooltipId ? graph.getNodeAttributes(tooltipId) : null;

  useEffect(() => setListPage(0), [areaId, nodeType, publicationId]);

  return (
    <section
      aria-labelledby="atlas-network-title"
      className="atlas-network"
      data-layout-hash={artifact.layout.position_hash}
      data-selected-node={selectedId || ""}
      data-testid="atlas-network"
    >
      <div className="atlas-network-heading">
        <div>
          <p className="eyebrow">Global relationship network</p>
          <h2 id="atlas-network-title">Explore the control landscape</h2>
          <p>{artifact.selection.rendered_node_count.toLocaleString()} records and {artifact.selection.rendered_edge_count.toLocaleString()} published relationships. Select a point to inspect it without rearranging the map.</p>
        </div>
        <div className="atlas-network-filters" aria-label="Atlas network filters">
          <label>Record category
            <select value={nodeType} onChange={(event) => setNodeType(event.target.value)}>
              <option value="">All categories</option>
              {nodeTypes.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label>Relationship class
            <select value={relationshipClass} onChange={(event) => setRelationshipClass(event.target.value)}>
              <option value="">All relationships</option>
              {artifact.selection.relationship_classes.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>Area
            <select value={areaId} onChange={(event) => setAreaId(event.target.value)}>
              <option value="">All areas</option>
              {AREA_PRESENTATIONS.map((area) => <option key={area.id} value={area.id}>{area.label}</option>)}
            </select>
          </label>
          <label>Publication
            <select value={publicationId} onChange={(event) => setPublicationId(event.target.value)}>
              <option value="">All publications</option>
              {publications.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="atlas-network-stage">
        <SigmaContainer
          graph={graph}
          settings={{
            allowInvalidContainer: true,
            labelDensity: 0.08,
            labelColor: { color: token("--ca-text") },
            labelGridCellSize: 140,
            labelRenderedSizeThreshold: 8,
            edgeLabelColor: { color: token("--ca-text-muted") },
            edgeProgramClasses: { arrow: EdgeArrowProgram, line: EdgeLineProgram },
            renderEdgeLabels: true,
            zIndex: true,
          }}
        >
          <GraphController
            graph={graph}
            hoveredId={hoveredId}
            areaId={areaId}
            nodeType={nodeType}
            onHover={setHoveredId}
            onSelect={onSelect}
            publicationId={publicationId}
            relationshipClass={relationshipClass}
            selectedId={selectedId}
          />
          <ControlsContainer position="bottom-right"><ZoomControl /><FullScreenControl /></ControlsContainer>
        </SigmaContainer>
        {tooltip ? (
          <aside className="atlas-network-tooltip" data-testid="atlas-network-tooltip">
            <strong>{String(tooltip.label || tooltipId)}</strong>
            <span>{String(tooltip.display?.nodeType || "record").replaceAll("_", " ")}</span>
            {tooltip.display?.descendantRecordCount ? <span>{Number(tooltip.display.descendantRecordCount).toLocaleString()} records below</span> : null}
            {tooltip.display?.mandateClassification ? <span>{String(tooltip.display.mandateClassification)} mandate</span> : null}
            {tooltip.publicationId ? <span>Publication: {String(tooltip.publicationId)}</span> : null}
          </aside>
        ) : null}
      </div>
      <details className="atlas-network-list">
        <summary>Accessible network list ({visibleNodes.length.toLocaleString()} records)</summary>
        <p>Use this list to reach every point currently shown by the category filter.</p>
        <ol start={listPage * 50 + 1}>
          {listNodes.map((id) => {
            const data = graph.getNodeAttributes(id);
            return <li key={id}><button aria-current={id === selectedId ? "true" : undefined} onClick={() => onSelect(id)} type="button"><span>{String(data.label || id)}</span><small>{String(data.display?.nodeType || "record").replaceAll("_", " ")}</small></button></li>;
          })}
        </ol>
        <div className="atlas-network-pagination">
          <button disabled={listPage === 0} onClick={() => setListPage((page) => Math.max(0, page - 1))} type="button">Previous</button>
          <span>Page {listPage + 1} of {pageCount}</span>
          <button disabled={listPage + 1 >= pageCount} onClick={() => setListPage((page) => Math.min(pageCount - 1, page + 1))} type="button">Next</button>
        </div>
      </details>
    </section>
  );
}
