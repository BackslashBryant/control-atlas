/**
 * Human-first display names for runtime records.
 *
 * Rule (user-locked): record identity is publisher + family + official ID
 * ("NIST AC 3.1.1"). The publisher's record name is supporting text, never a
 * generated summary. Internal scaffold ids (FAMILY-AC, DOC-STRATEGY, HIGH)
 * never become record titles on their own.
 */

import { displayNameFor } from "../../app/display-names.mjs";
import { nistFamilyCode } from "../../shared/nist-families.mjs";
import { sourceNativeIdentityCategory } from "../../shared/record-identity.mjs";
import { routeIdentityFor } from "./routeIdentity";

type TitledNode = {
  id: string;
  node_type?: string;
  label?: string;
  metadata?: {
    item_id?: string;
    title?: string;
    catalog_id?: string;
    family?: string;
    identity_category?: string;
  };
};

/** Family-qualify otherwise ambiguous NIST requirement numbers. */
export function familyQualifiedRecordId(
  itemId: string,
  family?: string,
  catalogId?: string,
): string {
  const identifier = itemId.trim();
  if (!/^\d+(?:\.\d+)+$/.test(identifier)) return identifier;
  if (
    !["nist-800-171", "nist-800-171-rev2", "nist-800-172"].includes(
      catalogId || "",
    )
  ) {
    return identifier;
  }
  const familyCode = nistFamilyCode(family);
  return familyCode ? `${familyCode}-${identifier}` : identifier;
}

/** Return only a publisher-authored record name; never turn body text into a title. */
export function officialRecordName(itemId: string, title: string): string {
  const identifier = itemId.trim();
  const publishedTitle = title.trim();
  if (!publishedTitle || publishedTitle.toLocaleLowerCase() === identifier.toLocaleLowerCase()) {
    return "";
  }
  const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return publishedTitle
    .replace(new RegExp(`^${escapedIdentifier}(?:\\s*[-–—:|]\\s*|\\s+)`, "i"), "")
    .trim();
}

function familyIdentity(family: string): string {
  const label = family.trim();
  return nistFamilyCode(label) || label;
}

const GENERIC_PUBLISHER_LABELS = new Set([
  "other",
  "publisher unavailable",
  "source owner",
  "unavailable",
]);

/** Prefer an actual organization name over generic catalog buckets. */
export function recordPublisherName(...values: unknown[]): string {
  for (const value of values) {
    const label = String(value || "").trim();
    if (!label || GENERIC_PUBLISHER_LABELS.has(label.toLocaleLowerCase())) continue;
    if (/^National Institute of Standards and Technology\b/i.test(label)) return "NIST";
    if (/^Defense Information Systems Agency\b/i.test(label)) return "DISA";
    if (/^(?:The )?MITRE(?: Corporation)?\b/i.test(label)) return "MITRE";
    return label;
  }
  return "";
}

function identifierIncludesFamily(identifier: string, family: string): boolean {
  if (!identifier || !family) return false;
  const escapedFamily = family.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[-.])${escapedFamily}(?:[-.]|$)`, "i").test(identifier);
}

/**
 * Build the concise identity shown wherever a record is titled.
 *
 * Numeric NIST requirements need their family code ("NIST AC 3.1.1"). IDs
 * that already carry the family stay intact ("NIST AC-2", not
 * "NIST AC AC-2"). Other catalogs keep their published family label.
 */
export function formatRecordIdentity(
  publisher: string,
  family: string,
  itemId: string,
): string {
  const publisherLabel = publisher.trim();
  const identifier = itemId.trim();
  const familyLabel = familyIdentity(family);
  const parts = [publisherLabel];
  if (familyLabel && !identifierIncludesFamily(identifier, familyLabel)) {
    parts.push(familyLabel);
  }
  if (identifier) parts.push(identifier);
  return parts.filter(Boolean).join(" ");
}

export function recordIdentityFor(input: {
  publisher: string;
  catalogId: string;
  itemId: string;
  family: string;
  metadata?: TitledNode["metadata"];
}): string {
  const category = input.metadata?.identity_category || sourceNativeIdentityCategory({
    catalogId: input.catalogId,
    family: input.family,
  });
  return formatRecordIdentity(input.publisher, category, input.itemId);
}

/** Keep only locators that read as public document citations, never file paths or fragments. */
export function humanReadableEvidenceLocator(locator: string): string {
  const value = locator.trim();
  if (!value || /[#/\\]/.test(value)) return "";
  if (/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/i.test(value)) return "";
  if (/\.(?:csv|json|pdf|xml|xlsx?)\b/i.test(value)) return "";
  return /^(?:appendix|clause|figure|page|paragraph|row|section|table|§)\b/i.test(value) ||
    /^\d+\s+(?:CFR|U\.S\.C\.)\b/i.test(value)
    ? value
    : "";
}

/**
 * Construct one identifier-led title without repeating an identifier the
 * publisher already placed at the beginning of the official title.
 *
 * The boundary check is intentionally narrow. It removes only a leading,
 * standalone identifier (case-insensitive), while preserving the same token
 * when it appears later in legitimate official text.
 */
export function formatRecordTitle(itemId: string, officialTitle: string): string {
  const identifier = itemId.trim();
  const title = officialTitle.trim();
  if (!identifier) return title;
  if (!title) return identifier;
  if (title.toLocaleLowerCase() === identifier.toLocaleLowerCase()) {
    return identifier;
  }
  const leadingIdentifier = title.slice(0, identifier.length);
  const boundary = title.slice(identifier.length, identifier.length + 1);
  if (
    leadingIdentifier.toLocaleLowerCase() === identifier.toLocaleLowerCase() &&
    (!boundary || boundary === "[" || boundary === "]" || /[-\s\u2013\u2014:|()]/.test(boundary))
  ) {
    return title;
  }
  return `${identifier} — ${title}`;
}

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
  return formatRecordTitle(itemId, title);
}

const BASE_TITLE = "Control Atlas";

// Per-view suffixes for document.title (CATL-61). Wayfinding + honest browser
// history/bookmark labels; record pages use the official record name.
// "atlas-map" -> "Explore" (nav rename); the pre-existing "search"/"browse"
// view (a distinct, already-shipped full-text results page) is renamed away
// from its old "Explore" label to "Search results" so the two do not share a
// name — see the source-first record contract in docs/PAGE_CONTRACTS.md.
export function routeDocumentTitle(
  state: { view: string; node?: string; query?: string },
  node?: TitledNode | null,
  entityName = "",
): string {
  if (state.view === "home") {
    return `${BASE_TITLE} — Public reference for federal cyber requirements`;
  }
  if (state.view === "library-detail") {
    const recordName = entityName || recordDisplayTitle(node) || "Record";
    return `${recordName} — ${BASE_TITLE}`;
  }
  if (state.view === "commons-detail") {
    return `${entityName || routeIdentityFor("commons-detail").title} — ${BASE_TITLE}`;
  }
  const base = routeIdentityFor(state.view as import("./viewState").AppView).title;
  const label =
    state.view === "search" && state.query
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

export type RecordConnectionGroup = {
  catalogId: string;
  label: string;
  relationshipType: string;
  items: Array<{
    nodeId: string;
    itemId: string;
    title: string;
    relationshipType: string;
    edgeId: string;
    provenanceClass: string;
    sourceRefs: Array<{
      sourceId: string;
      sourceName: string;
      sourceVersion: string;
      locator: string;
      evidenceQuality: string;
    }>;
  }>;
};

/**
 * Record-page connections are published, cross-catalog correlation links only.
 * Structural parent/child edges and same-publication relationships belong in
 * classification, never in the Connections count.
 */
export function buildRecordConnectionGroups(
  centerNodeId: string,
  centerCatalogId: string,
  edges: Array<{
    id?: string;
    source_node_id: string;
    target_node_id: string;
    relationship_type?: string;
    relationship_class?: string;
    publication_status?: string;
    provenance_class?: string;
    source_refs?: Array<{
      source_id?: string;
      source_name?: string;
      source_version?: string;
      locator?: string;
      evidence_quality?: string;
    }>;
  }>,
  getNode: (id: string) => TitledNode | null | undefined,
  catalogLabel: (catalogId: string) => string | null | undefined,
): RecordConnectionGroup[] {
  const groups = new Map<string, RecordConnectionGroup>();
  for (const [edgeIndex, edge] of edges.entries()) {
    if (edge.publication_status !== "published") continue;
    if (edge.relationship_class !== "correlation") continue;
    const counterpartId =
      edge.source_node_id === centerNodeId
        ? edge.target_node_id
        : edge.target_node_id === centerNodeId
          ? edge.source_node_id
          : null;
    if (!counterpartId) continue;
    const counterpart = getNode(counterpartId);
    const catalogId = counterpart?.metadata?.catalog_id?.trim();
    const itemId = counterpart?.metadata?.item_id?.trim();
    const title = counterpart?.metadata?.title?.trim();
    const groupLabel = catalogId ? catalogLabel(catalogId)?.trim() : "";
    const relationshipType = edge.relationship_type?.trim();
    const provenanceClass = edge.provenance_class?.trim();
    if (
      !counterpart ||
      !catalogId ||
      catalogId === centerCatalogId ||
      !itemId ||
      !title ||
      !groupLabel ||
      !relationshipType ||
      !provenanceClass
    ) continue;
    const groupId = `${catalogId}:${relationshipType}`;
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        catalogId,
        label: groupLabel,
        relationshipType,
        items: [],
      });
    }
    groups.get(groupId)!.items.push({
      nodeId: counterpartId,
      itemId,
      title,
      relationshipType,
      edgeId: edge.id || `${centerNodeId}:${counterpartId}:${relationshipType}:${edgeIndex}`,
      provenanceClass,
      sourceRefs: (edge.source_refs || [])
        .map((reference) => ({
          sourceId: reference.source_id?.trim() || "",
          sourceName: reference.source_name?.trim() || "",
          sourceVersion: reference.source_version?.trim() || "",
          locator: reference.locator?.trim() || "",
          evidenceQuality: reference.evidence_quality?.trim() || "",
        }))
        .filter((reference) => reference.sourceId || reference.sourceName),
    });
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: group.items.sort((a, b) => a.itemId.localeCompare(b.itemId)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label) || a.relationshipType.localeCompare(b.relationshipType));
}

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
