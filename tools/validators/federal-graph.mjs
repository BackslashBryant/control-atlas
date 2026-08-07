import {
  RELATIONSHIP_CLASSES,
  isValidatedStructuralEdge,
  isValidatedStructuralPointer,
} from "../../src/app/structural-hierarchy.mjs";

const PROVENANCE_CLASSES = new Set([
  'mandated',
  'federal_published',
  'federal_program',
  'federal_utilized',
  'federal_referenced',
  'mitre_published',
  'inferred',
  // Control Atlas's own organizing spine (trunk/limb/catalog attachment). Not a
  // publisher claim — always paired with publication_status 'editorial'.
  'control_atlas_derived',
]);
const CONFIDENCE_VALUES = new Set(['direct', 'derived', 'inferred', 'inferred_high', 'inferred_medium', 'inferred_low']);
// 'editorial' marks Control Atlas's own organizing-layer edges — never publisher
// fact. Kept out of the published/candidate provenance guards below on purpose.
const PUBLICATION_STATUSES = new Set(['published', 'candidate', 'editorial']);
const RELATIONSHIP_CLASS_VALUES = new Set(Object.values(RELATIONSHIP_CLASSES));

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
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const nodeIds = new Set(nodesById.keys());
  const evidenceIds = new Set(evidence.map((entry) => entry.id));

  for (const node of nodes) {
    const source = sourceById.get(node.source_id);
    if (!source) errors.push(`node ${node.id} has unknown defining source ${node.source_id}`);
    else if (!source.graph_eligible) errors.push(`node ${node.id} defining source ${node.source_id} is not graph eligible`);
    else if (source.access_status !== 'public') {
      errors.push(`node ${node.id} defining source ${node.source_id} must remain public for displayable graph content`);
    }
    if (node.plain_language_summary !== undefined || node.metadata?.plain_action !== undefined) {
      errors.push(`node ${node.id} retains retired synthetic record guidance`);
    }
    if (node.parent_id !== undefined && node.parent_id !== null) {
      if (!nodeIds.has(node.parent_id)) {
        errors.push(`node ${node.id} parent_id ${node.parent_id} references unknown node`);
      }
      if (typeof node.parent_derivation !== 'string' || !node.parent_derivation.trim()) {
        errors.push(`node ${node.id} has parent_id but is missing parent_derivation`);
      }
      if (!isValidatedStructuralPointer(node, nodesById.get(node.parent_id))) {
        errors.push(`node ${node.id} has an invalid structural parent ${node.parent_id}`);
      }
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
    if (!RELATIONSHIP_CLASS_VALUES.has(edge.relationship_class)) {
      errors.push(`edge ${edge.id} has invalid relationship_class`);
    }
    if (edge.publication_status === 'blocked') errors.push(`edge ${edge.id} cannot use blocked publication_status`);
    else if (!PUBLICATION_STATUSES.has(edge.publication_status)) errors.push(`edge ${edge.id} has invalid publication_status`);
    if (!PROVENANCE_CLASSES.has(edge.provenance_class)) errors.push(`edge ${edge.id} has invalid provenance_class`);
    if (!CONFIDENCE_VALUES.has(edge.confidence)) errors.push(`edge ${edge.id} has invalid confidence`);
    if (!nodeIds.has(edge.source_node_id) || !nodeIds.has(edge.target_node_id)) {
      errors.push(`edge ${edge.id} references unknown node`);
    }
    if (
      edge.relationship_class === RELATIONSHIP_CLASSES.structural &&
      !isValidatedStructuralEdge(
        edge,
        nodesById.get(edge.source_node_id),
        nodesById.get(edge.target_node_id),
      )
    ) {
      errors.push(`edge ${edge.id} is an invalid structural parent relationship`);
    }
    // build-framework-data.mjs omits evidence_ids from the emitted edge when
    // it is exactly the mechanical `evidence:<edge-id-suffix>` pattern (a
    // real ~2 MiB budget win) — derive it back for validation the same way
    // src/app/runtime.mjs's evidenceIdsFor does at read time.
    const resolvedEvidenceIds = edge.evidence_ids !== undefined
      ? edge.evidence_ids
      : [`evidence:${String(edge.id).slice('edge:'.length)}`];
    if (!resolvedEvidenceIds.length) errors.push(`edge ${edge.id} must reference evidence`);
    else if (resolvedEvidenceIds.some((id) => !evidenceIds.has(id))) errors.push(`edge ${edge.id} references unknown evidence`);
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

    if (edge.plain_language_rationale !== undefined) {
      errors.push(`edge ${edge.id} retains retired synthetic relationship rationale`);
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
