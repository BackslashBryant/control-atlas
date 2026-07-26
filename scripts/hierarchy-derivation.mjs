#!/usr/bin/env node
/**
 * W1.3b — promotes an already-published CCI<->800-53 correlation into a
 * compact structural parent (`parent_id` + `parent_derivation` on the CCI
 * node itself, not a new maps/*.json + full edge + evidence object per CCI).
 *
 * Why this is safe to derive rather than re-fetch: `maps/cci-to-800-53.json`
 * (DISA's direct Rev 5 references) and `maps/cci-to-800-53-rev4.json` (the
 * Rev 4 -> Rev 5 crosswalk, scripts/fetch-800-53-rev4-rev5-crosswalk.mjs) are
 * both already-published, already-tested correlation data built in an earlier
 * session. Re-measuring directly (not trusting the sprint doc's own naive
 * index-string-matching estimate) showed they already resolve 5,093/5,137
 * CCIs (99.1%) to a real `nist-800-53` control id — this module only *picks
 * one canonical target per CCI* from data that already exists, per the
 * doctrine's Assessment Objective tier (`nist-800-53a` assessment_procedure
 * nodes ARE that tier, docs/tree-model.md + sprint-handoff §6a), falling back
 * to the control/enhancement directly when no assessment_procedure exists for
 * that control. The 44 CCIs neither file can resolve are left unparented and
 * reported — the same 44 already documented as genuinely unmappable
 * (withdrawn/Appendix J controls with no NIST-published Rev 5 target).
 */

/**
 * Pure tie-break: given the ordered candidate control ids a CCI's
 * already-published correlations point at (direct Rev 5 references first,
 * Rev-4-crosswalk-derived second — preserving each source's own internal
 * order), pick one canonical structural parent.
 *
 * Rule (documented, not arbitrary): prefer the first candidate that has a
 * matching assessment_procedure (the Assessment Objective tier) over a
 * candidate that only resolves to the control/enhancement; within each tier,
 * take the first candidate in input order (direct evidence before
 * crosswalk-derived evidence).
 *
 * @param {string[]} orderedCandidateControlIds
 * @param {{ assessmentProcedureItemIds: Set<string>, controlItemIds: Set<string> }} catalogs
 * @returns {{ controlId: string, tier: "assessment_procedure" | "control" } | null}
 */
export function pickCanonicalCciParent(orderedCandidateControlIds, catalogs) {
  const seen = new Set();
  const unique = orderedCandidateControlIds.filter((id) => {
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
  const apMatch = unique.find((id) => catalogs.assessmentProcedureItemIds.has(id));
  if (apMatch) return { controlId: apMatch, tier: "assessment_procedure" };
  const controlMatch = unique.find((id) => catalogs.controlItemIds.has(id));
  if (controlMatch) return { controlId: controlMatch, tier: "control" };
  return null;
}

/**
 * @param {object} options
 * @param {string[]} options.cciItemIds - every CCI's bare item id (e.g. "CCI-000002")
 * @param {Array<{source_id: string, target_id: string}>} options.directRelationships - maps/cci-to-800-53.json relationships
 * @param {Array<{source_id: string, target_id: string}>} options.crosswalkRelationships - maps/cci-to-800-53-rev4.json relationships
 * @param {Set<string>} options.assessmentProcedureItemIds
 * @param {Set<string>} options.controlItemIds
 * @returns {{ parents: Map<string, {controlId: string, tier: string}>, unresolved: string[] }}
 */
export function deriveCciHierarchyParents({
  cciItemIds,
  directRelationships,
  crosswalkRelationships,
  assessmentProcedureItemIds,
  controlItemIds,
}) {
  const candidatesByCci = new Map();
  for (const rel of directRelationships) {
    const list = candidatesByCci.get(rel.source_id) || [];
    list.push(rel.target_id);
    candidatesByCci.set(rel.source_id, list);
  }
  for (const rel of crosswalkRelationships) {
    const list = candidatesByCci.get(rel.source_id) || [];
    list.push(rel.target_id);
    candidatesByCci.set(rel.source_id, list);
  }

  const parents = new Map();
  const unresolved = [];
  for (const cciId of cciItemIds) {
    const candidates = candidatesByCci.get(cciId) || [];
    const picked = pickCanonicalCciParent(candidates, {
      assessmentProcedureItemIds,
      controlItemIds,
    });
    if (picked) parents.set(cciId, picked);
    else unresolved.push(cciId);
  }
  return { parents, unresolved };
}
