#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  artifactProfileId,
  assertionProfileId,
  effectiveProfile,
  ENTITY_PROFILE_REGISTRY,
  publicationProfileId,
  recordProfileId,
  resourceProfileId,
} from "../src/shared/entity-profiles.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));
const failures = [];
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const schema = readJson("data/schemas/profile-registry.schema.json");
const validate = ajv.compile(schema);
if (!validate(ENTITY_PROFILE_REGISTRY)) failures.push(...(validate.errors || []).map((error) => `registry${error.instancePath}: ${error.message}`));

const ids = new Set();
for (const profile of ENTITY_PROFILE_REGISTRY.profiles) {
  if (ids.has(profile.profile_id)) failures.push(`duplicate profile ${profile.profile_id}`);
  ids.add(profile.profile_id);
  try {
    const effective = effectiveProfile(profile.profile_id);
    for (const field of ["required_fields", "optional_fields", "allowed_origins", "evidence_required_fields", "display_sections"]) {
      if (!Array.isArray(effective?.[field])) failures.push(`${profile.profile_id} has no inherited ${field}`);
    }
  } catch (error) {
    failures.push(error.message);
  }
}

function readShards(name) {
  const directory = join(ROOT, "data", "generated", "graph-data", name);
  return readdirSync(directory).filter((file) => file.endsWith(".json")).sort().flatMap((file) => {
    const artifact = JSON.parse(readFileSync(join(directory, file), "utf8"));
    return artifact[name] || [];
  });
}

const nodes = readShards("nodes");
const edges = readShards("edges");
const resources = readJson("data/commons-resource-dataset.json").resources;
const sources = readJson("data/source-registry.json");
const observed = new Set();

for (const node of nodes) {
  const profileId = recordProfileId(node.node_type);
  observed.add(profileId);
  const profile = effectiveProfile(profileId);
  if (!profile || profile.status !== "active") failures.push(`${node.id} resolves missing or inactive ${profileId}`);
}
for (const resource of resources) {
  const expected = resourceProfileId(resource.resourceType);
  observed.add(expected);
  if (resource.entityKind !== "resource" || resource.profileId !== expected) failures.push(`${resource.id} must resolve ${expected}`);
  if (!effectiveProfile(expected)) failures.push(`${resource.id} resolves missing ${expected}`);
}
for (const publication of sources.publications || []) {
  const expected = publicationProfileId(publication.metadata?.identity_kind || "publication");
  observed.add(expected);
  if (publication.entity_kind !== "publication" || publication.profile_id !== expected) failures.push(`${publication.id} must resolve ${expected}`);
}
for (const artifact of sources.artifacts || []) {
  const expected = artifactProfileId(artifact.format);
  observed.add(expected);
  if (artifact.entity_kind !== "artifact" || artifact.profile_id !== expected) failures.push(`${artifact.id} must resolve ${expected}`);
}
for (const source of sources.sources || []) {
  const expected = artifactProfileId(source.artifact_type || "other");
  observed.add(expected);
  if (source.entity_kind !== "artifact" || source.profile_id !== expected) failures.push(`${source.id} must resolve ${expected}`);
}
for (const bundle of sources.catalog_source_bundles || []) {
  observed.add("assertion.source_bundle");
  if (bundle.entity_kind !== "assertion" || bundle.profile_id !== "assertion.source_bundle") failures.push(`${bundle.catalog_id} source bundle lacks assertion profile`);
}
for (const edge of edges) {
  const expected = assertionProfileId(edge.relationship_type);
  observed.add(expected);
  if (!effectiveProfile(expected)) failures.push(`${edge.id} resolves missing ${expected}`);
}
for (const profile of ENTITY_PROFILE_REGISTRY.profiles) {
  if (profile.status === "dormant" && observed.has(profile.profile_id)) failures.push(`dormant profile ${profile.profile_id} is unexpectedly produced`);
}

if (failures.length) {
  console.error(`FAIL: profile verification found ${failures.length} issue(s):`);
  console.error(failures.slice(0, 100).map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log(`PASS: ${nodes.length} records, ${resources.length} resources, ${sources.publications.length} publications, ${sources.artifacts.length + sources.sources.length} source artifacts, and ${edges.length} assertions resolve active profiles.`);
