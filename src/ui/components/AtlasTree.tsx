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
  atlasTreeCollisions,
  layoutAtlasTree,
} from "../lib/atlasTreeLayout";
import {
  atlasDisplayTrace,
  buildAtlasTreeModel,
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
  const { node, semanticLevel, mapped, mappingDegree } = data;
  const kind = nodeKind(node);
  const areaPresentation = kind === "area"
    ? areaPresentationFor(node.id)
    : kind === "authority"
      ? AUTHORITY_PRESENTATION
      : null;
  const areaStyle = areaPresentation
    ? areaCssVariables(areaPresentation) as CSSProperties
    : undefined;
  const detail = semanticLevel === "orientation"
    ? node.nodeType === "authority_aggregate"
      ? `${node.childCount.toLocaleString()} instruments`
      : `${node.descendantRecordCount.toLocaleString()} records`
    : semanticLevel === "discovery"
      ? node.level === "publication"
        ? `${node.publicationType || "Publication"} · ${node.descendantRecordCount.toLocaleString()} records · ${mappingDegree.toLocaleString()} mapped records`
        : `${node.childCount.toLocaleString()} direct branches · ${node.descendantRecordCount.toLocaleString()} records`
      : node.mandateNote || node.blurb;
  return (
    <div
      className={`atlas-tree-node atlas-tree-node--${kind}${selected ? " is-selected" : ""}${mapped ? " is-mapping-highlight" : ""}`}
      data-atlas-node-id={node.id}
      data-area-id={kind === "area" ? node.id : undefined}
      style={areaStyle}
    >
      <Handle className="atlas-tree-node__handle" isConnectable={false} position={Position.Top} type="target" />
      <span className="atlas-tree-node__terminal" aria-hidden="true" />
      <strong>{node.label}</strong>
      <small>{detail}</small>
      {node.level === "publication" && semanticLevel !== "orientation" && node.mandate ? (
        <span className={`badge atlas-tree-node__mandate atlas-tree-node__mandate--${node.mandate}`}>
          {catalogMandateLabel(node.mandate)}
        </span>
      ) : null}
      <Handle className="atlas-tree-node__handle" isConnectable={false} position={Position.Bottom} type="source" />
    </div>
  );
}

function publicationCatalogId(id: string) {
  return id.endsWith(":CATALOG") ? id.slice(0, -":CATALOG".length) : id;
}

function useCompactAtlas() {
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1024px)");
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
  useEffect(() => {
    guard.current = Date.now();
    const timer = window.setTimeout(() => {
      void reactFlow.fitView({ padding: 0.16, duration: props.reducedMotion ? 0 : 260 });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [props.layoutKey, props.reducedMotion, reactFlow]);
  return (
    <div className="atlas-tree__stage" data-semantic-level={props.semanticLevel}>
      <ReactFlow
        aria-label="Interactive Atlas map hierarchy"
        colorMode="dark"
        edges={props.edges}
        fitView
        fitViewOptions={{ padding: 0.16, duration: props.reducedMotion ? 0 : 260 }}
        maxZoom={1.8}
        minZoom={0.35}
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
        const level = node.level === "area" ? 2 : node.level === "publication" ? 3 : node.level === "summary" ? 4 : 1;
        return (
          <button
            aria-level={level}
            className={`atlas-tree-compact__node atlas-tree-compact__node--${nodeKind(node)}`}
            data-atlas-node-id={node.id}
            key={node.id}
            onClick={() => props.onSelectNode(node)}
            onKeyDown={moveFocus}
            role="treeitem"
            type="button"
          >
            <strong>{node.label}</strong>
            <span>{node.descendantRecordCount.toLocaleString()} records</span>
          </button>
        );
      })}
    </div>
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
  const [traceOpen, setTraceOpen] = useState(Boolean(focusId));
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const [selectedId, setSelectedId] = useState(focusId || model.trunk.id);
  useEffect(() => {
    setSemanticLevel(focusId ? "justification" : "orientation");
    setTraceOpen(Boolean(focusId));
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
  const positions = useMemo(
    () => layoutAtlasTree({ model, rendered, focusId }),
    [focusId, model, rendered],
  );
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
    const placement = positionById.get(node.id)!;
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
      className: `atlas-tree__flow-node atlas-tree__flow-node--${nodeKind(node)}`,
      data: {
        node,
        semanticLevel,
        mapped: mappedIds.has(node.id),
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
        type: "smoothstep",
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
          type: "smoothstep",
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
  const collisions = atlasTreeCollisions(positions);

  const focusedNode = focusId ? model.nodesById.get(focusId) || null : null;
  const selectedNode = rendered.find((node) => node.id === selectedId) || focusedNode || model.trunk;
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
  const technologyParent = focusedNode?.level === "publication" && requiresTechnologyGate(focusedNode)
    ? focusedNode
    : props.benchmarkId
      ? model.nodesById.get(model.nodesById.get(props.benchmarkId)?.parentId || "") || null
      : null;
  const technologyOptions = technologyParent
    ? (model.childrenByParent.get(technologyParent.id) || [])
      .filter((node) => {
        const query = technologyQuery.trim().toLowerCase();
        return !query || `${node.itemId} ${node.label}`.toLowerCase().includes(query);
      })
    : [];

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

  if (collisions.length) {
    return <p role="alert">The Atlas map could not place this branch without overlap. Return to the overview and try again.</p>;
  }

  return (
    <section aria-labelledby="atlas-tree-title" className="atlas-tree" data-tree-edge-count={flowEdges.length} data-tree-node-count={flowNodes.length}>
      <header className="atlas-tree__intro">
        <div>
          <p className="eyebrow">Atlas</p>
          <h2 id="atlas-tree-title">Federal cybersecurity, from authority to action</h2>
          {semanticLevel === "orientation" && !focusId ? (
            <p data-orientation-explanation>
              Federal cybersecurity material is spread across separate laws, agencies, and publications that were never organized together. Publishers wrote their own documents; Control Atlas drew the lines between them.
            </p>
          ) : (
            <p>{focusedNode ? `Focused on ${focusedNode.label}. Branch down or trace back to see why this publication exists.` : "Branch through the Control Atlas structure to surrounding publications and publisher groups."}</p>
          )}
        </div>
        <dl aria-label="Atlas totals" className="atlas-tree__totals">
          <div><dt>Records</dt><dd>{rootRecordCount.toLocaleString()}</dd></div>
          <div><dt>Publications</dt><dd>{model.publications.length}</dd></div>
          <div><dt>Authority instruments</dt><dd>{model.authorityNodes.length}</dd></div>
        </dl>
      </header>

      {semanticLevel === "orientation" && !focusId ? (
        <div aria-label="Publication mandate kinds" className="atlas-tree__mandate-key">
          {(["statutory", "contractual", "federal_policy_or_regulatory_mandate", "issued_without_federal_mandate"] as const).map((mandate) => (
            <span key={mandate}>{catalogMandateLabel(mandate)} · {model.publications.filter((node) => node.mandate === mandate).length}</span>
          ))}
        </div>
      ) : null}

      <div className="atlas-tree__toolbar">
        {focusId ? <button onClick={props.onReset} type="button">Return to Atlas map overview</button> : null}
        {focusId ? <button aria-expanded={traceOpen} onClick={() => setTraceOpen((value) => !value)} type="button">Trace back to authority</button> : null}
        {props.focusedRecord ? (
          <button aria-pressed={overlayEnabled} onClick={() => setOverlayEnabled((value) => !value)} type="button">
            {overlayEnabled ? "Hide mapping overlay" : "Show mapping overlay"}
          </button>
        ) : null}
      </div>

      <div className="atlas-tree__workbench">
        {compact ? (
          <CompactAtlasTree nodes={identity.nodes} onSelectNode={(node) => setSelectedId(node.id)} />
        ) : (
          <ReactFlowProvider>
            <AtlasTreeStage
              edges={identity.edges}
              layoutKey={layoutKey}
              nodes={identity.nodes}
              onSelectNode={(node) => setSelectedId(node.id)}
              onSemanticLevel={setSemanticLevel}
              reducedMotion={reducedMotion}
              semanticLevel={semanticLevel}
            />
          </ReactFlowProvider>
        )}

        <aside aria-labelledby="atlas-inspector-title" className="atlas-tree__inspector">
          <p className="eyebrow">{nodeKind(selectedNode).replaceAll("-", " ")}</p>
          <h3 id="atlas-inspector-title">{selectedNode.label}</h3>
          <p>{selectedNode.blurb}</p>
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
          {selectedNode.nodeType !== "authority_aggregate" && selectedNode.nodeType !== "technology_gate" && !isAggregate(selectedNode) ? (
            <button className="button button--primary" onClick={() => openNode(selectedNode)} type="button">
              {selectedNode.level === "area" ? "Open this area" : selectedNode.level === "publication" ? "Open this publication" : selectedNode.level === "summary" ? "Open this branch" : "Return to overview"}
            </button>
          ) : null}
          <small className="atlas-tree__inspector-hint">Select a node to inspect it. Use the action above only when you are ready to drill down.</small>
        </aside>
      </div>

      {technologyParent ? (
        <aside aria-labelledby="atlas-technology-picker-title" className="atlas-tree__technology-picker">
          <h3 id="atlas-technology-picker-title">Choose a technology</h3>
          <p>{technologyParent.childCount.toLocaleString()} publisher benchmarks are available. Selecting one adds exactly that branch.</p>
          <label>
            Search technologies
            <input onChange={(event) => setTechnologyQuery(event.target.value)} type="search" value={technologyQuery} />
          </label>
          <select
            aria-label={`Technology benchmark, ${technologyParent.childCount.toLocaleString()} available`}
            onChange={(event) => event.target.value && props.onSelectBenchmark(event.target.value)}
            value={props.benchmarkId || ""}
          >
            <option value="">Choose a benchmark</option>
            {technologyOptions.map((node) => <option key={node.id} value={node.id}>{node.label} · {node.childCount.toLocaleString()} records</option>)}
          </select>
          {technologyOptions.length === 0 ? <p role="status">No technologies match that search.</p> : null}
        </aside>
      ) : null}

      {traceOpen && trace.length ? (
        <aside aria-labelledby="atlas-trace-title" className="atlas-tree__trace" data-authority-trace={trace.map((hop) => hop.id).join(">")}>
          <h3 id="atlas-trace-title">Trace back to authority</h3>
          <ol>
            {trace.map((hop) => (
              <li className={`atlas-tree__trace-hop atlas-tree__trace-hop--${hop.origin}`} key={`${hop.origin}:${hop.id}`}>
                <strong>{hop.label}</strong>
                <span>{hop.origin === "authority" ? "Authority" : hop.origin === "organizing" ? "Control Atlas structure" : "Publisher hierarchy"}</span>
                {hop.rationale ? <p>{hop.rationale}</p> : null}
                {hop.source_refs?.length ? <small>{hop.source_refs.map((ref) => ref.locator || ref.source_id).filter(Boolean).join(" · ")}</small> : null}
              </li>
            ))}
          </ol>
          {publication?.alsoRequiredBy.length ? (
            <div className="atlas-tree__also-required"><strong>Also required by</strong>{publication.alsoRequiredBy.map((id) => <span className="badge" key={id}>{model.nodesById.get(id)?.label || id}</span>)}</div>
          ) : null}
        </aside>
      ) : null}

      {overlayEnabled && overlay ? (
        <aside aria-labelledby="atlas-overlay-title" className="atlas-tree__overlay">
          <h3 id="atlas-overlay-title">Published connections</h3>
          <ul>{overlay.highlights.map((entry) => <li className="atlas-tree__overlay-highlight" key={entry.node.id}>{entry.node.metadata?.title || entry.node.id}</li>)}</ul>
          {overlay.summaryChip ? <button onClick={props.onOpenCompare} type="button">{overlay.summaryChip.label} · open Compare</button> : null}
        </aside>
      ) : null}

      <div aria-label="Atlas map relationship legend" className="atlas-tree__legend">
        <span><i className="is-authority" />Authority trace</span>
        <span><i className="is-organizing" />Control Atlas structure</span>
        <span><i className="is-published" />Publisher hierarchy</span>
        <span><i className="is-mapping" />Sideways mapping</span>
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
  return record.nodes
    .filter((node) => childIds.has(node.id))
    .map((node) => ({
      id: node.id,
      itemId: node.metadata?.item_id || node.id,
      label: node.metadata?.title || node.id,
      blurb: node.metadata?.description || "Publisher record.",
      nodeType: node.node_type || "record",
      parentId: centerId,
      childCount: 0,
      descendantRecordCount: 1,
      level: "summary" as const,
      alsoRequiredBy: [],
      sourceRefs: [],
      rationale: node.metadata?.description || "Publisher record.",
    }));
}
