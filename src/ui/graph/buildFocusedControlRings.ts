import type {
  VisibleGraphEdge,
  VisibleGraphNode,
  VisibleRelationshipModel,
} from "./sourceRegistryTypes.ts";

export const CONTROL_RING_ORDER = [
  "selected-control",
  "control-catalog-context",
  "baseline-overlay-profile",
  "assessment-and-implementation",
  "mapping-and-threat-context",
  "templates-playbooks-sources",
] as const;

function node(
  id: string,
  label: string,
  nodeType: string,
  graphRole: string,
  description: string,
  childCount?: number,
): VisibleGraphNode {
  return {
    id,
    label,
    node_type: nodeType,
    graphRole,
    metadata: {
      item_id: label,
      title: label,
      description,
      childCount,
    },
  };
}

function edge(
  source: string,
  target: string,
  relationshipType: string,
): VisibleGraphEdge {
  return {
    id: `focused:${source}->${target}`,
    source_node_id: source,
    target_node_id: target,
    relationship_type: relationshipType,
    provenance_class: "federal_published",
    publication_status: "published",
    confidence: "high",
    plain_language_rationale:
      "This connection places the selected control in its practical compliance context.",
  };
}

export function buildFocusedControlRings(
  controlId: string,
): VisibleRelationshipModel {
  if (controlId !== "AC-2" && controlId !== "nist-800-53:AC-2") {
    throw new Error(`Unsupported focused control: ${controlId}`);
  }

  const centerNodeId = "nist-800-53:AC-2";
  const nodes = [
    node(
      centerNodeId,
      "AC-2",
      "control",
      "nist-control",
      "Account Management",
    ),
    node(
      "source:nist-sp-800-53-r5",
      "SP 800-53 Rev. 5",
      "source",
      "control-catalog",
      "The primary NIST control catalog.",
    ),
    node(
      "family:access-control",
      "Access Control family",
      "control-family",
      "control-catalog",
      "The NIST control family containing AC-2.",
    ),
    node(
      "source:nist-sp-800-53b",
      "SP 800-53B",
      "baseline",
      "baseline-overlay-profile",
      "The NIST control baseline source.",
    ),
    node(
      "cluster:fedramp-baselines",
      "FedRAMP Low / Moderate / High",
      "cluster",
      "baseline-overlay-profile",
      "Three FedRAMP Rev. 5 baseline contexts.",
      3,
    ),
    node(
      "source:nist-sp-800-53a-r5",
      "SP 800-53A",
      "assessment",
      "assessment-scoping",
      "Assessment procedures for NIST controls.",
    ),
    node(
      "cluster:disa-stig-srg",
      "STIG/SRG cluster",
      "cluster",
      "implementation-standard",
      "Product hardening and security requirements guidance.",
      12,
    ),
    node(
      "cluster:cmmc-assessment-scoping",
      "CMMC assessment/scoping cluster",
      "cluster",
      "assessment-scoping",
      "CMMC assessment and scoping context.",
      4,
    ),
    node(
      "cluster:disa-ccis",
      "DISA CCIs cluster",
      "cluster",
      "mapping-crosswalk",
      "CCI mappings connecting implementation requirements to NIST controls.",
      35,
    ),
    node(
      "cluster:csf-mappings",
      "CSF mapping cluster",
      "cluster",
      "mapping-crosswalk",
      "NIST CSF crosswalk context.",
      8,
    ),
    node(
      "cluster:attack-d3fend",
      "ATT&CK/D3FEND cluster",
      "cluster",
      "threat-defense",
      "Threat behavior and defensive technique context.",
      9,
    ),
    node(
      "cluster:resources",
      "Templates / Playbooks / Sources cluster",
      "cluster",
      "supporting-reference",
      "Three templates, two playbooks, and five canonical sources.",
      10,
    ),
  ];

  const edges = nodes
    .filter((entry) => entry.id !== centerNodeId)
    .map((entry) => edge(centerNodeId, entry.id, "provides_context_for"));

  return {
    centerNodeId,
    layoutMode: "focus",
    nodes,
    edges,
    stats: { total: edges.length, filtered: edges.length },
  };
}

export function expandFocusedControlCluster(
  model: VisibleRelationshipModel,
  clusterKey: string,
): VisibleRelationshipModel {
  const clusterId = `cluster:${clusterKey}`;
  const cluster = model.nodes.find((entry) => entry.id === clusterId);
  if (!cluster) return model;

  const childCount = cluster.metadata.childCount ?? 0;
  const childLabel = cluster.metadata.title.replace(/\s+cluster$/i, "");
  const children = Array.from({ length: childCount }, (_, index) =>
    node(
      `${clusterKey}:${index + 1}`,
      `${childLabel} ${index + 1}`,
      clusterKey.includes("cci") ? "cci" : "context",
      cluster.graphRole,
      `Expanded item ${index + 1} from ${cluster.metadata.title}.`,
    ),
  );
  const retainedNodes = model.nodes.filter((entry) => entry.id !== clusterId);
  const retainedEdges = model.edges.filter(
    (entry) =>
      entry.source_node_id !== clusterId && entry.target_node_id !== clusterId,
  );
  const childEdges = children.map((entry) =>
    edge(model.centerNodeId, entry.id, "provides_context_for"),
  );

  return {
    ...model,
    layoutMode: "expanded",
    nodes: [...retainedNodes, ...children],
    edges: [...retainedEdges, ...childEdges],
    stats: {
      total: retainedEdges.length + childEdges.length,
      filtered: retainedEdges.length + childEdges.length,
    },
  };
}
