export type GraphNode = {
  id: string;
  label: string;
  itemId: string;
  nodeType: string;
  isCenter?: boolean;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
};

export type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
  id: string;
  relationshipType: string;
  provenanceClass: string;
  publicationStatus: string;
  confidence: string;
  plainLanguageRationale: string;
};

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

const PROVENANCE_COLORS: Record<string, string> = {
  mandated: "#2563EB",
  federal_published: "#22D3EE",
  federal_program: "#0D9488",
  federal_referenced: "#64748B",
  inferred: "#F59E0B",
  deprecated: "#DC2626",
};

export function provenanceColor(provenanceClass: string): string {
  return PROVENANCE_COLORS[provenanceClass] || "#64748B";
}

export function provenanceCssVar(provenanceClass: string): string {
  const map: Record<string, string> = {
    mandated: "var(--ca-provenance-official)",
    federal_published: "var(--ca-provenance-nist)",
    federal_program: "var(--ca-provenance-fedramp)",
    federal_referenced: "var(--ca-provenance-community)",
    inferred: "var(--ca-provenance-inferred)",
    deprecated: "var(--ca-provenance-deprecated)",
  };
  return map[provenanceClass] || "var(--ca-provenance-community)";
}

export function linkDashPattern(
  provenanceClass: string,
  publicationStatus: string,
): number[] | undefined {
  if (publicationStatus === "candidate" || provenanceClass === "inferred") {
    return [4, 4];
  }
  if (provenanceClass === "deprecated") {
    return [2, 3];
  }
  return undefined;
}

export function nodeColor(
  node: GraphNode,
  selectedId: string | null,
  highlightIds: Set<string>,
): string {
  if (node.id === selectedId) return "#22D3EE";
  if (node.isCenter) return "#2563EB";
  if (highlightIds.size && !highlightIds.has(node.id))
    return "rgba(148, 163, 184, 0.35)";
  return "#F8FAFC";
}

export function buildGraphData(
  nodes: Array<{
    id: string;
    node_type?: string;
    label?: string;
    metadata?: { item_id?: string; title?: string };
  }>,
  edges: Array<{
    id: string;
    source_node_id: string;
    target_node_id: string;
    relationship_type: string;
    provenance_class: string;
    publication_status: string;
    confidence: string;
    plain_language_rationale?: string;
  }>,
  centerNodeId: string,
): GraphData {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.metadata?.title || node.label || node.id,
      itemId: node.metadata?.item_id || node.id,
      nodeType: node.node_type || "",
      isCenter: node.id === centerNodeId,
    })),
    links: edges.map((edge) => ({
      id: edge.id,
      source: edge.source_node_id,
      target: edge.target_node_id,
      relationshipType: edge.relationship_type,
      provenanceClass: edge.provenance_class,
      publicationStatus: edge.publication_status,
      confidence: edge.confidence,
      plainLanguageRationale: edge.plain_language_rationale || "",
    })),
  };
}

export const PROVENANCE_LEGEND = [
  { key: "mandated", label: "Mandated", pattern: "solid" },
  { key: "federal_published", label: "Federal published", pattern: "solid" },
  { key: "federal_program", label: "Federal program", pattern: "solid" },
  { key: "inferred", label: "Inferred link", pattern: "dashed" },
  { key: "deprecated", label: "Deprecated", pattern: "dotted" },
] as const;
