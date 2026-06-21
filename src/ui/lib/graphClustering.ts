import { groupRelationships } from "../../app/relationship-groups.mjs";

export type ClusterThresholds = {
  disaCci: number;
  otherMappings: number;
  sources: number;
  templates: number;
  playbooks: number;
};

export const DEFAULT_CLUSTER_THRESHOLDS: ClusterThresholds = {
  disaCci: 10,
  otherMappings: 10,
  sources: 5,
  templates: 6,
  playbooks: 6,
};

type RawNode = {
  id: string;
  node_type?: string;
  label?: string;
  metadata?: { item_id?: string; title?: string; catalog_id?: string };
};

type RawEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  provenance_class: string;
  publication_status: string;
  confidence: string;
  plain_language_rationale?: string;
};

export type ClusterNodeMeta = {
  isCluster: true;
  clusterKey: string;
  clusterLabel: string;
  memberIds: string[];
  memberCount: number;
};

function clusterKeyForGroupLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function thresholdForGroup(
  label: string,
  thresholds: ClusterThresholds,
): number {
  const normalized = label.toLowerCase();
  if (normalized.includes("cci")) return thresholds.disaCci;
  if (normalized.includes("template")) return thresholds.templates;
  if (normalized.includes("playbook") || normalized.includes("pattern")) {
    return thresholds.playbooks;
  }
  if (normalized.includes("source")) return thresholds.sources;
  return thresholds.otherMappings;
}

function clusterMemberIds(group: {
  items: Array<{ counterpart?: { id?: string } }>;
}) {
  return group.items
    .map((item) => item.counterpart?.id)
    .filter(Boolean) as string[];
}

export function applyRelationshipClustering(options: {
  centerNodeId: string;
  nodes: RawNode[];
  edges: RawEdge[];
  runtime: Parameters<typeof groupRelationships>[2];
  expandedClusters?: Set<string>;
  thresholds?: ClusterThresholds;
}): {
  nodes: RawNode[];
  edges: RawEdge[];
  clusterMeta: Map<string, ClusterNodeMeta>;
} {
  const {
    centerNodeId,
    nodes,
    edges,
    runtime,
    expandedClusters = new Set<string>(),
    thresholds = DEFAULT_CLUSTER_THRESHOLDS,
  } = options;

  const centerNode = nodes.find((node) => node.id === centerNodeId);
  if (!centerNode) {
    return { nodes, edges, clusterMeta: new Map() };
  }

  const grouped = groupRelationships(edges, centerNodeId, runtime);
  const clusterMeta = new Map<string, ClusterNodeMeta>();
  const hiddenNodeIds = new Set<string>();
  const syntheticNodes: RawNode[] = [];
  const syntheticEdges: RawEdge[] = [];

  for (const group of grouped) {
    const clusterKey = clusterKeyForGroupLabel(group.label);
    const limit = thresholdForGroup(group.label, thresholds);
    const memberIds = clusterMemberIds(group);

    if (memberIds.length <= limit || expandedClusters.has(clusterKey)) {
      continue;
    }

    const clusterId = `cluster:${clusterKey}`;
    clusterMeta.set(clusterId, {
      isCluster: true,
      clusterKey,
      clusterLabel: group.label,
      memberIds,
      memberCount: memberIds.length,
    });

    for (const memberId of memberIds) {
      hiddenNodeIds.add(memberId);
    }

    syntheticNodes.push({
      id: clusterId,
      node_type: "cluster",
      label: `${group.label} (${memberIds.length})`,
      metadata: {
        item_id: `${group.label} (${memberIds.length})`,
        title: `${group.label} (${memberIds.length})`,
      },
    });

    for (const edge of edges) {
      const touchesMember =
        memberIds.includes(edge.source_node_id) ||
        memberIds.includes(edge.target_node_id);
      if (!touchesMember) continue;

      const otherId =
        edge.source_node_id === centerNodeId ||
        memberIds.includes(edge.source_node_id)
          ? edge.target_node_id
          : edge.source_node_id;

      if (otherId === centerNodeId) continue;
      if (memberIds.includes(otherId)) continue;

      syntheticEdges.push({
        ...edge,
        id: `${edge.id}:${clusterId}`,
        source_node_id:
          edge.source_node_id === centerNodeId ? centerNodeId : clusterId,
        target_node_id:
          edge.target_node_id === centerNodeId ? centerNodeId : clusterId,
      });
    }
  }

  const visibleNodes = [
    ...nodes.filter((node) => !hiddenNodeIds.has(node.id)),
    ...syntheticNodes,
  ];

  const visibleEdges = edges
    .filter(
      (edge) =>
        !hiddenNodeIds.has(edge.source_node_id) &&
        !hiddenNodeIds.has(edge.target_node_id),
    )
    .concat(syntheticEdges);

  return {
    nodes: visibleNodes,
    edges: visibleEdges,
    clusterMeta,
  };
}
