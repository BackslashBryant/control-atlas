#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  assertionEnvelopeForEdge,
  assertionProfileId,
  effectiveProfile,
  recordProfileId,
} from "../src/shared/entity-profiles.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) => JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
const failures = [];
const sha256Pattern = /^sha256:[a-f0-9]{64}$/;
const absencePattern = /\b(?:not documented|were not documented|was not documented|not stated|no additional limitations|publisher destination was reviewed|documentation (?:was|were) not found)\b/i;

function fail(message) {
  failures.push(message);
}

function readShards(kind) {
  const directory = join(ROOT, "data", "generated", "graph-data", kind);
  return readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .flatMap((file) => JSON.parse(readFileSync(join(directory, file), "utf8"))[kind] || []);
}

function displayStrings(value, trail = []) {
  if (typeof value === "string") return [{ trail, value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => displayStrings(item, [...trail, index]));
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) => displayStrings(item, [...trail, key]));
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateAssertion = ajv.compile(readJson("data/schemas/atlas-assertion.schema.json"));
const validateClaimEvidence = ajv.compile(readJson("data/schemas/claim-evidence.schema.json"));
const dataset = readJson("data/commons-resource-dataset.json");
const sourceRegistry = readJson("data/source-registry.json");
const adapterRegistry = readJson("data/profiles/source-adapter-registry.json");
const migrationManifest = readJson("data/profiles/source-truth-migration-manifest.json");
const nodes = readShards("nodes");
const edges = readShards("edges");
const evidence = readShards("evidence");
const nodeIds = new Set(nodes.map((node) => node.id));
const evidenceById = new Map(evidence.map((entry) => [entry.id, entry]));

if (dataset.schemaVersion !== "4.0") fail(`resource dataset schemaVersion is ${dataset.schemaVersion}, expected 4.0`);
if (sourceRegistry.schema_version !== "5.0") fail(`source registry schema_version is ${sourceRegistry.schema_version}, expected 5.0`);
const requiredAdapterFields = ["adapter_id", "adapter_version", "accepted_source_types", "produced_profile_ids", "field_transformations", "relationship_rules", "fixture_set", "failure_policy"];
for (const adapter of adapterRegistry.adapters || []) {
  for (const field of requiredAdapterFields) if (adapter[field] == null) fail(`${adapter.adapter_id || "adapter"} lacks ${field}`);
  for (const profileId of adapter.produced_profile_ids || []) if (!effectiveProfile(profileId)) fail(`${adapter.adapter_id} produces unknown ${profileId}`);
}
const manifestProfiles = new Set((migrationManifest.mappings || []).map((mapping) => mapping.profile_id));

for (const resource of dataset.resources || []) {
  if (resource.costType === "free" || resource.costType === "no_cost") fail(`${resource.id} retains unsupported cost default ${resource.costType}`);
  for (const field of ["presentationProfile", "toolProfile"]) {
    for (const entry of displayStrings(resource[field], [field])) {
      if (absencePattern.test(entry.value)) fail(`${resource.id}.${entry.trail.join(".")} contains visible absence prose`);
    }
  }
  for (const section of Object.values(resource.presentationProfile || {})) {
    if (section && typeof section === "object" && section.status && section.status !== "documented") {
      fail(`${resource.id} serializes non-documented presentation section ${section.status}`);
    }
  }
  for (const section of Object.values(resource.toolProfile || {})) {
    if (section && typeof section === "object" && section.status === "not_documented") {
      fail(`${resource.id} serializes unsupported tool placeholder`);
    }
  }
  const evidencePaths = new Set();
  for (const claim of resource.claimEvidence || []) {
    evidencePaths.add(claim.fieldPath);
    const envelope = {
      entity_id: resource.id,
      field_path: claim.fieldPath,
      origin: claim.origin,
      evidence_refs: claim.evidenceRefs || [],
      ...(claim.transformation ? { transformation: claim.transformation } : {}),
      ...(claim.confidence != null ? { confidence: claim.confidence } : {}),
      review_status: claim.reviewStatus,
    };
    if (!validateClaimEvidence(envelope)) {
      fail(`${resource.id}${claim.fieldPath}: ${ajv.errorsText(validateClaimEvidence.errors)}`);
    }
  }
  for (const field of ["/name", "/publisher", "/summary", "/whyIncluded", "/accessType"]) {
    if (!evidencePaths.has(field)) fail(`${resource.id} lacks claim evidence for ${field}`);
  }
  if (resource.costType && !evidencePaths.has("/costType")) fail(`${resource.id} displays cost without field evidence`);
  const replacements = resource.lifecycle?.replacedBy || resource.supersededBy || [];
  if ((Array.isArray(replacements) ? replacements.length : Boolean(replacements)) && !evidencePaths.has("/lifecycle/replacedBy") && !evidencePaths.has("/supersededBy")) {
    fail(`${resource.id} names a replacement without explicit claim evidence`);
  }
}

for (const artifact of sourceRegistry.artifacts || []) {
  if (!sha256Pattern.test(artifact.sha256 || "")) fail(`${artifact.id} lacks a valid acquired-artifact checksum`);
  if (!artifact.version && !artifact.metadata?.version_unknown_reason) fail(`${artifact.id} lacks a version or explicit version-unknown disposition`);
}
for (const source of sourceRegistry.sources || []) {
  if (!sha256Pattern.test(source.checksum || "")) fail(`${source.id} lacks a valid checksum`);
  if (!source.version && !source.metadata?.version_unknown_reason) fail(`${source.id} lacks a source version or explicit version-unknown disposition`);
}

for (const node of nodes) {
  const expectedProfile = recordProfileId(node.node_type);
  if (node.entity_kind !== "content_record" || node.profile_id !== expectedProfile) fail(`${node.id} lacks explicit ${expectedProfile} envelope fields`);
  if (!effectiveProfile(expectedProfile)) fail(`${node.id} resolves unknown profile ${expectedProfile}`);
  if (!manifestProfiles.has(expectedProfile)) fail(`${node.id} profile ${expectedProfile} is absent from the migration manifest`);
  if (!node.metadata?.origin) fail(`${node.id} lacks origin classification`);
  const replacementIds = node.metadata?.replaced_by || node.metadata?.superseded_by || [];
  if ((Array.isArray(replacementIds) ? replacementIds.length : Boolean(replacementIds)) && !(node.source_refs?.length || node.metadata?.authority_source_refs?.length || node.artifact_ids?.length)) {
    fail(`${node.id} names a replacement without a source reference`);
  }
}

for (const edge of edges) {
  const expectedProfile = assertionProfileId(edge.relationship_type);
  if (edge.relationship_type === "Concept Crosswalk") fail(`${edge.id} retains uncontrolled Concept Crosswalk predicate`);
  if (edge.entity_kind !== "assertion" || edge.profile_id !== expectedProfile) fail(`${edge.id} lacks explicit ${expectedProfile} envelope fields`);
  if (!edge.assertion_class || !edge.authority_class || !edge.status) fail(`${edge.id} lacks relationship class, authority, or lifecycle`);
  if (!nodeIds.has(edge.source_node_id) || !nodeIds.has(edge.target_node_id)) fail(`${edge.id} references a missing endpoint`);
  const envelope = assertionEnvelopeForEdge(edge);
  if (!validateAssertion(envelope)) fail(`${edge.id}: ${ajv.errorsText(validateAssertion.errors)}`);
  if (!["structural", "atlas_navigation"].includes(envelope.assertion_class)) {
    const matchingEvidence = (edge.evidence_ids || []).map((id) => evidenceById.get(id)).filter(Boolean);
    if (!edge.source_refs?.length && !matchingEvidence.length) fail(`${edge.id} has no resolvable evidence`);
  }
}

for (const entry of evidence) {
  if (!entry.source_version) fail(`${entry.id} lacks retrieval version context`);
  if (!entry.checksum && !["editorial", "locator_only"].includes(entry.integrity_status)) fail(`${entry.id} lacks checksum or an explicit integrity disposition`);
  if (entry.checksum && !sha256Pattern.test(entry.checksum)) fail(`${entry.id} has invalid checksum`);
}

for (const id of ["mitre-attack-enterprise", "mitre-attack-ics"]) {
  const source = sourceRegistry.sources.find((entry) => entry.id === id);
  if (!source || /\/master\//.test(source.artifact_url || "") || !/6cda5ad8462c79e14fbb872f4e09059b18e0cfc4/.test(source.artifact_url || "")) {
    fail(`${id} is not pinned to the reviewed ATT&CK 19.2 commit`);
  }
}
const d3fend = sourceRegistry.sources.find((entry) => entry.id === "mitre-d3fend-ontology");
if (d3fend?.artifact_url !== "https://d3fend.mitre.org/ontologies/d3fend.json" || d3fend.version !== "1.5.0") fail("D3FEND is not sourced from the reviewed 1.5.0 ontology JSON-LD artifact");
const fedrampLegacy = sourceRegistry.sources.find((entry) => entry.id === "fedramp-rev5");
const fedrampCurrent = sourceRegistry.sources.find((entry) => entry.id === "fedramp-2026-rules");
if (fedrampLegacy?.lifecycle_status !== "historical" || fedrampCurrent?.lifecycle_status !== "active") fail("FedRAMP current and historical source roles are not explicit");

if (failures.length) {
  console.error(`FAIL: source-truth verification found ${failures.length} issue(s):`);
  console.error(failures.slice(0, 200).map((failure) => `- ${failure}`).join("\n"));
  if (failures.length > 200) console.error(`- …and ${failures.length - 200} more`);
  process.exit(1);
}

console.log(`PASS: source truth verified across ${dataset.resources.length} resources, ${nodes.length} records, ${edges.length} assertions, ${evidence.length} evidence rows, and ${sourceRegistry.artifacts.length + sourceRegistry.sources.length} artifacts.`);
