import { readFileSync } from "node:fs";

import { writeJsonAtomically } from "./lib/write-json-atomically.mjs";
import { generatedAt } from "./lib/stable-generated-at.mjs";

const OUT = "data/generated/taxonomy-registry.json";

const terms = JSON.parse(readFileSync("data/curated/taxonomy-terms.json", "utf8"));
const relationships = JSON.parse(readFileSync("data/curated/taxonomy-relationships.json", "utf8"));
const identities = JSON.parse(readFileSync("data/curated/identity-registry.json", "utf8"));

const errors = [];

const dimensionIds = new Set(terms.dimensions.map((d) => d.id));
const termById = new Map();
const aliasOwners = new Map();

for (const term of terms.terms) {
  if (!term.id || !term.label || !term.dimension) {
    errors.push(`Term missing required field: ${JSON.stringify(term)}`);
    continue;
  }
  if (!dimensionIds.has(term.dimension)) {
    errors.push(`Term "${term.id}" references unknown dimension "${term.dimension}".`);
  }
  if (termById.has(term.id)) {
    errors.push(`Duplicate term ID: "${term.id}".`);
  }
  termById.set(term.id, term);

  for (const alias of term.aliases ?? []) {
    const lower = alias.toLocaleLowerCase();
    const existing = aliasOwners.get(lower);
    if (existing && existing.id !== term.id && existing.dimension !== term.dimension) {
      console.warn(`  [warn] Alias "${alias}" shared across dimensions: "${existing.id}" (${existing.dimension}) and "${term.id}" (${term.dimension}). Aliases are search-only; both terms surface in results.`);
    }
    if (!existing) aliasOwners.set(lower, term);
  }

  if (!term.status) errors.push(`Term "${term.id}" missing lifecycle status.`);
  if (!term.owner) errors.push(`Term "${term.id}" missing owner.`);
  if (!term.review_date) errors.push(`Term "${term.id}" missing review_date.`);
  if (!Array.isArray(term.hierarchy) || term.hierarchy.length < 2) {
    errors.push(`Term "${term.id}" has invalid hierarchy.`);
  }
}

for (const rel of relationships.relationships) {
  if (!termById.has(rel.from)) {
    errors.push(`Relationship "from" references unknown term "${rel.from}".`);
  }
  if (!termById.has(rel.to)) {
    errors.push(`Relationship "to" references unknown term "${rel.to}".`);
  }
  if (!rel.relationship) {
    errors.push(`Relationship from "${rel.from}" to "${rel.to}" missing relationship type.`);
  }
  if (!rel.source_url) {
    errors.push(`Relationship "${rel.from}" → "${rel.to}" missing source_url.`);
  }
  if (!rel.validation_state) {
    errors.push(`Relationship "${rel.from}" → "${rel.to}" missing validation_state.`);
  }
}

const visited = new Set();
const stack = new Set();
function detectCycle(termId) {
  if (stack.has(termId)) return true;
  if (visited.has(termId)) return false;
  visited.add(termId);
  stack.add(termId);
  for (const rel of relationships.relationships) {
    if (rel.from === termId && rel.propagate_for_discovery) {
      if (detectCycle(rel.to)) {
        errors.push(`Discovery-propagation cycle detected involving "${termId}".`);
        return true;
      }
    }
  }
  stack.delete(termId);
  return false;
}
for (const termId of termById.keys()) detectCycle(termId);

for (const identity of identities.identities) {
  if (!identity.key) {
    errors.push(`Identity entry missing key.`);
    continue;
  }
  for (const tid of identity.term_ids ?? []) {
    if (!termById.has(tid)) {
      errors.push(`Identity "${identity.key}" references unknown term "${tid}".`);
    }
  }
  if (!identity.fallback) {
    errors.push(`Identity "${identity.key}" missing fallback.`);
  }
  if (!identity.verification_status) {
    errors.push(`Identity "${identity.key}" missing verification_status.`);
  }
  if (identity.verification_status !== "verified_official" && identity.verification_status !== "fallback_only" && identity.asset_path) {
    errors.push(`Identity "${identity.key}" has asset_path but verification_status is "${identity.verification_status}" (must be "verified_official" to render as official mark).`);
  }
}

if (errors.length > 0) {
  console.error("taxonomy-registry validation failed:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const identityByTermId = new Map();
for (const identity of identities.identities) {
  for (const tid of identity.term_ids) {
    identityByTermId.set(tid, identity.key);
  }
}

const registry = {
  schema_version: "1.0",
  generated_at: generatedAt(),
  source: {
    terms_version: terms.schema_version,
    relationships_version: relationships.schema_version,
    identity_version: identities.schema_version,
  },
  dimensions: terms.dimensions,
  terms: terms.terms.map((t) => ({
    ...t,
    identity_key: t.identity_key ?? identityByTermId.get(t.id) ?? null,
  })),
  relationships: relationships.relationships,
  identities: identities.identities,
};

writeJsonAtomically(OUT, registry);

console.log(
  `taxonomy-registry: ${terms.dimensions.length} dimensions, ` +
  `${terms.terms.length} terms, ` +
  `${relationships.relationships.length} relationships, ` +
  `${identities.identities.length} identities.`,
);
