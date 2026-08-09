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
import { memo, useEffect, useMemo, useRef, useState } from "react";

import type {
  AtlasFrameworkChoice,
  AtlasFrameworkGroup,
  AtlasFamilyChoice,
} from "../lib/atlasDrilldown";
import {
  ATLAS_CYBERSECURITY_NODE_ID,
  ATLAS_UNIVERSE_POSITIONS,
  atlasUniverseCollisions,
} from "../lib/atlasUniverse";

type CatalogSummary = {
  id?: string;
  leaf_record_count?: number;
  node_count?: number;
};

type SemanticLevel = "landscape" | "publications" | "structure";
type NodeKind = "root" | "cybersecurity" | "area" | "publication" | "unit" | "junction";

type AtlasTreeNodeData = {
  kind: NodeKind;
  label: string;
  meta?: string;
  area?: AtlasFrameworkGroup;
  framework?: AtlasFrameworkChoice;
  unit?: AtlasFamilyChoice;
};

type AtlasTreeNode = Node<AtlasTreeNodeData, "atlasTree">;
type AtlasTreeEdge = Edge<{ relation: "organizing" | "structural" | "routing" }>;

type GraphProjection = {
  nodes: AtlasTreeNode[];
  edges: AtlasTreeEdge[];
  level: SemanticLevel;
  title: string;
  description: string;
};

function publishedRecordCount(framework: AtlasFrameworkChoice, summaries: CatalogSummary[]) {
  const summary = summaries.find((candidate) => candidate.id === framework.id);
  const nativeCount = framework.units.reduce(
    (total, unit) => total + unit.records.length,
    0,
  );
  return nativeCount || summary?.leaf_record_count || summary?.node_count || 0;
}

function areaCounts(area: AtlasFrameworkGroup, summaries: CatalogSummary[]) {
  return {
    publications: area.frameworks.length,
    records: area.frameworks.reduce(
      (total, framework) => total + publishedRecordCount(framework, summaries),
      0,
    ),
  };
}

function treeNode(
  id: string,
  kind: NodeKind,
  label: string,
  position: { x: number; y: number },
  dimensions: { width: number; height: number },
  data: Partial<AtlasTreeNodeData> = {},
): AtlasTreeNode {
  const interactive = kind === "area" || kind === "publication" || kind === "unit";
  return {
    id,
    type: "atlasTree",
    className: kind === "area" ? "atlas-universe__area" : `atlas-universe__${kind}`,
    data: { kind, label, ...data },
    position,
    width: dimensions.width,
    height: dimensions.height,
    draggable: false,
    selectable: interactive,
    focusable: interactive,
    ariaRole: kind === "junction" ? "presentation" : interactive ? "button" : "group",
  };
}

function treeEdge(
  id: string,
  source: string,
  target: string,
  relation: AtlasTreeEdge["data"]["relation"],
): AtlasTreeEdge {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    className: "atlas-universe__branch",
    data: { relation },
    focusable: false,
    selectable: false,
    style: { strokeWidth: relation === "routing" ? 3 : 4 },
  };
}

function baseNodes(): AtlasTreeNode[] {
  return [
    treeNode(
      "atlas:AUTHORITY-ROOTS",
      "root",
      "Authority roots",
      { x: 482, y: 650 },
      { width: 396, height: 92 },
      { meta: "Law / policy / standards / source material" },
    ),
    treeNode(
      ATLAS_CYBERSECURITY_NODE_ID,
      "cybersecurity",
      "Cybersecurity",
      { x: 560, y: 510 },
      { width: 240, height: 76 },
      { meta: "Control Atlas structure" },
    ),
  ];
}

const LANDSCAPE_JUNCTIONS = [
  ["junction:base", 678, 462],
  ["junction:left", 430, 396],
  ["junction:left-crown", 310, 324],
  ["junction:center", 680, 334],
  ["junction:right", 930, 396],
  ["junction:right-crown", 1050, 324],
] as const;

function landscapeProjection(
  areas: AtlasFrameworkGroup[],
  summaries: CatalogSummary[],
): GraphProjection {
  const byId = new Map(areas.map((area) => [area.id, area]));
  const nodes = baseNodes();
  for (const [id, x, y] of LANDSCAPE_JUNCTIONS) {
    nodes.push(treeNode(id, "junction", "", { x, y }, { width: 10, height: 10 }));
  }
  for (const position of ATLAS_UNIVERSE_POSITIONS) {
    const area = byId.get(position.id);
    if (!area) continue;
    const counts = areaCounts(area, summaries);
    const meta = `${counts.publications} publication${counts.publications === 1 ? "" : "s"} / ${counts.records.toLocaleString()} records`;
    nodes.push(
      treeNode(
        area.id,
        "area",
        area.label,
        { x: position.x, y: position.y },
        { width: position.width, height: position.height },
        { area, meta },
      ),
    );
  }

  const edges: AtlasTreeEdge[] = [
    treeEdge("roots-cybersecurity", "atlas:AUTHORITY-ROOTS", ATLAS_CYBERSECURITY_NODE_ID, "organizing"),
    treeEdge("cybersecurity-base", ATLAS_CYBERSECURITY_NODE_ID, "junction:base", "routing"),
    treeEdge("base-left", "junction:base", "junction:left", "routing"),
    treeEdge("left-crown", "junction:left", "junction:left-crown", "routing"),
    treeEdge("base-center", "junction:base", "junction:center", "routing"),
    treeEdge("base-right", "junction:base", "junction:right", "routing"),
    treeEdge("right-crown", "junction:right", "junction:right-crown", "routing"),
    treeEdge("area-governance", "junction:left-crown", "atlas:LIMB-GOVERNANCE", "organizing"),
    treeEdge("area-risk", "junction:left-crown", "atlas:LIMB-RISK", "organizing"),
    treeEdge("area-compliance", "junction:left", "atlas:LIMB-COMPLIANCE", "organizing"),
    treeEdge("area-architecture", "junction:left", "atlas:LIMB-ARCHITECTURE", "organizing"),
    treeEdge("area-implementation", "junction:center", "atlas:LIMB-IMPLEMENTATION", "organizing"),
    treeEdge("area-knowledge", "junction:center", "atlas:LIMB-KNOWLEDGE", "organizing"),
    treeEdge("area-assessment", "junction:right", "atlas:LIMB-ASSESSMENT", "organizing"),
    treeEdge("area-operations", "junction:right-crown", "atlas:LIMB-OPERATIONS", "organizing"),
    treeEdge("area-threat", "junction:right-crown", "atlas:LIMB-THREAT", "organizing"),
  ];
  return {
    nodes,
    edges,
    level: "landscape",
    title: "Cybersecurity, in nine connected areas",
    description: "Open an area to reveal its publications. The roots show why the work exists; the canopy shows where the work lives.",
  };
}

function focusChildrenPositions(count: number, width = 220) {
  const perRow = Math.min(5, Math.max(1, count));
  const gap = 24;
  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const rowWidth = inRow * width + Math.max(0, inRow - 1) * gap;
    const column = index % perRow;
    return {
      x: (1360 - rowWidth) / 2 + column * (width + gap),
      y: 42 + row * 112,
      width,
      height: 72,
    };
  });
}

function publicationProjection(
  area: AtlasFrameworkGroup,
  summaries: CatalogSummary[],
): GraphProjection {
  const nodes = baseNodes();
  nodes[0]!.position = { x: 482, y: 680 };
  nodes[1]!.position = { x: 560, y: 570 };
  nodes.push(
    treeNode(area.id, "area", area.label, { x: 570, y: 448 }, { width: 220, height: 72 }, {
      area,
      meta: `${area.frameworks.length} publication${area.frameworks.length === 1 ? "" : "s"}`,
    }),
  );
  const positions = focusChildrenPositions(area.frameworks.length);
  area.frameworks.forEach((framework, index) => {
    const records = publishedRecordCount(framework, summaries);
    nodes.push(
      treeNode(
        `publication:${framework.id}`,
        "publication",
        framework.label,
        positions[index]!,
        { width: 220, height: 72 },
        {
          area,
          framework,
          meta: `${framework.nodeType || "Publication"} / ${records.toLocaleString()} records`,
        },
      ),
    );
  });
  const edges = [
    treeEdge("roots-cybersecurity", "atlas:AUTHORITY-ROOTS", ATLAS_CYBERSECURITY_NODE_ID, "organizing"),
    treeEdge("cybersecurity-area", ATLAS_CYBERSECURITY_NODE_ID, area.id, "organizing"),
    ...area.frameworks.map((framework) =>
      treeEdge(
        `publication-edge:${framework.id}`,
        area.id,
        `publication:${framework.id}`,
        "organizing",
      ),
    ),
  ];
  return {
    nodes,
    edges,
    level: "publications",
    title: area.label,
    description: "This area contains several publications. Open one to see the sections as its publisher organized them.",
  };
}

function structuralUnits(framework: AtlasFrameworkChoice) {
  return framework.units.filter((unit) => !unit.id.startsWith("membership:"));
}

function structureProjection(
  area: AtlasFrameworkGroup,
  framework: AtlasFrameworkChoice,
): GraphProjection {
  const units = structuralUnits(framework);
  const nodes = baseNodes();
  nodes[0]!.position = { x: 482, y: 720 };
  nodes[1]!.position = { x: 560, y: 620 };
  nodes.push(
    treeNode(area.id, "area", area.label, { x: 580, y: 520 }, { width: 200, height: 68 }, { area }),
    treeNode(
      `publication:${framework.id}`,
      "publication",
      framework.label,
      { x: 550, y: 410 },
      { width: 260, height: 76 },
      { area, framework, meta: framework.nodeType || "Publication" },
    ),
  );
  const positions = focusChildrenPositions(units.length, 220);
  units.forEach((unit, index) => {
    nodes.push(
      treeNode(`unit:${unit.id}`, "unit", unit.label, positions[index]!, { width: 220, height: 72 }, {
        area,
        framework,
        unit,
        meta: `${unit.records.length.toLocaleString()} record${unit.records.length === 1 ? "" : "s"} / publisher structure`,
      }),
    );
  });
  const edges = [
    treeEdge("roots-cybersecurity", "atlas:AUTHORITY-ROOTS", ATLAS_CYBERSECURITY_NODE_ID, "organizing"),
    treeEdge("cybersecurity-area", ATLAS_CYBERSECURITY_NODE_ID, area.id, "organizing"),
    treeEdge("area-publication", area.id, `publication:${framework.id}`, "organizing"),
    ...units.map((unit) =>
      treeEdge(
        `unit-edge:${unit.id}`,
        `publication:${framework.id}`,
        `unit:${unit.id}`,
        "structural",
      ),
    ),
  ];
  return {
    nodes,
    edges,
    level: "structure",
    title: framework.label,
    description: units.length
      ? "Publisher-declared top-level structure. Open a branch to continue to its records."
      : "This publication has no publisher-declared child hierarchy in the Atlas. Its records remain connected through published references, not invented parentage.",
  };
}

const nodeTypes = { atlasTree: memo(AtlasTreeNodeView) };

function AtlasTreeNodeView({ data, selected }: NodeProps<AtlasTreeNode>) {
  if (data.kind === "junction") {
    return (
      <span aria-hidden="true" className="atlas-tree-node__junction">
        <Handle className="atlas-tree-node__handle" isConnectable={false} position={Position.Bottom} type="target" />
        <Handle className="atlas-tree-node__handle" isConnectable={false} position={Position.Top} type="source" />
      </span>
    );
  }
  return (
    <div className={`atlas-tree-node atlas-tree-node--${data.kind}${selected ? " is-selected" : ""}`}>
      <Handle className="atlas-tree-node__handle" isConnectable={false} position={Position.Bottom} type="target" />
      {data.kind === "root" ? (
        <div className="atlas-tree-node__roots" aria-label={data.meta}>
          <span>Law</span><span>Policy</span><span>Standards</span><span>Sources</span>
        </div>
      ) : null}
      <span className="atlas-tree-node__terminal" aria-hidden="true" />
      <strong>{data.label}</strong>
      {data.meta ? <small>{data.meta}</small> : null}
      <Handle className="atlas-tree-node__handle" isConnectable={false} position={Position.Top} type="source" />
    </div>
  );
}

function activePathEdges(nodes: AtlasTreeNode[], edges: AtlasTreeEdge[], activeNodeId: string) {
  const parentEdge = new Map(edges.map((edge) => [edge.target, edge]));
  const active = new Set<string>();
  let current = activeNodeId;
  while (current) {
    const edge = parentEdge.get(current);
    if (!edge) break;
    active.add(edge.id);
    current = edge.source;
  }
  // Routing junctions can have multiple children. Follow the real target's
  // parent chain only; never light a sibling branch.
  return active;
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

function AtlasUniverseGraph(props: {
  areas: AtlasFrameworkGroup[];
  catalogSummaries: CatalogSummary[];
  reducedMotion: boolean;
  initialAreaId: string;
  initialFrameworkId: string;
  onOpenArea: (area: AtlasFrameworkGroup) => void;
  onExpandArea: (area: AtlasFrameworkGroup) => void;
  onExpandFramework: (area: AtlasFrameworkGroup, framework: AtlasFrameworkChoice) => void;
  onCollapseToArea: (area: AtlasFrameworkGroup) => void;
  onResetOverview: () => void;
  onOpenFramework: (area: AtlasFrameworkGroup, framework: AtlasFrameworkChoice) => void;
  onOpenUnit: (area: AtlasFrameworkGroup, framework: AtlasFrameworkChoice, unit: AtlasFamilyChoice) => void;
}) {
  const {
    areas,
    catalogSummaries,
    reducedMotion,
    initialAreaId,
    initialFrameworkId,
    onOpenArea,
    onExpandArea,
    onExpandFramework,
    onCollapseToArea,
    onResetOverview,
    onOpenFramework,
    onOpenUnit,
  } = props;
  const reactFlow = useReactFlow<AtlasTreeNode, AtlasTreeEdge>();
  const [selectedArea, setSelectedArea] = useState<AtlasFrameworkGroup | null>(
    () => areas.find((area) => area.id === initialAreaId) || null,
  );
  const [selectedFramework, setSelectedFramework] = useState<AtlasFrameworkChoice | null>(
    () => {
      const area = areas.find((candidate) => candidate.id === initialAreaId);
      return area?.frameworks.find((framework) => framework.id === initialFrameworkId) || null;
    },
  );
  const [activeNodeId, setActiveNodeId] = useState("");
  const [liveMessage, setLiveMessage] = useState("Atlas ready.");
  const semanticGuard = useRef(0);

  const currentArea = selectedArea
    ? areas.find((area) => area.id === selectedArea.id) || selectedArea
    : null;
  const currentFramework = selectedFramework && currentArea
    ? currentArea.frameworks.find((framework) => framework.id === selectedFramework.id) || selectedFramework
    : null;

  useEffect(() => {
    const initialArea = areas.find((area) => area.id === initialAreaId) || null;
    setSelectedArea(initialArea);
    const initialFramework = initialArea?.frameworks.find(
      (framework) => framework.id === initialFrameworkId,
    ) || null;
    setSelectedFramework(initialFramework);
  }, [areas, initialAreaId, initialFrameworkId]);

  const projection = useMemo(() => {
    if (currentArea && currentFramework) {
      return structureProjection(currentArea, currentFramework);
    }
    if (currentArea) return publicationProjection(currentArea, catalogSummaries);
    return landscapeProjection(areas, catalogSummaries);
  }, [areas, catalogSummaries, currentArea, currentFramework]);

  const activeEdges = useMemo(
    () => activePathEdges(projection.nodes, projection.edges, activeNodeId),
    [activeNodeId, projection.edges, projection.nodes],
  );
  const styledEdges = useMemo(
    () => projection.edges.map((edge) => ({
      ...edge,
      animated: !reducedMotion && activeEdges.has(edge.id),
      className: `atlas-universe__branch${activeEdges.has(edge.id) ? " is-active" : ""}`,
      style: {
        ...edge.style,
        stroke: activeEdges.has(edge.id)
          ? "var(--ca-accent)"
          : edge.data?.relation === "structural"
            ? "var(--ca-accent)"
            : "var(--ca-primary)",
        opacity: activeNodeId && !activeEdges.has(edge.id) ? 0.28 : 0.76,
      },
    })),
    [activeEdges, activeNodeId, projection.edges, reducedMotion],
  );

  useEffect(() => {
    semanticGuard.current = Date.now();
    const timer = window.setTimeout(() => {
      void reactFlow.fitView({ padding: 0.14, duration: reducedMotion ? 0 : 260 });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [projection.level, reactFlow, reducedMotion, currentArea?.id, currentFramework?.id]);

  function openNode(node: AtlasTreeNode) {
    const { data } = node;
    if (data.kind === "area" && data.area) {
      if (data.area.frameworks.length === 0) {
        onOpenArea(data.area);
        return;
      }
      setSelectedArea(data.area);
      setSelectedFramework(null);
      onExpandArea(data.area);
      setActiveNodeId("");
      setLiveMessage(`${data.area.label} expanded to ${data.area.frameworks.length} publications.`);
      return;
    }
    if (data.kind === "publication" && data.area && data.framework) {
      const units = structuralUnits(data.framework);
      if (units.length === 0) {
        onOpenFramework(data.area, data.framework);
        return;
      }
      setSelectedArea(data.area);
      setSelectedFramework(data.framework);
      onExpandFramework(data.area, data.framework);
      setActiveNodeId("");
      setLiveMessage(`${data.framework.label} expanded to ${units.length} publisher-declared branches.`);
      return;
    }
    if (data.kind === "unit" && data.area && data.framework && data.unit) {
      onOpenUnit(data.area, data.framework, data.unit);
    }
  }

  function zoomOutSemantic() {
    if (selectedFramework) {
      setSelectedFramework(null);
      if (currentArea) onCollapseToArea(currentArea);
      setLiveMessage(`${currentArea?.label || "Area"} publication view.`);
      return;
    }
    if (selectedArea) {
      setSelectedArea(null);
      onResetOverview();
      setLiveMessage("Atlas landscape view.");
    }
  }

  return (
    <div className="atlas-universe__graph-shell">
      <div className="atlas-universe__graph-toolbar">
        <div>
          <span className="atlas-universe__level">{projection.level === "landscape" ? "Landscape" : projection.level === "publications" ? "Publications" : "Publisher structure"}</span>
          <strong>{projection.title}</strong>
          <small>{projection.description}</small>
        </div>
        {projection.level !== "landscape" ? (
          <button onClick={zoomOutSemantic} type="button">Zoom out one level</button>
        ) : null}
      </div>
      <div className="atlas-universe__stage" data-semantic-level={projection.level}>
        <ReactFlow
          aria-label="Interactive Control Atlas hierarchy"
          colorMode="dark"
          edges={styledEdges}
          fitView
          fitViewOptions={{ padding: 0.14, duration: reducedMotion ? 0 : 260 }}
          maxZoom={1.8}
          minZoom={0.42}
          nodes={projection.nodes}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesFocusable
          onMoveEnd={(_, viewport) => {
            if (Date.now() - semanticGuard.current < 500) return;
            if (viewport.zoom < 0.5 && projection.level !== "landscape") {
              zoomOutSemantic();
              return;
            }
            if (viewport.zoom > 1.3 && activeNodeId) {
              const node = projection.nodes.find((candidate) => candidate.id === activeNodeId);
              if (node) openNode(node);
            }
          }}
          onNodeClick={(_, node) => openNode(node)}
          onNodeMouseEnter={(_, node) => setActiveNodeId(node.id)}
          onNodeMouseLeave={() => setActiveNodeId("")}
          panOnScroll={false}
          preventScrolling
          proOptions={{ hideAttribution: true }}
          zoomOnScroll
        >
          <Background color="rgba(109, 232, 255, 0.12)" gap={24} />
          <Controls position="bottom-right" showInteractive={false} />
        </ReactFlow>
      </div>
      <p aria-live="polite" className="sr-only">{liveMessage}</p>
      <div className="atlas-universe__legend" aria-label="Atlas relationship legend">
        <span><i className="is-organizing" />Control Atlas structure</span>
        <span><i className="is-published" />Publisher structure</span>
      </div>
    </div>
  );
}

function AtlasUniverseMobile(props: {
  areas: AtlasFrameworkGroup[];
  catalogSummaries: CatalogSummary[];
  initialAreaId: string;
  initialFrameworkId: string;
  onOpenArea: (area: AtlasFrameworkGroup) => void;
  onExpandArea: (area: AtlasFrameworkGroup) => void;
  onExpandFramework: (area: AtlasFrameworkGroup, framework: AtlasFrameworkChoice) => void;
  onCollapseToArea: (area: AtlasFrameworkGroup) => void;
  onResetOverview: () => void;
  onOpenFramework: (area: AtlasFrameworkGroup, framework: AtlasFrameworkChoice) => void;
  onOpenUnit: (area: AtlasFrameworkGroup, framework: AtlasFrameworkChoice, unit: AtlasFamilyChoice) => void;
}) {
  const [area, setArea] = useState<AtlasFrameworkGroup | null>(
    () => props.areas.find((candidate) => candidate.id === props.initialAreaId) || null,
  );
  const [framework, setFramework] = useState<AtlasFrameworkChoice | null>(null);
  useEffect(() => {
    const nextArea = props.areas.find((candidate) => candidate.id === props.initialAreaId) || null;
    setArea(nextArea);
    const nextFramework = nextArea?.frameworks.find(
      (candidate) => candidate.id === props.initialFrameworkId,
    ) || null;
    setFramework(nextFramework);
  }, [props.areas, props.initialAreaId, props.initialFrameworkId]);
  const units = framework ? structuralUnits(framework) : [];
  const items = framework ? units : area ? area.frameworks : props.areas;

  return (
    <div className="atlas-universe-mobile">
      <div className="atlas-universe-mobile__roots"><strong>Authority roots</strong><span>Law / policy / standards / source material</span></div>
      <div className="atlas-universe-mobile__spine"><strong>Cybersecurity</strong><span>Control Atlas structure</span></div>
      <div className="atlas-universe-mobile__toolbar">
        {(area || framework) ? (
          <button onClick={() => {
            if (framework) { setFramework(null); if (area) props.onCollapseToArea(area); }
            else { setArea(null); props.onResetOverview(); }
          }} type="button">Zoom out</button>
        ) : null}
        <span>{framework ? "Publisher structure" : area ? "Publications" : "Landscape"}</span>
      </div>
      <div className="atlas-universe-mobile__branches">
        {items.map((item) => {
          if ("frameworks" in item) {
            const counts = areaCounts(item, props.catalogSummaries);
            return (
              <button className="atlas-universe__area" key={item.id} onClick={() => {
                if (item.frameworks.length) { setArea(item); props.onExpandArea(item); }
                else props.onOpenArea(item);
              }} type="button">
                <strong>{item.label}</strong>
                <span>{counts.publications} publication{counts.publications === 1 ? "" : "s"} / {counts.records.toLocaleString()} records</span>
              </button>
            );
          }
          if ("units" in item && area) {
            return (
              <button key={item.id} onClick={() => {
                if (structuralUnits(item).length) { setFramework(item); props.onExpandFramework(area, item); }
                else props.onOpenFramework(area, item);
              }} type="button">
                <strong>{item.label}</strong>
                <span>{publishedRecordCount(item, props.catalogSummaries).toLocaleString()} records</span>
              </button>
            );
          }
          if (framework && area) {
            const unit = item as AtlasFamilyChoice;
            return (
              <button key={unit.id} onClick={() => props.onOpenUnit(area, framework, unit)} type="button">
                <strong>{unit.label}</strong>
                <span>{unit.records.length.toLocaleString()} records / publisher structure</span>
              </button>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function AtlasUniverse(props: {
  areas: AtlasFrameworkGroup[];
  catalogSummaries: CatalogSummary[];
  nodeCount: number;
  initialAreaId: string;
  initialFrameworkId: string;
  onOpenArea: (area: AtlasFrameworkGroup) => void;
  onExpandArea: (area: AtlasFrameworkGroup) => void;
  onExpandFramework: (area: AtlasFrameworkGroup, framework: AtlasFrameworkChoice) => void;
  onCollapseToArea: (area: AtlasFrameworkGroup) => void;
  onResetOverview: () => void;
  onOpenFramework: (area: AtlasFrameworkGroup, framework: AtlasFrameworkChoice) => void;
  onOpenUnit: (area: AtlasFrameworkGroup, framework: AtlasFrameworkChoice, unit: AtlasFamilyChoice) => void;
}) {
  const compact = useCompactAtlas();
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const collisions = atlasUniverseCollisions();
  if (collisions.length) {
    return <p role="status">The Atlas overview could not be laid out safely.</p>;
  }

  return (
    <section aria-labelledby="atlas-universe-title" className="atlas-universe">
      <header className="atlas-universe__intro">
        <div>
          <p className="eyebrow">Control Atlas landscape</p>
          <h2 id="atlas-universe-title">The whole tree, from authority to implementation.</h2>
          <p>Zoom from the nine areas into publications and their native structure. Relationship overlays stay separate so the hierarchy remains honest.</p>
        </div>
        <dl className="atlas-universe__totals" aria-label="Atlas totals">
          <div><dt>Published records</dt><dd>{props.nodeCount.toLocaleString()}</dd></div>
          <div><dt>Publications</dt><dd>{props.catalogSummaries.length.toLocaleString()}</dd></div>
        </dl>
      </header>
      {compact ? (
        <AtlasUniverseMobile {...props} />
      ) : (
        <ReactFlowProvider>
          <AtlasUniverseGraph {...props} reducedMotion={reducedMotion} />
        </ReactFlowProvider>
      )}
    </section>
  );
}
