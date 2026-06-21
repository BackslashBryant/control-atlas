import type { ClusterNodeMeta } from "./graphClustering";

export type GraphNode = {
  id: string;
  label: string;
  itemId: string;
  nodeType: string;
  isCenter?: boolean;
  isCluster?: boolean;
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
  mitre_published: "#7C3AED",
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
    mitre_published: "var(--ca-provenance-mitre)",
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
  if (node.isCluster) return "#6366F1";
  if (node.id === selectedId) return "#22D3EE";
  if (node.isCenter) return "#2563EB";
  if (highlightIds.size && !highlightIds.has(node.id))
    return "rgba(148, 163, 184, 0.35)";
  if (node.nodeType === "source") return "#14B8A6";
  if (node.nodeType === "template") return "#A855F7";
  if (node.nodeType === "pattern") return "#F97316";
  return "#F8FAFC";
}

export function nodeShapeRadius(node: GraphNode): number {
  if (node.isCluster) return 10;
  if (node.isCenter) return 8;
  return 6;
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
  clusterMeta?: Map<string, ClusterNodeMeta>,
): GraphData {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.metadata?.title || node.label || node.id,
      itemId: node.metadata?.item_id || node.label || node.id,
      nodeType: node.node_type || "",
      isCenter: node.id === centerNodeId,
      isCluster: clusterMeta?.has(node.id) || node.node_type === "cluster",
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

export const ITEM_TYPE_LEGEND = [
  { key: "control", label: "Control", shape: "circle" },
  { key: "baseline", label: "Baseline", shape: "triangle" },
  { key: "cci", label: "CCI", shape: "circle" },
  { key: "stig", label: "STIG/SRG", shape: "circle" },
  { key: "template", label: "Template", shape: "circle" },
  { key: "playbook", label: "Playbook", shape: "circle" },
  { key: "source", label: "Source", shape: "circle" },
] as const;

export const PROVENANCE_LEGEND = [
  { key: "mandated", label: "Official source", pattern: "solid" },
  { key: "federal_published", label: "Source-backed", pattern: "solid" },
  { key: "federal_program", label: "Source-backed", pattern: "solid" },
  { key: "inferred", label: "Inferred", pattern: "dashed" },
  { key: "deprecated", label: "Deprecated", pattern: "dotted" },
] as const;
