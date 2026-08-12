#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonAtomically } from './lib/write-json-atomically.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(ROOT, 'data/source-registry.json');
const registry = JSON.parse(readFileSync(path, 'utf8'));

for (const bundle of registry.catalog_source_bundles || []) {
  if (bundle.expected_inventory) continue;
  const root = `data/generated/catalog-source-inventory.json#catalogs.${bundle.catalog_id}`;
  bundle.expected_inventory = {
    basis: 'Exact unique record identities emitted by the catalog source adapter from provenance-attested publisher material, counted before structural groups, relationships, or graph publication.',
    evidence_class: 'pre_graph_adapter_inventory',
    evidence_locator: `${root}.discovered_records`,
    imported_evidence_locator: `${root}.normalized_records`,
    exclusions: [],
  };
}

const byId = new Map((registry.artifacts || []).map((artifact) => [artifact.id, artifact]));
const structure = byId.get('artifact-control-atlas-structure');
if (structure) {
  structure.source_role = 'editorial';
  structure.metadata = {
    ...(structure.metadata || {}),
    pipeline_scope: 'governance',
    pipeline_scope_reason: 'Product-authored organizing structure is verified as governance evidence and is not a publisher catalog source.',
  };
}

const addMapping = (catalogId, artifactId) => {
  const bundle = (registry.catalog_source_bundles || []).find((entry) => entry.catalog_id === catalogId);
  if (!bundle || !byId.has(artifactId)) return;
  if (!bundle.mapping_source_ids.includes(artifactId)) bundle.mapping_source_ids.push(artifactId);
  bundle.mapping_source_ids.sort();
};
addMapping('nist-800-53', 'artifact-nist-csf-53-supplemental');
addMapping('csf-2', 'artifact-nist-csf11-csf20-crosswalk');

writeJsonAtomically(path, registry);
console.log(`Synchronized inventory contracts for ${registry.catalog_source_bundles.length} catalogs.`);
