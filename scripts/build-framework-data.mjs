#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateGraphArtifacts } from "../tools/validators/federal-graph.mjs";
import { loadSourceRegistry } from "../tools/validators/source-registry.mjs";
import {
  ATLAS_NEIGHBORHOOD_SHARD_COUNT,
  buildAtlasNeighborhoodShards,
} from "../src/app/atlas-neighborhood.mjs";
import {
  catalogIdOf,
  defaultRelationshipClass,
  RELATIONSHIP_CLASSES,
} from "../src/app/structural-hierarchy.mjs";
import {
  ORGANIZING_STRUCTURE_SOURCE_ID,
  resolveCatalogPublicationIdentity,
  validateCatalogPublicationIdentity,
} from "../src/app/catalog-publication-identity.mjs";
import { buildConnectionInventory } from "../src/ui/lib/connectionInventory.mjs";
import {
  ancestorChain,
  buildAncestorGraph,
} from "../src/app/ancestor-path.mjs";
import {
  assertTrunkReachability,
  canonicalTrunkReachable,
  deriveAssessmentProcedureParents,
  deriveCciHierarchyParents,
  deriveEditorialSpine,
  deriveSyntheticCatalogs,
} from "./hierarchy-derivation.mjs";
import { createFederalGraphRuntime } from "../src/app/runtime.mjs";
import { validateAuthoritySpine } from "../src/app/authority-spine.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = join(ROOT, "data", "generated");
const RUNTIME_COLLECTIONS = [
  "sources",
  "nodes",
  "edges",
  "evidence",
  "graph-health",
  "atlas-spine",
];
const SHARDED_RUNTIME_COLLECTIONS = new Set(["nodes", "edges", "evidence"]);
const RUNTIME_COLLECTION_SHARD_COUNT = 64;
const GOVERNANCE_FILES = [
  "build-manifest.json",
  "source-manifests.json",
  "graph-diff-summary.json",
  "library-search.json",
  "atlas-neighborhood-manifest.json",
];
const ATLAS_NEIGHBORHOOD_DIR = join(GENERATED, "atlas-neighborhood");

const CATALOGS = [
  ["controls-800-53.json", "nist-800-53", "nist-oscal", "control"],
  [
    "800-53b-baselines.json",
    "nist-800-53b",
    "nist-800-53b-baselines",
    "baseline",
  ],
  ["fips-199.json", "fips-199", "nist-fips-199", "impact_category"],
  ["fips-200.json", "fips-200", "nist-fips-200", "requirement"],
  ["tasks-800-37.json", "nist-800-37", "nist-800-37-rev2", "rmf_step"],
  [
    "requirements-800-171-rev2.json",
    "nist-800-171-rev2",
    "nist-800-171-rev2",
    "requirement",
  ],
  ["requirements-800-171.json", "nist-800-171", "nist-oscal", "requirement"],
  [
    "requirements-800-172.json",
    "nist-800-172",
    "nist-800-172-rev3",
    "requirement",
  ],
  ["csf-subcategories.json", "csf-2", "nist-oscal", "requirement"],
  ["cmmc-practices.json", "cmmc-2", "dod-cmmc-rule", "program"],
  ["fedramp-baselines.json", "fedramp-rev5", "fedramp-rev5", "baseline"],
  ["cui-policy.json", "cui-policy", "isoo-cui-regulation", "policy"],
  ["ccis.json", "disa-cci", "disa-cci-list", "requirement"],
  ["ai-rmf.json", "nist-ai-rmf", "nist-ai-rmf-playbook", "requirement"],
  ["ssdf.json", "nist-ssdf", "nist-ssdf-oscal", "requirement"],
  ["dod-rai.json", "dod-rai", "dod-rai-toolkit", "requirement"],
  ["dod-zt.json", "dod-zt", "dod-zt-reference-architecture-v2", "requirement"],
  ["stig-rules.json", "disa-stig", "disa-stig-library", "stig_rule"],
  ["srg-requirements.json", "disa-srg", "disa-srg-library", "srg_requirement"],
  [
    "attack-techniques-enterprise.json",
    "mitre-attack",
    "mitre-attack-enterprise",
    "attack_technique",
  ],
  [
    "attack-techniques-ics.json",
    "mitre-attack-ics",
    "mitre-attack-ics",
    "attack_technique",
  ],
  [
    "d3fend-countermeasures.json",
    "mitre-d3fend",
    "mitre-d3fend-ontology",
    "defend_countermeasure",
  ],
];

/**
 * Declarative parent-tier table — the "branches" of the
 * roots > trunk > branches > twigs > leaves hierarchy.
 *
 * One row per catalog that publishes a grouping level between the catalog and its
 * records. Adding a catalog's tier is a ROW here, not another branch inside
 * buildNodes. Before this table, tier construction was gated behind
 * `catalogId === "nist-800-53"`, which left 88% of graph nodes with no parent even
 * though most catalogs carry their grouping value in the source data — measured in
 * docs/audits/grc-hierarchy-audit-2026-07-25.md.
 *
 * Row contract:
 *   nodeType     node_type for the tier node
 *   idPrefix     id shape is `<catalogId>:<idPrefix>-<key>`
 *   key          (record) => stable id fragment; null/empty skips the record
 *   title        (record) => human title for the tier
 *   label        (key, title) => node label; omit to use the title verbatim
 *   description  (record, title) => tier node description
 *   edgeDataset  locator prefix for the membership edge id
 *   rationale    (record, title) => why this record belongs to this tier
 *
 * A record whose key or title is missing is left unparented rather than filed
 * under a guessed tier. Catalogs absent from this table have no grouping level in
 * their upstream data (disa-cci, mitre-d3fend) or need a vocabulary decision
 * first; neither case is served by inventing a tier here.
 */
export const CATALOG_TIERS = {
  "nist-800-53": {
    nodeType: "family",
    idPrefix: "FAMILY",
    key: (record) => familyCodeFromControlId(record.id),
    title: (record) => record.family,
    label: (key, title) => `${key} ${title} Family`,
    description: (record, title) =>
      `${title} controls and enhancements from NIST SP 800-53 Rev. 5.`,
    edgeDataset: "800-53-family-membership",
    rationale: (record, title) =>
      `${record.id} is part of the ${title} family in NIST SP 800-53 Rev. 5.`,
  },
  "nist-800-171": {
    nodeType: "family",
    idPrefix: "FAMILY",
    key: (record) => slugKey(record.family),
    title: (record) => record.family,
    description: (record, title) =>
      `${title} security requirements from NIST SP 800-171 Rev. 3.`,
    edgeDataset: "800-171-family-membership",
    rationale: (record, title) =>
      `${record.id} is part of the ${title} family in NIST SP 800-171 Rev. 3.`,
  },
  "nist-800-171-rev2": {
    nodeType: "family",
    idPrefix: "FAMILY",
    key: (record) => slugKey(record.family),
    title: (record) => record.family,
    description: (record, title) =>
      `${title} security requirements from NIST SP 800-171 Rev. 2.`,
    edgeDataset: "800-171-rev2-family-membership",
    rationale: (record, title) =>
      `${record.id} is part of the ${title} family in NIST SP 800-171 Rev. 2.`,
  },
  "nist-800-172": {
    nodeType: "family",
    idPrefix: "FAMILY",
    key: (record) => slugKey(record.family),
    title: (record) => record.family,
    description: (record, title) =>
      `${title} enhanced security requirements from NIST SP 800-172.`,
    edgeDataset: "800-172-family-membership",
    rationale: (record, title) =>
      `${record.id} is part of the ${title} family in NIST SP 800-172.`,
  },
  // DISA publishes STIGs and SRGs as XCCDF Benchmarks — tools/importers/
  // disa-stig-adapter.mjs parses `parsed.Benchmark` — so both use one node type.
  "disa-stig": {
    nodeType: "benchmark",
    idPrefix: "BENCHMARK",
    key: (record) => slugKey(record.metadata?.benchmark_id),
    title: (record) => record.metadata?.benchmark_title,
    description: (record, title) =>
      record.metadata?.benchmark_description ||
      `${title} published in the DISA STIG library.`,
    edgeDataset: "disa-stig-benchmark-membership",
    rationale: (record, title) =>
      `${record.id} is a rule in the ${title} benchmark.`,
  },
  "disa-srg": {
    nodeType: "benchmark",
    idPrefix: "BENCHMARK",
    key: (record) => slugKey(record.metadata?.benchmark_id),
    title: (record) => record.metadata?.benchmark_title,
    description: (record, title) =>
      record.metadata?.benchmark_description ||
      `${title} published in the DISA SRG library.`,
    edgeDataset: "disa-srg-benchmark-membership",
    rationale: (record, title) =>
      `${record.id} is a requirement in the ${title} security requirements guide.`,
  },
  // CSF 2.0 is two tiers deep (Function > Category > Subcategory). The
  // Category row below is the record's immediate parent; `parentTier`
  // declares Category's own parent (Function), resolved from the same
  // record via tools/normalizers/oscal-normalize.mjs's walkCsf, which
  // threads both grouping levels from the official OSCAL catalog's
  // `class: "function"` / `class: "category"` groups (previously discarded).
  "csf-2": {
    nodeType: "category",
    idPrefix: "CATEGORY",
    key: (record) => record.category_id,
    title: (record) => record.category,
    description: (record, title) =>
      `${title} category of the NIST Cybersecurity Framework 2.0.`,
    edgeDataset: "csf-category-membership",
    rationale: (record, title) =>
      `${record.id} is a subcategory in the ${title} category of CSF 2.0.`,
    parentTier: {
      nodeType: "function",
      idPrefix: "FUNCTION",
      key: (record) => record.function_id,
      title: (record) => record.function,
      description: (record, title) =>
        `${title} function of the NIST Cybersecurity Framework 2.0.`,
      edgeDataset: "csf-function-membership",
      rationale: (record, title) =>
        `The ${title} function of CSF 2.0 organizes this category.`,
    },
  },
  // Both ATT&CK domains and D3FEND publish a top-level tactic taxonomy
  // (kill-chain tactics for ATT&CK, Model/Harden/Detect/Isolate/Deceive/
  // Evict/Restore for D3FEND) — one shared node type, same precedent as
  // "benchmark" above. Names/ids resolved upstream in the adapters
  // (tools/importers/mitre-attack-adapter.mjs, mitre-d3fend-adapter.mjs)
  // since neither ingested snapshot carried them as a flat field.
  // Sub-techniques resolve a tactic tier key too (same as SP 800-53 control
  // enhancements resolve a family key above) — they get BOTH the tactic-tier
  // edge and, via addAttackSubtechniqueMembershipEdges below, a second edge
  // from their parent technique. That is the established shape for
  // enhancement-style child records in this graph, not a new convention.
  "mitre-attack": {
    nodeType: "tactic",
    idPrefix: "TACTIC",
    key: (record) => record.metadata?.tactic_id,
    title: (record) => record.metadata?.tactic_title,
    description: (record, title) =>
      `${title} tactic of the MITRE ATT&CK Enterprise matrix.`,
    edgeDataset: "mitre-attack-tactic-membership",
    rationale: (record, title) =>
      `${record.id} is a technique under the ${title} tactic in MITRE ATT&CK.`,
  },
  "mitre-attack-ics": {
    nodeType: "tactic",
    idPrefix: "TACTIC",
    key: (record) => record.metadata?.tactic_id,
    title: (record) => record.metadata?.tactic_title,
    description: (record, title) =>
      `${title} tactic of the MITRE ATT&CK for ICS matrix.`,
    edgeDataset: "mitre-attack-ics-tactic-membership",
    rationale: (record, title) =>
      `${record.id} is a technique under the ${title} tactic in MITRE ATT&CK for ICS.`,
  },
  "mitre-d3fend": {
    nodeType: "tactic",
    idPrefix: "TACTIC",
    key: (record) => record.metadata?.tactic_id,
    title: (record) => record.metadata?.tactic_title,
    description: (record, title) =>
      `${title} tactic of the MITRE D3FEND defensive technique ontology.`,
    edgeDataset: "mitre-d3fend-tactic-membership",
    rationale: (record, title) =>
      `${record.id} is a defensive technique under the ${title} tactic in MITRE D3FEND.`,
  },
  // nist-ai-rmf (GOVERN-n/MAP-n/... categories), nist-ssdf (PO/PS/PW/RV
  // practice groups), and dod-rai (2 sections) each carry a real `family`
  // grouping value but naming the tier "family" would misrender as
  // "Control family: GOVERN-1" — owner decision 2026-07-25: one generic
  // "group" node type shared across all three, same precedent as
  // "benchmark"/"tactic" above. The tier node's own title still carries the
  // real category name; only the internal type tag is generic.
  "nist-ai-rmf": {
    nodeType: "group",
    idPrefix: "GROUP",
    key: (record) => slugKey(record.family),
    title: (record) => record.family,
    description: (record, title) =>
      `${title} group of the NIST AI Risk Management Framework Playbook.`,
    edgeDataset: "nist-ai-rmf-group-membership",
    rationale: (record, title) =>
      `${record.id} is part of the ${title} group in the NIST AI RMF Playbook.`,
  },
  "nist-ssdf": {
    nodeType: "group",
    idPrefix: "GROUP",
    key: (record) => slugKey(record.family),
    title: (record) => record.family,
    description: (record, title) =>
      `${title} practice group of NIST SP 800-218 (SSDF).`,
    edgeDataset: "nist-ssdf-group-membership",
    rationale: (record, title) =>
      `${record.id} is part of the ${title} practice group in the SSDF.`,
  },
  "dod-rai": {
    nodeType: "group",
    idPrefix: "GROUP",
    key: (record) => slugKey(record.family),
    title: (record) => record.family,
    description: (record, title) =>
      `${title} section of the DoD Responsible AI Toolkit.`,
    edgeDataset: "dod-rai-group-membership",
    rationale: (record, title) =>
      `${record.id} is part of the ${title} section of the DoD Responsible AI Toolkit.`,
  },
};

const MAPS = [
  ["800-53-to-csf.json", "nist-800-53", "csf-2", "nist-olir-csf2-to-sp800-53"],
  [
    "800-53-to-800-171.json",
    "nist-800-171",
    "nist-800-53",
    "nist-800-171-oscal-mappings",
  ],
  [
    "800-171-to-csf.json",
    "nist-800-171",
    "csf-2",
    "nist-olir-csf2-to-sp800-171",
  ],
  ["cci-to-800-53.json", "disa-cci", "nist-800-53", "disa-cci-nist-references"],
  // CCIs that DISA's own list never re-mapped past Rev 3/4, resolved through
  // NIST's published Rev 4 -> Rev 5 correspondences. See
  // scripts/fetch-800-53-rev4-rev5-crosswalk.mjs for what each edge is based on.
  [
    "cci-to-800-53-rev4.json",
    "disa-cci",
    "nist-800-53",
    "nist-800-53-rev4-rev5-crosswalk",
  ],
  [
    "stig-srg-to-cci.json",
    "disa-stig",
    "disa-cci",
    "disa-stig-srg-cci-references",
  ],
  [
    "800-53-to-dod-zt-overlays.json",
    "nist-800-53",
    "dod-zt",
    "dod-zt-overlays-2024",
  ],
  [
    "attack-to-d3fend.json",
    "mitre-attack",
    "mitre-d3fend",
    "mitre-d3fend-mappings",
  ],
  [
    "d3fend-to-800-53.json",
    "mitre-d3fend",
    "nist-800-53",
    "mitre-d3fend-mappings",
  ],
];

const CATALOG_SUMMARIES = new Map([
  [
    "nist-800-53",
    {
      sourceId: "nist-800-53",
      title: "SP 800-53 Rev. 5 Catalog",
      description:
        "Catalog summary for NIST SP 800-53 Rev. 5 security and privacy controls.",
    },
  ],
  [
    "csf-2",
    {
      sourceId: "nist-csf-2",
      title: "CSF 2.0 Catalog",
      description:
        "Catalog summary for the NIST Cybersecurity Framework 2.0 Functions, Categories, and Subcategories.",
    },
  ],
  [
    "disa-stig",
    {
      sourceId: "disa-stig-library",
      title: "DISA STIG Catalog",
      description:
        "Catalog summary for the DISA Security Technical Implementation Guide library.",
    },
  ],
  [
    "disa-srg",
    {
      sourceId: "disa-srg-library",
      title: "DISA SRG Catalog",
      description:
        "Catalog summary for the DISA Security Requirements Guide library.",
    },
  ],
  [
    "mitre-attack",
    {
      sourceId: "mitre-attack-enterprise",
      title: "MITRE ATT&CK Enterprise Catalog",
      description:
        "Catalog summary for the MITRE ATT&CK Enterprise adversary tactics and techniques knowledge base.",
    },
  ],
  [
    "mitre-attack-ics",
    {
      sourceId: "mitre-attack-ics",
      title: "MITRE ATT&CK ICS Catalog",
      description:
        "Catalog summary for the MITRE ATT&CK for Industrial Control Systems knowledge base.",
    },
  ],
  [
    "mitre-d3fend",
    {
      sourceId: "mitre-d3fend-ontology",
      title: "MITRE D3FEND Catalog",
      description:
        "Catalog summary for the MITRE D3FEND defensive technique ontology.",
    },
  ],
  [
    "nist-ai-rmf",
    {
      sourceId: "nist-ai-rmf-playbook",
      title: "NIST AI RMF Playbook Catalog",
      description:
        "Catalog summary for the NIST AI Risk Management Framework Playbook.",
    },
  ],
  [
    "nist-ssdf",
    {
      sourceId: "nist-ssdf",
      title: "NIST SSDF Catalog",
      description:
        "Catalog summary for NIST SP 800-218, the Secure Software Development Framework.",
    },
  ],
  [
    "dod-rai",
    {
      sourceId: "dod-rai-toolkit",
      title: "DoD Responsible AI Catalog",
      description:
        "Catalog summary for the DoD Responsible AI Toolkit.",
    },
  ],
  [
    "nist-800-171-rev2",
    {
      sourceId: "nist-800-171-rev2",
      title: "SP 800-171 Rev. 2 Catalog",
      description:
        "Catalog summary for NIST SP 800-171 Rev. 2 controlled unclassified information security requirements.",
    },
  ],
  [
    "nist-800-171",
    {
      sourceId: "nist-800-171",
      title: "SP 800-171 Rev. 3 Catalog",
      description:
        "Catalog summary for NIST SP 800-171 Rev. 3 controlled unclassified information security requirements.",
    },
  ],
  [
    "nist-800-172",
    {
      sourceId: "nist-800-172-rev3",
      title: "SP 800-172 Rev. 3 Catalog",
      description:
        "Catalog summary for NIST SP 800-172 Rev. 3 enhanced CUI security requirements.",
    },
  ],
  [
    "cmmc-2",
    {
      sourceId: "dod-cmmc-rule",
      title: "CMMC 2.0 Catalog",
      description:
        "Catalog summary for the Cybersecurity Maturity Model Certification 2.0 program levels.",
    },
  ],
  [
    "cui-policy",
    {
      sourceId: "isoo-cui-regulation",
      title: "CUI Program Catalog",
      description:
        "Catalog summary for the Controlled Unclassified Information program's designation categories.",
    },
  ],
  [
    "dod-zt",
    {
      sourceId: "dod-zt-reference-architecture-v2",
      title: "DoD Zero Trust Catalog",
      description:
        "DoD Zero Trust tenets, pillars, capabilities, activities, and control overlays from official DoD CIO publications.",
    },
  ],
]);

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const nodeId = (catalogId, recordId) => recordId.startsWith(`${catalogId}:`) ? recordId : `${catalogId}:${recordId}`;
const identifier = (value) => String(value).replace(/[^A-Za-z0-9:_-]+/g, "-");

// OLIR-style mapping files zero-pad SP 800-53 control IDs and write
// enhancements in paren notation ("AC-01", "CM-07(02)", "AC-02.3"), while
// ingested catalog nodes use unpadded dot notation ("AC-1", "CM-7.2",
// "AC-2.3"). Normalize at the mapping read site so endpoints resolve against
// the node set; anything that is not an 800-53-style control ID (CSF
// "GV.OC-03", CCI "CCI-000015", 800-171 "3.1.1") passes through unchanged.
export function normalizeControlId(recordId) {
  const match = String(recordId ?? "").match(
    /^([A-Za-z]{2})-0*(\d+)(?:\.0*(\d+)|\(0*(\d+)\))?$/,
  );
  if (!match) return recordId;
  const enhancement = match[3] ?? match[4];
  return `${match[1]}-${match[2]}${enhancement != null ? `.${enhancement}` : ""}`;
}

function relationshipId(prefix, sourceNodeId, targetNodeId, relationshipType) {
  return identifier(
    `${prefix}:${relationshipType}:${sourceNodeId}:${targetNodeId}`,
  );
}

function nodeType(defaultType, recordId) {
  return defaultType === "control" && String(recordId).includes(".")
    ? "control_enhancement"
    : defaultType;
}

function familyCodeFromControlId(recordId) {
  return String(recordId || "").match(/^([A-Z]{2})-/)?.[1] || null;
}

/** Stable, id-safe fragment for a tier key derived from free text. */
function slugKey(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return (
    text
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase() || null
  );
}

/**
 * Resolve a record's parent tier from CATALOG_TIERS, or null when the catalog has
 * no tier or this record does not carry the grouping value. Never guesses.
 */
function tierFor(catalogId, record) {
  const tier = CATALOG_TIERS[catalogId];
  if (!tier) return null;
  const key = tier.key(record);
  const title = tier.title(record);
  if (!key || !title) return null;
  return {
    tier,
    key,
    title,
    nodeId: nodeId(catalogId, `${tier.idPrefix}-${key}`),
    itemId: `${tier.idPrefix}-${key}`,
  };
}

/**
 * Resolve a tier's own parent tier (e.g. CSF Category's parent Function),
 * when the catalog's CATALOG_TIERS row declares one via `parentTier`. Most
 * catalogs are one tier deep and have none.
 */
function parentTierFor(catalogId, record, tier) {
  const parent = tier.parentTier;
  if (!parent) return null;
  const key = parent.key(record);
  const title = parent.title(record);
  if (!key || !title) return null;
  return {
    tier: parent,
    key,
    title,
    nodeId: nodeId(catalogId, `${parent.idPrefix}-${key}`),
    itemId: `${parent.idPrefix}-${key}`,
  };
}

/** The outermost tier a record's chain resolves to — what hangs off the catalog. */
function topTierFor(catalogId, record) {
  const resolved = tierFor(catalogId, record);
  if (!resolved) return null;
  return parentTierFor(catalogId, record, resolved.tier) || resolved;
}

function normalize53BBaselineId(value) {
  const label = String(value || "").toUpperCase();
  if (label.includes("PRIVACY")) return "PRIVACY";
  if (label.includes("MODERATE")) return "MODERATE";
  if (label.includes("HIGH")) return "HIGH";
  if (label.includes("LOW")) return "LOW";
  return null;
}

function assessmentNodeId(recordId) {
  return nodeId("nist-800-53a", recordId);
}

// §8 merged provenance: some catalogs derive from the SAME underlying official
// file as another (e.g. 800-53A assessment procedures are embedded in the
// 800-53 rev5 OSCAL catalog; the 800-171 catalog and its OSCAL mapping are one
// file; the CCI-to-NIST references are the CCI list). Node/edge provenance must
// cite the ONE artifact that carries real evidence, not a redundant twin.
const ARTIFACT_ALIASES = {
  'artifact-nist-800-53a-assessment-procedures': 'artifact-nist-800-53',
  'artifact-nist-800-171': 'artifact-nist-800-171-oscal-mappings',
  'artifact-disa-cci-nist-references': 'artifact-disa-cci-list',
};
function aliasArtifact(id) {
  return ARTIFACT_ALIASES[id] || id;
}

// spec §3: every node stores publication_source_id, artifact_ids, and
// provenance_assertions[]. Shared by pushEligibleNode (regular catalog
// content) and the organizing-spine's trunk/limb/synthetic-catalog nodes
// (applyOrganizingSpine) so neither path ships a node with no provenance.
function attachNodeProvenance(node, sourceId, registry) {
  const source = registry.byId.get(sourceId);
  node.publication_source_id = sourceId;
  node.artifact_ids = node.artifact_ids || [
    aliasArtifact(node.metadata?.primary_artifact_id || `artifact-${sourceId}`),
    ...(node.metadata?.contributing_artifact_ids || []).map(aliasArtifact),
    ...(node.metadata?.enrichment_artifact_ids || []).map(aliasArtifact),
  ];
  node.provenance_assertions = node.provenance_assertions || [
    {
      authority_class: source?.authority_class || "publisher",
      publication_source_id: sourceId,
      artifact_id: aliasArtifact(`artifact-${sourceId}`),
      source_locator: node.metadata?.source_locator || `${sourceId}#${node.id}`,
      version: source?.version || "1.0",
      snapshot_date: source?.retrieved_at || "2026-08-05",
    },
  ];
  return node;
}

function pushEligibleNode(state, registry, node, sourceId) {
  const source = registry.byId.get(sourceId);
  if (!source?.graph_eligible) {
    state.findings.push({
      id: `finding:ineligible-node:${node.id}`,
      finding_type: "ineligible_source_node",
      severity: "warning",
      source_id: sourceId,
      subject_id: node.id,
      message: `Node ${node.id} was not published because its defining source is not graph eligible.`,
    });
    return;
  }
  attachNodeProvenance(node, sourceId, registry);
  state.nodes.push(node);
}

function buildAssessmentNode(record, ingestionSourceId) {
  const assessment = record.metadata?.assessment;
  if (!assessment?.source_key) return null;
  return {
    id: assessmentNodeId(record.id),
    node_type: "assessment_procedure",
    label: `${record.id} Assessment Procedure`,
    source_id: assessment.source_key,
    lifecycle_status: record.status === "deprecated" ? "deprecated" : "active",
    // W1.3a: the assessment procedure is generated from this same control/
    // enhancement record, so record.id IS its parent's item_id by construction
    // — no join needed, no risk of a stale match.
    metadata: {
      catalog_id: "nist-800-53a",
      ingestion_source_id: ingestionSourceId,
      item_id: record.id,
      title: `${record.title || record.id} Assessment Procedure`,
      description:
        `Assessment procedures for ${record.id} ${record.title || ""}`.trim(),
      family: record.family || "",
      type: "assessment_procedure",
      assessment_methods: assessment.methods.map((entry) => entry.method),
      assessment_method_details: assessment.methods,
      assessment_objects: assessment.objects,
      assessment_objectives: assessment.objectives,
      procedure_text: assessment.procedure_text || "",
      nist_control: record.id,
      references: null,
    },
  };
}

function buildCatalogSummaryNode(
  catalogId,
  publicationSourceId,
  ingestionSourceId,
  summary,
) {
  return {
    id: nodeId(catalogId, "CATALOG"),
    node_type: "catalog",
    label: summary.title,
    source_id: publicationSourceId,
    lifecycle_status: "active",
    metadata: {
      catalog_id: catalogId,
      ingestion_source_id: ingestionSourceId,
      item_id: "CATALOG",
      title: summary.title,
      description: summary.description,
      family: "Catalog",
      baselines: null,
      nist_800_53b_baselines: null,
      nist_control: null,
      type: "catalog_summary",
      references: null,
    },
  };
}

function nodeSeverity(record) {
  return record.severity || record.cat || record.metadata?.severity || null;
}

export function lifecycleStatus(record) {
  if (record.status === "withdrawn") return "withdrawn";
  if (record.status === "deprecated") return "deprecated";
  return "active";
}

/** Add a resolved tier's node to the dedup map, once per distinct tier node id. */
function registerTierNode(
  tierNodes,
  catalogId,
  resolved,
  publicationSourceId,
  ingestionSourceId,
  record,
) {
  if (!resolved || tierNodes.has(resolved.nodeId)) return;
  const { tier, key, title, nodeId: tierNodeId, itemId } = resolved;
  tierNodes.set(tierNodeId, {
    id: tierNodeId,
    node_type: tier.nodeType,
    label: tier.label ? tier.label(key, title) : title,
    source_id: publicationSourceId,
    lifecycle_status: "active",
    metadata: {
      catalog_id: catalogId,
      ingestion_source_id: ingestionSourceId,
      item_id: itemId,
      title,
      description: tier.description(record, title),
      family: title,
      baselines: null,
      nist_800_53b_baselines: null,
      nist_control: null,
      type: tier.nodeType === "family" ? "control_family" : tier.nodeType,
      references: null,
    },
  });
}

function buildNodes(registry) {
  const state = { nodes: [], findings: [] };
  const tierNodes = new Map();
  for (const [filename, catalogId, defaultSourceId, defaultType] of CATALOGS) {
    const path = join(ROOT, "data", filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const record of document.records || []) {
      const ingestionSourceId = record.source?.key || defaultSourceId;
      const identity = resolveCatalogPublicationIdentity({
        catalogId,
        ingestionSourceId,
        sourceById: registry.byId,
      });
      const id = nodeId(catalogId, record.id);
      if (!identity) {
        state.findings.push({
          id: `finding:missing-publication-identity:${id}`,
          finding_type: "missing_publication_identity",
          severity: "error",
          source_id: ingestionSourceId,
          subject_id: id,
          message: `Node ${id} was not published because its exact publication identity is unavailable.`,
        });
        continue;
      }
      const sourceId = identity.publicationSourceId;
      const resolvedTier = tierFor(catalogId, record);
      pushEligibleNode(
        state,
        registry,
        {
          id,
          node_type: record.type?.startsWith("zt_")
            ? record.type
            : nodeType(defaultType, record.id),
          // DISA CCI records carry their own identifier as the title, so the
          // naive "<id> <title>" join printed "CCI-000015 CCI-000015" on every
          // one of them (breadcrumbs, search results, Atlas labels).
          label:
            record.title && !String(record.title).startsWith(String(record.id))
              ? `${record.id} ${record.title}`
              : String(record.title || record.id),
          source_id: sourceId,
          lifecycle_status: lifecycleStatus(record),
          metadata: {
            catalog_id: catalogId,
            ingestion_source_id: ingestionSourceId,
            item_id: record.id,
            title: record.title || record.id,
            description: record.description || "",
            // A record's grouping label IS its parent tier's title — prefer it
            // over the raw record.family, which for some catalogs (e.g. ATT&CK)
            // is a machine slug ("command-and-control") kept for matching, not
            // display. Catalogs whose tier title already equals record.family
            // (800-53, 800-171, AI-RMF, SSDF, ...) see no change; STIG/SRG,
            // whose raw record.family is empty, keep resolving through the tier.
            family:
              resolvedTier?.title || record.family || record.group || "",
            severity: nodeSeverity(record),
            baselines:
              record.fedramp_baselines || record.metadata?.baselines || null,
            nist_800_53b_baselines:
              record.metadata?.nist_800_53b_baselines || null,
            nist_control: record.nist_control || null,
            type: record.type || null,
            references: record.references || null,
            check_text: record.check_text || null,
            fix_text: record.fix_text || null,
            superseded_by: record.metadata?.superseded_by || null,
            discussion: record.metadata?.discussion || null,
            related_controls: record.metadata?.related_controls || null,
            implementation_examples: record.metadata?.implementation_examples || null,
            informative_references: record.metadata?.informative_references || null,
            primary_artifact_id: record.metadata?.primary_artifact_id || null,
            contributing_artifact_ids: record.metadata?.contributing_artifact_ids || null,
            enrichment_artifact_ids: record.metadata?.enrichment_artifact_ids || null,
            // Duplicated onto the control's own node (not just the separate
            // assessment_procedure node buildAssessmentNode below emits) so a
            // viewer sees it without a full-graph fetch: atlas-neighborhood
            // shards only carry a compact id/type/title tuple for counterpart
            // nodes (src/app/atlas-neighborhood.mjs compactNode), so the
            // assessment_procedure counterpart's rich metadata is invisible
            // from the control's own record page. The control itself is
            // always the shard's center_node, which keeps full metadata.
            assessment_objectives: record.metadata?.assessment?.objectives || null,
            assessment_method_details: record.metadata?.assessment?.methods || null,
          },
        },
        sourceId,
      );

      if (catalogId === "nist-800-53") {
        const assessmentNode = buildAssessmentNode(record, ingestionSourceId);
        if (assessmentNode) {
          pushEligibleNode(
            state,
            registry,
            assessmentNode,
            assessmentNode.source_id,
          );
        }

      }

      registerTierNode(
        tierNodes,
        catalogId,
        resolvedTier,
        sourceId,
        ingestionSourceId,
        record,
      );
      if (resolvedTier) {
        registerTierNode(
          tierNodes,
          catalogId,
          parentTierFor(catalogId, record, resolvedTier.tier),
          sourceId,
          ingestionSourceId,
          record,
        );
      }
    }

    const summary = CATALOG_SUMMARIES.get(catalogId);
    if (summary && (document.records || []).length) {
      const identity = resolveCatalogPublicationIdentity({
        catalogId,
        ingestionSourceId: defaultSourceId,
        sourceById: registry.byId,
      });
      if (!identity) continue;
      pushEligibleNode(
        state,
        registry,
        buildCatalogSummaryNode(
          catalogId,
          identity.publicationSourceId,
          identity.ingestionSourceId,
          summary,
        ),
        summary.sourceId,
      );
    }
  }

  for (const tierNode of tierNodes.values()) {
    pushEligibleNode(state, registry, tierNode, tierNode.source_id);
  }

  return {
    nodes: state.nodes.sort((a, b) => a.id.localeCompare(b.id)),
    findings: state.findings,
  };
}

function addPublishedEdge(state, registry, nodeIds, payload) {
  const source = registry.byId.get(payload.sourceId);
  if (
    !source?.graph_eligible ||
    !nodeIds.has(payload.sourceNodeId) ||
    !nodeIds.has(payload.targetNodeId)
  ) {
    state.findings.push({
      id: `finding:blocked-relationship:${payload.subjectId}`,
      finding_type: "blocked_relationship",
      severity: "warning",
      source_id: payload.sourceId,
      subject_id: payload.subjectId,
      message: `Relationship ${payload.subjectId} was blocked because its source or endpoint is not graph eligible.`,
    });
    return;
  }

  const edgeId = `edge:${payload.subjectId}`;
  const evidenceId = `evidence:${payload.subjectId}`;
  const publicationStatus = payload.publicationStatus || "published";
  const provenanceClass = payload.provenanceClass || source.provenance_class;

  let rationaleVal = payload.rationale || "";
  let warningVal = payload.warning || null;
  let ruleIdVal = payload.inferenceRuleId || null;

  if (publicationStatus === "candidate" || provenanceClass === "inferred") {
    if (!ruleIdVal) ruleIdVal = "inferred-mapping-rule";
    if (!warningVal)
      warningVal = "Candidate relationship inferred from adjacent metadata.";
    if (!rationaleVal) {
      rationaleVal = `Inferred relationship between ${payload.sourceNodeId} and ${payload.targetNodeId}.`;
    }
  }

  const sourceRefs = payload.sourceRefs || [
    {
      source_id: payload.sourceId,
      ref_type: payload.evidenceQuality || "primary",
      locator: payload.locator || `${payload.sourceId}#relationship`,
    },
  ];

  state.evidence.push({
    id: evidenceId,
    source_id: payload.sourceId,
    source_version: payload.sourceVersion || source.version,
    locator: payload.locator,
    retrieved_at: payload.retrievedAt || source.retrieved_at,
    checksum: payload.checksum || source.checksum,
    evidence_quality: payload.evidenceQuality || "primary",
    ingestion_source_id: payload.ingestionSourceId || payload.sourceId,
  });

  state.edges.push({
    id: edgeId,
    source_node_id: payload.sourceNodeId,
    target_node_id: payload.targetNodeId,
    relationship_type: payload.relationshipType,
    raw_relationship_type: payload.rawRelationshipType || payload.relationshipType,
    relationship_class:
      payload.relationshipClass ||
      defaultRelationshipClass(payload.relationshipType),
    mapping_model:
      payload.mappingModel ||
      payload.relationshipClass ||
      defaultRelationshipClass(payload.relationshipType),
    source_artifact_id: aliasArtifact(payload.sourceArtifactId || `artifact-${payload.sourceId}`),
    source_locator: payload.locator || `${payload.sourceId}#relationship`,
    status: payload.status || "active",
    authority_class: payload.authorityClass || source?.authority_class || "publisher",
    provenance_class: provenanceClass,
    confidence:
      payload.confidence ||
      (publicationStatus === "candidate" ? "inferred_high" : "direct"),
    publication_status: publicationStatus,
    evidence_ids: [evidenceId],
    display_label:
      payload.displayLabel ||
      `${payload.sourceNodeId} ${payload.relationshipType} ${payload.targetNodeId}`,
    warning: warningVal,
    inference_rule_id: ruleIdVal,
    rationale: rationaleVal,
    source_refs: sourceRefs,
  });
}

function addDocumentRelationshipEdges(state, registry, nodeIds) {
  for (const [filename, catalogId, defaultSourceId] of CATALOGS) {
    const path = join(ROOT, "data", filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const record of document.records || []) {
      const ingestionSourceId = record.source?.key || defaultSourceId;
      const identity = resolveCatalogPublicationIdentity({
        catalogId,
        ingestionSourceId,
        sourceById: registry.byId,
      });
      if (!identity) continue;
      for (const relationship of record.metadata?.relationships || []) {
        const sourceNodeId = nodeId(catalogId, record.id);
        const targetNodeId = nodeId(
          relationship.target_catalog,
          relationship.target_id,
        );
        const subjectId = relationshipId(
          filename.replace(".json", ""),
          sourceNodeId,
          targetNodeId,
          relationship.relationship_type || "references",
        );
        addPublishedEdge(state, registry, nodeIds, {
          subjectId,
          sourceId: identity.publicationSourceId,
          ingestionSourceId,
          sourceNodeId,
          targetNodeId,
          relationshipType: relationship.relationship_type || "references",
          locator: `${record.source?.locator || `${filename}#${record.id}`}->${relationship.target_catalog}:${relationship.target_id}`,
          retrievedAt: record.source?.snapshot_date,
          rationale:
            relationship.rationale ||
            record.description ||
            document.provenance ||
            "",
        });
      }
    }
  }
}

/**
 * Join every record to its parent tier with a structural `contains` edge.
 * Driven entirely by CATALOG_TIERS, so a catalog
 * gains its branch level by adding a row, not by editing this function.
 */
function addTierMembershipEdges(state, registry, nodeIds) {
  for (const [filename, catalogId, defaultSourceId] of CATALOGS) {
    if (!CATALOG_TIERS[catalogId]) continue;
    const path = join(ROOT, "data", filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const record of document.records || []) {
      const ingestionSourceId = record.source?.key || defaultSourceId;
      const identity = resolveCatalogPublicationIdentity({
        catalogId,
        ingestionSourceId,
        sourceById: registry.byId,
      });
      if (!identity) continue;
      const resolved = tierFor(catalogId, record);
      if (!resolved) continue;
      const { tier, title, nodeId: sourceNodeId } = resolved;
      const targetNodeId = nodeId(catalogId, record.id);
      const subjectId = relationshipId(
        tier.edgeDataset,
        sourceNodeId,
        targetNodeId,
        "contains",
      );
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: identity.publicationSourceId,
        ingestionSourceId,
        sourceNodeId,
        targetNodeId,
        relationshipType: "contains",
        relationshipClass: RELATIONSHIP_CLASSES.structural,
        confidence: "derived",
        locator: record.source?.locator || `${filename}#${record.id}`,
        retrievedAt: record.source?.snapshot_date,
        rationale: tier.rationale(record, title),
      });
    }
  }
}

/**
 * Join a tier to ITS parent tier (e.g. CSF Category -> Function) for catalogs
 * whose CATALOG_TIERS row declares `parentTier`. Most catalogs are one tier
 * deep and have none, so this is a no-op for them.
 */
function addTierParentEdges(state, registry, nodeIds) {
  const seen = new Set();
  for (const [filename, catalogId, defaultSourceId] of CATALOGS) {
    const tier = CATALOG_TIERS[catalogId];
    if (!tier?.parentTier) continue;
    const path = join(ROOT, "data", filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const record of document.records || []) {
      const ingestionSourceId = record.source?.key || defaultSourceId;
      const identity = resolveCatalogPublicationIdentity({
        catalogId,
        ingestionSourceId,
        sourceById: registry.byId,
      });
      if (!identity) continue;
      const resolved = tierFor(catalogId, record);
      if (!resolved) continue;
      const parent = parentTierFor(catalogId, record, resolved.tier);
      if (!parent) continue;
      const subjectId = relationshipId(
        parent.tier.edgeDataset,
        parent.nodeId,
        resolved.nodeId,
        "contains",
      );
      if (seen.has(subjectId)) continue;
      seen.add(subjectId);
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: identity.publicationSourceId,
        ingestionSourceId,
        sourceNodeId: parent.nodeId,
        targetNodeId: resolved.nodeId,
        relationshipType: "contains",
        relationshipClass: RELATIONSHIP_CLASSES.structural,
        confidence: "derived",
        locator: record.source?.locator || `${filename}#${record.id}`,
        retrievedAt: record.source?.snapshot_date,
        rationale: parent.tier.rationale(record, parent.title),
      });
    }
  }
}

/**
 * Every catalog that declares a CATALOG_TIERS row gets its outermost tier
 * (the parent tier when one is declared, else the tier itself) linked to the
 * catalog's own summary node, so nothing hangs disconnected above the tree —
 * this is what closes docs/audits/grc-hierarchy-audit-2026-07-25.md's
 * "family (20) has no parent itself" finding for every tiered catalog, not
 * only SP 800-53.
 */
function addTierToCatalogEdges(state, registry, nodeIds) {
  const seen = new Set();
  for (const [filename, catalogId, defaultSourceId] of CATALOGS) {
    if (!CATALOG_TIERS[catalogId]) continue;
    const catalogNodeId = nodeId(catalogId, "CATALOG");
    if (!nodeIds.has(catalogNodeId)) continue;
    const path = join(ROOT, "data", filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const record of document.records || []) {
      const ingestionSourceId = record.source?.key || defaultSourceId;
      const identity = resolveCatalogPublicationIdentity({
        catalogId,
        ingestionSourceId,
        sourceById: registry.byId,
      });
      if (!identity) continue;
      const top = topTierFor(catalogId, record);
      if (!top) continue;
      const subjectId = relationshipId(
        `${catalogId}-catalog-membership`,
        catalogNodeId,
        top.nodeId,
        "contains",
      );
      if (seen.has(subjectId)) continue;
      seen.add(subjectId);
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: identity.publicationSourceId,
        ingestionSourceId,
        sourceNodeId: catalogNodeId,
        targetNodeId: top.nodeId,
        relationshipType: "contains",
        relationshipClass: RELATIONSHIP_CLASSES.structural,
        confidence: "derived",
        locator: record.source?.locator || `${filename}#${record.id}`,
        retrievedAt: record.source?.snapshot_date,
        rationale: `${top.title} is organized under the ${catalogId} catalog.`,
      });
    }
  }
}

function baseControlIdFromEnhancementId(recordId) {
  const id = String(recordId || "");
  const dotIndex = id.indexOf(".");
  return dotIndex === -1 ? null : id.slice(0, dotIndex);
}

function addEnhancementMembershipEdges(state, registry, nodeIds) {
  const path = join(ROOT, "data", "controls-800-53.json");
  if (!existsSync(path)) return;
  const document = readJson(path);
  const recordIds = new Set(
    (document.records || []).map((record) => record.id),
  );
  const existingEdgeIds = new Set(state.edges.map((edge) => edge.id));
  for (const record of document.records || []) {
    if (!String(record.id).includes(".")) continue;
    const baseId = baseControlIdFromEnhancementId(record.id);
    if (!baseId || !recordIds.has(baseId)) continue;
    const sourceNodeId = nodeId("nist-800-53", baseId);
    const targetNodeId = nodeId("nist-800-53", record.id);
    const subjectId = relationshipId(
      "800-53-enhancement-membership",
      sourceNodeId,
      targetNodeId,
      "contains",
    );
    if (existingEdgeIds.has(`edge:${subjectId}`)) continue;
    addPublishedEdge(state, registry, nodeIds, {
      subjectId,
      sourceId: "nist-800-53",
      ingestionSourceId: record.source?.key || "nist-oscal",
      sourceNodeId,
      targetNodeId,
      relationshipType: "contains",
      relationshipClass: RELATIONSHIP_CLASSES.structural,
      confidence: "derived",
      locator: record.source?.locator || `controls-800-53.json#${record.id}`,
      retrievedAt: record.source?.snapshot_date,
      rationale: `${record.id} is a control enhancement of ${baseId} in SP 800-53 Rev. 5.`,
    });
  }
}

/**
 * Nest ATT&CK sub-techniques (e.g. T1055.001) under their parent technique
 * (T1055) — the same enhancement-of-a-base-record pattern as SP 800-53
 * above, driven by `metadata.parent_technique_id`
 * (tools/importers/mitre-attack-adapter.mjs), not string-splitting the id
 * here, since the STIX bundle's own `x_mitre_is_subtechnique` flag is the
 * authoritative signal.
 */
function addAttackSubtechniqueMembershipEdges(state, registry, nodeIds) {
  for (const [filename, catalogId, defaultSourceId] of [
    ["attack-techniques-enterprise.json", "mitre-attack", "mitre-attack-enterprise"],
    ["attack-techniques-ics.json", "mitre-attack-ics", "mitre-attack-ics"],
  ]) {
    const path = join(ROOT, "data", filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    const recordIds = new Set((document.records || []).map((record) => record.id));
    for (const record of document.records || []) {
      const parentId = record.metadata?.parent_technique_id;
      if (!parentId || !recordIds.has(parentId)) continue;
      const sourceNodeId = nodeId(catalogId, parentId);
      const targetNodeId = nodeId(catalogId, record.id);
      const subjectId = relationshipId(
        `${catalogId}-subtechnique-membership`,
        sourceNodeId,
        targetNodeId,
        "contains",
      );
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: record.source?.key || defaultSourceId,
        sourceNodeId,
        targetNodeId,
        relationshipType: "contains",
        relationshipClass: RELATIONSHIP_CLASSES.structural,
        confidence: "derived",
        locator: record.source?.locator || `${filename}#${record.id}`,
        retrievedAt: record.source?.snapshot_date,
        rationale: `${record.id} is a sub-technique of ${parentId}.`,
      });
    }
  }
}

function addBaselineMembershipEdges(state, registry, nodeIds) {
  const path = join(ROOT, "data", "controls-800-53.json");
  if (!existsSync(path)) return;
  const document = readJson(path);
  for (const record of document.records || []) {
    const baselineIds = [
      ...new Set(
        (record.metadata?.nist_800_53b_baselines || [])
          .map(normalize53BBaselineId)
          .filter(Boolean),
      ),
    ];
    for (const baselineId of baselineIds) {
      const sourceNodeId = nodeId("nist-800-53b", baselineId);
      const targetNodeId = nodeId("nist-800-53", record.id);
      const subjectId = relationshipId(
        "800-53b-membership",
        sourceNodeId,
        targetNodeId,
        "selects",
      );
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: "nist-800-53b-baselines",
        sourceNodeId,
        targetNodeId,
        relationshipType: "selects",
        relationshipClass: RELATIONSHIP_CLASSES.applicability,
        locator: `sp800-53b#${baselineId}:${record.id}`,
        rationale: `NIST SP 800-53B ${baselineId} baseline membership includes ${record.id}.`,
      });
    }
  }
}

function addFedrampMembershipEdges(state, registry, nodeIds) {
  const path = join(ROOT, "data", "fedramp-baselines.json");
  if (!existsSync(path)) return;
  const document = readJson(path);
  for (const record of document.records || []) {
    const sourceNodeId = nodeId("fedramp-rev5", record.id);
    for (const controlId of record.metadata?.controls || []) {
      const targetNodeId = nodeId("nist-800-53", controlId);
      const subjectId = relationshipId(
        "fedramp-membership",
        sourceNodeId,
        targetNodeId,
        "selects",
      );
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: record.source?.key || "fedramp-rev5",
        sourceNodeId,
        targetNodeId,
        relationshipType: "selects",
        relationshipClass: RELATIONSHIP_CLASSES.applicability,
        locator: `${record.source?.locator || `fedramp#${record.id}`}:${controlId}`,
        retrievedAt: record.source?.snapshot_date,
        rationale: `${record.title} includes ${controlId} in the published FedRAMP Rev. 5 baseline membership.`,
      });
    }
  }
}

function addAssessmentEdges(state, registry, nodeIds) {
  const path = join(ROOT, "data", "controls-800-53.json");
  if (!existsSync(path)) return;
  const document = readJson(path);
  for (const record of document.records || []) {
    const sourceId = record.metadata?.assessment?.source_key;
    if (!sourceId) continue;
    const sourceNodeId = assessmentNodeId(record.id);
    const targetNodeId = nodeId("nist-800-53", record.id);
    const subjectId = relationshipId(
      "800-53a-assessment",
      sourceNodeId,
      targetNodeId,
      "assesses",
    );
    addPublishedEdge(state, registry, nodeIds, {
      subjectId,
      sourceId,
      sourceNodeId,
      targetNodeId,
      relationshipType: "assesses",
      locator: `sp800-53a#${record.id}`,
      rationale: `NIST SP 800-53A assessment procedures for ${record.id} assess the corresponding control.`,
      displayLabel: `${sourceNodeId} assesses ${targetNodeId}`,
    });
  }
}

function addCmmcProgramEdges(state, registry, nodeIds, nodes) {
  const path = join(ROOT, "data", "cmmc-practices.json");
  if (!existsSync(path)) return;
  const document = readJson(path);
  const rev2Requirements = nodes.filter(
    (node) =>
      node.metadata?.catalog_id === "nist-800-171-rev2" &&
      node.node_type === "requirement",
  );
  for (const record of document.records || []) {
    const sourceNodeId = nodeId("cmmc-2", record.id);
    if (record.metadata?.requires_800_171_rev === "rev2") {
      for (const requirement of rev2Requirements) {
        const subjectId = relationshipId(
          "cmmc-level2",
          sourceNodeId,
          requirement.id,
          "requires",
        );
        addPublishedEdge(state, registry, nodeIds, {
          subjectId,
          sourceId: record.source?.key || "dod-cmmc-rule",
          sourceNodeId,
          targetNodeId: requirement.id,
          relationshipType: "requires",
          confidence: "derived",
          locator: record.source?.locator || "32-CFR-170.14(c)(3)",
          retrievedAt: record.source?.snapshot_date,
          rationale: `${record.title} uses the 110 requirements in NIST SP 800-171 Rev. 2.`,
        });
      }
    }
    if (record.metadata?.requires_800_172) {
      for (const targetNodeId of [
        "nist-800-171-rev2:CATALOG",
        "nist-800-172:CATALOG",
      ]) {
        const subjectId = relationshipId(
          "cmmc-level3",
          sourceNodeId,
          targetNodeId,
          "depends_on",
        );
        addPublishedEdge(state, registry, nodeIds, {
          subjectId,
          sourceId: record.source?.key || "dod-cmmc-rule",
          sourceNodeId,
          targetNodeId,
          relationshipType: "depends_on",
          confidence: "derived",
          locator: record.source?.locator || "32-CFR-170.14(c)(4)",
          retrievedAt: record.source?.snapshot_date,
          rationale: `${record.title} depends on SP 800-171 Rev. 2 and SP 800-172 requirement context.`,
        });
      }
    }
  }

  // Every CMMC level is a real child of the CMMC 2.0 program, regardless of
  // which external requirement set it also `requires` — Level 1 requires
  // only the 15 FAR 52.204-21 basic safeguarding requirements, a catalog
  // this app does not ingest, so it was the one level with no edge at all
  // (isolated) before this. Parenting all three under the catalog fixes
  // that honestly instead of fabricating a link to an uningested source.
  const catalogNodeId = "cmmc-2:CATALOG";
  for (const record of document.records || []) {
    const targetNodeId = nodeId("cmmc-2", record.id);
    const subjectId = relationshipId(
      "cmmc-program-membership",
      catalogNodeId,
      targetNodeId,
      "contains",
    );
    addPublishedEdge(state, registry, nodeIds, {
      subjectId,
      sourceId: record.source?.key || "dod-cmmc-rule",
      sourceNodeId: catalogNodeId,
      targetNodeId,
      relationshipType: "contains",
      relationshipClass: RELATIONSHIP_CLASSES.structural,
      confidence: "derived",
      locator: record.source?.locator || "32-CFR-170.14",
      retrievedAt: record.source?.snapshot_date,
      rationale: `${record.title} is one of the three CMMC 2.0 program levels.`,
    });
  }
}

function addDodZeroTrustHierarchyEdges(state, registry, nodeIds) {
  const path = join(ROOT, "data", "dod-zt.json");
  if (!existsSync(path)) return;
  const document = readJson(path);
  for (const record of document.records || []) {
    if (record.type === "zt_overlay_catalog") {
      // The overlay reference document itself (source of the 799 SP 800-53
      // <-> ZT capability `supports` mappings below) — a sibling of the
      // tenets, not a container for the capabilities it documents.
      const catalogNodeId = "dod-zt:CATALOG";
      const targetNodeId = nodeId("dod-zt", record.id);
      const subjectId = relationshipId(
        "dod-zt-overlay-catalog-membership",
        catalogNodeId,
        targetNodeId,
        "contains",
      );
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: record.source?.key || "dod-zt-overlays-2024",
        sourceNodeId: catalogNodeId,
        targetNodeId,
        relationshipType: "contains",
        relationshipClass: RELATIONSHIP_CLASSES.structural,
        confidence: "derived",
        locator: record.source?.locator || `dod-zt.json#${record.id}`,
        retrievedAt: record.source?.snapshot_date,
        rationale: `${record.title} is part of the DoD Zero Trust reference material.`,
      });
      continue;
    }
    if (record.type === "zt_tenet") {
      // Tenets are cross-cutting principles that apply across every pillar in
      // the DoD Zero Trust Reference Architecture, not a subdivision of any
      // one pillar (no source field ties a specific tenet to specific
      // pillars) — so "tenet includes pillar" would fabricate a containment
      // relationship the data doesn't support. What the audit actually
      // measured as the bug is that tenets had zero edges at all; the honest
      // fix is parenting them to the catalog as their own sibling
      // collection, alongside (not above) the pillars.
      const catalogNodeId = "dod-zt:CATALOG";
      const targetNodeId = nodeId("dod-zt", record.id);
      const subjectId = relationshipId(
        "dod-zt-tenet-membership",
        catalogNodeId,
        targetNodeId,
        "contains",
      );
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: record.source?.key || "dod-zt-reference-architecture-v2",
        sourceNodeId: catalogNodeId,
        targetNodeId,
        relationshipType: "contains",
        relationshipClass: RELATIONSHIP_CLASSES.structural,
        confidence: "derived",
        locator: record.source?.locator || `dod-zt.json#${record.id}`,
        retrievedAt: record.source?.snapshot_date,
        rationale: `${record.id} is one of the foundational tenets of the DoD Zero Trust model.`,
      });
      continue;
    }
    if (record.type === "zt_pillar" || record.type === "zt_document") {
      const catalogNodeId = "dod-zt:CATALOG";
      const targetNodeId = nodeId("dod-zt", record.id);
      const subjectId = relationshipId(
        "dod-zt-catalog-membership",
        catalogNodeId,
        targetNodeId,
        "contains",
      );
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: record.source?.key || "dod-zt-reference-architecture-v2",
        sourceNodeId: catalogNodeId,
        targetNodeId,
        relationshipType: "contains",
        relationshipClass: RELATIONSHIP_CLASSES.structural,
        confidence: "derived",
        locator: record.source?.locator || `dod-zt.json#${record.id}`,
        retrievedAt: record.source?.snapshot_date,
        rationale: `${record.title} is part of the native DoD Zero Trust structure.`,
      });
      continue;
    }
    if (record.type !== "zt_capability" && record.type !== "zt_activity")
      continue;
    const parentId =
      record.type === "zt_capability"
        ? record.metadata?.pillar_id
        : record.metadata?.capability_id;
    if (!parentId) continue;
    const sourceNodeId = nodeId("dod-zt", parentId);
    const targetNodeId = nodeId("dod-zt", record.id);
    const subjectId = relationshipId(
      "dod-zt-hierarchy",
      sourceNodeId,
      targetNodeId,
      "contains",
    );
    addPublishedEdge(state, registry, nodeIds, {
      subjectId,
      sourceId: record.source?.key || "dod-zt-reference-architecture-v2",
      sourceNodeId,
      targetNodeId,
      relationshipType: "contains",
      relationshipClass: RELATIONSHIP_CLASSES.structural,
      confidence: "derived",
      locator: record.source?.locator || `dod-zt.json#${record.id}`,
      retrievedAt: record.source?.snapshot_date,
      rationale: `${parentId} includes ${record.id} in the DoD Zero Trust model.`,
    });
  }
}

function addCuiPolicyEdges(state, registry, nodeIds) {
  const relationships = [
    {
      subjectId: "issue12-171r2-cui-basic",
      sourceId: "nist-800-171-rev2",
      sourceNodeId: "nist-800-171-rev2:CATALOG",
      targetNodeId: "cui-policy:CUI-BASIC",
      relationshipType: "protects",
      confidence: "inferred",
      locator: "abstract",
      rationale:
        "SP 800-171 Rev. 2 protects the confidentiality of CUI in nonfederal systems where no category-specific handling controls are prescribed.",
    },
    {
      subjectId: "issue12-171r3-cui-basic",
      sourceId: "nist-800-171",
      ingestionSourceId: "nist-oscal",
      sourceNodeId: "nist-800-171:CATALOG",
      targetNodeId: "cui-policy:CUI-BASIC",
      relationshipType: "protects",
      confidence: "inferred",
      locator: "abstract",
      rationale:
        "SP 800-171 Rev. 3 protects the confidentiality of CUI in nonfederal systems where no category-specific handling controls are prescribed.",
    },
    {
      subjectId: "issue12-172-cui-program",
      sourceId: "nist-800-172-rev3",
      sourceNodeId: "nist-800-172:CATALOG",
      targetNodeId: "cui-policy:CUI-PROGRAM",
      relationshipType: "supports",
      confidence: "inferred",
      locator: "abstract",
      rationale:
        "SP 800-172 Rev. 3 provides enhanced security requirements for protecting CUI associated with critical programs or high value assets.",
    },
  ];

  for (const relationship of relationships) {
    addPublishedEdge(state, registry, nodeIds, relationship);
  }

  // Every CUI designation is a real child of the CUI Program catalog. Basic
  // and Program already carry a specific `protects`/`supports` edge above;
  // Specified has no single catalog that governs it in this app's ingested
  // set (each CUI Specified category cites its own separate law/regulation),
  // so without this it was the one designation with zero edges at all.
  //
  // Real NARA registry categories (type cui-category, spec §7) nest one
  // level deeper, under whichever designation anchor
  // (CUI-BASIC/CUI-SPECIFIED/CUI-PROGRAM) their own registry data resolved
  // to (metadata.parent_designation) — not flatly under the catalog root.
  const path = join(ROOT, "data", "cui-policy.json");
  if (existsSync(path)) {
    const document = readJson(path);
    const catalogNodeId = "cui-policy:CATALOG";
    for (const record of document.records || []) {
      const targetNodeId = nodeId("cui-policy", record.id);
      const isCategory = record.type === "cui-category";
      const sourceNodeId = isCategory
        ? nodeId("cui-policy", record.metadata?.parent_designation || "CUI-PROGRAM")
        : catalogNodeId;
      const subjectId = relationshipId(
        "cui-policy-program-membership",
        sourceNodeId,
        targetNodeId,
        "contains",
      );
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: record.source?.key || "isoo-cui-regulation",
        sourceNodeId,
        targetNodeId,
        relationshipType: "contains",
        relationshipClass: RELATIONSHIP_CLASSES.structural,
        confidence: "derived",
        locator: record.source?.locator || "32-CFR-2002",
        retrievedAt: record.source?.snapshot_date,
        rationale: isCategory
          ? `${record.title} is a NARA CUI Registry category classified ${record.metadata?.designation || "unresolved"} under ${record.metadata?.parent_designation || "CUI Program"}.`
          : `${record.title} is one of the designation categories in the CUI Program.`,
      });
    }
  }
}

/**
 * W1.2/W1.3d — the `nist-800-53:CATALOG` node's structural parent, derived
 * from the already-published CSF<->800-53 OLIR correlation edges (no new
 * fetch: see docs/STATE.md 2026-07-26 session 3 for why the sprint doc's
 * "zero edges" premise was disproven). The individual control<->subcategory
 * correlation stays Class 3 (`maps_to`) per docs/tree-model.md §3 — one
 * control maps to dozens of subcategories across every function, so no
 * single function can honestly "contain" a control. What CAN take a single
 * structural parent is the catalog as a whole: the CSF Function that the
 * plurality of its controls' correlation edges point to.
 */
function buildEdges(registry, nodes) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const state = { edges: [], evidence: [], findings: [] };

  for (const [
    filename,
    sourceCatalog,
    targetCatalog,
    defaultSourceId,
  ] of MAPS) {
    const path = join(ROOT, "maps", filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const [index, relationship] of (
      document.relationships || []
    ).entries()) {
      const sourceNodeId = resolveMapEndpointNodeId(
        relationship.source_catalog || sourceCatalog,
        relationship.source_id,
        nodeIds,
      );
      const targetNodeId = resolveMapEndpointNodeId(
        relationship.target_catalog || targetCatalog,
        relationship.target_id,
        nodeIds,
      );
      const sourceId =
        relationship.evidence_source || document.source_key || defaultSourceId;
      const subjectId = `${filename.replace(".json", "")}:${index + 1}`;
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId,
        sourceNodeId,
        targetNodeId,
        relationshipType: relationship.relationship_type || "maps_to",
        // A map file may declare how strong its own mapping is. Only the Rev 4
        // crosswalk does today: its edges compose two published documents rather
        // than restating one, so they are "derived", not "direct".
        confidence: relationship.confidence,
        sourceVersion: document.source_version,
        locator:
          relationship.source_locator ||
          `${document.source_key || sourceId}#relationship`,
        retrievedAt: document.snapshot_date,
        checksum: document.checksum,
        rationale: relationship.why || document.provenance || "",
      });
    }
  }
  addDocumentRelationshipEdges(state, registry, nodeIds);
  addTierMembershipEdges(state, registry, nodeIds);
  addTierParentEdges(state, registry, nodeIds);
  addTierToCatalogEdges(state, registry, nodeIds);
  addEnhancementMembershipEdges(state, registry, nodeIds);
  addAttackSubtechniqueMembershipEdges(state, registry, nodeIds);
  addBaselineMembershipEdges(state, registry, nodeIds);
  addFedrampMembershipEdges(state, registry, nodeIds);
  addAssessmentEdges(state, registry, nodeIds);
  addCmmcProgramEdges(state, registry, nodeIds, nodes);
  addDodZeroTrustHierarchyEdges(state, registry, nodeIds);
  addCuiPolicyEdges(state, registry, nodeIds);
  return state;
}

/**
 * OLIR mappings can name a publisher-native grouping concept rather than a
 * leaf record. Preserve that distinction: an 800-53 family or CSF category
 * must resolve to its real grouping node, never become a blocked leaf lookup
 * or a made-up control-to-control mapping.
 */
function resolveMapEndpointNodeId(catalogId, rawId, nodeIds) {
  const itemId = normalizeControlId(rawId);
  const leafNodeId = nodeId(catalogId, itemId);
  if (nodeIds.has(leafNodeId)) return leafNodeId;

  if (catalogId === "nist-800-53" && /^[A-Z]{2}$/.test(itemId)) {
    const familyNodeId = nodeId(catalogId, `FAMILY-${itemId}`);
    if (nodeIds.has(familyNodeId)) return familyNodeId;
  }

  if (catalogId === "csf-2" && /^[A-Z]{2}\.[A-Z]{2}$/.test(itemId)) {
    const categoryNodeId = nodeId(catalogId, `CATEGORY-${itemId}`);
    if (nodeIds.has(categoryNodeId)) return categoryNodeId;
  }

  return leafNodeId;
}

function artifact(collection, values, generatedAt) {
  return {
    schema_version: "1.0",
    generated_at: generatedAt,
    [collection]: values,
  };
}

function collectionFingerprint(values) {
  return createHash("sha256").update(JSON.stringify(values)).digest("hex");
}

function existingGeneratedAt(collections) {
  let generatedAt = null;
  for (const [name, values] of Object.entries(collections)) {
    const path = join(GENERATED, `${name}.json`);
    if (!existsSync(path)) return null;
    const existing = readJson(path);
    const collection = runtimeCollectionKey(name);
    if (!existing.generated_at || existing.schema_version !== "1.0")
      return null;
    if (generatedAt && existing.generated_at !== generatedAt) return null;
    if (SHARDED_RUNTIME_COLLECTIONS.has(name)) {
      if (existing.sharded_collection?.content_sha256 !== collectionFingerprint(values)) {
        return null;
      }
      generatedAt ||= existing.generated_at;
      continue;
    }
    if (JSON.stringify(existing[collection]) !== JSON.stringify(values))
      return null;
    generatedAt = existing.generated_at;
  }
  return generatedAt;
}

function loadExistingCollections() {
  const previous = {};
  for (const name of RUNTIME_COLLECTIONS) {
    const path = join(GENERATED, `${name}.json`);
    if (!existsSync(path)) continue;
    const existing = readJson(path);
    previous[name] = existing.sharded_collection ? null : existing;
  }
  return previous;
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function buildSourceManifests(graph) {
  const evidenceById = new Map(
    graph.evidence.map((entry) => [entry.id, entry]),
  );
  const nodeCounts = countBy(graph.nodes, (node) => node.source_id);
  const evidenceCounts = countBy(graph.evidence, (entry) => entry.source_id);
  const edgeCounts = countBy(
    graph.edges,
    (edge) => evidenceById.get(edge.evidence_ids[0])?.source_id || "",
  );
  const findingCounts = countBy(graph.findings, (entry) => entry.source_id);

  return graph.sources
    .map((source) => ({
      source_id: source.id,
      display_name: source.display_name,
      display_group: source.display_group,
      frameworks: source.metadata?.frameworks || [],
      owner: source.owner,
      version: source.version,
      sync_model: source.sync_model,
      last_checked: source.last_checked,
      last_imported: source.last_imported,
      hash: source.hash,
      stale_after_days: source.stale_after_days,
      retrieved_at: source.retrieved_at,
      artifact_url: source.artifact_url,
      artifact_type: source.artifact_type,
      checksum: source.checksum,
      access_status: source.access_status,
      lifecycle_status: source.lifecycle_status,
      graph_eligible: source.graph_eligible,
      node_count: nodeCounts.get(source.id) || 0,
      relationship_count: edgeCounts.get(source.id) || 0,
      evidence_count: evidenceCounts.get(source.id) || 0,
      finding_count: findingCounts.get(source.id) || 0,
    }))
    .sort((a, b) => a.source_id.localeCompare(b.source_id));
}

function createBuildManifest(graph) {
  return {
    kind: "build_manifest",
    runtime_artifacts: [
      ...RUNTIME_COLLECTIONS.map((name) => `${name}.json`),
      "library-search.json",
      "atlas-neighborhood-manifest.json",
      "atlas-neighborhood/",
      "catalog-bootstrap.json",
      "catalog-records/",
    ],
    governance_artifacts: GOVERNANCE_FILES,
    source_registry_path: "data/source-registry.json",
    source_registry_schema: "4.0",
    counts: {
      sources: graph.sources.length,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      evidence: graph.evidence.length,
      findings: graph.findings.length,
    },
  };
}

function compactOfficialText(text, limit = 180) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  const candidate = normalized.slice(0, limit + 1);
  const lastBreak = candidate.lastIndexOf(" ");
  const boundary = lastBreak >= Math.floor(limit * 0.8) ? lastBreak : limit;
  return `${normalized.slice(0, boundary).trimEnd()}…`;
}

function buildLibraryDocuments(graph) {
  const sourceById = new Map(
    graph.sources.map((source) => [source.id, source]),
  );
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const publishedConnectionCounts = new Map();
  const publishedConnectionCatalogs = new Map();
  for (const edge of graph.edges) {
    if (edge.publication_status && edge.publication_status !== "published") continue;
    for (const [nodeId, counterpartId] of [
      [edge.source_node_id, edge.target_node_id],
      [edge.target_node_id, edge.source_node_id],
    ]) {
      publishedConnectionCounts.set(nodeId, (publishedConnectionCounts.get(nodeId) || 0) + 1);
      const counterpart = nodeById.get(counterpartId);
      const catalogId = counterpart?.metadata?.catalog_id || counterpart?.source_id;
      if (catalogId) {
        const catalogs = publishedConnectionCatalogs.get(nodeId) || new Set();
        catalogs.add(catalogId);
        publishedConnectionCatalogs.set(nodeId, catalogs);
      }
    }
  }
  return graph.nodes.map((node) => {
    const source = sourceById.get(node.source_id);
    const itemId = node.metadata?.item_id || node.id;
    const title = node.metadata?.title || node.label;
    return {
      id: node.id,
      item_id: itemId,
      title,
      description_available: Boolean(node.metadata?.description?.trim()),
      official_text_preview: compactOfficialText(node.metadata?.description),
      object_type: node.node_type,
      source_id: node.source_id,
      source_name: source?.display_name || source?.name || "",
      publisher_name: source?.display_group || source?.owner || "",
      source_class: source?.provenance_class || "",
      catalog_id: node.metadata?.catalog_id || "",
      control_family: node.metadata?.family || "",
      severity: node.metadata?.severity || "",
      published_connection_count: publishedConnectionCounts.get(node.id) || 0,
      published_connection_catalog_count:
        publishedConnectionCatalogs.get(node.id)?.size || 0,
    };
  });
}

function buildLibrarySearch(graph) {
  const documents = buildLibraryDocuments(graph);
  const facetValues = (field) =>
    [...new Set(documents.map((document) => document[field]).filter(Boolean))].sort();
  return {
    document_count: documents.length,
    facets: {
      objectTypes: facetValues("object_type"),
      publishers: facetValues("publisher_name"),
      sourceClasses: facetValues("source_class"),
      controlFamilies: facetValues("control_family"),
      severities: facetValues("severity"),
    },
    documents,
  };
}

function buildDiffSummary(previous, collections, generatedAt) {
  const changedRuntimeArtifacts = RUNTIME_COLLECTIONS.filter((name) => {
    const previousCollection = previous[name];
    const currentCollection = collections[name];
    if (!previousCollection) return true;
    const previousPayload = JSON.stringify(
      previousCollection[runtimeCollectionKey(name)],
    );
    return previousPayload !== JSON.stringify(currentCollection);
  });

  return {
    kind: "graph_diff_summary",
    previous_generated_at: previous.sources?.generated_at || null,
    current_generated_at: generatedAt,
    changed_runtime_artifacts: changedRuntimeArtifacts,
    unchanged_runtime_artifacts: RUNTIME_COLLECTIONS.filter(
      (name) => !changedRuntimeArtifacts.includes(name),
    ),
  };
}

function runtimeCollectionKey(name) {
  if (name === "graph-health") return "findings";
  if (name === "atlas-spine") return "atlas_spine";
  return name;
}

function authorityCatalogIds(treeSpine) {
  return new Set([
    ...Object.keys(treeSpine.catalogLimbs || {}),
    ...(treeSpine.syntheticCatalogs || []).map((entry) => entry.catalog_id),
  ]);
}

function buildAuthorityNode(instrument) {
  return {
    id: instrument.id,
    node_type: instrument.node_type,
    label: instrument.label,
    source_id: instrument.source_id,
    lifecycle_status: "active",
    // These entries were verified by manual review against official primary
    // sources. No downloaded artifact bytes exist, so an empty artifact list
    // is more honest than inventing a checksum-backed artifact record.
    artifact_ids: [],
    metadata: {
      ingestion_source_id: instrument.source_id,
      item_id: instrument.id.slice("authority:".length),
      title: instrument.label,
      description: instrument.blurb,
      type: instrument.node_type,
      source_refs: instrument.source_refs,
      source_locator: instrument.source_refs[0]?.locator || "",
    },
  };
}

function pushAuthorityEdge(
  edgeState,
  registry,
  { subjectId, sourceNodeId, targetNodeId, sourceRefs, rationale },
) {
  const primaryReference = sourceRefs[0];
  const source = registry.byId.get(primaryReference.source_id);
  const evidenceId = `evidence:${subjectId}`;
  edgeState.evidence.push({
    id: evidenceId,
    source_id: primaryReference.source_id,
    source_version: source?.version || "",
    locator: primaryReference.locator,
    retrieved_at: source?.retrieved_at || null,
    checksum: source?.checksum || null,
    evidence_quality: "primary",
    ingestion_source_id: primaryReference.source_id,
  });
  edgeState.edges.push({
    id: `edge:${subjectId}`,
    source_node_id: sourceNodeId,
    target_node_id: targetNodeId,
    relationship_type: "issued_under",
    relationship_class: RELATIONSHIP_CLASSES.organizing,
    provenance_class: source?.provenance_class || "federal_published",
    confidence: "direct",
    publication_status: "published",
    evidence_ids: [evidenceId],
    display_label: `${sourceNodeId} is issued under ${targetNodeId}`,
    warning: null,
    inference_rule_id: null,
    rationale,
    source_refs: sourceRefs,
  });
}

export function applyAuthoritySpine(nodeState, edgeState, registry) {
  const authoritySpine = readJson(
    join(ROOT, "data", "curated", "authority-spine.json"),
  );
  const treeSpine = readJson(join(ROOT, "data", "curated", "tree-spine.json"));
  const errors = validateAuthoritySpine(authoritySpine, {
    catalogIds: authorityCatalogIds(treeSpine),
    sourceIds: new Set(registry.sources.map((source) => source.id)),
  });
  if (errors.length) {
    throw new Error(`Invalid authority spine:\n- ${errors.join("\n- ")}`);
  }

  for (const instrument of authoritySpine.instruments) {
    nodeState.nodes.push(
      attachNodeProvenance(
        buildAuthorityNode(instrument),
        instrument.source_id,
        registry,
      ),
    );
    if (instrument.parent) {
      pushAuthorityEdge(edgeState, registry, {
        subjectId: `authority:instrument:${instrument.id}->${instrument.parent}`,
        sourceNodeId: instrument.id,
        targetNodeId: instrument.parent,
        sourceRefs: instrument.source_refs,
        rationale: `${instrument.label} declares ${instrument.parent} as its verified authority parent.`,
      });
    }
  }

  for (const publication of authoritySpine.publications) {
    const authorityIds = [
      ...(publication.primary_authority
        ? [publication.primary_authority]
        : []),
      ...publication.also_required_by,
    ];
    for (const authorityId of authorityIds) {
      pushAuthorityEdge(edgeState, registry, {
        subjectId: `authority:publication:${publication.catalog_id}->${authorityId}`,
        sourceNodeId: `${publication.catalog_id}:CATALOG`,
        targetNodeId: authorityId,
        sourceRefs: publication.source_refs,
        rationale: `${publication.catalog_id} is issued under ${authorityId}; this secondary relationship does not change canonical ownership.`,
      });
    }
  }

  return authoritySpine;
}

function attachAuthorityPublicationMetadata(nodes, authoritySpine) {
  const rootByCatalogId = new Map(
    nodes
      .filter((node) => node.node_type === "catalog")
      .map((node) => [catalogIdOf(node), node]),
  );
  for (const publication of authoritySpine.publications) {
    const root = rootByCatalogId.get(publication.catalog_id);
    if (!root) {
      throw new Error(
        `Authority publication ${publication.catalog_id} has no emitted catalog root`,
      );
    }
    Object.assign(root.metadata, {
      mandate: publication.mandate,
      primary_authority: publication.primary_authority,
      also_required_by: publication.also_required_by,
      publication_type: publication.publication_type,
      mandate_note: publication.mandate_note,
      authority_source_refs: publication.source_refs,
    });
  }
}

const ATLAS_SUMMARY_NODE_TYPES = new Set([
  "family",
  "benchmark",
  "category",
  "tactic",
  "group",
  "function",
]);

export function buildAtlasSpine(graph, authoritySpine, treeSpine) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const ancestorGraph = buildAncestorGraph(graph.nodes, graph.edges);
  const canonicalChildrenByParent = new Map();
  for (const node of graph.nodes) {
    const chain = ancestorChain(node.id, ancestorGraph);
    if (chain.length < 2) continue;
    const parentId = chain.at(-2).id;
    const children = canonicalChildrenByParent.get(parentId) || [];
    children.push(node.id);
    canonicalChildrenByParent.set(parentId, children);
  }
  for (const children of canonicalChildrenByParent.values()) {
    children.sort((leftId, rightId) => {
      const left = nodeById.get(leftId);
      const right = nodeById.get(rightId);
      const leftKey = left?.metadata?.item_id || left?.label || leftId;
      const rightKey = right?.metadata?.item_id || right?.label || rightId;
      return leftKey.localeCompare(rightKey, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }

  const isLeafRecord = (node) =>
    node &&
    node.node_type !== "catalog" &&
    node.node_type !== "trunk" &&
    node.node_type !== "limb" &&
    !ATLAS_SUMMARY_NODE_TYPES.has(node.node_type) &&
    !node.id.startsWith("authority:");
  const descendantRecordCount = (rootId) => {
    let count = 0;
    const stack = [...(canonicalChildrenByParent.get(rootId) || [])];
    const seen = new Set();
    while (stack.length) {
      const nodeId = stack.pop();
      if (seen.has(nodeId)) continue;
      seen.add(nodeId);
      const node = nodeById.get(nodeId);
      if (isLeafRecord(node)) count += 1;
      stack.push(...(canonicalChildrenByParent.get(nodeId) || []));
    }
    return count;
  };
  const catalogLeafCount = (catalogId) =>
    graph.nodes.filter(
      (node) => node.metadata?.catalog_id === catalogId && isLeafRecord(node),
    ).length;
  const publicationByCatalogId = new Map(
    authoritySpine.publications.map((publication) => [
      publication.catalog_id,
      publication,
    ]),
  );
  const rootByCatalogId = new Map(
    graph.nodes
      .filter((node) => node.node_type === "catalog")
      .map((node) => [catalogIdOf(node), node]),
  );
  const catalogCounts = new Map(
    [...rootByCatalogId.keys()].map((catalogId) => [
      catalogId,
      catalogLeafCount(catalogId),
    ]),
  );

  const entries = [];
  const instrumentChildren = new Map(
    authoritySpine.instruments.map((instrument) => [instrument.id, []]),
  );
  for (const instrument of authoritySpine.instruments) {
    if (instrument.parent) {
      instrumentChildren.get(instrument.parent)?.push(instrument.id);
    }
  }
  for (const instrument of authoritySpine.instruments) {
    const issuedCatalogs = authoritySpine.publications.filter(
      (publication) =>
        publication.primary_authority === instrument.id ||
        publication.also_required_by.includes(instrument.id),
    );
    entries.push({
      id: instrument.id,
      node_type: instrument.node_type,
      label: instrument.label,
      blurb: instrument.blurb,
      parent_id: instrument.parent,
      child_count:
        (instrumentChildren.get(instrument.id)?.length || 0) +
        issuedCatalogs.length,
      descendant_record_count: issuedCatalogs.reduce(
        (total, publication) =>
          total + (catalogCounts.get(publication.catalog_id) || 0),
        0,
      ),
    });
  }

  const trunk = graph.nodes.find((node) => node.node_type === "trunk");
  if (!trunk) throw new Error("Atlas spine cannot find the canonical trunk");
  const totalCatalogRecords = [...catalogCounts.values()].reduce(
    (total, count) => total + count,
    0,
  );
  entries.push({
    id: trunk.id,
    node_type: trunk.node_type,
    label: trunk.metadata?.title || trunk.label,
    blurb: trunk.metadata?.description || "",
    parent_id: null,
    child_count: treeSpine.limbs.length,
    descendant_record_count: totalCatalogRecords,
  });

  for (const limb of treeSpine.limbs) {
    const catalogIds = [
      ...Object.entries(treeSpine.catalogLimbs),
      ...(treeSpine.syntheticCatalogs || []).map((entry) => [
        entry.catalog_id,
        entry.limb,
      ]),
    ]
      .filter(([, limbId]) => limbId === limb.id)
      .map(([catalogId]) => catalogId);
    entries.push({
      id: limb.id,
      node_type: "limb",
      label: limb.label,
      blurb: limb.blurb,
      parent_id: trunk.id,
      child_count: catalogIds.length,
      descendant_record_count: catalogIds.reduce(
        (total, catalogId) => total + (catalogCounts.get(catalogId) || 0),
        0,
      ),
    });
    for (const catalogId of catalogIds) {
      const root = rootByCatalogId.get(catalogId);
      const publication = publicationByCatalogId.get(catalogId);
      if (!root || !publication) {
        throw new Error(`Atlas spine cannot resolve catalog ${catalogId}`);
      }
      const summaryIds = canonicalChildrenByParent.get(root.id) || [];
      const membershipGroups = new Map();
      if (summaryIds.length === 0) {
        for (const node of graph.nodes.filter(
          (entry) =>
            entry.node_type !== "catalog" &&
            entry.metadata?.catalog_id === catalogId,
        )) {
          const family = node.metadata?.family || "All records";
          const members = membershipGroups.get(family) || [];
          members.push(node);
          membershipGroups.set(family, members);
        }
      }
      entries.push({
        id: root.id,
        node_type: "catalog",
        label: root.metadata?.title || root.label,
        blurb: root.metadata?.description || publication.mandate_note,
        parent_id: limb.id,
        child_count: summaryIds.length || membershipGroups.size,
        descendant_record_count: catalogCounts.get(catalogId) || 0,
        mandate: publication.mandate,
        primary_authority: publication.primary_authority,
        also_required_by: publication.also_required_by,
        publication_type: publication.publication_type,
        mandate_note: publication.mandate_note,
        area_id: limb.id,
      });
      for (const summaryId of summaryIds) {
        const summary = nodeById.get(summaryId);
        if (!summary) continue;
        const childIds = canonicalChildrenByParent.get(summaryId) || [];
        entries.push({
          id: summary.id,
          node_type: summary.node_type,
          label: summary.metadata?.title || summary.label || summary.id,
          blurb: summary.metadata?.description || "",
          parent_id: root.id,
          child_count: childIds.length,
          descendant_record_count: isLeafRecord(summary)
            ? 1 + descendantRecordCount(summaryId)
            : descendantRecordCount(summaryId),
        });
      }
      for (const [family, members] of [...membershipGroups.entries()].sort(
        ([left], [right]) => left.localeCompare(right),
      )) {
        entries.push({
          id: `membership:${catalogId}:${slugKey(family)}`,
          node_type: "family",
          label: family,
          blurb: `${members.length.toLocaleString()} records`,
          parent_id: root.id,
          child_count: members.length,
          descendant_record_count: members.length,
        });
      }
    }
  }

  return { entries };
}

// --- Class-4 organizing spine (Cybersecurity trunk + limbs) ---------------
// Owner directive 2026-07-31: "Everything must connect to the trunk. Period."
// This emits the trunk/limb/catalog spine (organizing edges, publication_status
// "editorial", never publisher-declared) plus structural backfill for orphans
// whose catalog root exists, then a HARD connectivity gate that fails the build
// if any node cannot reach the trunk over the full (undirected) edge set. CCIs
// and assessment procedures stay pure correlation junctions (docs/tree-model.md
// §4) — they reach the trunk through their existing correlation/assesses edges,
// not through new structural parents.

function buildStructureNode({ id, nodeType, label, description }) {
  return {
    id,
    node_type: nodeType,
    label,
    source_id: ORGANIZING_STRUCTURE_SOURCE_ID,
    lifecycle_status: "active",
    metadata: {
      ingestion_source_id: ORGANIZING_STRUCTURE_SOURCE_ID,
      item_id: id.split(":").pop(),
      title: label,
      description,
      type: nodeType,
    },
  };
}

function buildSyntheticCatalogNode(decl) {
  return {
    id: `${decl.catalog_id}:CATALOG`,
    node_type: "catalog",
    label: decl.label,
    source_id: decl.source_id,
    lifecycle_status: "active",
    metadata: {
      catalog_id: decl.catalog_id,
      ingestion_source_id: decl.source_id,
      item_id: "CATALOG",
      title: decl.label,
      description: decl.description,
      family: "Catalog",
      type: "catalog_summary",
      references: null,
    },
  };
}

function pushOrganizingEdge(edgeState, { subjectId, sourceNodeId, targetNodeId, rationale }) {
  const evidenceId = `evidence:${subjectId}`;
  edgeState.evidence.push({
    id: evidenceId,
    source_id: ORGANIZING_STRUCTURE_SOURCE_ID,
    source_version: "2026-07-31",
    locator: `tree-spine#${subjectId}`,
    retrieved_at: "2026-07-31",
    checksum: null,
    evidence_quality: "editorial",
    ingestion_source_id: ORGANIZING_STRUCTURE_SOURCE_ID,
  });
  edgeState.edges.push({
    id: `edge:${subjectId}`,
    source_node_id: sourceNodeId,
    target_node_id: targetNodeId,
    relationship_type: "organizes",
    relationship_class: RELATIONSHIP_CLASSES.organizing,
    provenance_class: "control_atlas_derived",
    confidence: "derived",
    publication_status: "editorial",
    evidence_ids: [evidenceId],
    display_label: `${sourceNodeId} organizes ${targetNodeId}`,
    warning: null,
    inference_rule_id: null,
    rationale,
    source_refs: [
      {
        source_id: ORGANIZING_STRUCTURE_SOURCE_ID,
        ref_type: "editorial",
        locator: `tree-spine#${subjectId}`,
      },
    ],
  });
}

function pushStructuralBackfillEdge(edgeState, sourceById, { subjectId, parentNode, childNode, rationale }) {
  const source = sourceById.get(childNode.source_id);
  const provenance =
    source?.provenance_class && source.provenance_class !== "inferred"
      ? source.provenance_class
      : "federal_published";
  const evidenceId = `evidence:${subjectId}`;
  edgeState.evidence.push({
    id: evidenceId,
    source_id: childNode.source_id,
    source_version: source?.version || "",
    locator: `${childNode.source_id}#${childNode.id}`,
    retrieved_at: source?.retrieved_at || null,
    checksum: source?.checksum || null,
    evidence_quality: "primary",
    ingestion_source_id: childNode.metadata?.ingestion_source_id || childNode.source_id,
  });
  edgeState.edges.push({
    id: `edge:${subjectId}`,
    source_node_id: parentNode.id,
    target_node_id: childNode.id,
    relationship_type: "contains",
    relationship_class: RELATIONSHIP_CLASSES.structural,
    provenance_class: provenance,
    confidence: "direct",
    publication_status: "published",
    evidence_ids: [evidenceId],
    display_label: `${parentNode.id} contains ${childNode.id}`,
    warning: null,
    inference_rule_id: null,
    rationale,
    source_refs: [
      {
        source_id: childNode.source_id,
        ref_type: "primary",
        locator: `${childNode.source_id}#${childNode.id}`,
      },
    ],
  });
}

/**
 * Records carry their own path to the trunk. The record page loads a single
 * neighborhood shard, never the monolithic graph (enforced by
 * tests/e2e/bootstrap-payload.spec.mjs), so a runtime walk over the full edge
 * set could only ever produce a truncated chain there. Deriving it once at
 * build time costs ~300 bytes per node and lets "Where this sits" render the
 * complete chain from whatever artifact delivered the record.
 */
function attachAncestorPaths(nodes, edges) {
  const graph = buildAncestorGraph(nodes, edges);
  for (const node of nodes) {
    const chain = ancestorChain(node.id, graph);
    // The last link is the node itself; keep only its ancestors, root first.
    const ancestors = chain.slice(0, -1).map((link) => ({
      id: link.id,
      label: link.label,
      node_type: link.node_type,
      origin: link.origin,
    }));
    if (ancestors.length) node.ancestor_path = ancestors;
  }
}

function applyOrganizingSpine(nodeState, edgeState, registry) {
  const spine = readJson(join(ROOT, "data", "curated", "tree-spine.json"));
  const sourceById = registry.byId;
  const nodes = nodeState.nodes;

  // 1. Trunk + limb nodes (scaffold, no catalog_id — exempt from catalog identity).
  nodes.push(
    attachNodeProvenance(
      buildStructureNode({
        id: spine.trunk.id,
        nodeType: "trunk",
        label: spine.trunk.label,
        description:
          "The cybersecurity discipline itself — the single common ancestor every limb hangs from.",
      }),
      ORGANIZING_STRUCTURE_SOURCE_ID,
      registry,
    ),
  );
  for (const limb of spine.limbs) {
    nodes.push(
      attachNodeProvenance(
        buildStructureNode({
          id: limb.id,
          nodeType: "limb",
          label: limb.label,
          description: limb.blurb,
        }),
        ORGANIZING_STRUCTURE_SOURCE_ID,
        registry,
      ),
    );
  }

  // 2. Synthetic catalog wrappers (catalog_ids with content but no root node).
  const synthetic = deriveSyntheticCatalogs(nodes, spine, catalogIdOf);
  if (synthetic.empty.length) {
    throw new Error(
      `tree-spine syntheticCatalogs matched zero nodes: ${synthetic.empty.join(", ")}`,
    );
  }
  let nodeById = new Map(nodes.map((node) => [node.id, node]));
  for (const wrapper of synthetic.wrappers) {
    const decl = spine.syntheticCatalogs.find((entry) => entry.catalog_id === wrapper.catalogId);
    const catalogNode = attachNodeProvenance(buildSyntheticCatalogNode(decl), decl.source_id, registry);
    nodes.push(catalogNode);
    nodeById.set(catalogNode.id, catalogNode);
    pushOrganizingEdge(edgeState, {
      subjectId: `organizing:limb-catalog:${wrapper.catalogNodeId}`,
      sourceNodeId: wrapper.limbId,
      targetNodeId: wrapper.catalogNodeId,
      rationale: `${decl.label} is organized under ${wrapper.limbId} (synthetic catalog wrapper).`,
    });
    for (const childId of wrapper.childIds) {
      pushStructuralBackfillEdge(edgeState, sourceById, {
        subjectId: `structural:synthetic:${wrapper.catalogNodeId}:${childId}`,
        parentNode: catalogNode,
        childNode: nodeById.get(childId),
        rationale: `${decl.label} contains ${childId}.`,
      });
    }
  }

  // 3. Editorial spine over the real catalog roots (trunk->limb, limb->catalog).
  const realCatalogRoots = nodes.filter(
    (node) => node.node_type === "catalog" && spine.catalogLimbs[catalogIdOf(node)],
  );
  const { organizesEdges, unassigned } = deriveEditorialSpine(realCatalogRoots, spine, catalogIdOf);
  if (unassigned.length) {
    throw new Error(`catalog roots with no limb assignment: ${unassigned.join(", ")}`);
  }
  for (const edge of organizesEdges) {
    pushOrganizingEdge(edgeState, {
      subjectId: `organizing:spine:${edge.source_id}->${edge.target_id}`,
      sourceNodeId: edge.source_id,
      targetNodeId: edge.target_id,
      rationale:
        edge.source_id === spine.trunk.id
          ? `${edge.target_id} is a limb of the Cybersecurity trunk.`
          : `${edge.target_id} is a catalog organized under ${edge.source_id}.`,
    });
  }

  // 3.5 Junction canonical parents as organizing edges so the rail can walk them.
  // These stay OUT of structural ancestry — CCIs and procedures remain correlation
  // junctions (docs/tree-model.md §4); the organizing edge is a badged editorial
  // "where this sits" home, never a publisher containment claim.
  const nodeIdSet = new Set(nodes.map((node) => node.id));
  const assessesRelationships = edgeState.edges
    .filter((edge) => edge.relationship_type === "assesses")
    .map((edge) => ({ source_id: edge.source_node_id, target_id: edge.target_node_id }));
  const { parents: procedureParents } = deriveAssessmentProcedureParents(assessesRelationships);
  for (const [procedureNodeId, { controlId }] of procedureParents) {
    if (!nodeIdSet.has(controlId)) continue;
    // Parent -> child: the control is the parent, the procedure hangs beneath it.
    pushOrganizingEdge(edgeState, {
      subjectId: `organizing:procedure:${procedureNodeId}`,
      sourceNodeId: controlId,
      targetNodeId: procedureNodeId,
      rationale: `${procedureNodeId} assesses ${controlId}; filed beneath it for the tree path.`,
    });
  }
  const cciMapRelationships = (filename) => {
    const path = join(ROOT, "maps", filename);
    if (!existsSync(path)) return [];
    return (readJson(path).relationships || []).map((relationship) => ({
      source_id: relationship.source_id,
      target_id: normalizeControlId(relationship.target_id),
    }));
  };
  const { parents: cciParents } = deriveCciHierarchyParents({
    cciItemIds: nodes
      .filter((node) => catalogIdOf(node) === "disa-cci")
      .map((node) => node.metadata.item_id),
    directRelationships: cciMapRelationships("cci-to-800-53.json"),
    crosswalkRelationships: cciMapRelationships("cci-to-800-53-rev4.json"),
    assessmentProcedureItemIds: new Set(
      nodes
        .filter((node) => node.node_type === "assessment_procedure")
        .map((node) => node.metadata.item_id),
    ),
    controlItemIds: new Set(
      nodes
        .filter((node) => catalogIdOf(node) === "nist-800-53")
        .map((node) => node.metadata.item_id),
    ),
  });
  for (const [cciItemId, { controlId, tier }] of cciParents) {
    const parentNodeId =
      tier === "assessment_procedure" ? `nist-800-53a:${controlId}` : `nist-800-53:${controlId}`;
    if (!nodeIdSet.has(parentNodeId)) continue;
    // Parent -> child: the control/assessment objective is the parent, the CCI
    // hangs beneath it (docs/tree-model.md §4: control -> objective -> CCI).
    pushOrganizingEdge(edgeState, {
      subjectId: `organizing:cci:disa-cci:${cciItemId}`,
      sourceNodeId: parentNodeId,
      targetNodeId: `disa-cci:${cciItemId}`,
      rationale: `CCI ${cciItemId} cites ${controlId}; filed beneath its ${
        tier === "assessment_procedure" ? "assessment objective" : "control"
      } for the tree path.`,
    });
  }

  // 4. Residual connectivity backfill — anything still unreachable from the trunk.
  const syntheticNonOwningCatalogs = new Set(
    (spine.syntheticCatalogs || [])
      .filter((decl) => decl.attachRecords === false)
      .map((decl) => decl.catalog_id),
  );
  const catalogRootByCatalogId = new Map();
  for (const node of nodes) {
    if (node.node_type === "catalog") catalogRootByCatalogId.set(catalogIdOf(node), node);
  }
  const canonicalBeforeBackfill = canonicalTrunkReachable(
    nodes,
    edgeState.edges,
    spine.trunk.id,
  );
  for (const node of nodes) {
    if (canonicalBeforeBackfill.has(node.id)) continue;
    const cid = catalogIdOf(node);
    const root = catalogRootByCatalogId.get(cid);
    // A catalog whose records are parented elsewhere (CCIs under the control
    // they cite, procedures under the control they assess) keeps a browsable
    // root that owns nothing. Filing a leftover under it is Control Atlas's
    // own decision, not a publisher containment claim, so it is an organizing
    // edge — the same class the rest of that catalog's filing uses.
    const rootOwnsRecords = !syntheticNonOwningCatalogs.has(cid);
    if (root && root.id !== node.id && rootOwnsRecords) {
      pushStructuralBackfillEdge(edgeState, sourceById, {
        subjectId: `structural:residual:${root.id}->${node.id}`,
        parentNode: root,
        childNode: node,
        rationale: `${node.id} attached to its catalog root ${root.id} (residual connectivity backfill).`,
      });
    } else if (root && root.id !== node.id) {
      pushOrganizingEdge(edgeState, {
        subjectId: `organizing:residual:${root.id}->${node.id}`,
        sourceNodeId: root.id,
        targetNodeId: node.id,
        rationale: `${node.id} filed under ${root.id} for reachability (editorial, non-structural).`,
      });
    } else if (spine.residualLimbs?.[cid]) {
      pushOrganizingEdge(edgeState, {
        subjectId: `organizing:residual:${spine.residualLimbs[cid]}->${node.id}`,
        sourceNodeId: spine.residualLimbs[cid],
        targetNodeId: node.id,
        rationale: `${node.id} (${cid}) filed under ${spine.residualLimbs[cid]} for reachability (editorial, non-structural).`,
      });
    }
  }

  // 5. Hard connectivity gate — every node must reach the trunk.
  const reachability = assertTrunkReachability(
    nodes,
    edgeState.edges,
    spine.trunk.id,
  );
  const organizingCount = edgeState.edges.filter(
    (edge) => edge.relationship_type === "organizes",
  ).length;
  console.log(
    `[organizing-spine] trunk+${spine.limbs.length} limbs, ${synthetic.wrappers.length} synthetic catalogs, ` +
      `${organizingCount} organizing edges; eligible ${reachability.eligibleNodeCount}/${reachability.totalNodeCount} ` +
      `(${reachability.exemptAuthorityNodeCount} authority exempt); ` +
      `undirected ${reachability.undirected.size}/${reachability.eligibleNodeCount}, ` +
      `canonical ${reachability.canonical.size}/${reachability.eligibleNodeCount} reach ${spine.trunk.id}.`,
  );
}

export function buildFrameworkData() {
  const registry = loadSourceRegistry(
    readJson(join(ROOT, "data", "source-registry.json")),
  );
  const nodeState = buildNodes(registry);
  const edgeState = buildEdges(registry, nodeState.nodes);
  const authoritySpine = applyAuthoritySpine(nodeState, edgeState, registry);
  applyOrganizingSpine(nodeState, edgeState, registry);
  attachAuthorityPublicationMetadata(nodeState.nodes, authoritySpine);
  attachAncestorPaths(nodeState.nodes, edgeState.edges);
  const findings = [...nodeState.findings, ...edgeState.findings];
  const graph = {
    sources: registry.sources,
    nodes: nodeState.nodes,
    edges: edgeState.edges,
    evidence: edgeState.evidence,
    findings,
  };
  const errors = [
    ...validateGraphArtifacts(graph),
    ...validateCatalogPublicationIdentity(graph.nodes, graph.sources),
  ];
  if (errors.length)
    throw new Error(`Invalid federal graph:\n- ${errors.join("\n- ")}`);

  // provenance_assertions is unread anywhere in src/ or the verify scripts —
  // publication_source_id + artifact_ids (kept) already satisfy "every node
  // resolves publication and artifact provenance"; the assertion object
  // itself is 100% derivable from those two fields plus the sources.json
  // the runtime already loads (~3 MiB across 11k+ nodes, genuinely dead).
  // metadata carries a wide, mostly-catalog-specific field set (baselines,
  // check_text, discussion, ...) so most records leave most of it null —
  // `field: null,` costs the same bytes as a real value. No consumer checks
  // key presence (all reads are `?.field` / `|| default`), so a missing key
  // and an explicit null are behaviorally identical — drop the nulls. Both
  // apply everywhere a node ships (nodes.json AND the atlas-neighborhood
  // shards/catalog-records copies) so every runtime view of "the same node"
  // stays byte-identical — tests/atlas-neighborhood.test.mjs asserts this.
  const stripNullMetadata = (metadata) => {
    if (!metadata) return metadata;
    const out = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== null) out[key] = value;
    }
    return out;
  };
  const stripDeadNodeFields = ({ provenance_assertions, ...node }) => ({
    ...node,
    ...(node.metadata ? { metadata: stripNullMetadata(node.metadata) } : {}),
  });
  // ancestor_path rides along on the shard and catalog-record copies of a
  // node so the record page can draw its chain to the trunk from the one
  // artifact it loads. nodes.json alone omits it: anything reading that
  // file already has the whole graph, and carrying it there pushes the
  // artifact past the 20 MiB budget in scripts/check-data-size.mjs.
  // Stripped here, before the collections are compared with what is
  // already on disk, so an unchanged build keeps its generated_at.
  const strippedGraphNodes = graph.nodes.map(stripDeadNodeFields);
  const emittedNodes = strippedGraphNodes.map(
    ({ ancestor_path, ...node }) => node,
  );
  // display_label is fully derivable from source_node_id/relationship_type/
  // target_node_id and unread anywhere in src/ — dead weight on every edge.
  // warning/inference_rule_id are read via `edge.warning || ""` (runtime.mjs)
  // so omitting a null/falsy value is behaviorally identical to storing it.
  // raw_relationship_type duplicates relationship_type on the ~78% of edges
  // where an OLIR-style source never overrode it. None of this is dropping
  // real evidence — same 20 MiB budget concern as ancestor_path above.
  const derivableEvidenceId = (edge) => `evidence:${String(edge.id).slice("edge:".length)}`;
  const emittedEdges = graph.edges.map(
    ({ display_label, warning, inference_rule_id, raw_relationship_type, evidence_ids, ...edge }) => ({
      ...edge,
      ...(warning ? { warning } : {}),
      ...(inference_rule_id ? { inference_rule_id } : {}),
      ...(raw_relationship_type && raw_relationship_type !== edge.relationship_type
        ? { raw_relationship_type }
        : {}),
      ...(evidence_ids?.length === 1 && evidence_ids[0] === derivableEvidenceId(edge)
        ? {}
        : { evidence_ids }),
    }),
  );
  const treeSpine = readJson(join(ROOT, "data", "curated", "tree-spine.json"));
  const atlasSpine = buildAtlasSpine(graph, authoritySpine, treeSpine);
  const collections = {
    sources: graph.sources,
    nodes: emittedNodes,
    edges: emittedEdges,
    evidence: graph.evidence,
    "graph-health": graph.findings,
    "atlas-spine": atlasSpine,
  };
  const previousCollections = loadExistingCollections();
  const generatedAt =
    existingGeneratedAt(collections) || new Date().toISOString();

  const sourceManifests = buildSourceManifests(graph);
  const buildManifest = createBuildManifest(graph);
  const diffSummary = buildDiffSummary(
    previousCollections,
    collections,
    generatedAt,
  );
  const librarySearch = buildLibrarySearch(graph);
  const sourceById = new Map(graph.sources.map((source) => [source.id, source]));
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const evidenceById = new Map(
    graph.evidence.map((entry) => [entry.id, entry]),
  );
  const catalogs = createFederalGraphRuntime(graph)
    .getCatalogs()
    .map((catalog) => {
      const root =
        graph.nodes.find(
          (node) =>
            node.node_type === "catalog" &&
            node.metadata?.catalog_id === catalog.id,
        ) ||
        graph.nodes.find(
          (node) => node.metadata?.catalog_id === catalog.id,
        );
      const source = sourceById.get(root?.source_id);
      return {
        ...catalog,
        source_id: root?.source_id || "",
        source_version: source?.version || source?.source_version || "",
      };
    });
  const mappingSourcesByPair = new Map();
  for (const edge of graph.edges) {
    if (edge.publication_status !== "published") continue;
    const sourceCatalog =
      nodeById.get(edge.source_node_id)?.metadata?.catalog_id || "";
    const targetCatalog =
      nodeById.get(edge.target_node_id)?.metadata?.catalog_id || "";
    if (!sourceCatalog || !targetCatalog || sourceCatalog === targetCatalog) {
      continue;
    }
    const sourceIds = new Set([
      ...(edge.source_refs || []).map((reference) => reference.source_id),
      ...(edge.evidence_ids || []).map(
        (evidenceId) => evidenceById.get(evidenceId)?.source_id,
      ),
    ]);
    for (const key of [
      `${sourceCatalog}|${targetCatalog}`,
      `${targetCatalog}|${sourceCatalog}`,
    ]) {
      const values = mappingSourcesByPair.get(key) || new Set();
      for (const sourceId of sourceIds) {
        if (sourceId) values.add(sourceId);
      }
      mappingSourcesByPair.set(key, values);
    }
  }
  const catalogBootstrap = {
    catalogs,
    mapping_sources: Object.fromEntries(
      [...mappingSourcesByPair.entries()].map(([key, sourceIds]) => [
        key,
        [...sourceIds]
          .map((sourceId) => {
            const source = sourceById.get(sourceId);
            return {
              value: sourceId,
              label: source?.display_name || source?.name || sourceId,
            };
          })
          .sort((left, right) => left.label.localeCompare(right.label)),
      ]),
    ),
  };
const catalogRecords = new Map();
  for (const node of strippedGraphNodes) {
    const catalogId = node.metadata?.catalog_id;
    if (!catalogId) continue;
    const records = catalogRecords.get(catalogId) || [];
    records.push(node);
    catalogRecords.set(catalogId, records);
  }

  mkdirSync(GENERATED, { recursive: true });
  for (const entry of readdirSync(GENERATED)) {
    const entryPath = join(GENERATED, entry);
    // This sibling artifact is owned by build-commons-index.mjs. Framework
    // rebuilds must not erase another generator's committed output.
    if (entry === "commons-search-index.json") {
      continue;
    }
    if (
      entry === "library-search" ||
      entry === "atlas-neighborhood" ||
      entry === "catalog-records" ||
      entry === "graph-data"
    ) {
      rmSync(entryPath, { recursive: true, force: true });
      continue;
    }
    if (entry.endsWith(".json")) {
      rmSync(entryPath, { force: true });
    }
  }
  for (const [name, values] of Object.entries(collections)) {
    const collection = runtimeCollectionKey(name);
    if (SHARDED_RUNTIME_COLLECTIONS.has(name)) {
      const shardDir = join(GENERATED, "graph-data", name);
      mkdirSync(shardDir, { recursive: true });
      const chunkSize = Math.ceil(values.length / RUNTIME_COLLECTION_SHARD_COUNT);
      const shards = [];
      for (let index = 0; index < values.length; index += chunkSize) {
        const shardId = String(shards.length).padStart(3, "0");
        const path = `graph-data/${name}/${shardId}.json`;
        const chunk = values.slice(index, index + chunkSize);
        writeFileSync(
          join(GENERATED, path),
          `${JSON.stringify(artifact(collection, chunk, generatedAt))}\n`,
          "utf8",
        );
        shards.push({ path, record_count: chunk.length });
      }
      const manifest = artifact(collection, [], generatedAt);
      manifest.sharded_collection = {
        collection,
        record_count: values.length,
        content_sha256: collectionFingerprint(values),
        shards,
      };
      writeFileSync(
        join(GENERATED, `${name}.json`),
        `${JSON.stringify(manifest)}\n`,
        "utf8",
      );
      continue;
    }
    const value = artifact(collection, values, generatedAt);
    writeFileSync(
      join(GENERATED, `${name}.json`),
      `${JSON.stringify(value)}\n`,
      "utf8",
    );
  }

  // The Sources page reports what the build actually loaded and connected.
  // Deriving it in the browser would force the monolithic graph onto a route
  // that otherwise needs none, so it is computed once here and shipped as a
  // few hundred bytes.
  writeFileSync(
    join(GENERATED, "connection-inventory.json"),
    `${JSON.stringify(
      artifact(
        "connection_inventory",
        buildConnectionInventory(graph.nodes, graph.edges),
        generatedAt,
      ),
      null,
      2,
    )}
`,
    "utf8",
  );

  writeFileSync(
    join(GENERATED, "source-manifests.json"),
    `${JSON.stringify(artifact("source_manifests", sourceManifests, generatedAt), null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    join(GENERATED, "build-manifest.json"),
    `${JSON.stringify(artifact("build_manifest", buildManifest, generatedAt), null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    join(GENERATED, "graph-diff-summary.json"),
    `${JSON.stringify(artifact("graph_diff_summary", diffSummary, generatedAt), null, 2)}\n`,
    "utf8",
  );

  // Search remains comprehensive, but it is not an initial-route payload.
  // Split it into bounded static files so a reader opens only the search data
  // when they search, while preserving every record and its title.
  const librarySearchDir = join(GENERATED, "library-search");
  mkdirSync(librarySearchDir, { recursive: true });
  const searchChunkSize = Math.ceil(librarySearch.documents.length / 64);
  const searchShards = [];
  for (let index = 0; index < librarySearch.documents.length; index += searchChunkSize) {
    const shardId = String(searchShards.length).padStart(3, "0");
    const path = `library-search/${shardId}.json`;
    const documents = librarySearch.documents.slice(index, index + searchChunkSize);
    writeFileSync(
      join(GENERATED, path),
      `${JSON.stringify(artifact("library_search", { documents }, generatedAt))}\n`,
      "utf8",
    );
    searchShards.push({ path, record_count: documents.length });
  }
  const librarySearchManifest = artifact(
    "library_search",
    { ...librarySearch, documents: [] },
    generatedAt,
  );
  librarySearchManifest.sharded_collection = {
    collection: "library_search",
    record_count: librarySearch.documents.length,
    shards: searchShards,
  };
  writeFileSync(
    join(GENERATED, "library-search.json"),
    `${JSON.stringify(librarySearchManifest)}\n`,
    "utf8",
  );

  writeFileSync(
    join(GENERATED, "catalog-bootstrap.json"),
    `${JSON.stringify(
      artifact("catalog_bootstrap", catalogBootstrap, generatedAt),
    )}\n`,
    "utf8",
  );

  const catalogRecordsDir = join(GENERATED, "catalog-records");
  mkdirSync(catalogRecordsDir, { recursive: true });
  for (const [catalogId, nodes] of catalogRecords) {
    // DISA publishes individual STIG/SRG benchmarks. Keep the catalog landing
    // page small and load one published benchmark at a time; a single complete
    // STIG record artifact is larger than the static-file budget and delays a
    // reader who only needs one publication.
    if (catalogId === "disa-stig" || catalogId === "disa-srg") {
      const groups = new Map();
      for (const node of nodes) {
        if (node.node_type === "catalog" || node.node_type === "benchmark") {
          continue;
        }
        const family = node.metadata?.family;
        if (!family) {
          throw new Error(`${catalogId} record ${node.id} has no published benchmark`);
        }
        const groupNodes = groups.get(family) || [];
        groupNodes.push(node);
        groups.set(family, groupNodes);
      }
      const catalogDir = join(catalogRecordsDir, catalogId);
      mkdirSync(catalogDir, { recursive: true });
      const groupPaths = new Set();
      const publishedGroups = [...groups.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, groupNodes]) => {
          const filename = `${slugKey(name)}.json`;
          if (groupPaths.has(filename)) {
            throw new Error(`${catalogId} published benchmark path collision: ${filename}`);
          }
          groupPaths.add(filename);
          const path = `${catalogId}/${filename}`;
          writeFileSync(
            join(catalogRecordsDir, path),
            `${JSON.stringify(
              artifact(
                "catalog_records",
                { catalog_id: catalogId, published_group: name, nodes: groupNodes },
                generatedAt,
              ),
            )}\n`,
            "utf8",
          );
          return { name, path, record_count: groupNodes.length };
        });
      writeFileSync(
        join(catalogRecordsDir, `${catalogId}.json`),
        `${JSON.stringify(
          artifact(
            "catalog_records",
            {
              catalog_id: catalogId,
              sharded_by: "published_benchmark",
              record_count: publishedGroups.reduce(
                (count, group) => count + group.record_count,
                0,
              ),
              published_groups: publishedGroups,
              nodes: [],
            },
            generatedAt,
          ),
        )}\n`,
        "utf8",
      );
      continue;
    }
    writeFileSync(
      join(catalogRecordsDir, `${catalogId}.json`),
      `${JSON.stringify(
        artifact(
          "catalog_records",
          { catalog_id: catalogId, nodes },
          generatedAt,
        ),
      )}\n`,
      "utf8",
    );
  }

  // Generate neighborhood shards only after the catalog records have been
  // serialized. Each structure is a complete view of the graph; retaining
  // both while serializing the largest DISA catalog can exceed a constrained
  // workstation's native allocation limit even though each artifact itself is
  // within its size budget.
  const atlasNeighborhoodShards = buildAtlasNeighborhoodShards({
    ...graph,
    nodes: strippedGraphNodes,
  });
  mkdirSync(ATLAS_NEIGHBORHOOD_DIR, { recursive: true });
  const atlasShardManifest = [];
  for (const shard of atlasNeighborhoodShards) {
    const shardPath = `atlas-neighborhood/${shard.shard_id}.json`;
    writeFileSync(
      join(GENERATED, shardPath),
      `${JSON.stringify(
        artifact(
          "atlas_neighborhood_shard",
          {
            shard_id: shard.shard_id,
            record_count: shard.record_count,
            records: shard.records,
          },
          generatedAt,
        ),
      )}\n`,
      "utf8",
    );
    atlasShardManifest.push({
      shard_id: shard.shard_id,
      record_count: shard.record_count,
      path: shardPath,
      bytes: statSync(join(GENERATED, shardPath)).size,
    });
  }
  writeFileSync(
    join(GENERATED, "atlas-neighborhood-manifest.json"),
    `${JSON.stringify(
      artifact(
        "atlas_neighborhood_manifest",
        {
          shard_count: ATLAS_NEIGHBORHOOD_SHARD_COUNT,
          hash_algorithm: "fnv1a-32",
          records: graph.nodes.length,
          shards: atlasShardManifest,
        },
        generatedAt,
      ),
      null,
      2,
    )}\n`,
    "utf8",
  );

  return {
    sources: graph.sources.length,
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    evidence: graph.evidence.length,
    findings: graph.findings.length,
  };
}

if (process.argv[1]?.includes("build-framework-data.mjs")) {
  const result = buildFrameworkData();
  console.log(
    `Built federal graph: ${result.sources} sources, ${result.nodes} nodes, ${result.edges} edges, ${result.evidence} evidence records, ${result.findings} findings`,
  );
}
