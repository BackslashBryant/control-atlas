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

export function buildAtlasBootstrapModel(
  catalogs: Array<{ id?: string; name?: string }>,
  spine: {
    limbs: Array<{ id: string; label: string; blurb: string }>;
    catalogLimbs: Record<string, string>;
  },
): AtlasDrilldownModel {
  const catalogById = new Map(
    catalogs
      .filter((catalog): catalog is { id: string; name?: string } => Boolean(catalog.id))
      .map((catalog) => [catalog.id, catalog]),
  );
  return {
    baselines: [],
    rmfSteps: [],
    frameworkGroups: spine.limbs.map((limb) => ({
      id: limb.id,
      label: limb.label,
      description: limb.blurb,
      frameworks: Object.entries(spine.catalogLimbs)
        .filter(([, limbId]) => limbId === limb.id)
        .map(([catalogId]) => {
          const catalog = catalogById.get(catalogId);
          return {
            id: catalogId,
            itemId: catalogId,
            label: catalog?.name || catalogId,
            description: "",
            nodeType: "catalog",
            groupId: limb.id,
            units: [],
          };
        })
        .sort((left, right) => left.label.localeCompare(right.label)),
    })),
  };
}

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

// Records that belong to a catalog by membership rather than by a published
// containment edge. Grouped by their family when the publisher gives one, so
// 5,000 CCIs do not arrive as a single flat list.
function groupRecordsByFamily(records: AtlasDrillNode[]): AtlasFamilyChoice[] {
  const byFamily = new Map<string, AtlasDrillNode[]>();
  for (const record of records) {
    const family =
      (record.metadata as { family?: string } | undefined)?.family || "All records";
    const bucket = byFamily.get(family) || [];
    bucket.push(record);
    byFamily.set(family, bucket);
  }
  return [...byFamily.entries()]
    .map(([family, entries]) => ({
      id: `membership:${family}`,
      itemId: family,
      label: family,
      description: `${entries.length.toLocaleString()} records`,
      nodeType: "family",
      records: entries.map(toChoice).sort(byItemId),
    }))
    .sort(byItemId);
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
  // Class-4 organizing spine: limb -> catalog attachment. These edges are
  // publication_status "editorial" (never "published"), so index them from the
  // full edge set, not from publishedEdges.
  const organizingChildrenByParent = new Map<string, string[]>();
  for (const edge of dataset.edges) {
    if (
      edge.relationship_class === "organizing" &&
      edge.relationship_type === "organizes"
    ) {
      const children = organizingChildrenByParent.get(edge.source_node_id) || [];
      children.push(edge.target_node_id);
      organizingChildrenByParent.set(edge.source_node_id, children);
    }
  }

  const buildFramework = (
    catalogNode: AtlasDrillNode,
    limbId: string,
  ): AtlasFrameworkChoice => {
    const units = (structuralChildrenByParent.get(catalogNode.id) || [])
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
    // CCIs and assessment procedures hang beneath the control they cite or
    // assess, so their catalog root deliberately owns no structural children
    // (see attachRecords in data/curated/tree-spine.json). Browsing still has
    // to work, so group those records by catalog membership instead of leaving
    // the catalog a dead end.
    const catalogId = catalogNode.metadata?.catalog_id || catalogNode.id;
    const membershipUnits =
      units.length > 0
        ? units
        : groupRecordsByFamily(
            dataset.nodes.filter(
              (node) =>
                node.metadata?.catalog_id === catalogId &&
                node.node_type !== "catalog",
            ),
          );
    return {
      ...toChoice(catalogNode),
      id: catalogId,
      groupId: limbId,
      units: membershipUnits,
    };
  };

  // One group per limb, in trunk-declared order, empty limbs included (A.7 greys
  // them rather than hiding — docs/plans/cybersecurity-trunk-and-voice-2026-07-31 A.7).
  const trunkNode = dataset.nodes.find((node) => node.node_type === "trunk");
  const limbNodes = dataset.nodes.filter((node) => node.node_type === "limb");
  const limbById = new Map(limbNodes.map((node) => [node.id, node]));
  const trunkLimbOrder = trunkNode
    ? organizingChildrenByParent.get(trunkNode.id) || []
    : [];
  const orderedLimbIds = [
    ...trunkLimbOrder.filter((id) => limbById.has(id)),
    ...limbNodes
      .map((node) => node.id)
      .filter((id) => !trunkLimbOrder.includes(id)),
  ];
  const frameworkGroups: AtlasFrameworkGroup[] = orderedLimbIds.map((limbId) => {
    const limb = limbById.get(limbId) as AtlasDrillNode;
    const frameworks = (organizingChildrenByParent.get(limbId) || [])
      .map((id) => nodesById.get(id))
      .filter((node): node is AtlasDrillNode => Boolean(node))
      .filter((node) => node.node_type === "catalog")
      .map((catalogNode) => buildFramework(catalogNode, limbId))
      .sort((left, right) => left.label.localeCompare(right.label));
    return {
      id: limb.id,
      label: limb.metadata?.title || limb.label || limb.id,
      description: limb.metadata?.description || "",
      frameworks,
    };
  });
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
