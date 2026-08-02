import type { CompareCrosswalk } from "./viewState";

export type CompareRole = "shared" | "uniqueA" | "uniqueB" | "neutral";

export type CompareGraphNode = {
  id: string;
  node_type?: string;
  label?: string;
  metadata?: { item_id?: string; title?: string };
  compareRole?: CompareRole;
};

export type CompareGraphEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  provenance_class: string;
  publication_status: string;
  confidence: string;
  rationale?: string;
  navigation_note?: string;
};

export type CompareSummaryCounts = {
  shared: number;
  uniqueA: number;
  uniqueB: number;
  sourceBacked: number;
  inferred: number;
  deprecated: number;
};

export type CompareGraphLabels = {
  shared: string;
  uniqueA: string;
  uniqueB: string;
};

export type CompareGraphResult = {
  mapAvailable: boolean;
  nodes: CompareGraphNode[];
  edges: CompareGraphEdge[];
  centerNodeId: string;
  atlasMapNode: string;
  summary: CompareSummaryCounts;
  labels: CompareGraphLabels;
  stats: { nodeCount: number; filtered: number; truncated: boolean };
};


type ProvenanceItem = {
  provenance_class?: string;
  publication_status?: string;
  confidence?: string;
};

export function summarizeProvenance(items: ProvenanceItem[]): Pick<
  CompareSummaryCounts,
  "sourceBacked" | "inferred" | "deprecated"
> {
  let sourceBacked = 0;
  let inferred = 0;
  let deprecated = 0;
  for (const item of items) {
    if (item.provenance_class === "deprecated") {
      deprecated += 1;
    } else if (
      item.publication_status === "candidate" ||
      item.confidence === "inferred"
    ) {
      inferred += 1;
    } else {
      sourceBacked += 1;
    }
  }
  return { sourceBacked, inferred, deprecated };
}

export function getCompareLegendLabels(
  crosswalk: CompareCrosswalk,
): CompareGraphLabels {
  switch (crosswalk) {
    case "relationships":
      return {
        shared: "Shared mappings",
        uniqueA: "Only in Framework A",
        uniqueB: "Only in Framework B",
      };
    case "baseline-compare":
      return {
        shared: "Shared baseline controls",
        uniqueA: "Only in Baseline A",
        uniqueB: "Only in Baseline B",
      };
    case "stig-chain":
      return {
        shared: "Shared controls",
        uniqueA: "Only in STIG/SRG chain",
        uniqueB: "Only in selected control set",
      };
    case "threat-chain":
      return {
        shared: "Shared countermeasure/control relationships",
        uniqueA: "Only in threat chain",
        uniqueB: "Only in selected control set",
      };
    default:
      return {
        shared: "Shared",
        uniqueA: "Only in A",
        uniqueB: "Only in B",
      };
  }
}

function nodeFromRuntime(node: any, compareRole: CompareRole): CompareGraphNode {
  return {
    id: node.id,
    node_type: node.node_type,
    label: node.label,
    metadata: node.metadata,
    compareRole,
  };
}

function edgeFromRuntime(edge: any, id?: string): CompareGraphEdge {
  return {
    id: id || edge.id,
    source_node_id: edge.source_node_id,
    target_node_id: edge.target_node_id,
    relationship_type: edge.relationship_type,
    provenance_class: edge.provenance_class,
    publication_status: edge.publication_status,
    confidence: edge.confidence,
    rationale: edge.rationale || "",
    navigation_note: edge.navigation_note || "",
  };
}

function emptyResult(
  crosswalk: CompareCrosswalk,
  mapAvailable = false,
): CompareGraphResult {
  return {
    mapAvailable,
    nodes: [],
    edges: [],
    centerNodeId: "",
    atlasMapNode: "",
    summary: {
      shared: 0,
      uniqueA: 0,
      uniqueB: 0,
      sourceBacked: 0,
      inferred: 0,
      deprecated: 0,
    },
    labels: getCompareLegendLabels(crosswalk),
    stats: { nodeCount: 0, filtered: 0, truncated: false },
  };
}

function finalizeGraph(
  crosswalk: CompareCrosswalk,
  nodes: Map<string, CompareGraphNode>,
  edges: CompareGraphEdge[],
  centerNodeId: string,
  atlasMapNode: string,
  roleCounts: Pick<CompareSummaryCounts, "shared" | "uniqueA" | "uniqueB">,
): CompareGraphResult {
  // The grouped-summary map renders category rollups (never every node at
  // once), so no node cap is needed; the List remains the full deep view.
  const nodeList = [...nodes.values()];
  const provenance = summarizeProvenance(edges);
  return {
    mapAvailable: nodeList.length > 0,
    nodes: nodeList,
    edges,
    centerNodeId: centerNodeId || nodeList[0]?.id || "",
    atlasMapNode,
    summary: { ...roleCounts, ...provenance },
    labels: getCompareLegendLabels(crosswalk),
    stats: {
      nodeCount: nodeList.length,
      filtered: nodeList.length,
      truncated: false,
    },
  };
}

function addNode(
  nodes: Map<string, CompareGraphNode>,
  node: any,
  role: CompareRole,
) {
  if (!node?.id) return;
  const existing = nodes.get(node.id);
  if (!existing || role === "shared") {
    nodes.set(node.id, nodeFromRuntime(node, role));
  }
}

function buildRelationshipCompareGraph(
  rows: any[],
  sourceCatalog: string,
  targetCatalog: string,
): CompareGraphResult {
  if (!rows.length || !sourceCatalog || !targetCatalog) {
    return emptyResult("relationships");
  }

  const nodes = new Map<string, CompareGraphNode>();
  const edges: CompareGraphEdge[] = [];
  const fromIds = new Set<string>();
  const toIds = new Set<string>();

  for (const row of rows) {
    fromIds.add(row.from_id);
    toIds.add(row.to_id);
    edges.push({
      id: row.edge_id || `${row.from_id}-${row.to_id}`,
      source_node_id: row.from_id,
      target_node_id: row.to_id,
      relationship_type: row.relationship_type,
      provenance_class: row.provenance_class,
      publication_status: row.publication_status,
      confidence: row.confidence,
      rationale: row.rationale,
      navigation_note: row.navigation_note,
    });
  }

  const sharedIds = new Set([...fromIds].filter((id) => toIds.has(id)));
  let uniqueA = 0;
  let uniqueB = 0;
  let shared = 0;

  for (const id of fromIds) {
    const role: CompareRole = sharedIds.has(id)
      ? "shared"
      : rowCatalogSide(rows, id) === "a"
        ? "uniqueA"
        : "neutral";
    if (role === "shared") shared += 1;
    else if (role === "uniqueA") uniqueA += 1;
    addNode(
      nodes,
      {
        id,
        node_type: "control",
        label: id,
        metadata: { item_id: rows.find((r) => r.from_id === id)?.from_item_id },
      },
      role,
    );
  }

  for (const id of toIds) {
    if (nodes.has(id)) continue;
    const role: CompareRole = sharedIds.has(id) ? "shared" : "uniqueB";
    if (role === "uniqueB") uniqueB += 1;
    addNode(
      nodes,
      {
        id,
        node_type: "control",
        label: id,
        metadata: { item_id: rows.find((r) => r.to_id === id)?.to_item_id },
      },
      role,
    );
  }

  const centerNodeId = rows[0]?.from_id || "";
  const atlasMapNode =
    rows[0]?.from_item_id || rows[0]?.to_item_id || centerNodeId;

  return finalizeGraph(
    "relationships",
    nodes,
    edges,
    centerNodeId,
    atlasMapNode,
    { shared: rows.filter((r) => r.publication_status === "published").length, uniqueA, uniqueB },
  );
}

function rowCatalogSide(rows: any[], nodeId: string): "a" | "b" | "neutral" {
  const row = rows.find((entry) => entry.from_id === nodeId || entry.to_id === nodeId);
  if (!row) return "neutral";
  if (row.from_id === nodeId) return "a";
  return "b";
}

function buildBaselineCompareGraph(comparison: any): CompareGraphResult {
  if (!comparison?.baseline_a || !comparison?.baseline_b) {
    return emptyResult("baseline-compare");
  }

  const nodes = new Map<string, CompareGraphNode>();
  const edges: CompareGraphEdge[] = [];

  for (const entry of comparison.shared) {
    addNode(nodes, entry.control_node, "shared");
  }
  for (const entry of comparison.only_a) {
    addNode(nodes, entry.control_node, "uniqueA");
  }
  for (const entry of comparison.only_b) {
    addNode(nodes, entry.control_node, "uniqueB");
  }

  edges.push({
    id: "baseline-a",
    source_node_id: comparison.baseline_a.id,
    target_node_id: comparison.baseline_b.id,
    relationship_type: "related_to",
    provenance_class: "federal_published",
    publication_status: "published",
    confidence: "direct",
    navigation_note: "Baseline comparison anchor",
  });
  addNode(nodes, comparison.baseline_a, "neutral");
  addNode(nodes, comparison.baseline_b, "neutral");

  for (const entry of comparison.shared) {
    edges.push({
      id: `shared-${entry.control_node.id}`,
      source_node_id: comparison.baseline_a.id,
      target_node_id: entry.control_node.id,
      relationship_type: "includes",
      provenance_class: "federal_published",
      publication_status: "published",
      confidence: "direct",
    });
  }

  const atlasItem =
    comparison.shared[0]?.control_node?.metadata?.item_id ||
    comparison.only_a[0]?.control_node?.metadata?.item_id ||
    comparison.baseline_a.metadata?.item_id;

  return finalizeGraph(
    "baseline-compare",
    nodes,
    edges,
    comparison.baseline_a.id,
    atlasItem || "",
    {
      shared: comparison.shared.length,
      uniqueA: comparison.only_a.length,
      uniqueB: comparison.only_b.length,
    },
  );
}

function buildChainCompareGraph(
  crosswalk: "stig-chain" | "threat-chain",
  selectedChain: any,
): CompareGraphResult {
  if (!selectedChain?.source_node) {
    return emptyResult(crosswalk);
  }

  const nodes = new Map<string, CompareGraphNode>();
  const edges: CompareGraphEdge[] = [];
  const sourceNode = selectedChain.source_node;

  addNode(nodes, sourceNode, "uniqueA");

  const intermediateKey =
    crosswalk === "stig-chain" ? "cci_entries" : "d3fend_entries";
  const mappedKey =
    crosswalk === "stig-chain" ? "nist_entries" : "nist_entries";
  const unmappedKey =
    crosswalk === "stig-chain" ? "unmapped_cci_nodes" : "unmapped_d3fend_nodes";

  for (const entry of selectedChain[intermediateKey] || []) {
    const midNode =
      crosswalk === "stig-chain" ? entry.cciNode : entry.d3fendNode;
    addNode(nodes, midNode, "neutral");
    edges.push(
      edgeFromRuntime(entry.relationshipEdge, `src-${midNode.id}`),
    );
  }

  for (const entry of selectedChain[mappedKey] || []) {
    const leafNode =
      crosswalk === "stig-chain" ? entry.nistNode : entry.nistNode;
    addNode(nodes, leafNode, "shared");
    edges.push(
      edgeFromRuntime(entry.relationshipEdge, `map-${leafNode.id}`),
    );
  }

  for (const node of selectedChain[unmappedKey] || []) {
    addNode(nodes, node, "uniqueB");
  }

  const atlasItem =
    selectedChain.nist_nodes?.[0]?.metadata?.item_id ||
    sourceNode.metadata?.item_id ||
    sourceNode.id;

  return finalizeGraph(
    crosswalk,
    nodes,
    edges,
    sourceNode.id,
    atlasItem,
    {
      shared: (selectedChain[mappedKey] || []).length,
      uniqueA: 1,
      uniqueB: (selectedChain[unmappedKey] || []).length,
    },
  );
}

export type CompareCrosswalkInput = {
  crosswalk: CompareCrosswalk;
  relationshipRows?: { rows: any[] } | null;
  sourceCatalog?: string;
  targetCatalog?: string;
  baselineComparison?: any;
  chainPayload?: { selected_chain?: any } | null;
  threatChainPayload?: { selected_chain?: any } | null;
};

export function buildCrosswalkCompareGraph(
  input: CompareCrosswalkInput,
): CompareGraphResult {
  const { crosswalk } = input;

  if (crosswalk === "relationships") {
    return buildRelationshipCompareGraph(
      input.relationshipRows?.rows || [],
      input.sourceCatalog || "",
      input.targetCatalog || "",
    );
  }

  if (crosswalk === "baseline-compare") {
    return buildBaselineCompareGraph(input.baselineComparison);
  }

  if (crosswalk === "stig-chain") {
    return buildChainCompareGraph(
      "stig-chain",
      input.chainPayload?.selected_chain,
    );
  }

  if (crosswalk === "threat-chain") {
    return buildChainCompareGraph(
      "threat-chain",
      input.threatChainPayload?.selected_chain,
    );
  }

  return emptyResult(crosswalk);
}

// The grouped map renders category rollups, so the graph itself stays
// uncapped and its counts stay complete. The List is the deep view: it is
// the one surface that puts a row in the DOM per mapping, so it stays
// bounded (unbounded tables stall assistive-technology scans). Callers
// disclose the remainder and point at export for the full set.
export const MAX_COMPARE_TABLE_ROWS = 750;

export function compareGraphTableRows(
  graph: CompareGraphResult,
): Array<{
  edge: CompareGraphEdge;
  counterpart: { id: string };
  itemId: string;
  title: string;
}> {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  return graph.edges
    .filter((edge) => edge.id !== "baseline-a")
    .slice(0, MAX_COMPARE_TABLE_ROWS)
    .map((edge) => {
      const target = nodeById.get(edge.target_node_id);
      return {
        edge,
        counterpart: { id: edge.target_node_id },
        itemId: target?.metadata?.item_id || edge.target_node_id,
        title: target?.label || target?.metadata?.title || edge.target_node_id,
      };
    });
}
