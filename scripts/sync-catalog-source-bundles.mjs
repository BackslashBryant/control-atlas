#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonAtomically } from './lib/write-json-atomically.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Nested DISA document files are implementation shards beneath the two
// published catalog roots; the root catalog files are the coverage unit.
export const NON_CATALOG_TECHNICAL_SHARDS = Object.freeze([]);
// These two catalog views are deterministically extracted from a single
// official OSCAL artifact whose canonical identity is shared with another
// catalog. Keep the alias explicit rather than inventing a duplicate file.
const PRIMARY_ARTIFACT_ALIASES = Object.freeze({
  'nist-800-171': 'artifact-nist-800-171-oscal-mappings',
  'nist-800-53a': 'artifact-nist-800-53',
});
const RETRIEVAL_METHOD_BY_PARSER = Object.freeze({
  'ecfr-xml': 'extracted_from_official_publication',
  'nara-cui-registry-html': 'extracted_from_official_publication',
  'dod-rai-toolkit-html': 'extracted_from_official_publication',
  'pdf-extract': 'extracted_from_official_publication',
  'dod-zt-overlay-json': 'supplemental_mapping',
});

function catalogIds() {
  return readdirSync(join(ROOT, 'data', 'generated', 'catalog-records'), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name.slice(0, -5))
    .filter((id) => !NON_CATALOG_TECHNICAL_SHARDS.includes(id))
    .sort();
}

export function syncCatalogSourceBundles(registry) {
  for (const layer of ['publications', 'sources']) {
    for (const record of registry[layer] || []) {
      const method = RETRIEVAL_METHOD_BY_PARSER[record.metadata?.parser];
      if (method && record.retrieval_method === 'manual_review') record.retrieval_method = method;
    }
  }
  const known = new Map((registry.catalog_source_bundles || []).map((bundle) => [bundle.catalog_id, bundle]));
  const sources = [...(registry.sources || []), ...(registry.publications || [])];
  const artifacts = registry.artifacts || [];
  for (const catalogId of catalogIds()) {
    if (known.has(catalogId) && !PRIMARY_ARTIFACT_ALIASES[catalogId]) continue;
    const candidates = sources.filter((source) =>
      source.eligibility_status !== 'excluded' && source.metadata?.frameworks?.includes(catalogId),
    );
    const source = candidates.find((candidate) => artifacts.some((artifact) => artifact.publication_source_id === candidate.id)) || candidates[0];
    if (!source) throw new Error(`catalog ${catalogId} has generated records but no canonical publication/source metadata`);
    const related = artifacts.filter((artifact) => candidates.some((candidate) => candidate.id === artifact.publication_source_id));
    const aliased = PRIMARY_ARTIFACT_ALIASES[catalogId]
      ? artifacts.filter((artifact) => artifact.id === PRIMARY_ARTIFACT_ALIASES[catalogId])
      : [];
    const primary = aliased.length
      ? aliased
      : related.filter((artifact) => artifact.publication_source_id === source.id && artifact.source_role === 'primary_data');
    const mapping = related.filter((artifact) => artifact.source_role === 'mapping');
    const supplemental = related.filter((artifact) => !primary.includes(artifact) && !mapping.includes(artifact));
    known.set(catalogId, {
      catalog_id: catalogId,
      publication_source_id: source.id,
      primary_artifact_ids: primary.map((artifact) => artifact.id),
      enrichment_artifact_ids: supplemental.map((artifact) => artifact.id),
      mapping_source_ids: mapping.map((artifact) => artifact.id),
      assessment_source_ids: [],
      automation_source_ids: [],
      reconciliation_source_ids: [],
    });
  }
  registry.catalog_source_bundles = [...known.values()].sort((a, b) => a.catalog_id.localeCompare(b.catalog_id));
  return registry;
}

if (process.argv[1]?.includes('sync-catalog-source-bundles.mjs')) {
  const path = join(ROOT, 'data', 'source-registry.json');
  const registry = syncCatalogSourceBundles(JSON.parse(readFileSync(path, 'utf8')));
  writeJsonAtomically(path, registry);
  console.log(`Synchronized ${registry.catalog_source_bundles.length} catalog source bundles.`);
}
