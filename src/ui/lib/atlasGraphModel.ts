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
  nodeType: string;
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

function nodeDisplay(node: AtlasGraphSourceNode): AtlasGraphNodeDisplayMetadata {
  const metadata = asRecord(node.metadata);
  return {
    label: text(node.label) || text(metadata.title) || node.id,
    nodeType: text(node.node_type),
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
