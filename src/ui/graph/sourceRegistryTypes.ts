export type {
  RmfLifecycleStep,
  SourceHierarchyTier,
  SourceManifestRecord,
  SourceMapDisposition,
  SourceNoviceQuestion,
} from "./sourceManifest.ts";

export type VisibleGraphNode = {
  id: string;
  label: string;
  node_type: string;
  graphRole: string;
  parent?: string;
  metadata: {
    item_id: string;
    title: string;
    hierarchyTier?: string;
    description?: string;
    childCount?: number;
    sourceView?: string;
    sourceViewGroup?: string;
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

export type RelationshipLayoutMode =
  | "hierarchy"
  | "focus"
  | "drill"
  | "expanded";

export type VisibleRelationshipModel = {
  centerNodeId: string;
  layoutMode: RelationshipLayoutMode;
  nodes: VisibleGraphNode[];
  edges: VisibleGraphEdge[];
  stats: {
    total: number;
    filtered: number;
  };
};
