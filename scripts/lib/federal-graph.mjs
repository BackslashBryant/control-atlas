const PROVENANCE_CLASSES = new Set([
  'mandated',
  'federal_published',
  'federal_program',
  'federal_utilized',
  'federal_referenced',
  'inferred',
]);
const CONFIDENCE_VALUES = new Set(['direct', 'derived', 'inferred_high', 'inferred_medium', 'inferred_low']);
const PUBLICATION_STATUSES = new Set(['published', 'candidate']);

export function validateGraphArtifacts({ sources = [], nodes = [], edges = [], evidence = [] }) {
  const errors = [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const evidenceIds = new Set(evidence.map((entry) => entry.id));

  for (const node of nodes) {
    const source = sourceById.get(node.source_id);
    if (!source) errors.push(`node ${node.id} has unknown defining source ${node.source_id}`);
    else if (!source.graph_eligible) errors.push(`node ${node.id} defining source ${node.source_id} is not graph eligible`);
  }

  for (const edge of edges) {
    if (edge.publication_status === 'blocked') errors.push(`edge ${edge.id} cannot use blocked publication_status`);
    else if (!PUBLICATION_STATUSES.has(edge.publication_status)) errors.push(`edge ${edge.id} has invalid publication_status`);
    if (!PROVENANCE_CLASSES.has(edge.provenance_class)) errors.push(`edge ${edge.id} has invalid provenance_class`);
    if (!CONFIDENCE_VALUES.has(edge.confidence)) errors.push(`edge ${edge.id} has invalid confidence`);
    if (!nodeIds.has(edge.source_node_id) || !nodeIds.has(edge.target_node_id)) {
      errors.push(`edge ${edge.id} references unknown node`);
    }
    if (!edge.evidence_ids?.length) errors.push(`edge ${edge.id} must reference evidence`);
    else if (edge.evidence_ids.some((id) => !evidenceIds.has(id))) errors.push(`edge ${edge.id} references unknown evidence`);
    if (edge.publication_status === 'candidate') {
      if (edge.provenance_class !== 'inferred') errors.push(`candidate edge ${edge.id} must be inferred`);
      if (!edge.confidence?.startsWith('inferred_')) errors.push(`candidate edge ${edge.id} must use inferred confidence`);
      if (!edge.warning || !edge.inference_rule_id) errors.push(`candidate edge ${edge.id} must include warning and inference_rule_id`);
    }
  }
  return errors;
}
