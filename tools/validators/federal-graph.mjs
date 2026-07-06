const PROVENANCE_CLASSES = new Set([
  'mandated',
  'federal_published',
  'federal_program',
  'federal_utilized',
  'federal_referenced',
  'mitre_published',
  'inferred',
]);
const CONFIDENCE_VALUES = new Set(['direct', 'derived', 'inferred', 'inferred_high', 'inferred_medium', 'inferred_low']);
const PUBLICATION_STATUSES = new Set(['published', 'candidate']);

function pushDuplicateErrors(errors, label, items) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    if (!item?.id) continue;
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }
  for (const id of duplicates) {
    errors.push(`duplicate ${label} id: ${id}`);
  }
}

export function validateGraphArtifacts({ sources = [], nodes = [], edges = [], evidence = [] }) {
  const errors = [];
  pushDuplicateErrors(errors, 'source', sources);
  pushDuplicateErrors(errors, 'node', nodes);
  pushDuplicateErrors(errors, 'edge', edges);
  pushDuplicateErrors(errors, 'evidence', evidence);

  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const evidenceIds = new Set(evidence.map((entry) => entry.id));

  for (const node of nodes) {
    const source = sourceById.get(node.source_id);
    if (!source) errors.push(`node ${node.id} has unknown defining source ${node.source_id}`);
    else if (!source.graph_eligible) errors.push(`node ${node.id} defining source ${node.source_id} is not graph eligible`);
    else if (source.access_status !== 'public') {
      errors.push(`node ${node.id} defining source ${node.source_id} must remain public for displayable graph content`);
    }
    if (typeof node.plain_language_summary !== 'string' || !node.plain_language_summary.trim()) {
      errors.push(`node ${node.id} is missing required plain_language_summary`);
    }
  }

  for (const entry of evidence) {
    const source = sourceById.get(entry.source_id);
    if (!source) errors.push(`evidence ${entry.id} has unknown source ${entry.source_id}`);
    else if (source.access_status !== 'public') {
      errors.push(`evidence ${entry.id} source ${entry.source_id} must remain public for displayable graph content`);
    }
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
      if (typeof edge.rationale !== 'string' || !edge.rationale.trim()) {
        errors.push(`candidate edge ${edge.id} must include non-empty rationale`);
      }
    }
    if (edge.publication_status === 'published') {
      if (edge.provenance_class === 'inferred') errors.push(`published edge ${edge.id} cannot use inferred provenance_class`);
      if (edge.confidence?.startsWith('inferred_')) errors.push(`published edge ${edge.id} cannot use inferred confidence`);
    }

    if (typeof edge.plain_language_rationale !== 'string' || !edge.plain_language_rationale.trim()) {
      errors.push(`edge ${edge.id} is missing required plain_language_rationale`);
    }
    if (!Array.isArray(edge.source_refs) || edge.source_refs.length === 0) {
      errors.push(`edge ${edge.id} is missing required source_refs`);
    } else {
      for (const [idx, ref] of edge.source_refs.entries()) {
        if (!ref.source_id || typeof ref.source_id !== 'string') {
          errors.push(`edge ${edge.id} source_refs[${idx}] must have a valid string source_id`);
        }
        if (!ref.ref_type || typeof ref.ref_type !== 'string') {
          errors.push(`edge ${edge.id} source_refs[${idx}] must have a valid string ref_type`);
        }
        if (ref.locator === undefined || typeof ref.locator !== 'string') {
          errors.push(`edge ${edge.id} source_refs[${idx}] must have a valid string locator`);
        }
      }
    }
  }
  return errors;
}
