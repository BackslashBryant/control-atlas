/**
 * Human-first display names for runtime records.
 *
 * Rule (user-locked): lead with the official name + ID the way the source
 * publishes it ("AC-2 — Account Management"), and never surface internal
 * scaffold ids (FAMILY-AC, DOC-STRATEGY, HIGH) as titles on their own.
 */

import { displayNameFor } from "../../app/display-names.mjs";

type TitledNode = {
  id: string;
  node_type?: string;
  label?: string;
  metadata?: { item_id?: string; title?: string; catalog_id?: string };
};

// Node types whose item_id is an internal scaffold id, not an official
// designation — for these the title alone is the official name.
const INTERNAL_ID_TYPES = new Set([
  "family",
  "baseline",
  "program",
  "policy",
  "impact_category",
  "zt_document",
  "zt_pillar",
  "zt_tenet",
  "rmf_step",
  "catalog",
]);

export function recordDisplayTitle(node: TitledNode | null | undefined): string {
  if (!node) return "";
  const itemId = node.metadata?.item_id ?? "";
  const title = node.metadata?.title ?? "";
  if (!title) return node.label || itemId || node.id;
  if (!itemId || title === itemId) return title;
  if (node.node_type === "family") {
    const familyCode = itemId.replace(/^FAMILY-/, "");
    return `${title} (${familyCode}) family`;
  }
  if (INTERNAL_ID_TYPES.has(node.node_type ?? "")) {
    return title;
  }
  if (title.startsWith(itemId)) return title;
  return `${itemId} — ${title}`;
}

const BASE_TITLE = "Control Atlas";

// Per-view suffixes for document.title (CATL-61). Wayfinding + honest browser
// history/bookmark labels; record pages use the official record name.
// "atlas-map" -> "Explore" (nav rename); the pre-existing "search"/"browse"
// view (a distinct, already-shipped full-text results page) is renamed away
// from its old "Explore" label to "Search results" so the two do not share a
// name — see PLAN CHANGE in docs/STATE.md.
const VIEW_TITLE_LABELS: Record<string, string> = {
  "start-here": "Start",
  "atlas-map": "Explore",
  search: "Search results",
  "catalog-detail": "Catalog",
  browse: "Search results",
  matrix: "Compare",
  patterns: "Learn",
  templates: "Build",
  sources: "Sources",
  about: "About",
  retired: "Retired",
  "not-found": "Page not found",
};

export function routeDocumentTitle(
  state: { view: string; node?: string; query?: string },
  node?: TitledNode | null,
): string {
  if (state.view === "home") {
    return `${BASE_TITLE} — The public map for federal cyber compliance`;
  }
  if (state.view === "library-detail") {
    const recordName = recordDisplayTitle(node) || "Record";
    return `${recordName} — ${BASE_TITLE}`;
  }
  const base = VIEW_TITLE_LABELS[state.view];
  if (!base) {
    return BASE_TITLE;
  }
  const label =
    (state.view === "search" || state.view === "browse") && state.query
      ? `${state.query} — ${base}`
      : base;
  return `${label} — ${BASE_TITLE}`;
}

// Friendly plural names for connection-impact summaries, keyed by node_type.
const TYPE_PLURALS: Record<string, [string, string]> = {
  control: ["NIST control", "NIST controls"],
  control_enhancement: ["control enhancement", "control enhancements"],
  requirement: ["CCI / requirement", "CCIs / requirements"],
  stig_rule: ["STIG rule", "STIG rules"],
  srg_requirement: ["SRG requirement", "SRG requirements"],
  benchmark: ["STIG / SRG benchmark", "STIG / SRG benchmarks"],
  baseline: ["baseline", "baselines"],
  program: ["program level", "program levels"],
  assessment_procedure: ["assessment procedure", "assessment procedures"],
  attack_technique: ["ATT&CK technique", "ATT&CK techniques"],
  defend_countermeasure: ["D3FEND countermeasure", "D3FEND countermeasures"],
  zt_activity: ["Zero Trust activity", "Zero Trust activities"],
  zt_capability: ["Zero Trust capability", "Zero Trust capabilities"],
  family: ["control family", "control families"],
  rmf_step: ["RMF step", "RMF steps"],
  impact_category: ["impact level", "impact levels"],
  function: ["CSF function", "CSF functions"],
  category: ["CSF category", "CSF categories"],
  tactic: ["tactic", "tactics"],
  group: ["group", "groups"],
};

/** English pluralization for the display-name fallback (avoids "categorys"). */
function pluralize(word: string): string {
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  return `${word}s`;
}

export function friendlyTypePlural(nodeType: string, count: number): string {
  const entry = TYPE_PLURALS[nodeType];
  if (entry) return count === 1 ? entry[0] : entry[1];
  // Fall back to the hardened formatter for casing (no "impact categorys",
  // no lower-case "disa ccis") and pluralize the last word properly.
  const pretty = displayNameFor("node_type", nodeType);
  return count === 1 ? pretty : pluralize(pretty);
}

export type ImpactBreakdown = {
  total: number;
  byType: Array<{ nodeType: string; label: string; count: number }>;
};

/**
 * The "birds per stone" summary: how many related requirements this record
 * touches, broken down by kind, largest groups first.
 */
export function buildImpactBreakdown(
  centerNodeId: string,
  edges: Array<{ source_node_id: string; target_node_id: string }>,
  getNode: (id: string) => TitledNode | null | undefined,
): ImpactBreakdown {
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  for (const edge of edges) {
    const counterpartId =
      edge.source_node_id === centerNodeId
        ? edge.target_node_id
        : edge.source_node_id;
    if (seen.has(counterpartId)) continue;
    seen.add(counterpartId);
    const counterpart = getNode(counterpartId);
    const nodeType = counterpart?.node_type || "other";
    counts.set(nodeType, (counts.get(nodeType) ?? 0) + 1);
  }
  const byType = [...counts.entries()]
    .map(([nodeType, count]) => ({
      nodeType,
      count,
      label: friendlyTypePlural(nodeType, count),
    }))
    .sort((a, b) => b.count - a.count);
  return { total: seen.size, byType };
}

/**
 * Requirement frameworks a practitioner cross-maps against (the "overlays").
 * Same-framework detail (CCIs, STIGs, baselines, enhancements) and threat/
 * assessment catalogs are intentionally excluded — this is equivalence, not
 * implementation. Keyed by catalog_id → display label.
 */
const EQUIVALENCE_FRAMEWORKS: Record<string, string> = {
  "csf-2": "NIST CSF 2.0",
  "nist-800-171": "SP 800-171",
  "nist-800-171-rev2": "SP 800-171 Rev. 2",
  "nist-800-172": "SP 800-172",
  "cmmc-2": "CMMC 2.0",
  "nist-ai-rmf": "AI RMF",
  "nist-ssdf": "SSDF",
  "fips-200": "FIPS 200",
};

export type CrossFrameworkGroup = {
  catalogId: string;
  label: string;
  items: Array<{ nodeId: string; itemId: string }>;
};

/**
 * The focused control's equivalents in OTHER requirement frameworks, from real
 * published `maps_to` edges — "AC-17 in 800-53 is also CSF PR.AA-05 and 800-171
 * 3.1.12". Empty array when no cross-framework mapping is ingested (the honest
 * signal that coverage is partial), never a fabricated link.
 */
export function buildCrossFrameworkEquivalents(
  centerNodeId: string,
  edges: Array<{
    source_node_id: string;
    target_node_id: string;
    relationship_type?: string;
  }>,
  getNode: (id: string) => TitledNode | null | undefined,
): CrossFrameworkGroup[] {
  const groups = new Map<string, CrossFrameworkGroup>();
  const seen = new Set<string>();
  for (const edge of edges) {
    if (edge.relationship_type && edge.relationship_type !== "maps_to") continue;
    const counterpartId =
      edge.source_node_id === centerNodeId
        ? edge.target_node_id
        : edge.target_node_id === centerNodeId
          ? edge.source_node_id
          : null;
    if (!counterpartId || seen.has(counterpartId)) continue;
    const counterpart = getNode(counterpartId);
    const catalogId = counterpart?.metadata?.catalog_id;
    const label = catalogId ? EQUIVALENCE_FRAMEWORKS[catalogId] : undefined;
    if (!catalogId || !label) continue;
    seen.add(counterpartId);
    if (!groups.has(catalogId)) {
      groups.set(catalogId, { catalogId, label, items: [] });
    }
    groups.get(catalogId)!.items.push({
      nodeId: counterpartId,
      itemId: counterpart?.metadata?.item_id || counterpartId,
    });
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}
