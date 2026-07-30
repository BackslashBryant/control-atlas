import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test, { before } from "node:test";
import { gzipSync } from "node:zlib";
import { parseCciXml } from "../tools/importers/cci-adapter.mjs";
import {
  parseOlirCsv,
  parseOlirExcel,
} from "../tools/relationship-builders/olir-adapter.mjs";
import {
  buildFrameworkData,
  lifecycleStatus,
} from "../scripts/build-framework-data.mjs";

const generated = (name) =>
  JSON.parse(readFileSync(`data/generated/${name}.json`, "utf8"));
const sourceRegistry = JSON.parse(readFileSync("data/source-registry.json", "utf8"));
let buildResult;

before(() => {
  buildResult = buildFrameworkData();
});

test("CCI adapter preserves official bridge requirements and references", () => {
  const result = parseCciXml(
    readFileSync("tests/fixtures/cci/sample.xml", "utf8"),
  );
  assert.equal(result.records[0].id, "CCI-000015");
  assert.deepEqual(
    result.relationships.map((item) => item.target_id),
    ["AC-2.1"],
  );
  assert.ok(
    result.relationships.every(
      (item) => item.evidence_source === "disa-cci-nist-references",
    ),
  );
});

test("OLIR adapter preserves source and target identifiers", () => {
  const relationships = parseOlirCsv(
    readFileSync("tests/fixtures/olir/sample-crosswalk.csv", "utf8"),
  );
  assert.equal(relationships[0].source_id, "nist-800-53:AC-2");
  assert.equal(relationships[0].target_id, "csf-2:PR.AA-01");
});

test("OLIR adapter parses workbook rows from official-style crosswalk sheets", async () => {
  const buffer = readFileSync("tests/fixtures/olir/sample-crosswalk.xlsx");
  const relationships = await parseOlirExcel(buffer);
  assert.equal(relationships.length, 1);
  assert.equal(relationships[0].source_id, "AC-2");
  assert.equal(relationships[0].target_id, "PR.AA-01");
  assert.match(relationships[0].why, /Sample comment/);
});

test("federal graph build emits graph contract counts", () => {
  const generatedAt = generated("sources").generated_at;
  buildFrameworkData();
  assert.equal(buildResult.sources, 50);
  assert.ok(buildResult.nodes > 9000);
  assert.ok(buildResult.edges > 12000);
  assert.equal(buildResult.edges, buildResult.evidence);
  assert.ok(buildResult.findings > 0);
  assert.equal(generated("sources").generated_at, generatedAt);
});

test("issue 10 graph build emits FIPS, RMF, family, and 800-53B context for AC-2", () => {
  const nodes = generated("nodes").nodes;
  const edges = generated("edges").edges;

  const nodeIds = new Set(nodes.map((node) => node.id));
  assert.ok(nodeIds.has("fips-199:FIPS-199-MODERATE"));
  assert.ok(nodeIds.has("fips-200:AC"));
  assert.ok(nodeIds.has("nist-800-37:RMF-SELECT"));
  assert.ok(nodeIds.has("nist-800-53b:MODERATE"));
  assert.ok(nodeIds.has("nist-800-53:FAMILY-AC"));

  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "nist-800-53b:MODERATE" &&
        edge.target_node_id === "nist-800-53:AC-2" &&
        edge.relationship_type === "selects" &&
        edge.relationship_class === "applicability",
    ),
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "fips-199:FIPS-199-MODERATE" &&
        edge.target_node_id === "nist-800-53b:MODERATE" &&
        edge.relationship_type === "selects",
    ),
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "fips-200:AC" &&
        edge.target_node_id === "nist-800-53:FAMILY-AC" &&
        edge.relationship_type === "references",
    ),
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "nist-800-37:RMF-SELECT" &&
        edge.target_node_id === "nist-800-53b:MODERATE" &&
        edge.relationship_type === "selects",
    ),
  );
});

test("issue 11 graph build emits assessment context and governance artifacts for AC-2", () => {
  const sources = generated("sources").sources;
  const nodes = generated("nodes").nodes;
  const edges = generated("edges").edges;
  const evidence = generated("evidence").evidence;
  const buildManifest = generated("build-manifest");
  const sourceManifests = generated("source-manifests");
  const diffSummary = generated("graph-diff-summary");

  assert.ok(
    sources.some(
      (source) => source.id === "nist-800-53a-assessment-procedures",
    ),
  );
  const assessmentNode = nodes.find((node) => node.id === "nist-800-53a:AC-2");
  assert.ok(assessmentNode, "missing AC-2 assessment node");
  assert.equal(assessmentNode.node_type, "assessment_procedure");
  assert.ok(Array.isArray(assessmentNode.metadata.assessment_methods));
  assert.ok(Array.isArray(assessmentNode.metadata.assessment_objectives));
  assert.ok(Array.isArray(assessmentNode.metadata.assessment_objects));
  assert.match(
    assessmentNode.metadata.procedure_text,
    /account managers are assigned/i,
  );

  const assessmentEdge = edges.find(
    (edge) =>
      edge.source_node_id === "nist-800-53a:AC-2" &&
      edge.target_node_id === "nist-800-53:AC-2" &&
      edge.relationship_type === "assesses",
  );
  assert.ok(assessmentEdge, "missing AC-2 assesses edge");
  assert.ok(
    evidence.some((entry) => assessmentEdge.evidence_ids.includes(entry.id)),
  );

  assert.ok(existsSync("data/generated/build-manifest.json"));
  assert.ok(existsSync("data/generated/source-manifests.json"));
  assert.ok(existsSync("data/generated/graph-diff-summary.json"));
  assert.ok(
    buildManifest.build_manifest.runtime_artifacts.includes(
      "graph-health.json",
    ),
  );
  assert.ok(
    buildManifest.build_manifest.governance_artifacts.includes(
      "build-manifest.json",
    ),
  );
  assert.ok(
    sourceManifests.source_manifests.some(
      (entry) => entry.source_id === "nist-800-53a-assessment-procedures",
    ),
  );
  const oscalSource = sources.find((source) => source.id === "nist-oscal");
  const oscalFreshness = sourceRegistry.freshness.sources.find(
    (entry) => entry.source_id === "nist-oscal",
  );
  assert.equal(oscalSource.sync_model, "auto_synced");
  assert.equal(oscalSource.last_checked, oscalFreshness.last_checked);
  assert.equal(oscalSource.stale_after_days, 45);
  const oscalManifest = sourceManifests.source_manifests.find(
    (entry) => entry.source_id === "nist-oscal",
  );
  assert.equal(oscalManifest.sync_model, "auto_synced");
  assert.equal(oscalManifest.last_checked, oscalFreshness.last_checked);
  assert.equal(oscalManifest.stale_after_days, 45);
  assert.equal(diffSummary.graph_diff_summary.kind, "graph_diff_summary");
});

test("issue 12 graph build emits Release 2 program context without a synthetic revision bridge", () => {
  const sources = generated("sources").sources;
  const nodes = generated("nodes").nodes;
  const edges = generated("edges").edges;

  const sourceIds = new Set(sources.map((source) => source.id));
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const id of [
    "nist-800-171-rev2",
    "nist-800-172-rev3",
    "isoo-cui-regulation",
    "nara-cui-registry",
  ]) {
    assert.ok(sourceIds.has(id), `missing source ${id}`);
  }

  for (const id of [
    "nist-800-171-rev2:3.1.1",
    "nist-800-171-rev2:CATALOG",
    "nist-800-171:CATALOG",
    "nist-800-172:3.1.1E",
    "nist-800-172:CATALOG",
    "cui-policy:CUI-PROGRAM",
    "cui-policy:CUI-BASIC",
    "cui-policy:CUI-SPECIFIED",
  ]) {
    assert.ok(nodeIds.has(id), `missing node ${id}`);
  }

  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "fedramp-rev5:MODERATE" &&
        edge.target_node_id === "nist-800-53:AC-2" &&
        edge.relationship_type === "selects" &&
        edge.relationship_class === "applicability",
    ),
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "cmmc-2:LEVEL-2" &&
        edge.target_node_id === "nist-800-171-rev2:3.1.1" &&
        edge.relationship_type === "requires",
    ),
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "cmmc-2:LEVEL-3" &&
        edge.target_node_id === "nist-800-171-rev2:CATALOG" &&
        edge.relationship_type === "depends_on",
    ),
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "cmmc-2:LEVEL-3" &&
        edge.target_node_id === "nist-800-172:CATALOG" &&
        edge.relationship_type === "depends_on",
    ),
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "nist-800-171-rev2:CATALOG" &&
        edge.target_node_id === "cui-policy:CUI-BASIC" &&
        edge.relationship_type === "protects",
    ),
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "nist-800-172:CATALOG" &&
        edge.target_node_id === "cui-policy:CUI-PROGRAM" &&
        edge.relationship_type === "supports",
    ),
  );
  assert.ok(
    !edges.some(
      (edge) =>
        edge.source_node_id === "cmmc-2:LEVEL-2" &&
        edge.target_node_id.startsWith("nist-800-171:") &&
        edge.relationship_type === "requires",
    ),
  );
  assert.ok(
    !edges.some(
      (edge) =>
        edge.source_node_id === "cmmc-2:LEVEL-2" &&
        edge.target_node_id === "nist-800-53:AC-2",
    ),
  );
});

test("epic 2 graph build emits DISA STIG and SRG nodes plus official CCI references", () => {
  const sources = generated("sources").sources;
  const nodes = generated("nodes").nodes;
  const edges = generated("edges").edges;

  const sourceIds = new Set(sources.map((source) => source.id));
  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const id of [
    "disa-stig-library",
    "disa-srg-library",
    "disa-stig-srg-cci-references",
  ]) {
    assert.ok(sourceIds.has(id), `missing source ${id}`);
  }

  const stigNodes = nodes.filter((node) => node.id.startsWith("disa-stig:"));
  const srgNodes = nodes.filter((node) => node.id.startsWith("disa-srg:"));
  assert.ok(stigNodes.length > 0, "expected at least one disa-stig node");
  assert.ok(srgNodes.length > 0, "expected at least one disa-srg node");

  const stigCciEdge = edges.find(
    (edge) =>
      edge.source_node_id.startsWith("disa-stig:") &&
      edge.target_node_id.startsWith("disa-cci:") &&
      edge.relationship_type === "references",
  );
  assert.ok(
    stigCciEdge,
    "expected at least one disa-stig -> disa-cci references edge",
  );

  const srgCciEdge = edges.find(
    (edge) =>
      edge.source_node_id.startsWith("disa-srg:") &&
      edge.target_node_id.startsWith("disa-cci:") &&
      edge.relationship_type === "references",
  );
  assert.ok(
    srgCciEdge,
    "expected at least one disa-srg -> disa-cci references edge",
  );

  assert.ok(
    !edges.some(
      (edge) =>
        edge.source_node_id.startsWith("disa-stig:") &&
        edge.target_node_id === "nist-800-53:AC-2",
    ),
  );
});

test("epic 2 graph build emits one complete compact library search artifact", () => {
  const artifact = generated("library-search");

  assert.equal(artifact.schema_version, "1.0");
  assert.equal(artifact.library_search.document_count, buildResult.nodes);
  assert.ok(Array.isArray(artifact.library_search.documents));
  assert.equal(
    artifact.library_search.serialized_index,
    undefined,
    "the complete document register is the search owner; a duplicate serialized index must not block startup",
  );
  assert.equal(
    existsSync(join("data", "generated", "library-search")),
    false,
    "per-catalog search shards are superseded by the complete compact artifact",
  );
  assert.equal(
    existsSync(join("data", "generated", "library-search-manifest.json")),
    false,
    "the shard scheduler manifest must not survive the global-index migration",
  );

  const ac2 = artifact.library_search.documents.find(
    (entry) => entry.id === "nist-800-53:AC-2",
  );
  assert.ok(ac2, "missing AC-2 library document");
  assert.equal(ac2.object_type, "control");
  assert.equal(ac2.source_id, "nist-800-53");
  assert.equal(
    ac2.source_name,
    "SP 800-53 Rev. 5",
    "library documents must carry a resolved source name so search-phase result cards can render it before sources.json loads",
  );
  assert.equal(ac2.source_class, "federal_published");
  assert.equal(ac2.control_family, "Access Control");
  assert.equal(
    ac2.description_available,
    true,
    "search must disclose when published record text is available without duplicating it in the bootstrap",
  );
  assert.equal(
    ac2.description,
    undefined,
    "full published text belongs to the record payload, not the search bootstrap",
  );
  assert.equal(ac2.plain_language_summary, undefined);
});

test("zero-padded OLIR mapping endpoints resolve to catalog nodes", () => {
  const edges = generated("edges").edges;
  const findings = generated("graph-health").findings;

  // maps/800-53-to-csf.json writes "AC-01"/"CM-07(02)"; ingested nodes use
  // "AC-1"/"CM-7.2". The build must normalize the notation, not block the
  // relationship.
  assert.ok(
    edges.some(
      (edge) =>
        edge.id.startsWith("edge:800-53-to-csf:") &&
        edge.source_node_id === "nist-800-53:AC-1" &&
        edge.target_node_id.startsWith("csf-2:"),
    ),
    "expected zero-padded AC-01 CSF mapping to resolve to nist-800-53:AC-1",
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.id.startsWith("edge:800-53-to-csf:") &&
        edge.source_node_id === "nist-800-53:CM-7.2",
    ),
    "expected paren enhancement CM-07(02) to resolve to nist-800-53:CM-7.2",
  );

  // Notation alone must no longer block OLIR mappings. Before the fix, 579
  // CSF and 126 SP 800-171 mappings were blocked purely by zero-padding; the
  // only blocks that may remain are genuine upstream data gaps, NOT notation:
  //   - all 126 SP 800-171 notation blocks clear outright (nothing residual);
  //   - a small CSF residue remains from mappings that reference bare
  //     family/category IDs the OLIR source left incomplete (e.g. "CP" ->
  //     "PR.IR-03", "CP-4" -> "RC.RP"), which normalizeControlId correctly
  //     leaves unchanged and which have no catalog node.
  const blocked = findings.filter(
    (finding) => finding.finding_type === "blocked_relationship",
  );
  const p171Blocked = blocked.filter((finding) =>
    finding.subject_id.startsWith("800-53-to-800-171:"),
  );
  assert.equal(
    p171Blocked.length,
    0,
    "every SP 800-171 OLIR mapping was blocked only by control ID notation and must now resolve",
  );
  const csfBlocked = blocked.filter((finding) =>
    finding.subject_id.startsWith("800-53-to-csf:"),
  );
  assert.ok(
    csfBlocked.length <= 12,
    `CSF OLIR notation blocks (573 of 579) must clear; only bare-identifier data gaps may remain, got ${csfBlocked.length} (was 579)`,
  );
});

test("complete library search bootstrap stays within its compressed transfer budget", () => {
  const artifactPath = join("data", "generated", "library-search.json");
  const compressedBytes = gzipSync(readFileSync(artifactPath), {
    level: 9,
  }).byteLength;

  assert.ok(
    compressedBytes <= 750_000,
    `complete search artifact exceeds 750 KB compressed: ${compressedBytes}`,
  );
});

test("dod-zt graph build emits pillars, capabilities, and overlay crosswalk edges", () => {
  const sources = generated("sources").sources;
  const nodes = generated("nodes").nodes;
  const edges = generated("edges").edges;

  const sourceIds = new Set(sources.map((source) => source.id));
  for (const id of [
    "dod-zt-reference-architecture-v2",
    "dod-zt-strategy",
    "dod-zt-overlays-2024",
    "dod-zt-capabilities",
    "dod-zt-execution-roadmap",
  ]) {
    assert.ok(sourceIds.has(id), `missing source ${id}`);
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  assert.ok(nodeIds.has("dod-zt:CATALOG"));
  assert.ok(nodeIds.has("dod-zt:TENET-1"));
  assert.ok(nodeIds.has("dod-zt:PILLAR-1"));
  assert.ok(nodeIds.has("dod-zt:CAP-1-1"));
  assert.ok(nodeIds.has("dod-zt:ACT-1-1-1"));

  const ztNodes = nodes.filter(
    (node) => node.metadata?.catalog_id === "dod-zt",
  );
  assert.ok(
    ztNodes.filter((node) => node.node_type === "zt_tenet").length >= 5,
  );
  assert.ok(
    ztNodes.filter((node) => node.node_type === "zt_pillar").length >= 7,
  );
  assert.ok(
    ztNodes.filter((node) => node.node_type === "zt_capability").length >= 40,
  );

  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "dod-zt:PILLAR-1" &&
        edge.target_node_id === "dod-zt:CAP-1-1" &&
        edge.relationship_type === "contains" &&
        edge.relationship_class === "structural",
    ),
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "nist-800-53:AC-2" &&
        edge.target_node_id.startsWith("dod-zt:CAP-") &&
        edge.relationship_type === "supports",
    ),
  );
  assert.ok(
    edges.some(
      (edge) =>
        edge.source_node_id === "dod-zt:DOC-OVERLAYS" &&
        edge.target_node_id === "dod-zt:DOC-RA" &&
        edge.relationship_type === "references",
    ),
  );
});

test("lifecycleStatus maps withdrawn and deprecated record statuses to node lifecycle_status", () => {
  assert.equal(lifecycleStatus({ status: "withdrawn" }), "withdrawn");
  assert.equal(lifecycleStatus({ status: "deprecated" }), "deprecated");
  assert.equal(lifecycleStatus({ status: undefined }), "active");
  assert.equal(lifecycleStatus({}), "active");
});

test("graph build derives structural control-enhancement edges with derived confidence", () => {
  const nodes = generated("nodes").nodes;
  const edges = generated("edges").edges;

  const enhancementNode = nodes.find(
    (node) => node.id === "nist-800-53:AC-2.1",
  );
  assert.ok(enhancementNode, "expected AC-2.1 node to exist");
  assert.equal(enhancementNode.node_type, "control_enhancement");

  const enhancementEdge = edges.find(
    (edge) =>
      edge.source_node_id === "nist-800-53:AC-2" &&
      edge.target_node_id === "nist-800-53:AC-2.1" &&
      edge.relationship_type === "contains" &&
      edge.relationship_class === "structural",
  );
  assert.ok(enhancementEdge, "expected AC-2 -> AC-2.1 structural edge");
  assert.equal(enhancementEdge.confidence, "derived");
  assert.match(enhancementEdge.rationale, /control enhancement of AC-2/);

  // Family-membership edges are structural ID-parsing, the same kind of
  // derivation as enhancement membership above, so they carry the same
  // 'derived' confidence rather than being rubber-stamped 'direct' (CATL-23).
  const familyEdge = edges.find(
    (edge) =>
      edge.source_node_id === "nist-800-53:FAMILY-AC" &&
      edge.target_node_id === "nist-800-53:AC-2" &&
      edge.relationship_type === "contains" &&
      edge.relationship_class === "structural",
  );
  assert.ok(familyEdge);
  assert.equal(familyEdge.confidence, "derived");

  // No duplicate enhancement edges after two consecutive builds.
  const edgesAfterRebuild = generated("edges").edges;
  const enhancementEdgeCount = edgesAfterRebuild.filter(
    (edge) =>
      edge.source_node_id === "nist-800-53:AC-2" &&
      edge.target_node_id === "nist-800-53:AC-2.1" &&
      edge.relationship_type === "contains" &&
      edge.relationship_class === "structural",
  ).length;
  assert.equal(
    enhancementEdgeCount,
    1,
    "expected exactly one AC-2 -> AC-2.1 structural edge, no duplicates",
  );
});

test("graph build removes the retired curated translation path", () => {
  assert.equal(existsSync("data/curated/plain-language/controls-800-53.json"), false);
  const nodes = generated("nodes").nodes;
  assert.ok(nodes.every((node) => node.plain_language_summary === undefined && node.metadata?.plain_action === undefined));
});
