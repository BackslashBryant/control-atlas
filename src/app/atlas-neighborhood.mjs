export const ATLAS_NEIGHBORHOOD_SHARD_COUNT = 128;

export function atlasNeighborhoodShardId(
  nodeId,
  shardCount = ATLAS_NEIGHBORHOOD_SHARD_COUNT,
) {
  let hash = 0x811c9dc5;
  for (const character of String(nodeId)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash % shardCount).toString(16).padStart(2, "0");
}

function compactNode(node) {
  return [
    node.id,
    node.node_type,
    node.metadata?.item_id || node.id,
    node.metadata?.title || node.label || node.id,
    node.metadata?.catalog_id || "",
    node.source_id || "",
    node.metadata?.family || "",
    node.parent_id || "",
  ];
}

function compactEdge(edge) {
  return [
    edge.id,
    edge.source_node_id,
    edge.target_node_id,
    edge.relationship_type,
    edge.relationship_class,
    edge.provenance_class,
    edge.publication_status,
    edge.confidence,
    (edge.source_refs || []).map((reference) => [
      reference.source_id || "",
      reference.ref_type || "",
      reference.locator || "",
    ]),
  ];
}

export function buildAtlasNeighborhoodShards(
  graph,
  shardCount = ATLAS_NEIGHBORHOOD_SHARD_COUNT,
) {
  const ancestorGraph = buildAncestorGraph(graph.nodes, graph.edges);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const edgesByNode = new Map(graph.nodes.map((node) => [node.id, []]));

  for (const edge of graph.edges) {
    edgesByNode.get(edge.source_node_id)?.push(edge);
    if (edge.target_node_id !== edge.source_node_id) {
      edgesByNode.get(edge.target_node_id)?.push(edge);
    }
  }

  const shardRecords = new Map();
  for (const node of graph.nodes) {
    const edges = (edgesByNode.get(node.id) || []).map(compactEdge);
    const structuralPath = ancestorChain(node.id, ancestorGraph).map(
      (link) => link.id,
    );
    const neighborhoodNodeIds = new Set([
      node.id,
      ...structuralPath,
      ...edges.flatMap((edge) => [edge[1], edge[2]]),
    ]);
    const shardId = atlasNeighborhoodShardId(node.id, shardCount);
    const records = shardRecords.get(shardId) || {};
    records[node.id] = {
      center_node: node,
      nodes: [...neighborhoodNodeIds]
        .map((nodeId) => nodeById.get(nodeId))
        .filter(Boolean)
        .map(compactNode),
      edges,
      structural_path: structuralPath,
      published_connection_count: edges.filter(
        (edge) => edge[6] === "published",
      ).length,
      candidate_connection_count: edges.filter(
        (edge) => edge[6] !== "published",
      ).length,
    };
    shardRecords.set(shardId, records);
  }

  return [...shardRecords.entries()]
    .map(([shard_id, records]) => ({
      shard_id,
      record_count: Object.keys(records).length,
      records,
    }))
    .sort((left, right) => left.shard_id.localeCompare(right.shard_id));
}
import {
  ancestorChain,
  buildAncestorGraph,
} from "./ancestor-path.mjs";
