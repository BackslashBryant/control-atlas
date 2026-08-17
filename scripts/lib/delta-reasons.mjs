// Phase 2 T2.9: every catalog whose normalized_to_leaf_delta is nonzero must
// carry a machine-readable, human-reviewed reason. Auto-inferring this would
// be a guess; each entry here was verified against the catalog's actual
// generated node_type distribution before being recorded. Pure,
// dependency-free data so it is unit-testable without re-running the count
// reconciliation build (see scripts/lib/completeness.mjs for the same
// pattern).
export const DELTA_REASONS = new Set([
  // The catalog's normalized source records are themselves publisher
  // structural containers (their node_type falls in GROUP_TYPES), so none
  // of them become a runtime leaf record.
  'structural_group_expansion',
  // The adapter emits additional organizing nodes (not present as discrete
  // records in the raw source) that GROUP_TYPES does not classify as
  // structural, inflating the leaf count above the normalized source count.
  'adapter_synthesized_node',
  'duplicate_source_id',
  'deprecated_record',
  'explicit_exclusion',
]);

export const NORMALIZED_TO_LEAF_DELTA_REASONS = {
  'cmmc-2': 'structural_group_expansion', // 3 CMMC Levels emit as node_type "program" (a GROUP_TYPES member), 0 leaf.
  'cui-policy': 'structural_group_expansion', // 128 CUI categories emit as node_type "policy" (a GROUP_TYPES member), 0 leaf.
  'microsoft-zt-maturity': 'adapter_synthesized_node', // adapter adds 6 zt_pillar nodes beyond the 62 normalized questions.
};
