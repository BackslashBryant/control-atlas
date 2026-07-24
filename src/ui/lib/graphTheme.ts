import type { ClusterNodeMeta } from "./graphClustering";

export type CompareRole = "shared" | "uniqueA" | "uniqueB" | "neutral";

export type GraphNode = {
  id: string;
  label: string;
  itemId: string;
  nodeType: string;
  isCenter?: boolean;
  isCluster?: boolean;
  compareRole?: CompareRole;
  graphRole?: string;
  parent?: string;
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

function readToken(name: string, fallback: string): string {
  if (typeof document === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export function provenanceColor(provenanceClass: string): string {
  const map: Record<string, string> = {
    mandated: "--ca-prov-official",
    federal_published: "--ca-prov-nist",
    federal_program: "--ca-prov-fedramp",
    federal_referenced: "--ca-prov-community",
    mitre_published: "--ca-prov-mitre",
    inferred: "--ca-prov-inferred",
    deprecated: "--ca-prov-deprecated",
    official: "--ca-prov-official",
    dod_published: "--ca-prov-dod",
    nist_published: "--ca-prov-nist",
    disa_published: "--ca-prov-disa",
    fedramp_published: "--ca-prov-fedramp",
  };
  return readToken(map[provenanceClass] ?? "--ca-prov-community", "#98A4AC");
}

export function provenanceCssVar(provenanceClass: string): string {
  const map: Record<string, string> = {
    mandated: "var(--ca-prov-official)",
    federal_published: "var(--ca-prov-nist)",
    federal_program: "var(--ca-prov-fedramp)",
    federal_referenced: "var(--ca-prov-community)",
    mitre_published: "var(--ca-prov-mitre)",
    inferred: "var(--ca-prov-inferred)",
    deprecated: "var(--ca-prov-deprecated)",
  };
  return map[provenanceClass] || "var(--ca-prov-community)";
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

export function compareNodeColor(role: CompareRole): string {
  const map: Record<CompareRole, string> = {
    shared: readToken("--ca-graph-shared", "#7EB79E"),
    uniqueA: readToken("--ca-graph-unique-a", "#54BCD9"),
    uniqueB: readToken("--ca-graph-unique-b", "#CBAE67"),
    neutral: readToken("--ca-graph-neutral", "#98A4AC"),
  };
  return map[role];
}

export function nodeColor(
  node: GraphNode,
  selectedId: string | null,
  highlightIds: Set<string>,
): string {
  if (node.compareRole) return compareNodeColor(node.compareRole);
  if (node.isCluster) return readToken("--ca-graph-cluster", "#98A4AC");
  if (node.id === selectedId) return readToken("--ca-graph-selected", "#54BCD9");
  if (node.isCenter) return readToken("--ca-graph-center", "#54BCD9");
  if (highlightIds.size && !highlightIds.has(node.id)) {
    return readToken("--ca-graph-dim", "rgba(152, 164, 172, 0.35)");
  }
  if (node.nodeType === "source") return readToken("--ca-prov-fedramp", "#7EB79E");
  if (node.nodeType === "template") return readToken("--ca-prov-mitre", "#CBAE67");
  if (node.nodeType === "pattern") return readToken("--ca-graph-unique-b", "#CBAE67");
  return readToken("--ca-text", "#E7E1D5");
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
    compareRole?: CompareRole;
    graphRole?: string;
    parent?: string;
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
  clusterMeta?: Map<string, import("./graphClustering").ClusterNodeMeta>,
): GraphData {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.metadata?.title || node.label || node.id,
      itemId: node.metadata?.item_id || node.label || node.id,
      nodeType: node.node_type || "",
      isCenter: node.id === centerNodeId,
      isCluster: clusterMeta?.has(node.id) || node.node_type === "cluster",
      compareRole: node.compareRole,
      graphRole: node.graphRole,
      parent: node.parent,
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
  { key: "federal_published", label: "Published source", pattern: "solid" },
  { key: "federal_program", label: "Program-backed", pattern: "solid" },
  { key: "inferred", label: "Inferred", pattern: "dashed" },
  { key: "deprecated", label: "Deprecated", pattern: "dotted" },
] as const;

export const COMPARE_ROLE_LEGEND = [
  { key: "shared", label: "Shared", color: "var(--ca-graph-shared)" },
  { key: "uniqueA", label: "Only in A", color: "var(--ca-graph-unique-a)" },
  { key: "uniqueB", label: "Only in B", color: "var(--ca-graph-unique-b)" },
] as const;
