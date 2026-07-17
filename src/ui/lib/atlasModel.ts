import { groupRelationships } from "../../app/relationship-groups.mjs";
import type {
  AtlasNeighborhoodEdge,
  AtlasNeighborhoodNode,
  AtlasNeighborhoodRecord,
} from "./runtimeLoader";

export type AtlasFilterState = {
  relationshipType: string;
  provenance: string;
  confidence: string;
  nodeType: string;
  includeCandidates: boolean;
  search: string;
};

export type AtlasRelationshipRow = {
  edge: AtlasNeighborhoodEdge;
  counterpart: AtlasNeighborhoodNode;
  itemId: string;
  title: string;
};

export type AtlasConnectionGroup = {
  id: string;
  label: string;
  description: string;
  placement: "upstream" | "lateral" | "downstream";
  stage: AtlasPathStageId;
  items: AtlasRelationshipRow[];
};

export type AtlasPathStageId =
  | "understand"
  | "decide"
  | "implement"
  | "evidence"
  | "assess"
  | "monitor";

export const ATLAS_PATH_STAGES: Array<{
  id: AtlasPathStageId;
  label: string;
  description: string;
}> = [
  {
    id: "understand",
    label: "Understand",
    description: "See the control, its family, and the requirements around it.",
  },
  {
    id: "decide",
    label: "Decide",
    description: "Use baselines and published mappings to determine what applies.",
  },
  {
    id: "implement",
    label: "Implement",
    description: "Follow implementation standards, enhancements, and technical references.",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Identify what should demonstrate that the requirement is in place.",
  },
  {
    id: "assess",
    label: "Assess",
    description: "Use published assessment procedures and scoping references.",
  },
  {
    id: "monitor",
    label: "Monitor",
    description: "Track related threats, defenses, and changing context.",
  },
];

const GROUP_META: Record<
  string,
  { placement: AtlasConnectionGroup["placement"]; stage: AtlasPathStageId; rank: number }
> = {
  baseControl: { placement: "upstream", stage: "understand", rank: 0 },
  nistBaseline: { placement: "upstream", stage: "decide", rank: 1 },
  fedrampBaseline: { placement: "upstream", stage: "decide", rank: 2 },
  csf: { placement: "lateral", stage: "decide", rank: 3 },
  sp171: { placement: "lateral", stage: "decide", rank: 4 },
  nistControl: { placement: "lateral", stage: "understand", rank: 5 },
  enhancements: { placement: "downstream", stage: "implement", rank: 6 },
  disa: { placement: "downstream", stage: "implement", rank: 7 },
  stig: { placement: "downstream", stage: "implement", rank: 8 },
  assessment: { placement: "downstream", stage: "assess", rank: 9 },
  mitre: { placement: "downstream", stage: "monitor", rank: 10 },
  other: { placement: "lateral", stage: "understand", rank: 11 },
};

function counterpartFor(
  record: AtlasNeighborhoodRecord,
  edge: AtlasNeighborhoodEdge,
) {
  const counterpartId =
    edge.source_node_id === record.center_node.id
      ? edge.target_node_id
      : edge.source_node_id;
  return record.nodes.find((node) => node.id === counterpartId) || null;
}

export function filterAtlasEdges(
  record: AtlasNeighborhoodRecord,
  filters: AtlasFilterState,
) {
  const needle = filters.search.trim().toLowerCase();
  return record.edges.filter((edge) => {
    if (!filters.includeCandidates && edge.publication_status !== "published") {
      return false;
    }
    if (
      filters.relationshipType &&
      edge.relationship_type !== filters.relationshipType
    ) {
      return false;
    }
    if (filters.provenance && edge.provenance_class !== filters.provenance) {
      return false;
    }
    if (filters.confidence && edge.confidence !== filters.confidence) {
      return false;
    }
    const counterpart = counterpartFor(record, edge);
    if (filters.nodeType && counterpart?.node_type !== filters.nodeType) {
      return false;
    }
    if (!needle) return true;
    const itemId = counterpart?.metadata?.item_id || counterpart?.id || "";
    const title = counterpart?.metadata?.title || counterpart?.label || "";
    return [itemId, title, edge.plain_language_rationale || ""]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
}

export function buildAtlasRows(
  record: AtlasNeighborhoodRecord,
  filters: AtlasFilterState,
): AtlasRelationshipRow[] {
  return filterAtlasEdges(record, filters)
    .map((edge) => {
      const counterpart = counterpartFor(record, edge);
      if (!counterpart) return null;
      return {
        edge,
        counterpart,
        itemId: counterpart.metadata?.item_id || counterpart.id,
        title:
          counterpart.metadata?.title ||
          counterpart.label ||
          counterpart.metadata?.item_id ||
          counterpart.id,
      };
    })
    .filter((row): row is AtlasRelationshipRow => Boolean(row))
    .sort((left, right) => left.itemId.localeCompare(right.itemId));
}

export function buildAtlasGroups(
  record: AtlasNeighborhoodRecord,
  filters: AtlasFilterState,
): AtlasConnectionGroup[] {
  const nodeById = new Map(record.nodes.map((node) => [node.id, node]));
  const runtime = { getNode: (nodeId: string) => nodeById.get(nodeId) || null };
  const edges = filterAtlasEdges(record, filters);
  const groups = groupRelationships(edges, record.center_node.id, runtime) as Array<{
    id: string;
    label: string;
    description: string;
    items: Array<{ edge: AtlasNeighborhoodEdge; counterpart: AtlasNeighborhoodNode }>;
  }>;

  return groups
    .map((group) => {
      const meta = GROUP_META[group.id] || GROUP_META.other;
      return {
        id: group.id,
        label: group.label,
        description: group.description,
        placement: meta.placement,
        stage: meta.stage,
        items: group.items
          .map(({ edge, counterpart }) => ({
            edge,
            counterpart,
            itemId: counterpart.metadata?.item_id || counterpart.id,
            title:
              counterpart.metadata?.title ||
              counterpart.label ||
              counterpart.metadata?.item_id ||
              counterpart.id,
          }))
          .sort((left, right) => left.itemId.localeCompare(right.itemId)),
      };
    })
    .sort(
      (left, right) =>
        (GROUP_META[left.id]?.rank ?? 99) -
        (GROUP_META[right.id]?.rank ?? 99),
    );
}

export function atlasFilterOptions(record: AtlasNeighborhoodRecord) {
  const relationshipTypes = new Set<string>();
  const provenanceClasses = new Set<string>();
  const confidenceLevels = new Set<string>();
  const nodeTypes = new Set<string>();

  for (const edge of record.edges) {
    relationshipTypes.add(edge.relationship_type);
    provenanceClasses.add(edge.provenance_class);
    confidenceLevels.add(edge.confidence);
    const counterpart = counterpartFor(record, edge);
    if (counterpart?.node_type) nodeTypes.add(counterpart.node_type);
  }

  return {
    relationshipTypes: [...relationshipTypes].sort(),
    provenanceClasses: [...provenanceClasses].sort(),
    confidenceLevels: [...confidenceLevels].sort(),
    nodeTypes: [...nodeTypes].sort(),
  };
}

export function selectAtlasOverviewGroups(
  groups: AtlasConnectionGroup[],
  limit = 6,
) {
  if (groups.length <= limit) return groups;
  const selected: AtlasConnectionGroup[] = [];
  for (const placement of ["upstream", "lateral", "downstream"] as const) {
    const representative = groups.find(
      (group) => group.placement === placement,
    );
    if (representative) selected.push(representative);
  }
  for (const group of groups) {
    if (selected.length >= limit) break;
    if (!selected.includes(group)) selected.push(group);
  }
  return selected;
}

export function resolveAtlasPathStage(
  groups: AtlasConnectionGroup[],
  requestedStage: string,
): AtlasPathStageId {
  if (
    ATLAS_PATH_STAGES.some((stage) => stage.id === requestedStage)
  ) {
    return requestedStage as AtlasPathStageId;
  }
  return (
    ATLAS_PATH_STAGES.find((stage) =>
      groups.some((group) => group.stage === stage.id && group.items.length > 0),
    )?.id || "understand"
  );
}
