import {
  applyRelationshipClustering as applyRelationshipClusteringImpl,
  DEFAULT_CLUSTER_THRESHOLDS as DEFAULT_CLUSTER_THRESHOLDS_IMPL,
} from "./graphClustering.mjs";
import { groupRelationships } from "../../app/relationship-groups.mjs";

export type ClusterThresholds = {
  disaCci: number;
  otherMappings: number;
  sources: number;
  templates: number;
  playbooks: number;
};

export const DEFAULT_CLUSTER_THRESHOLDS: ClusterThresholds =
  DEFAULT_CLUSTER_THRESHOLDS_IMPL;

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
  return applyRelationshipClusteringImpl(options) as {
    nodes: RawNode[];
    edges: RawEdge[];
    clusterMeta: Map<string, ClusterNodeMeta>;
  };
}
