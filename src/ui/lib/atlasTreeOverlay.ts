import type {
  AtlasNeighborhoodEdge,
  AtlasNeighborhoodNode,
  AtlasNeighborhoodRecord,
} from "./runtimeLoader";

export const ATLAS_OVERLAY_HIGHLIGHT_CAP = 24;

export type AtlasOverlayHighlight = {
  node: AtlasNeighborhoodNode;
  edge: AtlasNeighborhoodEdge;
};

const confidenceOrder = new Map([
  ["direct", 0],
  ["high", 0],
  ["derived", 1],
  ["moderate", 2],
  ["low", 3],
]);

function isPublisherDeclared(edge: AtlasNeighborhoodEdge) {
  return edge.publication_status === "published" &&
    edge.provenance_class !== "control_atlas_derived";
}

function counterpartId(edge: AtlasNeighborhoodEdge, centerNodeId: string) {
  return edge.source_node_id === centerNodeId
    ? edge.target_node_id
    : edge.source_node_id;
}

export function rankAtlasMappingOverlay(
  record: Pick<AtlasNeighborhoodRecord, "center_node" | "nodes" | "edges">,
  cap = ATLAS_OVERLAY_HIGHLIGHT_CAP,
) {
  const nodeById = new Map(record.nodes.map((node) => [node.id, node]));
  const ranked = record.edges
    .filter(
      (edge) =>
        edge.relationship_class === "correlation" &&
        edge.publication_status === "published",
    )
    .map((edge) => ({ edge, node: nodeById.get(counterpartId(edge, record.center_node.id)) }))
    .filter((entry): entry is AtlasOverlayHighlight => Boolean(entry.node))
    .sort((left, right) => {
      const publisherOrder = Number(isPublisherDeclared(right.edge)) - Number(isPublisherDeclared(left.edge));
      if (publisherOrder) return publisherOrder;
      const confidence = (confidenceOrder.get(left.edge.confidence) ?? 9) -
        (confidenceOrder.get(right.edge.confidence) ?? 9);
      if (confidence) return confidence;
      return left.node.id.localeCompare(right.node.id);
    });
  const unique = new Map<string, AtlasOverlayHighlight>();
  for (const entry of ranked) if (!unique.has(entry.node.id)) unique.set(entry.node.id, entry);
  const all = [...unique.values()];
  return {
    highlights: all.slice(0, cap),
    overflowCount: Math.max(0, all.length - cap),
    summaryChip: all.length > cap
      ? { label: `${(all.length - cap).toLocaleString()} more`, destination: "compare" as const }
      : null,
  };
}

export function preserveTreeIdentityWithOverlay<Nodes extends readonly { id: string }[], Edges>(
  nodes: Nodes,
  edges: Edges,
  overlay: ReturnType<typeof rankAtlasMappingOverlay>,
) {
  const renderedIds = new Set(nodes.map((node) => node.id));
  return {
    nodes,
    edges,
    highlightedIds: new Set(
      overlay.highlights
        .map((entry) => entry.node.id)
        .filter((id) => renderedIds.has(id)),
    ),
    summaryChip: overlay.summaryChip,
  };
}
