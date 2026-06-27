import { DEFAULT_MAP_WARNINGS, isVisibleWithOptionalFilters } from "./defaultMapFilter.ts";
import { buildFocusedControlRings } from "./buildFocusedControlRings.ts";
import { SOURCE_HIERARCHY_EDGES, SOURCE_HIERARCHY_NODES } from "./sourceHierarchyEdges.ts";
import { SOURCE_SEED_MANIFEST } from "./sourceSeedManifest.ts";
import { sourceToGraphRole } from "./sourceToGraphRole.ts";
import type {
  VisibleGraphEdge,
  VisibleGraphNode,
  VisibleRelationshipModel,
} from "./sourceRegistryTypes.ts";

export type SourceVisibilityFilters = {
  showSupportingReferences: boolean;
  showDraftOrLegacy: boolean;
  showRegistryOnly: boolean;
};

const DEFAULT_FILTERS: SourceVisibilityFilters = {
  showSupportingReferences: false,
  showDraftOrLegacy: false,
  showRegistryOnly: false,
};

function hierarchyNode(
  hierarchyTier: string,
  displayName: string,
  graphRole: string,
): VisibleGraphNode {
  return {
    id: `hierarchy:${hierarchyTier}`,
    label: displayName,
    node_type: "source-category",
    graphRole,
    metadata: {
      item_id: displayName,
      title: displayName,
      hierarchyTier,
    },
  };
}

function hierarchyEdge(source: string, target: string): VisibleGraphEdge {
  return {
    id: `hierarchy:${source}->${target}`,
    source_node_id: `hierarchy:${source}`,
    target_node_id: `hierarchy:${target}`,
    relationship_type: "leads_to",
    provenance_class: "official",
    publication_status: "published",
    confidence: "high",
    plain_language_rationale:
      "This category supplies context to the next layer of the compliance ecosystem.",
  };
}

export function buildSourceHierarchyModel(
  filters: SourceVisibilityFilters = DEFAULT_FILTERS,
): VisibleRelationshipModel {
  const nodes = SOURCE_HIERARCHY_NODES.map((entry) => {
    const representative = SOURCE_SEED_MANIFEST.find(
      (source) => source.hierarchyTier === entry.hierarchyTier,
    );
    return hierarchyNode(
      entry.hierarchyTier,
      entry.displayName,
      representative ? sourceToGraphRole(representative) : "other",
    );
  });
  const edges = SOURCE_HIERARCHY_EDGES.map(([source, target]) =>
    hierarchyEdge(source, target),
  );

  const optionalSources = SOURCE_SEED_MANIFEST.filter(
    (source) =>
      !source.isDefaultMapEligible &&
      isVisibleWithOptionalFilters(source, filters),
  );

  for (const source of optionalSources) {
    nodes.push({
      id: `source:${source.sourceId}`,
      label: source.displayName,
      node_type: "source",
      graphRole: sourceToGraphRole(source),
      parent: `hierarchy:${source.hierarchyTier}`,
      metadata: {
        item_id: source.displayName,
        title: source.displayName,
        hierarchyTier: source.hierarchyTier,
        description:
          source.disposition === "draft-gated"
            ? DEFAULT_MAP_WARNINGS.draftOrLegacy
            : source.disposition === "supporting-reference-only"
              ? DEFAULT_MAP_WARNINGS.supportingReferences
              : DEFAULT_MAP_WARNINGS.registryOnly,
      },
    });
    // We remove the explicit edge because the compound node relationship naturally shows the hierarchy
    // without cluttering the graph with lines.
  }

  return {
    centerNodeId: "hierarchy:control-catalog-requirement-set",
    layoutMode: optionalSources.length > 0 ? "expanded" : "hierarchy",
    nodes,
    edges,
    stats: { total: edges.length, filtered: edges.length },
  };
}

export function buildVisibleRelationshipModel(options: {
  nodeId: string;
  filters?: SourceVisibilityFilters;
}): VisibleRelationshipModel {
  if (
    options.nodeId === "AC-2" ||
    options.nodeId === "nist-800-53:AC-2"
  ) {
    return buildFocusedControlRings(options.nodeId);
  }
  return buildSourceHierarchyModel(options.filters);
}
