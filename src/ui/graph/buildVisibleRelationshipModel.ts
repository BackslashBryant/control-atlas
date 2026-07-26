import { DEFAULT_MAP_WARNINGS, isVisibleWithOptionalFilters } from "./defaultMapFilter.ts";
import { SOURCE_SEED_MANIFEST } from "./sourceSeedManifest.ts";
import { sourceToGraphRole } from "./sourceToGraphRole.ts";
import {
  SOURCE_VIEW_DEFINITIONS,
  normalizeSourceViewId,
  sourceViewGroup,
  sourceViewGroupsFor,
  type SourceViewGroup,
  type SourceViewId,
} from "./sourceViews.ts";
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

function sourcesInViewGroup(
  sourceView: SourceViewId,
  groupId: string,
  filters: SourceVisibilityFilters,
) {
  return SOURCE_SEED_MANIFEST.filter(
    (source) =>
      sourceViewGroupsFor(source, sourceView).includes(groupId) &&
      isVisibleWithOptionalFilters(source, filters),
  );
}

function viewGroupNode(
  sourceView: SourceViewId,
  group: SourceViewGroup,
  filters: SourceVisibilityFilters,
): VisibleGraphNode {
  const count = sourcesInViewGroup(sourceView, group.id, filters).length;
  return {
    id: `hierarchy:${group.id}`,
    label: group.label,
    node_type: "source-category",
    graphRole: group.graphRole,
    metadata: {
      item_id: group.label,
      title: `${count} source${count === 1 ? "" : "s"} inside — select to open`,
      hierarchyTier: sourceView === "purpose" ? group.id : undefined,
      childCount: count,
      description: group.description,
      sourceView,
      sourceViewGroup: group.id,
    },
  };
}

function sourceNode(
  source: (typeof SOURCE_SEED_MANIFEST)[number],
): VisibleGraphNode {
  return {
    id: `source:${source.sourceId}`,
    label: source.displayName,
    node_type: "source",
    graphRole: sourceToGraphRole(source),
    metadata: {
      item_id: source.displayName,
      title: `${source.publisher} · ${source.subcategory}`,
      hierarchyTier: source.hierarchyTier,
      description: source.plainSummary || source.defaultMapReason,
    },
  };
}

function viewSequenceEdge(
  sourceView: SourceViewId,
  source: SourceViewGroup,
  target: SourceViewGroup,
): VisibleGraphEdge {
  return {
    id: `hierarchy:${sourceView}:${source.id}->${target.id}`,
    source_node_id: `hierarchy:${source.id}`,
    target_node_id: `hierarchy:${target.id}`,
    relationship_type: "leads_to",
    provenance_class: "curated_navigation",
    publication_status: "projection",
    confidence: "high",
    plain_language_rationale: `This guided view moves from ${source.label} to ${target.label}.`,
  };
}

export function buildSourceViewModel(
  sourceView: SourceViewId = "novice",
  filters: SourceVisibilityFilters = DEFAULT_FILTERS,
): VisibleRelationshipModel {
  const definition = SOURCE_VIEW_DEFINITIONS[sourceView];
  const nodes = definition.groups.map((group) =>
    viewGroupNode(sourceView, group, filters),
  );
  const edges = definition.groups.slice(0, -1).map((group, index) =>
    viewSequenceEdge(sourceView, group, definition.groups[index + 1]),
  );

  const optionalSources = SOURCE_SEED_MANIFEST.filter(
    (source) =>
      !source.isDefaultMapEligible &&
      isVisibleWithOptionalFilters(source, filters),
  );

  for (const source of optionalSources) {
    const parentGroup = sourceViewGroupsFor(source, sourceView)[0];
    if (!parentGroup) continue;
    const optionalNode = sourceNode(source);
    nodes.push({
      ...optionalNode,
      parent: `hierarchy:${parentGroup}`,
      metadata: {
        ...optionalNode.metadata,
        description:
          source.disposition === "draft-gated"
            ? DEFAULT_MAP_WARNINGS.draftOrLegacy
            : source.disposition === "supporting-reference-only"
              ? DEFAULT_MAP_WARNINGS.supportingReferences
              : DEFAULT_MAP_WARNINGS.registryOnly,
      },
    });
  }

  const centerGroup = definition.groups[Math.min(2, definition.groups.length - 1)];
  return {
    centerNodeId: `hierarchy:${centerGroup.id}`,
    layoutMode: optionalSources.length > 0 ? "expanded" : "hierarchy",
    nodes,
    edges,
    stats: { total: edges.length, filtered: edges.length },
  };
}

/** The canonical purpose hierarchy retained for callers and old deep links. */
export function buildSourceHierarchyModel(
  filters: SourceVisibilityFilters = DEFAULT_FILTERS,
): VisibleRelationshipModel {
  return buildSourceViewModel("purpose", filters);
}

/**
 * Drill-down view for one group in the active lens. The group sits at the
 * center and its source records fan out below it.
 */
export function buildTierDrillModel(
  groupId: string,
  filters: SourceVisibilityFilters = DEFAULT_FILTERS,
  sourceView: SourceViewId = "purpose",
): VisibleRelationshipModel {
  const group = sourceViewGroup(sourceView, groupId);
  if (!group) {
    return buildSourceViewModel(sourceView, filters);
  }

  const members = sourcesInViewGroup(sourceView, groupId, filters);
  const center = viewGroupNode(sourceView, group, filters);
  const nodes = [center, ...members.map(sourceNode)];
  const edges = members.map((source) => ({
    id: `drill:${sourceView}:${groupId}->${source.sourceId}`,
    source_node_id: center.id,
    target_node_id: `source:${source.sourceId}`,
    relationship_type: "includes",
    provenance_class: "curated_navigation",
    publication_status: "projection",
    confidence: "high",
    plain_language_rationale: `${source.displayName} helps answer “${group.label}” in the ${SOURCE_VIEW_DEFINITIONS[sourceView].label.toLowerCase()} view.`,
  }));

  return {
    centerNodeId: center.id,
    layoutMode: "drill",
    nodes,
    edges,
    stats: { total: edges.length, filtered: edges.length },
  };
}

export function buildVisibleRelationshipModel(options: {
  nodeId: string;
  filters?: SourceVisibilityFilters;
  sourceView?: SourceViewId | string;
}): VisibleRelationshipModel {
  const requestedView = normalizeSourceViewId(options.sourceView);
  if (options.nodeId.startsWith("hierarchy:")) {
    const groupId = options.nodeId.slice("hierarchy:".length);
    const sourceView = sourceViewGroup(requestedView, groupId)
      ? requestedView
      : sourceViewGroup("purpose", groupId)
        ? "purpose"
        : requestedView;
    return buildTierDrillModel(groupId, options.filters, sourceView);
  }

  return buildSourceViewModel(requestedView, options.filters);
}
