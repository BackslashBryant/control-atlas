const CATEGORY_GROUPS = [
  {
    id: "requirements",
    label: "Requirements",
    nodeTypes: ["requirement", "srg_requirement"],
  },
  {
    id: "controls",
    label: "Controls",
    nodeTypes: ["control", "control_enhancement"],
  },
  {
    id: "assessment-checks",
    label: "Assessment checks",
    nodeTypes: ["assessment_procedure", "stig_rule"],
  },
  {
    id: "threats-defenses",
    label: "Threats and defenses",
    nodeTypes: ["attack_technique", "defend_countermeasure"],
  },
  {
    id: "zero-trust",
    label: "Zero Trust",
    nodeTypes: [
      "zt_activity",
      "zt_capability",
      "zt_document",
      "zt_overlay_section",
      "zt_pillar",
      "zt_tenet",
    ],
  },
  {
    id: "baselines-impact",
    label: "Baselines and impact levels",
    nodeTypes: ["baseline", "impact_category"],
  },
  {
    id: "framework-structure",
    label: "Framework structure",
    nodeTypes: [
      "benchmark",
      "catalog",
      "family",
      "policy",
      "program",
      "rmf_step",
    ],
  },
];

export function buildConnectionInventory(nodes, edges) {
  const categoryByNodeType = new Map();
  const categoryById = new Map();
  const categoryByNodeId = new Map();

  const inventory = CATEGORY_GROUPS.map((group) => {
    const entry = {
      id: group.id,
      label: group.label,
      totalRecords: 0,
      connectedRecords: new Set(),
      publishedLinks: 0,
      relatedCategoryIds: new Set(),
    };
    categoryById.set(group.id, entry);
    for (const nodeType of group.nodeTypes) {
      categoryByNodeType.set(nodeType, group.id);
    }
    return entry;
  });

  for (const node of nodes) {
    const categoryId = categoryByNodeType.get(node.node_type);
    const category = categoryById.get(categoryId);
    if (!category) continue;
    category.totalRecords += 1;
    categoryByNodeId.set(node.id, categoryId);
  }

  const publishedEdges = edges.filter(
    (edge) => edge.publication_status === "published",
  );
  for (const edge of publishedEdges) {
    const sourceCategoryId = categoryByNodeId.get(edge.source_node_id);
    const targetCategoryId = categoryByNodeId.get(edge.target_node_id);
    const sourceCategory = categoryById.get(sourceCategoryId);
    const targetCategory = categoryById.get(targetCategoryId);

    if (sourceCategory) {
      sourceCategory.connectedRecords.add(edge.source_node_id);
      sourceCategory.publishedLinks += 1;
      if (targetCategoryId && targetCategoryId !== sourceCategoryId) {
        sourceCategory.relatedCategoryIds.add(targetCategoryId);
      }
    }
    if (targetCategory) {
      targetCategory.connectedRecords.add(edge.target_node_id);
      if (targetCategoryId !== sourceCategoryId) targetCategory.publishedLinks += 1;
      if (sourceCategoryId && sourceCategoryId !== targetCategoryId) {
        targetCategory.relatedCategoryIds.add(sourceCategoryId);
      }
    }
  }

  const rows = inventory
    .filter((entry) => entry.totalRecords > 0)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      totalRecords: entry.totalRecords,
      connectedRecords: entry.connectedRecords.size,
      publishedLinks: entry.publishedLinks,
      relatedCategories: [...entry.relatedCategoryIds]
        .map((id) => categoryById.get(id)?.label)
        .filter(Boolean)
        .sort(),
    }));

  return {
    totalRecords: rows.reduce((sum, entry) => sum + entry.totalRecords, 0),
    publishedLinks: publishedEdges.length,
    rows,
  };
}
