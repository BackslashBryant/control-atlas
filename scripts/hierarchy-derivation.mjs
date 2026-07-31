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

/**
 * A.2 — an assessment_procedure's structural parent is the control/enhancement
 * it assesses, already recorded as a published `assesses` edge. This is a
 * reversal of existing published fact, not a guess: every assessment_procedure
 * has exactly one `assesses` target in the current data. If a procedure ever
 * carries more than one, keep the first in edge-array order and report the rest
 * via `extraTargets` rather than silently discarding — the invariant is checked,
 * not assumed to hold forever.
 *
 * @param {Array<{source_id: string, target_id: string}>} assessesRelationships
 * @returns {{ parents: Map<string, {controlId: string}>, extraTargets: Map<string, string[]> }}
 */
export function deriveAssessmentProcedureParents(assessesRelationships) {
  const parents = new Map();
  const extraTargets = new Map();
  for (const rel of assessesRelationships) {
    if (parents.has(rel.source_id)) {
      const list = extraTargets.get(rel.source_id) || [];
      list.push(rel.target_id);
      extraTargets.set(rel.source_id, list);
      continue;
    }
    parents.set(rel.source_id, { controlId: rel.target_id });
  }
  return { parents, extraTargets };
}

/**
 * A.2 — attaches every catalog root to its limb (from tree-spine.json's
 * catalogLimbs), and every limb to the trunk. Pure over already-loaded spine
 * data — no file I/O here; the caller loads the JSON. A catalog root whose
 * catalog_id has no limb assignment is reported in `unassigned` (never silently
 * dropped) so the build can fail loudly per A.1's "fail loudly" note.
 *
 * @param {{id: string}[]} catalogRoots - node_type === "catalog" nodes
 * @param {{trunk: {id: string}, limbs: {id: string}[], catalogLimbs: Record<string,string>}} spine
 * @param {(catalogNode: object) => string} catalogIdOf
 * @returns {{ organizesEdges: Array<{source_id: string, target_id: string}>, unassigned: string[] }}
 */
export function deriveEditorialSpine(catalogRoots, spine, catalogIdOf) {
  const organizesEdges = [];
  const unassigned = [];
  for (const limb of spine.limbs) {
    organizesEdges.push({ source_id: spine.trunk.id, target_id: limb.id });
  }
  for (const root of catalogRoots) {
    const limbId = spine.catalogLimbs[catalogIdOf(root)];
    if (!limbId) {
      unassigned.push(root.id);
      continue;
    }
    organizesEdges.push({ source_id: limbId, target_id: root.id });
  }
  return { organizesEdges, unassigned };
}

/**
 * A.3 (owner-approved, 2026-07-31) — some catalog_ids carry real limb content
 * but ship with no catalog root node, leaving their records orphaned. For each
 * declared synthetic catalog this returns the wrapper node id, its limb, and
 * every node sharing its catalog_id (its structural children — the same-catalog
 * rule accepts them). A declared synthetic catalog that matches zero nodes is
 * reported in `empty` so the build fails loudly rather than emitting a childless
 * wrapper. Baseline catalogs are intentionally NOT declared here — baselines are
 * Class-2 applicability, never spine (docs/tree-model.md §3.2).
 *
 * @param {Array<{id: string, node_type?: string, metadata?: {catalog_id?: string}}>} nodes
 * @param {{syntheticCatalogs?: Array<{catalog_id: string, limb: string}>}} spine
 * @param {(node: object) => string} catalogIdOf
 * @returns {{ wrappers: Array<{catalogId: string, catalogNodeId: string, limbId: string, childIds: string[]}>, empty: string[] }}
 */
export function deriveSyntheticCatalogs(nodes, spine, catalogIdOf) {
  const declared = spine.syntheticCatalogs || [];
  const childrenByCatalog = new Map();
  for (const decl of declared) childrenByCatalog.set(decl.catalog_id, []);
  for (const node of nodes) {
    const cid = catalogIdOf(node);
    if (childrenByCatalog.has(cid)) childrenByCatalog.get(cid).push(node.id);
  }
  const wrappers = [];
  const empty = [];
  for (const decl of declared) {
    const childIds = childrenByCatalog.get(decl.catalog_id) || [];
    if (childIds.length === 0) {
      empty.push(decl.catalog_id);
      continue;
    }
    wrappers.push({
      catalogId: decl.catalog_id,
      catalogNodeId: `${decl.catalog_id}:CATALOG`,
      limbId: decl.limb,
      childIds,
    });
  }
  return { wrappers, empty };
}
