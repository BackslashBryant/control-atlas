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
  plain_language_summary?: string;
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

export type AtlasDrilldownModel = {
  baselines: AtlasBaselineChoice[];
  rmfSteps: AtlasRmfStepChoice[];
};

function toChoice(node: AtlasDrillNode): AtlasRecordChoice {
  const itemId = node.metadata?.item_id || node.id;
  return {
    id: node.id,
    itemId,
    label: node.metadata?.title || node.label || itemId,
    description:
      node.plain_language_summary ||
      node.metadata?.description ||
      "No public summary is available for this record.",
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
      new Set(
        publishedEdges
          .filter(
            (edge) =>
              edge.relationship_type === "includes" &&
              edge.source_node_id === family.id,
          )
          .map((edge) => edge.target_node_id),
      ),
    ]),
  );

  const baselines = NIST_BASELINE_IDS.map((baselineId) => {
    const baseline = nodesById.get(baselineId);
    if (!baseline) return null;
    const selectedIds = new Set(
      publishedEdges
        .filter(
          (edge) =>
            edge.relationship_type === "includes" &&
            edge.source_node_id === baselineId,
        )
        .map((edge) => edge.target_node_id),
    );
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
    const results = publishedEdges
      .filter(
        (edge) =>
          edge.source_node_id === stepId || edge.target_node_id === stepId,
      )
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

  return { baselines, rmfSteps };
}
