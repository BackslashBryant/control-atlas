import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import authoritySpine from "../../../data/curated/authority-spine.json";
import type { AtlasSpine } from "../lib/atlasDrilldown";
import {
  renderedAtlasSet,
  requiresTechnologyGate,
  type AtlasAggregateNode,
  type AtlasRenderableNode,
} from "../lib/atlasTreeAggregation";
import {
  ATLAS_NODE_HEIGHT,
  ATLAS_NODE_WIDTH,
  atlasTreeCollisions,
  layoutAtlasTree,
} from "../lib/atlasTreeLayout";
import {
  atlasDisplayTrace,
  buildAtlasTreeModel,
  canonicalAtlasPath,
  extendDisplayedAuthorityTrace,
  type AtlasTraceHop,
  type AtlasTreeNode as AtlasModelNode,
} from "../lib/atlasTreeModel";
import {
  preserveTreeIdentityWithOverlay,
  rankAtlasMappingOverlay,
} from "../lib/atlasTreeOverlay";
import type { AtlasNeighborhoodRecord } from "../lib/runtimeLoader";
import { catalogMandateLabel } from "../lib/catalogMandate";
import {
  AREA_IDS,
  areaCssVariables,
  areaPresentationFor,
  AUTHORITY_PRESENTATION,
} from "../lib/areaVisualLanguage";

type CatalogSummary = {
  id?: string;
  cross_catalog_connected_count?: number;
  relationship_count?: number;
};

type SemanticLevel = "orientation" | "discovery" | "justification";

type AtlasFlowData = {
  node: AtlasRenderableNode;
  semanticLevel: SemanticLevel;
  mapped: boolean;
  mappingDegree: number;
  empty: boolean;
};

type AtlasFlowNode = Node<AtlasFlowData, "atlasTree">;
type AtlasFlowEdge = Edge<{ relation: "authority" | "organizing" | "structural" }>;

export type AtlasTreeProps = {
  spine: AtlasSpine;
  catalogSummaries: CatalogSummary[];
  areaId?: string;
  publicationId?: string;
  summaryId?: string;
  benchmarkId?: string;
  focusPath?: AtlasTraceHop[];
  focusedRecord?: AtlasNeighborhoodRecord | null;
  benchmarkChildren?: AtlasModelNode[];
  onReset: () => void;
  onOpenArea: (areaId: string) => void;
  onOpenPublication: (areaId: string, catalogId: string) => void;
  onOpenSummary: (summaryId: string) => void;
  onSelectBenchmark: (benchmarkId: string) => void;
  onOpenCompare: () => void;
};

const nodeTypes = { atlasTree: memo(AtlasTreeNodeView) };

function isAggregate(node: AtlasRenderableNode): node is AtlasAggregateNode {
  return "aggregate" in node && node.aggregate;
}

function nodeKind(node: AtlasRenderableNode) {
  if (node.nodeType === "authority_aggregate") return "authority";
  if (isAggregate(node)) return node.nodeType === "technology_gate" ? "technology-gate" : "aggregate";
  return node.level;
}

function AtlasTreeNodeView({ data, selected }: NodeProps<AtlasFlowNode>) {
  const { node, semanticLevel, mapped, mappingDegree, empty } = data;
  const kind = nodeKind(node);
  const areaPresentation = kind === "area"
    ? areaPresentationFor(node.id)
    : kind === "authority"
      ? AUTHORITY_PRESENTATION
      : null;
  const areaStyle = areaPresentation
    ? areaCssVariables(areaPresentation) as CSSProperties
    : undefined;
  const detail = empty
    ? "No records yet."
    : semanticLevel === "orientation"
    ? node.nodeType === "authority_aggregate"
      ? `${node.childCount.toLocaleString()} instruments`
      : `${node.descendantRecordCount.toLocaleString()} records`
    : semanticLevel === "discovery"
      ? node.level === "publication"
        ? `${node.publicationType || "Publication"} · ${node.descendantRecordCount.toLocaleString()} records · ${mappingDegree.toLocaleString()} related records`
        : `${node.childCount.toLocaleString()} direct branches · ${node.descendantRecordCount.toLocaleString()} records`
      : node.mandateNote || node.blurb;
  return (
    <div
      className={`atlas-tree-node atlas-tree-node--${kind}${selected ? " is-selected" : ""}${mapped ? " is-mapping-highlight" : ""}${empty ? " is-empty" : ""}`}
      data-empty={empty ? "true" : undefined}
      data-atlas-node-id={node.id}
      data-area-id={kind === "area" ? node.id : undefined}
      style={areaStyle}
    >
      <Handle className="atlas-tree-node__handle" isConnectable={false} position={Position.Left} type="target" />
      <span className="atlas-tree-node__terminal" aria-hidden="true" />
      <strong>{node.label}</strong>
      <small>{detail}</small>
      {node.level === "publication" && semanticLevel !== "orientation" && node.mandate ? (
        <span className={`badge atlas-tree-node__mandate atlas-tree-node__mandate--${node.mandate}`}>
          {catalogMandateLabel(node.mandate)}
        </span>
      ) : null}
      <Handle className="atlas-tree-node__handle" isConnectable={false} position={Position.Right} type="source" />
    </div>
  );
}

function publicationCatalogId(id: string) {
  return id.endsWith(":CATALOG") ? id.slice(0, -":CATALOG".length) : id;
}

function useCompactAtlas() {
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return compact;
}

function AtlasTreeStage(props: {
  nodes: AtlasFlowNode[];
  edges: AtlasFlowEdge[];
  layoutKey: string;
  semanticLevel: SemanticLevel;
  reducedMotion: boolean;
  onSemanticLevel: (level: SemanticLevel) => void;
  onSelectNode: (node: AtlasRenderableNode) => void;
}) {
  const reactFlow = useReactFlow<AtlasFlowNode, AtlasFlowEdge>();
  const guard = useRef(0);
  const minZoom = props.nodes.length > 18 ? 0.55 : 0.35;
  useEffect(() => {
    guard.current = Date.now();
    const timer = window.setTimeout(() => {
      void reactFlow.fitView({
        duration: props.reducedMotion ? 0 : 260,
        minZoom,
        padding: 0.16,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [minZoom, props.layoutKey, props.reducedMotion, reactFlow]);
  return (
    <div className="atlas-tree__stage" data-semantic-level={props.semanticLevel}>
      <ReactFlow
        aria-label="Interactive Atlas map hierarchy"
        colorMode="dark"
        edges={props.edges}
        fitView
        fitViewOptions={{
          duration: props.reducedMotion ? 0 : 260,
          minZoom,
          padding: 0.16,
        }}
        maxZoom={1.8}
        minZoom={minZoom}
        nodes={props.nodes}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesFocusable
        onMoveEnd={(_, viewport) => {
          if (Date.now() - guard.current < 500) return;
          props.onSemanticLevel(
            viewport.zoom < 0.7
              ? "orientation"
              : viewport.zoom <= 1.3
                ? "discovery"
                : "justification",
          );
        }}
        onNodeClick={(_, node) => props.onSelectNode(node.data.node)}
        panOnScroll={false}
        preventScrolling
        proOptions={{ hideAttribution: true }}
        zoomOnScroll
      >
        <Background color="var(--ca-border-subtle)" gap={24} />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

function CompactAtlasTree(props: {
  nodes: AtlasFlowNode[];
  onSelectNode: (node: AtlasRenderableNode) => void;
}) {
  function moveFocus(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const buttons = [...event.currentTarget.closest("[role=tree]")!.querySelectorAll<HTMLButtonElement>("button[role=treeitem]")];
    const index = buttons.indexOf(event.currentTarget);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    if (buttons[next]) {
      event.preventDefault();
      buttons[next].focus();
    }
  }
  return (
    <div aria-label="Atlas map hierarchy" className="atlas-tree-compact" role="tree">
      {props.nodes.map((flowNode) => {
        const node = flowNode.data.node;
        const empty = flowNode.data.empty;
        const detail = empty
          ? "No records yet."
          : node.nodeType === "authority_aggregate"
            ? `${node.childCount.toLocaleString()} instruments`
            : `${node.descendantRecordCount.toLocaleString()} records`;
        const level = node.level === "area" ? 2 : node.level === "publication" ? 3 : node.level === "summary" ? 4 : 1;
        return (
          <button
            aria-level={level}
            className={`atlas-tree-compact__node atlas-tree-compact__node--${nodeKind(node)}${empty ? " is-empty" : ""}`}
            data-atlas-node-id={node.id}
            data-empty={empty ? "true" : undefined}
            disabled={empty}
            key={node.id}
            onClick={() => props.onSelectNode(node)}
            onKeyDown={moveFocus}
            role="treeitem"
            type="button"
          >
            <strong>{node.label}</strong>
            <span>{detail}</span>
          </button>
        );
      })}
    </div>
  );
}

function AtlasStructuralExplorer(props: {
  children: AtlasModelNode[];
  node: AtlasModelNode;
  onOpen: (node: AtlasModelNode) => void;
  onShowConnections: () => void;
  query: string;
  setQuery: (value: string) => void;
  showConnections: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(40);
  useEffect(() => setVisibleCount(40), [props.node.id, props.query]);
  const query = props.query.trim().toLowerCase();
  const matches = props.children.filter((node) =>
    !query || `${node.itemId} ${node.label}`.toLowerCase().includes(query),
  );
  const visible = matches.slice(0, visibleCount);
  const childLabel = props.node.nodeType === "catalog"
    ? "Publisher structure"
    : props.node.nodeType === "benchmark"
      ? "Vulnerability IDs"
      : "Records";
  return (
    <section className="atlas-publisher-explorer" data-atlas-structural-explorer>
      <header className="atlas-publisher-explorer__header">
        <div>
          <p className="eyebrow">{props.node.nodeType.replaceAll("_", " ")}</p>
          <h2>{props.node.label}</h2>
          {props.node.blurb ? <p>{props.node.blurb}</p> : null}
        </div>
        <dl>
          <div><dt>Records below</dt><dd>{props.node.descendantRecordCount.toLocaleString()}</dd></div>
          <div><dt>Direct branches</dt><dd>{props.children.length.toLocaleString()}</dd></div>
        </dl>
      </header>
      {props.children.length ? (
        <div className="atlas-publisher-explorer__children">
          <div className="atlas-publisher-explorer__tools">
            <div>
              <p className="eyebrow">{childLabel}</p>
              <h3>Browse the next level</h3>
            </div>
            <label>
              Search this publication
              <input
                onChange={(event) => props.setQuery(event.target.value)}
                placeholder="ID or title"
                type="search"
                value={props.query}
              />
            </label>
          </div>
          <ul className="atlas-publisher-explorer__list">
            {visible.map((node) => (
              <li key={node.id}>
                <button onClick={() => props.onOpen(node)} type="button">
                  <span>
                    <strong>{node.itemId}</strong>
                    <small>{node.label}</small>
                  </span>
                  <span>{node.descendantRecordCount.toLocaleString()}</span>
                </button>
              </li>
            ))}
          </ul>
          {!matches.length ? <p role="status">No records match that search.</p> : null}
          {visible.length < matches.length ? (
            <button className="atlas-publisher-explorer__more" onClick={() => setVisibleCount((count) => count + 40)} type="button">
              Show 40 more · {matches.length - visible.length} remaining
            </button>
          ) : null}
        </div>
      ) : (
        <p className="atlas-tree__empty-state">This item has no structural children.</p>
      )}
      {props.showConnections ? (
        <button className="atlas-publisher-explorer__connections" onClick={props.onShowConnections} type="button">
          Show local connections
        </button>
      ) : null}
    </section>
  );
}

export function AtlasTree(props: AtlasTreeProps) {
  const compact = useCompactAtlas();
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const model = useMemo(
    () => buildAtlasTreeModel(props.spine, authoritySpine),
    [props.spine],
  );
  const rootRecordCount = model.nodes.find(
    (node) => !node.parentId && node.level !== "authority",
  )?.descendantRecordCount || 0;
  const focusId = useMemo(() => {
    if (props.benchmarkId && model.nodesById.has(props.benchmarkId)) return props.benchmarkId;
    if (props.summaryId && model.nodesById.has(props.summaryId)) return props.summaryId;
    if (props.focusPath?.length) {
      const found = [...props.focusPath].reverse().find((hop) => model.nodesById.has(hop.id));
      if (found) return found.id;
    }
    if (props.publicationId) {
      const publication = props.publicationId.endsWith(":CATALOG")
        ? props.publicationId
        : `${props.publicationId}:CATALOG`;
      if (model.nodesById.has(publication)) return publication;
    }
    if (props.areaId && model.nodesById.has(props.areaId)) return props.areaId;
    return "";
  }, [model.nodesById, props.areaId, props.benchmarkId, props.focusPath, props.publicationId, props.summaryId]);
  const [semanticLevel, setSemanticLevel] = useState<SemanticLevel>(focusId ? "justification" : "orientation");
  const [technologyQuery, setTechnologyQuery] = useState("");
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [selectedId, setSelectedId] = useState(focusId || model.trunk.id);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1200px)").matches,
  );
  useEffect(() => {
    setSemanticLevel(focusId ? "justification" : "orientation");
    setOverlayEnabled(false);
    setSelectedId(focusId || model.trunk.id);
  }, [focusId, model.trunk.id]);

  const rendered = useMemo(
    () => renderedAtlasSet({
      model,
      focusId,
      selectedTechnologyId: props.benchmarkId,
      dynamicChildren: props.benchmarkChildren,
    }),
    [focusId, model, props.benchmarkChildren, props.benchmarkId],
  );
  const [positions, setPositions] = useState<Awaited<ReturnType<typeof layoutAtlasTree>>>([]);
  const [layoutStatus, setLayoutStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let cancelled = false;
    setLayoutStatus("loading");
    layoutAtlasTree({ model, rendered, focusId })
      .then((nextPositions) => {
        if (cancelled) return;
        setPositions(nextPositions);
        setLayoutStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setPositions([]);
        setLayoutStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [focusId, model, rendered]);
  const positionById = useMemo(() => new Map(positions.map((entry) => [entry.id, entry])), [positions]);
  const layoutKey = useMemo(
    () => positions.map(({ id, x, y }) => `${id}:${x}:${y}`).join("|"),
    [positions],
  );
  const mappingDegreeByCatalog = useMemo(
    () => new Map(
      props.catalogSummaries.map((catalog) => [
        catalog.id || "",
        catalog.cross_catalog_connected_count || 0,
      ]),
    ),
    [props.catalogSummaries],
  );
  const overlay = useMemo(
    () => props.focusedRecord ? rankAtlasMappingOverlay(props.focusedRecord) : null,
    [props.focusedRecord],
  );
  const renderedIds = useMemo(() => new Set(rendered.map((node) => node.id)), [rendered]);
  const mappedIds = useMemo(() => {
    if (!overlayEnabled || !overlay) return new Set<string>();
    const exact = overlay.highlights.map((entry) => entry.node.id).filter((id) => renderedIds.has(id));
    return new Set(exact);
  }, [overlay, overlayEnabled, renderedIds]);
  const flowNodes = useMemo(() => rendered.map((node) => {
    const placement = positionById.get(node.id) || {
      x: 0,
      y: 0,
      width: ATLAS_NODE_WIDTH,
      height: ATLAS_NODE_HEIGHT,
    };
    return {
      id: node.id,
      type: "atlasTree",
      position: { x: placement.x, y: placement.y },
      width: placement.width,
      height: placement.height,
      draggable: false,
      selected: selectedId === node.id,
      selectable: node.level !== "authority" || Boolean(node.parentId),
      focusable: true,
      ariaRole: "button" as const,
      className: `atlas-tree__flow-node atlas-tree__flow-node--${nodeKind(node)}${node.descendantRecordCount === 0 ? " is-empty" : ""}`,
      data: {
        node,
        semanticLevel,
        mapped: mappedIds.has(node.id),
        empty: node.descendantRecordCount === 0 && node.level === "area",
        mappingDegree: node.level === "publication"
          ? mappingDegreeByCatalog.get(publicationCatalogId(node.id)) || 0
          : 0,
      },
    } satisfies AtlasFlowNode;
  }), [mappedIds, mappingDegreeByCatalog, positionById, rendered, selectedId, semanticLevel]);
  const flowEdges = useMemo(() => {
    const visible = new Set(rendered.map((node) => node.id));
    const structural = rendered.flatMap((node) => {
      if (!node.parentId || !visible.has(node.parentId)) return [];
      const relation = node.level === "authority"
        ? "authority"
        : node.level === "area" || node.level === "publication"
          ? "organizing"
          : "structural";
      return [{
        id: `tree:${node.parentId}->${node.id}`,
        source: node.parentId,
        target: node.id,
        type: "default",
        className: `atlas-tree__edge atlas-tree__edge--${relation}`,
        data: { relation },
        focusable: false,
        selectable: false,
      } satisfies AtlasFlowEdge];
    });
    if (!focusId) {
      const authorityEdges = rendered
        .filter((node) => node.nodeType === "authority_aggregate")
        .map((node) => ({
          id: `authority-overview:${node.id}->${model.trunk.id}`,
          source: node.id,
          target: model.trunk.id,
          type: "default",
          className: "atlas-tree__edge atlas-tree__edge--authority",
          data: { relation: "authority" as const },
          focusable: false,
          selectable: false,
        } satisfies AtlasFlowEdge));
      return [...authorityEdges, ...structural];
    }
    return structural;
  }, [focusId, model.trunk.id, rendered]);
  const identity = useMemo(
    () => overlay
      ? preserveTreeIdentityWithOverlay(flowNodes, flowEdges, overlay)
      : { nodes: flowNodes, edges: flowEdges, highlightedIds: new Set<string>(), summaryChip: null },
    [flowEdges, flowNodes, overlay],
  );
  const collisions = layoutStatus === "ready" ? atlasTreeCollisions(positions) : [];

  const focusedNode = focusId ? model.nodesById.get(focusId) || null : null;
  const selectedNode = rendered.find((node) => node.id === selectedId) || focusedNode || model.trunk;
  const selectedNodeIsRoot = selectedNode.id === model.trunk.id;
  const selectedMembers = isAggregate(selectedNode)
    ? selectedNode.memberIds.map((id) => model.nodesById.get(id)).filter((node): node is AtlasModelNode => Boolean(node))
    : [];
  const publication = focusedNode
    ? [...(props.focusPath || atlasDisplayTrace(model, focusedNode.id))]
        .map((hop) => model.nodesById.get(hop.id))
        .find((node) => node?.level === "publication") || null
    : null;
  const trace = useMemo(() => {
    if (!focusId) return [];
    return props.focusPath?.length
      ? extendDisplayedAuthorityTrace(model, props.focusPath)
      : atlasDisplayTrace(model, focusId);
  }, [focusId, model, props.focusPath]);
  const structuralExplorer = Boolean(focusedNode && focusedNode.level !== "area");
  const structuralChildren = focusedNode
    ? props.benchmarkId && focusedNode.id === props.benchmarkId
      ? props.benchmarkChildren || []
      : model.childrenByParent.get(focusedNode.id) || []
    : [];
  const structuralParent = focusedNode?.parentId
    ? model.nodesById.get(focusedNode.parentId) || null
    : null;
  const structuralQuery = technologyQuery.trim().toLowerCase();
  const sidebarChildren = structuralChildren
    .filter((node) => !structuralQuery || `${node.itemId} ${node.label}`.toLowerCase().includes(structuralQuery))
    .slice(0, 40);
  const areas = AREA_IDS
    .map((id) => model.nodesById.get(id))
    .filter((node): node is AtlasModelNode => Boolean(node));
  const breadcrumb = focusId ? canonicalAtlasPath(model, focusId) : [model.trunk];

  function openNode(node: AtlasRenderableNode) {
    if (!node.parentId && node.level !== "authority") {
      props.onReset();
      return;
    }
    if (node.level === "area") {
      props.onOpenArea(node.id);
      return;
    }
    if (node.level === "publication") {
      props.onOpenPublication(node.parentId || "", publicationCatalogId(node.id));
      return;
    }
    if (node.nodeType === "technology_gate" || isAggregate(node)) return;
    if (node.nodeType === "benchmark" && node.parentId && requiresTechnologyGate(model.nodesById.get(node.parentId)!)) {
      props.onSelectBenchmark(node.id);
      return;
    }
    props.onOpenSummary(node.id);
  }

  function activateNode(node: AtlasRenderableNode) {
    setSelectedId(node.id);
    if (node.level === "area" && node.descendantRecordCount === 0) return;
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false);
    }
    openNode(node);
  }

  return (
    <section aria-labelledby="atlas-page-title" className="atlas-tree" data-layout-status={layoutStatus} data-tree-edge-count={flowEdges.length} data-tree-node-count={flowNodes.length}>
      <div className="atlas-tree__mobile-bar">
        <button aria-controls="atlas-structure-sidebar" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)} type="button">
          Browse structure
        </button>
        <span>{breadcrumb.at(-1)?.label || "Atlas"}</span>
      </div>
      {sidebarOpen ? <button aria-label="Close structure browser" className="atlas-tree__scrim" onClick={() => setSidebarOpen(false)} type="button" /> : null}
      <div className={`atlas-tree__workbench${sidebarOpen ? " has-open-sidebar" : ""}${structuralExplorer ? " is-structural" : " is-overview"}`}>
        <aside aria-label="Atlas navigation" className="atlas-tree__dock atlas-tree__dock--left" id="atlas-structure-sidebar">
          <button className="atlas-tree__drawer-close" onClick={() => setSidebarOpen(false)} type="button">
            Close browse
          </button>
          <nav aria-label="Atlas breadcrumb" className="atlas-tree__breadcrumb">
            <strong>Current path</strong>
            <ol>
              {breadcrumb.map((node, index) => {
                const last = index === breadcrumb.length - 1;
                const label = node.id === model.trunk.id ? "Atlas" : node.label;
                return (
                  <li key={node.id}>
                    {last ? (
                      <span aria-current="page">{label}</span>
                    ) : (
                      <button onClick={() => openNode(node)} type="button">{label}</button>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {structuralExplorer && focusedNode ? (
            <nav aria-label="Current publication structure" className="atlas-tree__local-navigation">
              <strong>Browse this publication</strong>
              {structuralParent ? (
                <button className="atlas-tree__local-parent" onClick={() => activateNode(structuralParent)} type="button">
                  <span>Up one level</span>
                  <strong>{structuralParent.label}</strong>
                </button>
              ) : null}
              <label>
                Search this publication
                <input
                  onChange={(event) => setTechnologyQuery(event.target.value)}
                  placeholder="ID or title"
                  type="search"
                  value={technologyQuery}
                />
              </label>
              <p>{structuralChildren.length.toLocaleString()} immediate children</p>
              <ul>
                {sidebarChildren.map((node) => (
                  <li key={node.id}>
                    <button onClick={() => activateNode(node)} type="button">
                      <span>{node.itemId}</span>
                      <small>{node.descendantRecordCount.toLocaleString()}</small>
                    </button>
                  </li>
                ))}
              </ul>
              {sidebarChildren.length < structuralChildren.length ? (
                <small>Refine the search to browse the remaining records.</small>
              ) : null}
            </nav>
          ) : null}

          <dl aria-label="Atlas totals" className="atlas-tree__totals">
            <div><dt>Records</dt><dd>{rootRecordCount.toLocaleString()}</dd></div>
            <div><dt>Publications</dt><dd>{model.publications.length}</dd></div>
            <div><dt>Authorities</dt><dd>{model.authorityNodes.length}</dd></div>
          </dl>

          <nav aria-label="Cybersecurity areas" className="atlas-tree__areas">
            <strong>Areas</strong>
            <ul>
              {areas.map((area) => {
                const presentation = areaPresentationFor(area.id);
                const empty = area.descendantRecordCount === 0;
                return (
                  <li key={area.id}>
                    <button
                      aria-pressed={focusId === area.id || undefined}
                      data-area-id={area.id}
                      data-empty={empty ? "true" : undefined}
                      disabled={empty}
                      onClick={() => activateNode(area)}
                      style={areaCssVariables(presentation) as CSSProperties}
                      type="button"
                    >
                      <i aria-hidden="true" />
                      <span>
                        <strong>{area.label}</strong>
                        <small>{empty ? "No records yet." : `${area.descendantRecordCount.toLocaleString()} records`}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <details className="atlas-tree__legend">
            <summary>Legend</summary>
            <div aria-label="Atlas map relationship legend">
              <span><i className="is-authority" />Authority</span>
              <span><i className="is-organizing" />Atlas category</span>
              <span><i className="is-published" />Publication structure</span>
              <span><i className="is-mapping" />Mappings</span>
            </div>
            {!focusId ? (
              <div aria-label="Publication mandate kinds" className="atlas-tree__mandate-key">
                {(["statutory", "contractual", "federal_policy_or_regulatory_mandate", "issued_without_federal_mandate"] as const).map((mandate) => (
                  <span key={mandate}>{catalogMandateLabel(mandate)} · {model.publications.filter((node) => node.mandate === mandate).length}</span>
                ))}
              </div>
            ) : null}
          </details>

          {trace.length ? (
            <details className="atlas-tree__trace" data-authority-trace={trace.map((hop) => hop.id).join(">")}>
              <summary>Authority</summary>
              <ol>
                {trace.map((hop) => (
                  <li className={`atlas-tree__trace-hop atlas-tree__trace-hop--${hop.origin}`} key={`${hop.origin}:${hop.id}`}>
                    <strong>{hop.label}</strong>
                    <span>{hop.origin === "authority" ? "Authority" : hop.origin === "organizing" ? "Topic structure" : "Publication structure"}</span>
                    {hop.rationale ? <p>{hop.rationale}</p> : null}
                  </li>
                ))}
              </ol>
              {publication?.alsoRequiredBy.length ? (
                <div className="atlas-tree__also-required">
                  <strong>Also required by</strong>
                  {publication.alsoRequiredBy
                    .map((id) => model.nodesById.get(id))
                    .filter((node): node is AtlasModelNode => Boolean(node))
                    .map((node) => <span className="badge" key={node.id}>{node.label}</span>)}
                </div>
              ) : null}
            </details>
          ) : null}
        </aside>

        <div className="atlas-tree__canvas">
        {structuralExplorer && focusedNode ? (
          <AtlasStructuralExplorer
            children={structuralChildren}
            node={focusedNode}
            onOpen={activateNode}
            onShowConnections={() => setOverlayEnabled((value) => !value)}
            query={technologyQuery}
            setQuery={setTechnologyQuery}
            showConnections={Boolean(props.focusedRecord)}
          />
        ) : compact || layoutStatus === "error" || collisions.length ? (
          <CompactAtlasTree nodes={identity.nodes} onSelectNode={activateNode} />
        ) : layoutStatus === "loading" ? (
          <div className="atlas-tree__layout-status" role="status">Arranging the Atlas…</div>
        ) : (
          <ReactFlowProvider>
            <AtlasTreeStage
              edges={identity.edges}
              layoutKey={layoutKey}
              nodes={identity.nodes}
              onSelectNode={activateNode}
              onSemanticLevel={setSemanticLevel}
              reducedMotion={reducedMotion}
              semanticLevel={semanticLevel}
            />
          </ReactFlowProvider>
        )}
        </div>

        {!structuralExplorer && !compact ? <aside aria-labelledby="atlas-inspector-title" className="atlas-tree__dock atlas-tree__inspector">
          <p className="eyebrow">{selectedNodeIsRoot ? "Atlas overview" : nodeKind(selectedNode).replaceAll("-", " ")}</p>
          <h3 id="atlas-inspector-title">{selectedNode.label}</h3>
          <p>{selectedNodeIsRoot ? "Browse cybersecurity areas and the publications under them." : selectedNode.blurb}</p>
          {selectedNode.level === "area" && selectedNode.descendantRecordCount === 0 ? (
            <p className="atlas-tree__empty-state" role="status">No records yet.</p>
          ) : null}
          <dl>
            {selectedNode.nodeType === "authority_aggregate" ? (
              <div><dt>Authority instruments</dt><dd>{selectedNode.childCount.toLocaleString()}</dd></div>
            ) : (
              <>
                <div><dt>Records below</dt><dd>{selectedNode.descendantRecordCount.toLocaleString()}</dd></div>
                <div><dt>Direct branches</dt><dd>{selectedNode.childCount.toLocaleString()}</dd></div>
              </>
            )}
          </dl>
          {selectedMembers.length ? (
            <div className="atlas-tree__inspector-members">
              <strong>Grouped here</strong>
              <ul>{selectedMembers.slice(0, 8).map((node) => <li key={node.id}>{node.label}</li>)}</ul>
              {selectedMembers.length > 8 ? <small>+ {selectedMembers.length - 8} more instruments</small> : null}
            </div>
          ) : null}

          {props.focusedRecord ? (
            <button aria-pressed={overlayEnabled} onClick={() => setOverlayEnabled((value) => !value)} type="button">
              {overlayEnabled ? "Hide connections" : "Show connections"}
            </button>
          ) : null}
          {overlayEnabled && overlay ? (
            <section aria-labelledby="atlas-overlay-title" className="atlas-tree__overlay">
              <h3 id="atlas-overlay-title">Related records</h3>
              <ul>{overlay.highlights.map((entry) => <li className="atlas-tree__overlay-highlight" key={entry.node.id}>{entry.node.metadata?.title || entry.node.label}</li>)}</ul>
              {overlay.summaryChip ? <button onClick={props.onOpenCompare} type="button">{overlay.summaryChip.label} · open Compare</button> : null}
            </section>
          ) : null}
        </aside> : null}
        {structuralExplorer && overlayEnabled && overlay ? (
          <section aria-labelledby="atlas-main-overlay-title" className="atlas-tree__overlay atlas-tree__overlay--main">
            <h3 id="atlas-main-overlay-title">Related records</h3>
            <ul>{overlay.highlights.map((entry) => <li className="atlas-tree__overlay-highlight" key={entry.node.id}>{entry.node.metadata?.title || entry.node.label}</li>)}</ul>
            {overlay.summaryChip ? <button onClick={props.onOpenCompare} type="button">{overlay.summaryChip.label} · open Compare</button> : null}
          </section>
        ) : null}
      </div>

    </section>
  );
}

export function benchmarkChildrenFromNeighborhood(record: AtlasNeighborhoodRecord | null): AtlasModelNode[] {
  if (!record) return [];
  const centerId = record.center_node.id;
  const childIds = new Set(
    record.edges
      .filter((edge) => edge.relationship_class === "structural" && edge.source_node_id === centerId)
      .map((edge) => edge.target_node_id),
  );
  return record.nodes.flatMap((node) => {
    if (!childIds.has(node.id)) return [];
    const itemId = node.metadata?.item_id?.trim() || node.metadata?.title?.trim();
    const label = node.metadata?.title?.trim() || node.metadata?.item_id?.trim();
    if (!itemId || !label) return [];
    return [{
      id: node.id,
      itemId,
      label,
      blurb: node.metadata?.description || "",
      nodeType: node.node_type || "record",
      parentId: centerId,
      childCount: 0,
      descendantRecordCount: 1,
      level: "summary" as const,
      alsoRequiredBy: [],
      sourceRefs: [],
      rationale: node.metadata?.description || "",
    }];
  });
}
