#!/usr/bin/env node
import {
  ancestorChain,
  buildAncestorGraph,
} from "../src/app/ancestor-path.mjs";

export const TRUNK_REACHABILITY_EXEMPT_NODE_TYPES = new Set([
  "statute",
  "regulation",
  "policy_directive",
]);

export function isTrunkReachabilityEligible(node) {
  return !TRUNK_REACHABILITY_EXEMPT_NODE_TYPES.has(node?.node_type);
}

export function canonicalTrunkReachable(nodes, edges, trunkId) {
  const graph = buildAncestorGraph(nodes, edges);
  // Authority instruments are intentionally outside the trunk-reachability
  // gate. Include them in this predicate result so step-4 residual backfill
  // does not fabricate catalog/root attachments for isolated authority nodes.
  const reachable = new Set(
    nodes
      .filter((node) => !isTrunkReachabilityEligible(node))
      .map((node) => node.id),
  );
  for (const node of nodes) {
    if (!isTrunkReachabilityEligible(node)) continue;
    if (ancestorChain(node.id, graph).some((link) => link.id === trunkId)) {
      reachable.add(node.id);
    }
  }
  return reachable;
}

export function undirectedTrunkReachable(nodes, edges, trunkId) {
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    const source = edge.source_node_id;
    const target = edge.target_node_id;
    if (adjacency.has(source)) adjacency.get(source).push(target);
    if (adjacency.has(target)) adjacency.get(target).push(source);
  }
  const reachable = new Set([trunkId]);
  const stack = [trunkId];
  while (stack.length) {
    const current = stack.pop();
    for (const neighbor of adjacency.get(current) || []) {
      if (reachable.has(neighbor)) continue;
      reachable.add(neighbor);
      stack.push(neighbor);
    }
  }
  // Match the canonical predicate contract: exempt authority nodes are gate-
  // satisfied even when they are deliberately isolated from the trunk.
  for (const node of nodes) {
    if (!isTrunkReachabilityEligible(node)) reachable.add(node.id);
  }
  return reachable;
}

export function evaluateTrunkReachability(nodes, edges, trunkId) {
  const eligibleNodes = nodes.filter(isTrunkReachabilityEligible);
  const eligibleNodeIds = new Set(eligibleNodes.map((node) => node.id));
  const allUndirected = undirectedTrunkReachable(nodes, edges, trunkId);
  const allCanonical = canonicalTrunkReachable(nodes, edges, trunkId);
  const undirected = new Set(
    [...allUndirected].filter((nodeId) => eligibleNodeIds.has(nodeId)),
  );
  const canonical = new Set(
    [...allCanonical].filter((nodeId) => eligibleNodeIds.has(nodeId)),
  );
  return {
    undirected,
    canonical,
    totalNodeCount: nodes.length,
    eligibleNodeCount: eligibleNodes.length,
    exemptAuthorityNodeCount: nodes.length - eligibleNodes.length,
    undirectedOrphans: eligibleNodes
      .filter((node) => !undirected.has(node.id))
      .map((node) => node.id),
    canonicalOrphans: eligibleNodes
      .filter((node) => !canonical.has(node.id))
      .map((node) => node.id),
  };
}

export function assertTrunkReachability(nodes, edges, trunkId) {
  const result = evaluateTrunkReachability(nodes, edges, trunkId);
  if (result.undirectedOrphans.length || result.canonicalOrphans.length) {
    throw new Error(
      `Trunk reachability gate FAILED: eligible ${result.eligibleNodeCount}/${result.totalNodeCount} ` +
        `(${result.exemptAuthorityNodeCount} authority exempt); ` +
        `undirected ${result.undirected.size}/${result.eligibleNodeCount}; ` +
        `canonical ${result.canonical.size}/${result.eligibleNodeCount}. ` +
        `Undirected first 25: ${result.undirectedOrphans.slice(0, 25).join(", ") || "none"}. ` +
        `Canonical first 25: ${result.canonicalOrphans.slice(0, 25).join(", ") || "none"}.`,
    );
  }
  return result;
}

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
 * nodes ARE that tier (docs/DATA_POLICY.md), falling back
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
 * applicability, never containment (docs/DATA_POLICY.md).
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
      // CCIs and assessment procedures already hang beneath the control they
      // cite or assess (deriveCciHierarchyParents /
      // deriveAssessmentProcedureParents). A wrapper that also claimed them
      // structurally outranked that and flattened the record's chain to
      // "area > wrapper > record", losing the control it belongs to. Those
      // catalogs get a browsable root with no children of its own; Explore
      // lists their records by catalog membership instead.
      childIds: decl.attachRecords === false
        ? []
        : Array.isArray(decl.attachNodeTypes)
          ? childIds.filter((id) => decl.attachNodeTypes.includes(nodes.find((node) => node.id === id)?.node_type))
          : childIds,
    });
  }
  return { wrappers, empty };
}
