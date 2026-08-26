#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import registry from "../data/profiles/profile-registry.json" with { type: "json" };
import { writeJsonAtomically } from "./lib/write-json-atomically.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const entityKinds = new Set(["content_record", "resource", "artifact", "publication", "organization"]);
const mappings = registry.profiles
  .filter((profile) => entityKinds.has(profile.entity_kind) && !profile.profile_id.endsWith(".base"))
  .map((profile) => ({
    old_type: profile.profile_id.slice(profile.profile_id.indexOf(".") + 1),
    entity_kind: profile.entity_kind,
    profile_id: profile.profile_id,
    status: profile.status,
  }))
  .sort((left, right) => left.profile_id.localeCompare(right.profile_id));

const relationshipMappings = registry.profiles
  .filter((profile) => profile.entity_kind === "assertion" && !["assertion.base", "assertion.source_bundle"].includes(profile.profile_id))
  .map((profile) => ({
    old_label: profile.profile_id === "assertion.concept_crosswalk" ? "Concept Crosswalk" : profile.profile_id.slice("assertion.".length),
    predicate: profile.profile_id.slice("assertion.".length),
    profile_id: profile.profile_id,
    status: profile.status,
  }))
  .sort((left, right) => left.profile_id.localeCompare(right.profile_id));

writeJsonAtomically(join(ROOT, "data", "profiles", "source-truth-migration-manifest.json"), {
  schema_version: "1.0",
  migration_id: "source-truth-profiles-v1",
  generated_at: "2026-08-25",
  stable_id_policy: "Existing identifiers and routes are preserved; only canonical kind, profile, origin, and assertion metadata are added.",
  mappings,
  relationship_mappings: relationshipMappings,
});
console.log(`source-truth migration manifest: ${mappings.length} entity type mappings and ${relationshipMappings.length} relationship mappings.`);
