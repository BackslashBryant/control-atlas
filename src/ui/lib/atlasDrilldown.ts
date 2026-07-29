export const NIST_FRAMEWORK_ID = "nist-800-53";
export const NIST_FRAMEWORK_LABEL = "NIST SP 800-53";
export const NIST_BASELINE_IDS = [
  "nist-800-53b:LOW",
  "nist-800-53b:MODERATE",
  "nist-800-53b:HIGH",
] as const;
export const RMF_STEP_IDS = [
  "nist-800-37:RMF-PREPARE",
  "nist-800-37:RMF-CATEGORIZE",
  "nist-800-37:RMF-SELECT",
  "nist-800-37:RMF-IMPLEMENT",
  "nist-800-37:RMF-ASSESS",
  "nist-800-37:RMF-AUTHORIZE",
  "nist-800-37:RMF-MONITOR",
] as const;

export type AtlasDrillNode = {
  id: string;
  node_type?: string;
  label?: string;
  metadata?: {
    catalog_id?: string;
    item_id?: string;
    title?: string;
    description?: string;
  };
};

export type AtlasDrillEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  relationship_class: string;
  publication_status: string;
};

export type AtlasRecordChoice = {
  id: string;
  itemId: string;
  label: string;
  description: string;
  nodeType: string;
};

export type AtlasFamilyChoice = AtlasRecordChoice & {
  records: AtlasRecordChoice[];
};

export type AtlasBaselineChoice = AtlasRecordChoice & {
  families: AtlasFamilyChoice[];
  recordCount: number;
};

export type AtlasRmfResult = AtlasRecordChoice & {
  relationshipType: string;
};

export type AtlasRmfStepChoice = AtlasRecordChoice & {
  results: AtlasRmfResult[];
};

export type AtlasFrameworkChoice = AtlasRecordChoice & {
  groupId: string;
  units: AtlasFamilyChoice[];
};

export type AtlasFrameworkGroup = {
  id: string;
  label: string;
  description: string;
  frameworks: AtlasFrameworkChoice[];
};

export type AtlasDrilldownModel = {
  baselines: AtlasBaselineChoice[];
  rmfSteps: AtlasRmfStepChoice[];
  frameworkGroups: AtlasFrameworkGroup[];
};

const SUPPORTED_FRAMEWORKS = [
  {
    id: "nist-800-53",
    rootId: "nist-800-53:CATALOG",
    groupId: "control-catalog",
    groupLabel: "Control catalog",
    groupDescription: "Families, controls, and enhancements.",
  },
  {
    id: "csf-2",
    rootId: "csf-2:CATALOG",
    groupId: "outcome-framework",
    groupLabel: "Outcome framework",
    groupDescription: "Functions, categories, and subcategories.",
  },
  {
    id: "cmmc-2",
    rootId: "cmmc-2:CATALOG",
    groupId: "certification-program",
    groupLabel: "Certification program",
    groupDescription: "Program levels and their published requirements.",
  },
  {
    id: "mitre-attack",
    rootId: "mitre-attack:CATALOG",
    groupId: "threat-knowledge",
    groupLabel: "Threat knowledge",
    groupDescription: "Tactics, techniques, and sub-techniques.",
  },
] as const;

function toChoice(node: AtlasDrillNode): AtlasRecordChoice {
  const itemId = node.metadata?.item_id || node.id;
  return {
    id: node.id,
    itemId,
    label: node.metadata?.title || node.label || itemId,
    description:
      node.metadata?.description ||
      "No narrative description was published for this record.",
    nodeType: node.node_type || "",
  };
}

function counterpartId(edge: AtlasDrillEdge, nodeId: string) {
  return edge.source_node_id === nodeId
    ? edge.target_node_id
    : edge.source_node_id;
}

function byItemId(left: AtlasRecordChoice, right: AtlasRecordChoice) {
  return left.itemId.localeCompare(right.itemId, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function buildAtlasDrilldownModel(dataset: {
  nodes: AtlasDrillNode[];
  edges: AtlasDrillEdge[];
}): AtlasDrilldownModel {
  const nodesById = new Map(dataset.nodes.map((node) => [node.id, node]));
  const publishedEdges = dataset.edges.filter(
    (edge) => edge.publication_status === "published",
  );
  const structuralChildrenByParent = new Map<string, string[]>();
  const selectedIdsByBaseline = new Map<string, string[]>();
  const incidentEdgesByNode = new Map<string, AtlasDrillEdge[]>();
  for (const edge of publishedEdges) {
    for (const nodeId of [edge.source_node_id, edge.target_node_id]) {
      const incident = incidentEdgesByNode.get(nodeId) || [];
      incident.push(edge);
      incidentEdgesByNode.set(nodeId, incident);
    }
    if (
      edge.relationship_class === "structural" &&
      edge.relationship_type === "contains"
    ) {
      const children = structuralChildrenByParent.get(edge.source_node_id) || [];
      children.push(edge.target_node_id);
      structuralChildrenByParent.set(edge.source_node_id, children);
    }
    if (
      edge.relationship_class === "applicability" &&
      edge.relationship_type === "selects"
    ) {
      const selected = selectedIdsByBaseline.get(edge.source_node_id) || [];
      selected.push(edge.target_node_id);
      selectedIdsByBaseline.set(edge.source_node_id, selected);
    }
  }
  const frameworkGroups = SUPPORTED_FRAMEWORKS.map((supported) => {
    const root = nodesById.get(supported.rootId);
    if (!root) return null;
    const units = (structuralChildrenByParent.get(supported.rootId) || [])
      .map((nodeId) => nodesById.get(nodeId))
      .filter((node): node is AtlasDrillNode => Boolean(node))
      .map((unit) => ({
        ...toChoice(unit),
        records: (structuralChildrenByParent.get(unit.id) || [])
          .map((nodeId) => nodesById.get(nodeId))
          .filter((node): node is AtlasDrillNode => Boolean(node))
          .map(toChoice)
          .sort(byItemId),
      }))
      .sort(byItemId);
    if (!units.length) return null;
    return {
      id: supported.groupId,
      label: supported.groupLabel,
      description: supported.groupDescription,
      frameworks: [
        {
          ...toChoice(root),
          id: supported.id,
          groupId: supported.groupId,
          units,
        },
      ],
    };
  }).filter(Boolean) as AtlasFrameworkGroup[];
  const familyNodes = dataset.nodes
    .filter(
      (node) =>
        node.node_type === "family" &&
        node.metadata?.catalog_id === NIST_FRAMEWORK_ID,
    )
    .sort((left, right) =>
      (left.metadata?.item_id || left.id).localeCompare(
        right.metadata?.item_id || right.id,
      ),
    );

  const familyRecordIds = new Map(
    familyNodes.map((family) => [
      family.id,
      new Set(structuralChildrenByParent.get(family.id) || []),
    ]),
  );

  const baselines = NIST_BASELINE_IDS.map((baselineId) => {
    const baseline = nodesById.get(baselineId);
    if (!baseline) return null;
    const selectedIds = new Set(selectedIdsByBaseline.get(baselineId) || []);
    const families = familyNodes
      .map((family) => {
        const records = [...(familyRecordIds.get(family.id) || [])]
          .filter((id) => selectedIds.has(id))
          .map((id) => nodesById.get(id))
          .filter((node): node is AtlasDrillNode => Boolean(node))
          .map(toChoice)
          .sort(byItemId);
        return records.length
          ? {
              ...toChoice(family),
              records,
            }
          : null;
      })
      .filter((family): family is AtlasFamilyChoice => Boolean(family));
    return {
      ...toChoice(baseline),
      families,
      recordCount: families.reduce(
        (total, family) => total + family.records.length,
        0,
      ),
    };
  }).filter((baseline): baseline is AtlasBaselineChoice => Boolean(baseline));

  const rmfSteps = RMF_STEP_IDS.map((stepId) => {
    const step = nodesById.get(stepId);
    if (!step) return null;
    const results = (incidentEdgesByNode.get(stepId) || [])
      .map((edge) => {
        const node = nodesById.get(counterpartId(edge, stepId));
        return node
          ? {
              ...toChoice(node),
              relationshipType: edge.relationship_type,
            }
          : null;
      })
      .filter((result): result is AtlasRmfResult => Boolean(result))
      .sort(byItemId);
    return {
      ...toChoice(step),
      results,
    };
  }).filter((step): step is AtlasRmfStepChoice => Boolean(step));

  return { baselines, rmfSteps, frameworkGroups };
}
