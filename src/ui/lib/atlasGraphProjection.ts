import type { AtlasGraph, AtlasGraphSourceNode } from "./atlasGraphModel";
import { ATLAS_TRUNK_ID, type AtlasTreeModel } from "./atlasTreeModel";

export type AtlasProjectionLevel = "landscape" | "area" | "publication" | "detail";
export type AtlasProjectionDrill =
  | { kind: "area"; targetId: string }
  | { kind: "publication"; targetId: string }
  | { kind: "detail"; targetId: string }
  | { kind: "record"; targetId: string };

export type AtlasProjectionNode = {
  id: string;
  label: string;
  description: string;
  /** Compatibility only. UI surfaces use the separated axes below. */
  nodeType: string;
  nativeType: string;
  atlasClass: string;
  objectLayer: "atlas_structure" | "authority_document" | "publisher_content";
  atlasStructureRole: "root" | "area" | "";
  areaId: string;
  publicationId: string;
  canonicalNodeIds: string[];
  canonicalRecordCount: number;
  internalRelationshipCount: number;
  importance: number;
  x: number;
  y: number;
  drill?: AtlasProjectionDrill;
};

export type AtlasProjectionEdge = {
  id: string;
  source: string;
  target: string;
  canonicalEdgeIds: string[];
  connectionSourceIds: string[];
  relationshipCount: number;
  relationshipTypes: string[];
  relationshipClasses: string[];
  directedCount: number;
  undirectedCount: number;
};

export type AtlasGraphProjection = {
  id: string;
  level: AtlasProjectionLevel;
  label: string;
  description: string;
  nodes: AtlasProjectionNode[];
  edges: AtlasProjectionEdge[];
  representedCanonicalNodeCount: number;
  representedCanonicalRelationshipCount: number;
  suppressedRelationshipCount: number;
};

export type AtlasRecordLocation = {
  areaId: string;
  publicationId: string;
  detailId?: string;
  label: string;
  nodeType: string;
};

export type AtlasSemanticProjectionArtifact = {
  schema_version: "2.0";
  generated_at: string;
  canonical: { node_count: number; edge_count: number };
  landscape: AtlasGraphProjection;
  areas: Record<string, AtlasGraphProjection>;
  publications: Record<string, AtlasGraphProjection>;
  details: Record<string, AtlasGraphProjection>;
  record_locations: Record<string, AtlasRecordLocation>;
};

type Descriptor = Omit<AtlasProjectionNode, "canonicalRecordCount" | "internalRelationshipCount" | "importance" | "x" | "y">;
type EdgeBucket = Omit<AtlasProjectionEdge, "id" | "relationshipCount"> & { types: Set<string>; classes: Set<string>; sources: Set<string> };

const AUTHORITY_GROUPS = [
  ["authority:statutes", "Statutes", "Laws that establish federal cybersecurity duties.", "statute"],
  ["authority:regulations", "Regulations & clauses", "Rules and clauses that turn authority into requirements.", "regulation"],
  ["authority:directives", "Policy & directives", "Executive and agency direction for federal cybersecurity.", "policy_directive"],
] as const;

const LANDSCAPE_POSITIONS: Record<string, readonly [number, number]> = {
  "authority:statutes": [-1.1, .9], "authority:regulations": [-1.3, 0], "authority:directives": [-1.1, -.9],
  [ATLAS_TRUNK_ID]: [0, 0], "atlas:LIMB-GOVERNANCE": [.8, 1.2], "atlas:LIMB-RISK": [1.65, .95],
  "atlas:LIMB-COMPLIANCE": [1.25, .35], "atlas:LIMB-ARCHITECTURE": [1.7, -.1],
  "atlas:LIMB-IMPLEMENTATION": [1.15, -.65], "atlas:LIMB-ASSESSMENT": [.55, -1.15],
  "atlas:LIMB-OPERATIONS": [-.25, -1.22], "atlas:LIMB-THREAT": [.45, -.55],
  "atlas:LIMB-KNOWLEDGE": [.35, .72],
};

function asRecord(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}
function asText(value: unknown) { return typeof value === "string" ? value : ""; }
function normalized(value: string) { return value.trim().toLocaleLowerCase().replace(/\s+/g, " "); }
function metadata(node: AtlasGraphSourceNode) { return asRecord(node.metadata); }
function catalogId(node: AtlasGraphSourceNode) { return asText(metadata(node).catalog_id) || asText(node.catalog_id); }
function publicationCatalogId(publication: { id: string; itemId: string }) {
  return publication.id.endsWith(":CATALOG")
    ? publication.id.slice(0, -":CATALOG".length)
    : publication.itemId;
}
function nodeLabel(node: AtlasGraphSourceNode) { return asText(metadata(node).title) || asText(node.label) || asText(metadata(node).item_id) || node.id; }
function recordLabel(node: AtlasGraphSourceNode) {
  const itemId = asText(metadata(node).item_id);
  const title = asText(metadata(node).title);
  if (itemId && title && normalized(itemId) !== normalized(title)) return `${itemId} \u2014 ${title}`;
  return asText(node.label) || nodeLabel(node);
}
function nativeType(node: AtlasGraphSourceNode) {
  if (catalogId(node) === "disa-cci") return "cci";
  return asText(metadata(node).native_type) || asText(metadata(node).type) || asText(node.node_type);
}
function objectLayer(node: AtlasGraphSourceNode): AtlasProjectionNode["objectLayer"] {
  if (node.node_type === "trunk" || node.node_type === "limb" || node.source_id === "control-atlas-structure") return "atlas_structure";
  if (["statute", "regulation", "policy_directive"].includes(String(node.node_type))) return "authority_document";
  return "publisher_content";
}
function sourceIds(edge: Record<string, unknown>) {
  const refs = Array.isArray(edge.source_refs)
    ? edge.source_refs.map((ref) => asText(asRecord(ref).source_id))
    : [];
  return [...new Set([asText(edge.source_artifact_id), ...refs].filter(Boolean))].sort();
}
function projectionId(level: AtlasProjectionLevel, id: string) { return `${level}:${id}`; }
function stable(value: number) { return Number(value.toFixed(4)); }
function assignCoordinates(level: AtlasProjectionLevel, nodes: AtlasProjectionNode[]) {
  if (level === "landscape") {
    nodes.forEach((node, index) => {
      const point = LANDSCAPE_POSITIONS[node.id] || [Math.cos(index) * 1.5, Math.sin(index) * 1.2];
      node.x = point[0]; node.y = point[1];
    });
    return;
  }
  const context = nodes.find((node) => node.id.startsWith("context:"));
  if (context) {
    context.x = 0;
    context.y = 0;
  }
  const positioned = [...nodes]
    .filter((node) => node !== context)
    .sort((a, b) => a.id.localeCompare(b.id));
  positioned.forEach((node, index, all) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, all.length);
    const radius = level === "detail" ? 1.25 : 1.55;
    node.x = stable(Math.cos(angle) * radius); node.y = stable(Math.sin(angle) * radius);
  });
}

function buildProjection(options: {
  id: string; level: AtlasProjectionLevel; label: string; description: string;
  graph: AtlasGraph; descriptors: Descriptor[]; edgeLimit: number;
}): AtlasGraphProjection {
  const nodes = options.descriptors.map((descriptor) => ({
    ...descriptor,
    canonicalNodeIds: [...descriptor.canonicalNodeIds].sort(),
    canonicalRecordCount: descriptor.canonicalNodeIds.length,
    internalRelationshipCount: 0,
    importance: Math.min(10, 1 + Math.log1p(descriptor.canonicalNodeIds.length)),
    x: 0, y: 0,
  }));
  const membership = new Map<string, string>();
  for (const node of nodes) for (const canonicalId of node.canonicalNodeIds) {
    const previous = membership.get(canonicalId);
    if (previous) throw new Error(`Atlas projection ${options.id} maps ${canonicalId} to both ${previous} and ${node.id}.`);
    membership.set(canonicalId, node.id);
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const buckets = new Map<string, EdgeBucket>();
  options.graph.forEachEdge((edgeId, attributes, sourceId, targetId) => {
    const source = membership.get(sourceId); const target = membership.get(targetId);
    if (!source || !target) return;
    if (source === target) { nodeById.get(source)!.internalRelationshipCount += 1; return; }
    const directed = attributes.display.directed;
    const [left, right] = directed || source.localeCompare(target) <= 0 ? [source, target] : [target, source];
    const key = `${directed ? "d" : "u"}:${left}\u0000${right}`;
    const bucket = buckets.get(key) || {
      source: left, target: right, canonicalEdgeIds: [], connectionSourceIds: [], relationshipTypes: [], relationshipClasses: [],
      directedCount: 0, undirectedCount: 0, types: new Set<string>(), classes: new Set<string>(), sources: new Set<string>(),
    };
    bucket.canonicalEdgeIds.push(edgeId);
    bucket.types.add(asText(attributes.display.relationshipType) || "unspecified");
    bucket.classes.add(asText(attributes.display.relationshipClass) || "unspecified");
    sourceIds(attributes.source).forEach((id) => bucket.sources.add(id));
    if (directed) bucket.directedCount += 1; else bucket.undirectedCount += 1;
    buckets.set(key, bucket);
  });
  const allEdges = [...buckets.entries()].map(([key, bucket]) => ({
    id: `aggregate:${options.id}:${key}`, source: bucket.source, target: bucket.target,
    canonicalEdgeIds: bucket.canonicalEdgeIds.sort(), connectionSourceIds: [...bucket.sources].sort(),
    relationshipCount: bucket.canonicalEdgeIds.length, relationshipTypes: [...bucket.types].sort(), relationshipClasses: [...bucket.classes].sort(),
    directedCount: bucket.directedCount, undirectedCount: bucket.undirectedCount,
  })).sort((a, b) => b.relationshipCount - a.relationshipCount || a.id.localeCompare(b.id));
  const edges = allEdges.slice(0, options.edgeLimit);
  assignCoordinates(options.level, nodes);
  return {
    id: options.id, level: options.level, label: options.label, description: options.description,
    nodes: nodes.sort((a, b) => a.id.localeCompare(b.id)), edges,
    representedCanonicalNodeCount: membership.size,
    representedCanonicalRelationshipCount: edges.reduce((sum, edge) => sum + edge.relationshipCount, 0),
    suppressedRelationshipCount: allEdges.slice(options.edgeLimit).reduce((sum, edge) => sum + edge.relationshipCount, 0),
  };
}

function descriptor(options: {
  id: string; label: string; description: string; nodeType: string; ids: string[];
  areaId?: string; publicationId?: string; layer?: AtlasProjectionNode["objectLayer"];
  structureRole?: AtlasProjectionNode["atlasStructureRole"]; native?: string; atlasClass?: string; drill?: AtlasProjectionDrill;
}): Descriptor {
  return {
    id: options.id, label: options.label, description: options.description, nodeType: options.nodeType,
    nativeType: options.native || (options.layer === "atlas_structure" ? "" : options.nodeType), atlasClass: options.atlasClass || "",
    objectLayer: options.layer || "publisher_content", atlasStructureRole: options.structureRole || "",
    areaId: options.areaId || "", publicationId: options.publicationId || "", canonicalNodeIds: options.ids, drill: options.drill,
  };
}

function detailFor(graph: AtlasGraph, parent: AtlasProjectionNode) {
  if (parent.canonicalNodeIds.length < 2 || parent.canonicalNodeIds.length > 250) return null;
  return buildProjection({
    id: projectionId("detail", parent.id), level: "detail", label: parent.label,
    description: `${parent.canonicalNodeIds.length.toLocaleString()} publisher-native records.`, graph, edgeLimit: 150,
    descriptors: parent.canonicalNodeIds.map((id) => {
      const source = graph.getNodeAttribute(id, "source"); const layer = objectLayer(source);
      return descriptor({ id, label: recordLabel(source), description: asText(metadata(source).description), nodeType: asText(source.node_type),
        native: nativeType(source), atlasClass: source.node_type === "requirement" ? "requirement" : "", layer,
        structureRole: source.node_type === "trunk" ? "root" : source.node_type === "limb" ? "area" : "", areaId: parent.areaId,
        publicationId: parent.publicationId, ids: [id], drill: { kind: "record", targetId: id } });
    }),
  });
}

/** Builds presentation-only graph projections; it never writes canonical graph attributes or relationships. */
export function buildAtlasSemanticProjections(options: {
  graph: AtlasGraph; model: AtlasTreeModel; generatedAt: string;
}): AtlasSemanticProjectionArtifact {
  const { graph, model } = options;
  const areaForCatalog = new Map(model.publications.filter((node) => node.parentId).map((node) => [publicationCatalogId(node), node.parentId!]));
  const idsForArea = new Map(model.areas.map((area) => [area.id, [] as string[]]));
  const authorityIds = new Map(AUTHORITY_GROUPS.map(([id]) => [id, [] as string[]]));
  const trunkIds: string[] = []; const unclassified: string[] = [];
  const locations: Record<string, AtlasRecordLocation> = {};
  for (const id of graph.nodes()) {
    const source = graph.getNodeAttribute(id, "source"); const catalog = catalogId(source);
    const area = areaForCatalog.get(catalog) || (idsForArea.has(id) ? id : "");
    const authority = AUTHORITY_GROUPS.find(([, , , type]) => type === source.node_type);
    if (authority) authorityIds.get(authority[0])!.push(id);
    else if (id === ATLAS_TRUNK_ID) trunkIds.push(id);
    else if (area) idsForArea.get(area)!.push(id);
    else unclassified.push(id);
    if (area && catalog) locations[id] = { areaId: area, publicationId: catalog, label: nodeLabel(source), nodeType: asText(source.node_type) };
  }
  const landscape = buildProjection({
    id: projectionId("landscape", "control-atlas"), level: "landscape", label: "Cybersecurity landscape",
    description: "Major published structures in Control Atlas. Select a landmark to move into its real records.", graph, edgeLimit: 32,
    descriptors: [
      ...AUTHORITY_GROUPS.map(([id, label, description]) => descriptor({ id, label, description, nodeType: "authority_aggregate", ids: authorityIds.get(id) || [], layer: "authority_document" })).filter((item) => item.canonicalNodeIds.length),
      descriptor({ id: ATLAS_TRUNK_ID, label: model.trunk.label, description: model.trunk.blurb, nodeType: "trunk", ids: trunkIds, layer: "atlas_structure", structureRole: "root" }),
      ...model.areas.map((area) => descriptor({ id: area.id, label: area.label, description: area.blurb, nodeType: "limb", ids: idsForArea.get(area.id) || [], layer: "atlas_structure", structureRole: "area", areaId: area.id, drill: { kind: "area", targetId: area.id } })),
      ...(unclassified.length ? [descriptor({ id: "derived:unclassified", label: "Unclassified published records", description: "An explicit presentation exception, not an Atlas taxonomy.", nodeType: "derived_aggregate", ids: unclassified })] : []),
    ],
  });
  const areas: Record<string, AtlasGraphProjection> = {};
  const publications: Record<string, AtlasGraphProjection> = {};
  const details: Record<string, AtlasGraphProjection> = {};
  for (const area of model.areas) {
    const publicationNodes = model.publications.filter((publication) => publication.parentId === area.id);
    areas[area.id] = buildProjection({ id: projectionId("area", area.id), level: "area", label: area.label, description: area.blurb, graph, edgeLimit: 48,
      descriptors: [
        descriptor({ id: `context:${area.id}`, label: area.label, description: area.blurb, nodeType: "limb", ids: graph.hasNode(area.id) ? [area.id] : [], layer: "atlas_structure", structureRole: "area", areaId: area.id }),
        ...publicationNodes.map((publication) => {
          const publicationId = publicationCatalogId(publication);
          const ids = graph.nodes().filter((id) => catalogId(graph.getNodeAttribute(id, "source")) === publicationId);
          return descriptor({ id: publication.id, label: publication.label, description: publication.blurb, nodeType: "catalog", native: "catalog", ids, areaId: area.id, publicationId, drill: { kind: "publication", targetId: publicationId } });
        }),
      ],
    });
  }
  for (const publication of model.publications) {
    const publicationId = publicationCatalogId(publication);
    const publicationIds = graph.nodes().filter((id) => catalogId(graph.getNodeAttribute(id, "source")) === publicationId);
    const grouped = new Map<string, string[]>();
    for (const id of publicationIds) {
      if (id === publication.id) continue;
      const source = graph.getNodeAttribute(id, "source"); const meta = metadata(source);
      const group = asText(meta.benchmark_title) || asText(meta.benchmark_id) || asText(meta.family) || nativeType(source) || "Other publisher records";
      const entries = grouped.get(group) || []; entries.push(id); grouped.set(group, entries);
    }
    const nativeGroups = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
    const groupChunks = nativeGroups.length > 48
      ? Array.from({ length: Math.ceil(nativeGroups.length / 48) }, (_, index) => nativeGroups.slice(index * 48, index * 48 + 48))
      : nativeGroups.map((entry) => [entry]);
    const groupDescriptors = groupChunks.map((chunk, index) => {
      const ids = chunk.flatMap(([, entries]) => entries).sort();
      const label = chunk.length === 1 ? chunk[0]![0] : `${chunk[0]![0]}–${chunk.at(-1)![0]}`;
      return descriptor({ id: `group:${publicationId}:${index}`, label, description: `${ids.length.toLocaleString()} publisher-native records.`, nodeType: "publisher_group", ids, areaId: publication.parentId || "", publicationId });
    });
    const projection = buildProjection({ id: projectionId("publication", publicationId), level: "publication", label: publication.label, description: publication.blurb, graph, edgeLimit: 96,
      descriptors: [descriptor({ id: `context:${publication.id}`, label: publication.label, description: publication.blurb, nodeType: "catalog", native: "catalog", ids: publicationIds.filter((id) => id === publication.id), areaId: publication.parentId || "", publicationId }), ...groupDescriptors],
    });
    projection.nodes.forEach((node) => {
      const detail = detailFor(graph, node);
      if (!detail) return;
      node.drill = { kind: "detail", targetId: node.id };
      details[node.id] = detail;
      node.canonicalNodeIds.forEach((canonicalId) => {
        if (locations[canonicalId]) locations[canonicalId].detailId = node.id;
      });
    });
    publications[publicationId] = projection;
  }
  return { schema_version: "2.0", generated_at: options.generatedAt, canonical: { node_count: graph.order, edge_count: graph.size }, landscape, areas, publications, details, record_locations: locations };
}
