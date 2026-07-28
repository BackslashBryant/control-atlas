import { useMemo } from "react";

import { displayNameFor } from "../../app/display-names.mjs";

export type RelationshipFilterState = {
  relationshipType: string;
  provenance: string;
  confidence: string;
  nodeType: string;
  includeCandidates: boolean;
  search: string;
};

export type NeighborhoodRuntime = {
  buildNeighborhood: (
    centerNodeId: string,
    options?: Record<string, unknown>,
  ) => {
    centerNode: unknown;
    nodes: Array<{
      id: string;
      node_type?: string;
      label?: string;
      metadata?: { item_id?: string; title?: string };
    }>;
    edges: Array<{
      id: string;
      source_node_id: string;
      target_node_id: string;
      relationship_type: string;
      provenance_class: string;
      publication_status: string;
      confidence: string;
      rationale?: string;
      navigation_note?: string;
    }>;
    stats: {
      total: number;
      filtered: number;
      truncated: boolean;
      nodeCount: number;
    };
  };
};

export function useRelationshipFilters(
  runtime: NeighborhoodRuntime,
  centerNodeId: string,
  filters: RelationshipFilterState,
) {
  const optionSource = useMemo(
    () =>
      runtime.buildNeighborhood(centerNodeId, {
        include_candidates: true,
        hops: 1,
      }),
    [runtime, centerNodeId],
  );

  const neighborhood = useMemo(
    () =>
      runtime.buildNeighborhood(centerNodeId, {
        hops: 1,
        relationship_type: filters.relationshipType || undefined,
        provenance_class: filters.provenance || undefined,
        confidence: filters.confidence || undefined,
        node_type: filters.nodeType || undefined,
        include_candidates: filters.includeCandidates,
      }),
    [runtime, centerNodeId, filters],
  );

  const filterOptions = useMemo(() => {
    const relationshipTypes = new Set<string>();
    const provenanceClasses = new Set<string>();
    const confidenceLevels = new Set<string>();
    const nodeTypes = new Set<string>();

    for (const edge of optionSource.edges) {
      relationshipTypes.add(edge.relationship_type);
      provenanceClasses.add(edge.provenance_class);
      confidenceLevels.add(edge.confidence);
    }
    for (const node of optionSource.nodes) {
      if (node.node_type) nodeTypes.add(node.node_type);
    }

    return {
      relationshipTypes: [...relationshipTypes].sort(),
      provenanceClasses: [...provenanceClasses].sort(),
      confidenceLevels: [...confidenceLevels].sort(),
      nodeTypes: [...nodeTypes].sort(),
    };
  }, [optionSource]);

  const tableRows = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return neighborhood.edges
      .map((edge) => {
        const counterpartId =
          edge.source_node_id === centerNodeId
            ? edge.target_node_id
            : edge.source_node_id;
        const counterpart = neighborhood.nodes.find(
          (node) => node.id === counterpartId,
        );
        if (!counterpart) return null;
        const itemId = counterpart.metadata?.item_id || counterpart.id;
        const title = counterpart.metadata?.title || itemId;
        if (
          needle &&
          !itemId.toLowerCase().includes(needle) &&
          !title.toLowerCase().includes(needle) &&
          !edge.rationale?.toLowerCase().includes(needle) &&
          !edge.navigation_note?.toLowerCase().includes(needle)
        ) {
          return null;
        }
        return { edge, counterpart, itemId, title };
      })
      .filter(Boolean)
      .sort((left, right) => left!.itemId.localeCompare(right!.itemId));
  }, [neighborhood, centerNodeId, filters.search]);

  const displayOptions = {
    relationshipTypes: filterOptions.relationshipTypes.map((value) => ({
      value,
      label: displayNameFor("relationship_type", value),
    })),
    provenanceClasses: filterOptions.provenanceClasses.map((value) => ({
      value,
      label: displayNameFor("provenance_class", value),
    })),
    confidenceLevels: filterOptions.confidenceLevels.map((value) => ({
      value,
      label: displayNameFor("confidence", value),
    })),
    nodeTypes: filterOptions.nodeTypes.map((value) => ({
      value,
      label: displayNameFor("object_type", value),
    })),
  };

  return {
    neighborhood,
    filterOptions: displayOptions,
    tableRows,
  };
}
