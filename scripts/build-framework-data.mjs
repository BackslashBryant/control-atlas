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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import MiniSearch from "minisearch";
import { validateGraphArtifacts } from "../tools/validators/federal-graph.mjs";
import { loadSourceRegistry } from "../tools/validators/source-registry.mjs";
import {
  generatePlainLanguageRationale,
  generatePlainLanguageSummary,
} from "./lib/plain-language.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = join(ROOT, "data", "generated");
const RUNTIME_COLLECTIONS = [
  "sources",
  "nodes",
  "edges",
  "evidence",
  "graph-health",
];
const GOVERNANCE_FILES = [
  "build-manifest.json",
  "source-manifests.json",
  "graph-diff-summary.json",
  "library-search-manifest.json",
];
const LIBRARY_SEARCH_DIR = join(GENERATED, "library-search");
const EAGER_CATALOG_IDS = ["nist-800-53", "csf-2", "fedramp-rev5"];
const MAX_INITIAL_SEARCH_BYTES = 3_200_000;

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

const MAPS = [
  ["800-53-to-csf.json", "nist-800-53", "csf-2", "nist-olir-csf2-to-sp800-53"],
  [
    "800-53-to-800-171.json",
    "nist-800-171",
    "nist-800-53",
    "nist-800-171-oscal-mappings",
  ],
  ["cci-to-800-53.json", "disa-cci", "nist-800-53", "disa-cci-nist-references"],
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
      sourceId: "nist-oscal",
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
const nodeId = (catalogId, recordId) => `${catalogId}:${recordId}`;
const identifier = (value) => String(value).replace(/[^A-Za-z0-9:_-]+/g, "-");

// OLIR-style mapping files zero-pad SP 800-53 control IDs and write
// enhancements in paren notation ("AC-01", "CM-07(02)", "AC-02.3"), while
// ingested catalog nodes use unpadded dot notation ("AC-1", "CM-7.2",
// "AC-2.3"). Normalize at the mapping read site so endpoints resolve against
// the node set; anything that is not an 800-53-style control ID (CSF
// "GV.OC-03", CCI "CCI-000015", 800-171 "3.1.1") passes through unchanged.
function normalizeControlId(recordId) {
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
  // Curated plain-language overrides (see loadCuratedPlainLanguage) are hand-authored
  // and should win outright. Everything else is regenerated from metadata.description
  // so pre-baked record.plain_language_summary values (which can carry truncation
  // artifacts from upstream normalizers) never leak through uncorrected.
  node.plain_language_summary =
    node.curated_plain_language_summary ||
    generatePlainLanguageSummary({ ...node, plain_language_summary: null });
  delete node.curated_plain_language_summary;
  state.nodes.push(node);
}

function buildAssessmentNode(record) {
  const assessment = record.metadata?.assessment;
  if (!assessment?.source_key) return null;
  return {
    id: assessmentNodeId(record.id),
    node_type: "assessment_procedure",
    label: `${record.id} Assessment Procedure`,
    source_id: assessment.source_key,
    lifecycle_status: record.status === "deprecated" ? "deprecated" : "active",
    metadata: {
      catalog_id: "nist-800-53a",
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

function buildCatalogSummaryNode(catalogId, sourceId, summary) {
  return {
    id: nodeId(catalogId, "CATALOG"),
    node_type: "catalog",
    label: summary.title,
    source_id: sourceId,
    lifecycle_status: "active",
    metadata: {
      catalog_id: catalogId,
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

let curatedPlainLanguageCache;

function loadCuratedPlainLanguage() {
  if (curatedPlainLanguageCache !== undefined) return curatedPlainLanguageCache;
  const path = join(
    ROOT,
    "data",
    "curated",
    "plain-language",
    "controls-800-53.json",
  );
  if (!existsSync(path)) {
    curatedPlainLanguageCache = null;
    return curatedPlainLanguageCache;
  }
  try {
    curatedPlainLanguageCache = readJson(path);
  } catch {
    curatedPlainLanguageCache = null;
  }
  return curatedPlainLanguageCache;
}

function curatedEntryFor(itemId) {
  const curated = loadCuratedPlainLanguage();
  return curated?.entries?.[itemId] || null;
}

function buildNodes(registry) {
  const state = { nodes: [], findings: [] };
  const familyNodes = new Map();
  for (const [filename, catalogId, defaultSourceId, defaultType] of CATALOGS) {
    const path = join(ROOT, "data", filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const record of document.records || []) {
      const sourceId = record.source?.key || defaultSourceId;
      const id = nodeId(catalogId, record.id);
      const curatedEntry =
        catalogId === "nist-800-53" ? curatedEntryFor(record.id) : null;
      pushEligibleNode(
        state,
        registry,
        {
          id,
          node_type: record.type?.startsWith("zt_")
            ? record.type
            : nodeType(defaultType, record.id),
          label: record.title
            ? `${record.id} ${record.title}`
            : String(record.id),
          source_id: sourceId,
          lifecycle_status: lifecycleStatus(record),
          plain_language_summary: record.plain_language_summary || null,
          curated_plain_language_summary:
            curatedEntry?.plain_language_summary || null,
          metadata: {
            catalog_id: catalogId,
            item_id: record.id,
            title: record.title || record.id,
            description: record.description || "",
            family: record.family || record.group || "",
            severity: nodeSeverity(record),
            baselines:
              record.fedramp_baselines || record.metadata?.baselines || null,
            nist_800_53b_baselines:
              record.metadata?.nist_800_53b_baselines || null,
            nist_control: record.nist_control || null,
            type: record.type || null,
            references: record.references || null,
            superseded_by: record.metadata?.superseded_by || null,
            ...(curatedEntry?.plain_action
              ? { plain_action: curatedEntry.plain_action }
              : {}),
          },
        },
        sourceId,
      );

      if (catalogId === "nist-800-53") {
        const assessmentNode = buildAssessmentNode(record);
        if (assessmentNode) {
          pushEligibleNode(
            state,
            registry,
            assessmentNode,
            assessmentNode.source_id,
          );
        }

        const familyCode = familyCodeFromControlId(record.id);
        if (familyCode && record.family) {
          const familyId = nodeId("nist-800-53", `FAMILY-${familyCode}`);
          if (!familyNodes.has(familyId)) {
            familyNodes.set(familyId, {
              id: familyId,
              node_type: "family",
              label: `${familyCode} ${record.family} Family`,
              source_id: defaultSourceId,
              lifecycle_status: "active",
              metadata: {
                catalog_id: "nist-800-53",
                item_id: `FAMILY-${familyCode}`,
                title: record.family,
                description: `${record.family} controls and enhancements from NIST SP 800-53 Rev. 5.`,
                family: record.family,
                baselines: null,
                nist_800_53b_baselines: null,
                nist_control: null,
                type: "control_family",
                references: null,
              },
            });
          }
        }
      }
    }

    const summary = CATALOG_SUMMARIES.get(catalogId);
    if (summary && (document.records || []).length) {
      pushEligibleNode(
        state,
        registry,
        buildCatalogSummaryNode(catalogId, summary.sourceId, summary),
        summary.sourceId,
      );
    }
  }

  for (const familyNode of familyNodes.values()) {
    pushEligibleNode(state, registry, familyNode, familyNode.source_id);
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

  const plainLanguageRationale = generatePlainLanguageRationale(
    payload,
    source,
    rationaleVal,
  );

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
  });

  state.edges.push({
    id: edgeId,
    source_node_id: payload.sourceNodeId,
    target_node_id: payload.targetNodeId,
    relationship_type: payload.relationshipType,
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
    plain_language_rationale: plainLanguageRationale,
    source_refs: sourceRefs,
  });
}

function addDocumentRelationshipEdges(state, registry, nodeIds) {
  for (const [filename, catalogId, defaultSourceId] of CATALOGS) {
    const path = join(ROOT, "data", filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const record of document.records || []) {
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
          sourceId: record.source?.key || defaultSourceId,
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

function addFamilyMembershipEdges(state, registry, nodeIds) {
  const path = join(ROOT, "data", "controls-800-53.json");
  if (!existsSync(path)) return;
  const document = readJson(path);
  for (const record of document.records || []) {
    const familyCode = familyCodeFromControlId(record.id);
    if (!familyCode) continue;
    const sourceNodeId = nodeId("nist-800-53", `FAMILY-${familyCode}`);
    const targetNodeId = nodeId("nist-800-53", record.id);
    const subjectId = relationshipId(
      "800-53-family-membership",
      sourceNodeId,
      targetNodeId,
      "includes",
    );
    addPublishedEdge(state, registry, nodeIds, {
      subjectId,
      sourceId: record.source?.key || "nist-oscal",
      sourceNodeId,
      targetNodeId,
      relationshipType: "includes",
      confidence: "derived",
      locator: record.source?.locator || `controls-800-53.json#${record.id}`,
      retrievedAt: record.source?.snapshot_date,
      rationale: `${record.id} is part of the ${record.family} family in NIST SP 800-53 Rev. 5.`,
    });
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
      "includes",
    );
    if (existingEdgeIds.has(`edge:${subjectId}`)) continue;
    addPublishedEdge(state, registry, nodeIds, {
      subjectId,
      sourceId: record.source?.key || "nist-oscal",
      sourceNodeId,
      targetNodeId,
      relationshipType: "includes",
      confidence: "derived",
      locator: record.source?.locator || `controls-800-53.json#${record.id}`,
      retrievedAt: record.source?.snapshot_date,
      rationale: `${record.id} is a control enhancement of ${baseId} in SP 800-53 Rev. 5.`,
    });
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
        "includes",
      );
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: "nist-800-53b-baselines",
        sourceNodeId,
        targetNodeId,
        relationshipType: "includes",
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
        "includes",
      );
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: record.source?.key || "fedramp-rev5",
        sourceNodeId,
        targetNodeId,
        relationshipType: "includes",
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
}

function addDodZeroTrustHierarchyEdges(state, registry, nodeIds) {
  const path = join(ROOT, "data", "dod-zt.json");
  if (!existsSync(path)) return;
  const document = readJson(path);
  for (const record of document.records || []) {
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
      "includes",
    );
    addPublishedEdge(state, registry, nodeIds, {
      subjectId,
      sourceId: record.source?.key || "dod-zt-reference-architecture-v2",
      sourceNodeId,
      targetNodeId,
      relationshipType: "includes",
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
      sourceId: "nist-oscal",
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
}

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
      const sourceNodeId = nodeId(
        relationship.source_catalog || sourceCatalog,
        normalizeControlId(relationship.source_id),
      );
      const targetNodeId = nodeId(
        relationship.target_catalog || targetCatalog,
        normalizeControlId(relationship.target_id),
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
  addFamilyMembershipEdges(state, registry, nodeIds);
  addEnhancementMembershipEdges(state, registry, nodeIds);
  addBaselineMembershipEdges(state, registry, nodeIds);
  addFedrampMembershipEdges(state, registry, nodeIds);
  addAssessmentEdges(state, registry, nodeIds);
  addCmmcProgramEdges(state, registry, nodeIds, nodes);
  addDodZeroTrustHierarchyEdges(state, registry, nodeIds);
  addCuiPolicyEdges(state, registry, nodeIds);
  return state;
}

function artifact(collection, values, generatedAt) {
  return {
    schema_version: "1.0",
    generated_at: generatedAt,
    [collection]: values,
  };
}

function existingGeneratedAt(collections) {
  let generatedAt = null;
  for (const [name, values] of Object.entries(collections)) {
    const path = join(GENERATED, `${name}.json`);
    if (!existsSync(path)) return null;
    const existing = readJson(path);
    const collection = name === "graph-health" ? "findings" : name;
    if (!existing.generated_at || existing.schema_version !== "1.0")
      return null;
    if (generatedAt && existing.generated_at !== generatedAt) return null;
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
    previous[name] = readJson(path);
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
      "library-search-manifest.json",
      "library-search/",
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

function buildLibraryDocuments(graph) {
  const sourceById = new Map(
    graph.sources.map((source) => [source.id, source]),
  );
  return graph.nodes.map((node) => {
    const source = sourceById.get(node.source_id);
    return {
      id: node.id,
      item_id: node.metadata?.item_id || node.id,
      title: node.metadata?.title || node.label,
      description: node.metadata?.description || "",
      plain_language_summary: node.plain_language_summary || "",
      object_type: node.node_type,
      source_id: node.source_id,
      source_name: source?.display_name || source?.name || "",
      source_class: source?.provenance_class || "",
      catalog_id: node.metadata?.catalog_id || "",
      control_family: node.metadata?.family || "",
      severity: node.metadata?.severity || "",
    };
  });
}

function buildMiniSearchIndex(documents) {
  const index = new MiniSearch({
    fields: ["item_id", "title", "plain_language_summary", "description"],
    storeFields: ["id"],
    searchOptions: {
      prefix: true,
      boost: {
        item_id: 5,
        title: 3,
        plain_language_summary: 2,
        description: 1,
      },
    },
  });
  index.addAll(documents);
  return JSON.stringify(index.toJSON());
}

function buildLibrarySearchShards(graph) {
  const documents = buildLibraryDocuments(graph);
  const byCatalog = new Map();

  for (const document of documents) {
    const catalogId = document.catalog_id || "_core";
    const bucket = byCatalog.get(catalogId) || [];
    bucket.push(document);
    byCatalog.set(catalogId, bucket);
  }

  const shards = [...byCatalog.entries()]
    .map(([catalog_id, catalogDocuments]) => ({
      catalog_id,
      document_count: catalogDocuments.length,
      documents: catalogDocuments,
      serialized_index: buildMiniSearchIndex(catalogDocuments),
    }))
    .sort((left, right) => right.document_count - left.document_count);

  const eagerSet = new Set(
    EAGER_CATALOG_IDS.filter((catalogId) => byCatalog.has(catalogId)),
  );
  let eagerBytes = 0;
  for (const shard of shards) {
    if (eagerSet.has(shard.catalog_id)) {
      continue;
    }
    const shardBytes = Buffer.byteLength(JSON.stringify(shard));
    if (eagerBytes + shardBytes > MAX_INITIAL_SEARCH_BYTES) {
      break;
    }
    eagerSet.add(shard.catalog_id);
    eagerBytes += shardBytes;
  }

  return {
    shards,
    eager_shard_ids: [...eagerSet],
  };
}

function buildDiffSummary(previous, collections, generatedAt) {
  const changedRuntimeArtifacts = RUNTIME_COLLECTIONS.filter((name) => {
    const previousCollection = previous[name];
    const currentCollection = collections[name];
    if (!previousCollection) return true;
    const previousPayload = JSON.stringify(
      previousCollection[name === "graph-health" ? "findings" : name],
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

export function buildFrameworkData() {
  const registry = loadSourceRegistry(
    readJson(join(ROOT, "data", "source-registry.json")),
  );
  const nodeState = buildNodes(registry);
  const edgeState = buildEdges(registry, nodeState.nodes);
  const findings = [...nodeState.findings, ...edgeState.findings];
  const graph = {
    sources: registry.sources,
    nodes: nodeState.nodes,
    edges: edgeState.edges,
    evidence: edgeState.evidence,
    findings,
  };
  const errors = validateGraphArtifacts(graph);
  if (errors.length)
    throw new Error(`Invalid federal graph:\n- ${errors.join("\n- ")}`);

  const collections = {
    sources: graph.sources,
    nodes: graph.nodes,
    edges: graph.edges,
    evidence: graph.evidence,
    "graph-health": graph.findings,
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
  const librarySearchShards = buildLibrarySearchShards(graph);

  mkdirSync(GENERATED, { recursive: true });
  for (const entry of readdirSync(GENERATED)) {
    const entryPath = join(GENERATED, entry);
    if (entry === "library-search") {
      rmSync(entryPath, { recursive: true, force: true });
      continue;
    }
    if (entry.endsWith(".json")) {
      rmSync(entryPath);
    }
  }
  for (const [name, values] of Object.entries(collections)) {
    const collection = name === "graph-health" ? "findings" : name;
    const value = artifact(collection, values, generatedAt);
    writeFileSync(
      join(GENERATED, `${name}.json`),
      `${JSON.stringify(value, null, 2)}\n`,
      "utf8",
    );
  }

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

  mkdirSync(LIBRARY_SEARCH_DIR, { recursive: true });
  const shardManifest = [];
  for (const shard of librarySearchShards.shards) {
    const shardPath = `library-search/${shard.catalog_id}.json`;
    writeFileSync(
      join(GENERATED, shardPath),
      `${JSON.stringify(
        artifact(
          "library_search_shard",
          {
            catalog_id: shard.catalog_id,
            document_count: shard.document_count,
            documents: shard.documents,
            serialized_index: shard.serialized_index,
          },
          generatedAt,
        ),
        null,
        2,
      )}\n`,
      "utf8",
    );
    shardManifest.push({
      catalog_id: shard.catalog_id,
      document_count: shard.document_count,
      path: shardPath,
      bytes: statSync(join(GENERATED, shardPath)).size,
    });
  }

  writeFileSync(
    join(GENERATED, "library-search-manifest.json"),
    `${JSON.stringify(
      artifact(
        "library_search_manifest",
        {
          eager_shard_ids: librarySearchShards.eager_shard_ids,
          shards: shardManifest,
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
