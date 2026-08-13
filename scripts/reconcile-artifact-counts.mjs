#!/usr/bin/env node
// Build an explicit SourceCountLedger without mutating source truth.
//
// Artifact record_count / relationship_count describe parsed publisher input.
// Runtime node/edge citation counts describe generated graph output. They are
// intentionally separate because one source record can create zero, one, or
// multiple runtime objects. Conflating those meanings made earlier manifests
// look reconciled by overwriting the source-side count after every build.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readGeneratedCollection } from './lib/generated-graph-artifacts.mjs';
import { resolveExpectedLocator } from './lib/completeness.mjs';
import { writeJsonAtomically } from './lib/write-json-atomically.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = join(ROOT, 'data/source-registry.json');
const OUT = join(ROOT, 'data/generated/source-count-ledger.json');
const CATALOG_RECORDS = join(ROOT, 'data/generated/catalog-records');
const GROUP_TYPES = new Set(['benchmark', 'catalog', 'category', 'family', 'function', 'group', 'policy', 'program', 'tactic']);

function readJson(rel) {
  const full = join(ROOT, rel);
  if (!existsSync(full)) return null;
  return JSON.parse(readFileSync(full, 'utf8'));
}

function catalogRuntimeCounts(catalogId) {
  const rootPath = join(CATALOG_RECORDS, `${catalogId}.json`);
  if (!existsSync(rootPath)) return null;
  const root = JSON.parse(readFileSync(rootPath, 'utf8')).catalog_records;
  const nodes = [...(root.nodes || [])];
  const shardDir = join(CATALOG_RECORDS, catalogId);
  if (existsSync(shardDir)) {
    for (const filename of readdirSync(shardDir).filter((entry) => entry.endsWith('.json'))) {
      const shard = JSON.parse(readFileSync(join(shardDir, filename), 'utf8')).catalog_records;
      nodes.push(...(shard.nodes || []));
    }
  }
  const nonCatalog = nodes.filter((node) => node.node_type !== 'catalog');
  return {
    runtime_navigable_count: nonCatalog.length,
    runtime_leaf_record_count: nonCatalog.filter((node) => !GROUP_TYPES.has(node.node_type)).length,
    runtime_structural_group_count: nonCatalog.filter((node) => GROUP_TYPES.has(node.node_type)).length
      + (root.published_groups || []).length,
  };
}

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
const nodesRaw = readGeneratedCollection(ROOT, 'nodes');
const edgesRaw = readGeneratedCollection(ROOT, 'edges');
if (!nodesRaw || !edgesRaw) {
  console.error('source-count-ledger: run build-framework-data first (missing generated nodes/edges).');
  process.exit(1);
}
const nodes = Array.isArray(nodesRaw) ? nodesRaw : nodesRaw.nodes;
const edges = Array.isArray(edgesRaw) ? edgesRaw : edgesRaw.edges;
const runtimeNodeCitations = new Map();
const runtimeEdgeCitations = new Map();
for (const node of nodes) {
  for (const artifactId of node.artifact_ids || []) {
    runtimeNodeCitations.set(artifactId, (runtimeNodeCitations.get(artifactId) || 0) + 1);
  }
}
for (const edge of edges) {
  if (edge.source_artifact_id) {
    runtimeEdgeCitations.set(edge.source_artifact_id, (runtimeEdgeCitations.get(edge.source_artifact_id) || 0) + 1);
  }
}

const artifacts = (registry.artifacts || []).map((artifact) => ({
  artifact_id: artifact.id,
  publication_source_id: artifact.publication_source_id,
  source_role: artifact.source_role,
  counts: {
    parsed_source_records: artifact.record_count,
    published_source_relationships: artifact.relationship_count,
    runtime_node_citations: runtimeNodeCitations.get(artifact.id) || 0,
    runtime_edge_citations: runtimeEdgeCitations.get(artifact.id) || 0,
  },
}));

const catalogs = (registry.catalog_source_bundles || []).map((bundle) => {
  const artifactById = new Map((registry.artifacts || []).map((artifact) => [artifact.id, artifact]));
  const primary = (bundle.primary_artifact_ids || []).map((id) => artifactById.get(id)).filter(Boolean);
  const all = [
    ...(bundle.primary_artifact_ids || []),
    ...(bundle.enrichment_artifact_ids || []),
    ...(bundle.mapping_source_ids || []),
    ...(bundle.assessment_source_ids || []),
    ...(bundle.automation_source_ids || []),
    ...(bundle.reconciliation_source_ids || []),
  ].map((id) => artifactById.get(id)).filter(Boolean);
  const expected = bundle.expected_inventory?.evidence_locator
    ? resolveExpectedLocator(bundle.expected_inventory.evidence_locator, readJson)
    : null;
  const imported = bundle.expected_inventory?.imported_evidence_locator
    ? resolveExpectedLocator(bundle.expected_inventory.imported_evidence_locator, readJson)
    : null;
  return {
    catalog_id: bundle.catalog_id,
    counts: {
      discovered_expected_records: expected,
      normalized_records: imported ?? primary.reduce((total, artifact) => total + artifact.record_count, 0),
      parsed_primary_artifact_records: primary.reduce((total, artifact) => total + artifact.record_count, 0),
      published_source_relationships: all.reduce((total, artifact) => total + artifact.relationship_count, 0),
      graph_nodes: nodes.filter((node) => node.metadata?.catalog_id === bundle.catalog_id).length,
      graph_edges_incident: edges.filter((edge) => String(edge.source_node_id || '').startsWith(`${bundle.catalog_id}:`)
        || String(edge.target_node_id || '').startsWith(`${bundle.catalog_id}:`)).length,
      ...catalogRuntimeCounts(bundle.catalog_id),
    },
  };
});

const ledger = {
  schema_version: '1.0',
  generated_at: new Date().toISOString(),
  count_semantics: {
    discovered_expected_records: 'Independent publisher inventory expected by the completeness contract.',
    parsed_source_records: 'Publisher records emitted by the source adapter before graph construction.',
    normalized_records: 'Normalized catalog records named by the bundle imported-evidence locator.',
    published_source_relationships: 'Relationships explicitly parsed from publisher material.',
    graph_nodes: 'Generated graph nodes assigned to the catalog, including its catalog node.',
    runtime_node_citations: 'Generated graph nodes whose provenance cites the artifact.',
    runtime_edge_citations: 'Generated graph edges whose provenance cites the artifact.',
    runtime_navigable_count: 'Non-catalog nodes present in the generated catalog browsing payload.',
  },
  artifacts,
  catalogs,
};
writeJsonAtomically(OUT, ledger);
console.log(`source-count-ledger: ${artifacts.length} artifacts and ${catalogs.length} catalogs; source registry counts preserved.`);
