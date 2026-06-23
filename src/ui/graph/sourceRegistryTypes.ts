export type {
  SourceHierarchyTier,
  SourceManifestRecord,
  SourceMapDisposition,
} from "./sourceManifest.ts";

export type VisibleGraphNode = {
  id: string;
  label: string;
  node_type: string;
  graphRole: string;
  metadata: {
    item_id: string;
    title: string;
    hierarchyTier?: string;
    description?: string;
    childCount?: number;
  };
};

export type VisibleGraphEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  provenance_class: string;
  publication_status: string;
  confidence: string;
  plain_language_rationale: string;
};

export type VisibleRelationshipModel = {
  centerNodeId: string;
  layoutEngine: "dagre" | "concentric" | "fcose";
  nodes: VisibleGraphNode[];
  edges: VisibleGraphEdge[];
  stats: {
    total: number;
    filtered: number;
  };
};
