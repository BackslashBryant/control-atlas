import Graph from "graphology";

export type AtlasGraphEdgeDirection = "directed" | "undirected";

export type AtlasGraphSourceNode = {
  id: string;
  node_type?: string;
  label?: string;
  source_id?: string;
  publication_source_id?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export type AtlasGraphSourceEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type?: string;
  relationship_class?: string;
  provenance_class?: string;
  publication_status?: string;
  direction?: AtlasGraphEdgeDirection;
  directed?: boolean;
  [key: string]: unknown;
};

export type AtlasGraphNodeDisplayMetadata = {
  label: string;
  /** Preserved legacy field: do not use as a global semantic taxonomy. */
  nodeType: string;
  /** Publisher-facing record kind, retained without Atlas normalization. */
  nativeType: string;
  /** Optional Atlas-owned discovery facet; empty when no facet is asserted. */
  atlasClass: string;
  /** Separates Atlas presentation from publisher and authority content. */
  objectLayer: "atlas_structure" | "authority_document" | "publisher_content";
  /** Derived Atlas presentation role, never a publisher record kind. */
  atlasStructureRole: "root" | "area" | "";
  sourceId: string;
  catalogId: string;
  itemId: string;
  descendantRecordCount: number;
  mandateClassification: string;
  publicationType: string;
};

export type AtlasGraphEdgeDisplayMetadata = {
  label: string;
  relationshipType: string;
  relationshipClass: string;
  provenanceClass: string;
  publicationStatus: string;
  directed: boolean;
  /** Edge-local connection provenance, not a landscape node classification. */
  connectionSourceIds: string[];
};

export type AtlasGraphNodeAttributes = {
  source: Readonly<AtlasGraphSourceNode>;
  display: Readonly<AtlasGraphNodeDisplayMetadata>;
  x?: number;
  y?: number;
};

export type AtlasGraphEdgeAttributes = {
  source: Readonly<AtlasGraphSourceEdge>;
  display: Readonly<AtlasGraphEdgeDisplayMetadata>;
};

export type AtlasGraph = Graph<
  AtlasGraphNodeAttributes,
  AtlasGraphEdgeAttributes
>;

export type AtlasGraphModelInput = {
  nodes: readonly AtlasGraphSourceNode[];
  edges: readonly AtlasGraphSourceEdge[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function count(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function textList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  return typeof value === "string" && value.length > 0 ? [value] : [];
}

function nativeType(node: AtlasGraphSourceNode, metadata: Record<string, unknown>) {
  const nodeType = text(node.node_type);
  if (nodeType === "requirement" && text(metadata.catalog_id) === "disa-cci") return "cci";
  return text(metadata.native_type) || text(metadata.type) || nodeType;
}

function atlasClass(node: AtlasGraphSourceNode, metadata: Record<string, unknown>) {
  return text(metadata.atlas_class) || (text(node.node_type) === "requirement" ? "requirement" : "");
}

function objectLayer(node: AtlasGraphSourceNode, metadata: Record<string, unknown>): AtlasGraphNodeDisplayMetadata["objectLayer"] {
  const canonical = text(metadata.object_layer);
  if (canonical === "atlas_structure" || canonical === "authority_document" || canonical === "publisher_content") return canonical;
  const kind = text(node.node_type);
  if (kind === "trunk" || kind === "limb" || text(metadata.atlas_structure_role)) return "atlas_structure";
  if (["statute", "regulation", "policy_directive", "authority_document"].includes(kind)) return "authority_document";
  return "publisher_content";
}

function atlasStructureRole(node: AtlasGraphSourceNode, metadata: Record<string, unknown>): AtlasGraphNodeDisplayMetadata["atlasStructureRole"] {
  const role = text(metadata.atlas_structure_role);
  if (role === "root" || text(node.node_type) === "trunk") return "root";
  if (role === "area" || text(node.node_type) === "limb") return "area";
  return "";
}

function nodeDisplay(node: AtlasGraphSourceNode): AtlasGraphNodeDisplayMetadata {
  const metadata = asRecord(node.metadata);
  return {
    label: text(node.label) || text(metadata.title) || node.id,
    nodeType: text(node.node_type),
    nativeType: nativeType(node, metadata),
    atlasClass: atlasClass(node, metadata),
    objectLayer: objectLayer(node, metadata),
    atlasStructureRole: atlasStructureRole(node, metadata),
    sourceId:
      text(node.source_id) ||
      text(node.publication_source_id) ||
      text(metadata.ingestion_source_id),
    catalogId: text(metadata.catalog_id) || text(node.catalog_id),
    itemId: text(metadata.item_id) || text(node.item_id),
    descendantRecordCount: count(
      metadata.structural_descendant_record_count ??
      metadata.descendant_record_count ??
      node.descendant_record_count,
    ),
    mandateClassification: text(metadata.mandate) || text(node.mandate),
    publicationType:
      text(metadata.publication_type) || text(node.publication_type),
  };
}

function edgeDirection(edge: AtlasGraphSourceEdge) {
  if (
    edge.direction !== undefined &&
    edge.direction !== "directed" &&
    edge.direction !== "undirected"
  ) {
    throw new Error(`Atlas edge ${edge.id} has an invalid direction.`);
  }
  if (edge.directed !== undefined && typeof edge.directed !== "boolean") {
    throw new Error(`Atlas edge ${edge.id} has an invalid directed flag.`);
  }
  const fromDirection = edge.direction === undefined
    ? undefined
    : edge.direction === "directed";
  if (
    fromDirection !== undefined &&
    edge.directed !== undefined &&
    fromDirection !== edge.directed
  ) {
    throw new Error(`Atlas edge ${edge.id} has conflicting direction fields.`);
  }
  // Existing generated Control Atlas edges use canonical source/target order.
  // An explicit undirected marker always wins; omission preserves source -> target.
  return edge.directed ?? fromDirection ?? true;
}

function edgeDisplay(
  edge: AtlasGraphSourceEdge,
  directed: boolean,
): AtlasGraphEdgeDisplayMetadata {
  return {
    label: text(edge.relationship_type) || edge.id,
    relationshipType: text(edge.relationship_type),
    relationshipClass: text(edge.relationship_class),
    provenanceClass: text(edge.provenance_class),
    publicationStatus: text(edge.publication_status),
    directed,
    connectionSourceIds: [...new Set([
      ...textList(edge.source_artifact_id),
      ...textList(edge.artifact_ids),
      ...(Array.isArray(edge.source_refs)
        ? edge.source_refs.flatMap((reference) => {
          const source = asRecord(reference);
          const id = text(source.source_id) || text(source.artifact_id) || text(source.id);
          return id ? [id] : [];
        })
        : []),
    ])].sort(),
  };
}

function assertIdentifier(kind: "node" | "edge", id: unknown) {
  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`Atlas ${kind} is missing a canonical ID.`);
  }
}

/**
 * Project canonical Control Atlas records into a runtime Graphology model.
 * This function copies source records into attributes but never derives edges.
 */
export function buildAtlasGraphModel(input: AtlasGraphModelInput): AtlasGraph {
  const graph = new Graph<AtlasGraphNodeAttributes, AtlasGraphEdgeAttributes>({
    type: "mixed",
    multi: true,
    allowSelfLoops: true,
  });
  const nodes = [...input.nodes].sort((left, right) => left.id.localeCompare(right.id));
  const edges = [...input.edges].sort((left, right) => left.id.localeCompare(right.id));

  for (const node of nodes) {
    assertIdentifier("node", node.id);
    if (graph.hasNode(node.id)) {
      throw new Error(`Duplicate Atlas node ID: ${node.id}.`);
    }
    graph.addNode(node.id, {
      source: Object.freeze({ ...node }),
      display: Object.freeze(nodeDisplay(node)),
    });
  }

  for (const edge of edges) {
    assertIdentifier("edge", edge.id);
    if (graph.hasEdge(edge.id)) {
      throw new Error(`Duplicate Atlas edge ID: ${edge.id}.`);
    }
    if (!graph.hasNode(edge.source_node_id)) {
      throw new Error(
        `Atlas edge ${edge.id} references missing source node ${edge.source_node_id}.`,
      );
    }
    if (!graph.hasNode(edge.target_node_id)) {
      throw new Error(
        `Atlas edge ${edge.id} references missing target node ${edge.target_node_id}.`,
      );
    }
    const directed = edgeDirection(edge);
    const attributes: AtlasGraphEdgeAttributes = {
      source: Object.freeze({ ...edge }),
      display: Object.freeze(edgeDisplay(edge, directed)),
    };
    if (directed) {
      graph.addDirectedEdgeWithKey(
        edge.id,
        edge.source_node_id,
        edge.target_node_id,
        attributes,
      );
    } else {
      graph.addUndirectedEdgeWithKey(
        edge.id,
        edge.source_node_id,
        edge.target_node_id,
        attributes,
      );
    }
  }

  return graph;
}
