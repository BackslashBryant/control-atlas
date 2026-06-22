import { useCallback, useEffect, useMemo, useState } from "react";

import {
  applyRelationshipClustering,
  type ClusterNodeMeta,
} from "./graphClustering";

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

type UseClusteredGraphOptions = {
  runtime: Parameters<typeof applyRelationshipClustering>[0]["runtime"];
  centerNodeId: string;
  nodes: RawNode[];
  edges: RawEdge[];
  enabled?: boolean;
  expandedClusters?: Set<string>;
  onExpandedClustersChange?: (next: Set<string>) => void;
};

export function useClusteredGraph(options: UseClusteredGraphOptions) {
  const {
    runtime,
    centerNodeId,
    nodes,
    edges,
    enabled = true,
    expandedClusters: controlledExpanded,
    onExpandedClustersChange,
  } = options;

  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedClusterLabels, setExpandedClusterLabels] = useState<
    Map<string, string>
  >(() => new Map());

  const expandedClusters = controlledExpanded ?? internalExpanded;

  const setExpandedClusters = useCallback(
    (updater: (current: Set<string>) => Set<string>) => {
      const next = updater(expandedClusters);
      if (onExpandedClustersChange) {
        onExpandedClustersChange(next);
      } else {
        setInternalExpanded(next);
      }
    },
    [expandedClusters, onExpandedClustersChange],
  );

  const onClusterExpand = useCallback(
    (clusterKey: string) => {
      const clusterId = `cluster:${clusterKey}`;
      const label =
        applyRelationshipClustering({
          centerNodeId,
          nodes,
          edges,
          runtime,
          expandedClusters,
        }).clusterMeta.get(clusterId)?.clusterLabel ?? clusterKey;

      setExpandedClusterLabels((current) => {
        const next = new Map(current);
        next.set(clusterKey, label);
        return next;
      });
      setExpandedClusters((current) => new Set(current).add(clusterKey));
    },
    [centerNodeId, edges, expandedClusters, nodes, runtime, setExpandedClusters],
  );

  const onClusterCollapse = useCallback(
    (clusterKey: string) => {
      setExpandedClusterLabels((current) => {
        const next = new Map(current);
        next.delete(clusterKey);
        return next;
      });
      setExpandedClusters((current) => {
        const next = new Set(current);
        next.delete(clusterKey);
        return next;
      });
    },
    [setExpandedClusters],
  );

  const clustered = useMemo(() => {
    if (!enabled) {
      return {
        nodes,
        edges,
        clusterMeta: new Map<string, ClusterNodeMeta>(),
      };
    }

    return applyRelationshipClustering({
      centerNodeId,
      nodes,
      edges,
      runtime,
      expandedClusters,
    });
  }, [centerNodeId, edges, enabled, expandedClusters, nodes, runtime]);

  useEffect(() => {
    if (controlledExpanded !== undefined) {
      return;
    }
    setInternalExpanded(new Set());
    setExpandedClusterLabels(new Map());
  }, [centerNodeId, controlledExpanded]);

  return {
    ...clustered,
    expandedClusters,
    expandedClusterLabels,
    onClusterExpand,
    onClusterCollapse,
  };
}
