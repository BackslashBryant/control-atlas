#!/usr/bin/env node
// Phase 2 T2.12: a single human-readable audit report over the canonical
// publication-identity index, the source registry, and the count ledger.
// Read-only over all three; does not mutate source truth.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonAtomically } from './lib/write-json-atomically.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = join(ROOT, 'data/source-registry.json');
const INDEX = join(ROOT, 'data/generated/publication-identity-index.json');
const LEDGER = join(ROOT, 'data/generated/source-count-ledger.json');
const OUT = join(ROOT, 'data/generated/publication-audit-report.json');

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

const registry = readJson(REGISTRY);
const index = readJson(INDEX);
const ledger = readJson(LEDGER);
if (!registry || !index || !ledger) {
  console.error('publication-audit-report: run build-publication-identity-index.mjs and reconcile-artifact-counts.mjs first.');
  process.exit(1);
}

const pubById = new Map(registry.publications.map((pub) => [pub.id, pub]));

// A "publication"/"supplemental"/"mapping" row that is not the canonical
// identity of the index and not reachable as one of its aliases would be a
// real, unexplained orphan. Every other identity_kind (reference, editorial,
// ingestion) is expected to stand alone by design (Phase 2 T2.3).
const EXPLAINED_KINDS = new Set(['publication', 'supplemental', 'mapping']);
const unexplainedOrphanPublications = index.orphans.publications.filter(
  (id) => EXPLAINED_KINDS.has(pubById.get(id)?.metadata?.identity_kind),
);
const standaloneReferenceRows = index.orphans.publications.filter(
  (id) => !EXPLAINED_KINDS.has(pubById.get(id)?.metadata?.identity_kind),
);

const unresolvedMetadata = registry.publications
  .filter((pub) => !pub.metadata?.identity_kind)
  .map((pub) => pub.id);

const quarantinedRows = (registry.quarantine || []).map((entry) => ({
  id: entry.id,
  reason: entry.reason || null,
}));

const nonzeroDeltas = ledger.catalogs
  .filter((catalog) => catalog.counts.unexplained_graph_node_delta !== 0
    || catalog.counts.unexplained_graph_edge_delta !== 0
    || catalog.counts.normalized_to_leaf_delta)
  .map((catalog) => ({
    catalog_id: catalog.catalog_id,
    unexplained_graph_node_delta: catalog.counts.unexplained_graph_node_delta,
    unexplained_graph_edge_delta: catalog.counts.unexplained_graph_edge_delta,
    normalized_to_leaf_delta: catalog.counts.normalized_to_leaf_delta,
    normalized_to_leaf_delta_reason: catalog.counts.normalized_to_leaf_delta_reason,
  }));

const report = {
  schema_version: '1.0',
  generated_at: new Date().toISOString(),
  summary: {
    canonical_publication_count: index.identities.length,
    alias_count: index.identities.reduce((total, identity) => total + identity.alias_source_ids.length, 0),
    standalone_reference_count: standaloneReferenceRows.length,
    unexplained_orphan_count: unexplainedOrphanPublications.length,
    unresolved_metadata_count: unresolvedMetadata.length,
    quarantined_count: quarantinedRows.length,
    nonzero_delta_catalog_count: nonzeroDeltas.length,
  },
  canonical_publications: index.identities.map((identity) => ({
    id: identity.id,
    name: identity.name,
    publisher: identity.publisher,
    catalog_id: identity.catalog_id,
    alias_source_ids: identity.alias_source_ids,
    source_material_count: Object.values(identity.source_materials).reduce((total, list) => total + list.length, 0),
    connection_evidence_count: identity.connection_evidence.length,
  })),
  standalone_reference_rows: standaloneReferenceRows,
  unexplained_orphan_publications: unexplainedOrphanPublications,
  unresolved_metadata: unresolvedMetadata,
  quarantined_rows: quarantinedRows,
  nonzero_deltas: nonzeroDeltas,
};

try {
  const previous = JSON.parse(readFileSync(OUT, 'utf8'));
  const { generated_at: previousGeneratedAt, ...previousStable } = previous;
  const { generated_at: _next, ...nextStable } = report;
  if (previousGeneratedAt && JSON.stringify(previousStable) === JSON.stringify(nextStable)) {
    report.generated_at = previousGeneratedAt;
  }
} catch {
  // A missing or unreadable prior report is replaced by the current one.
}

writeJsonAtomically(OUT, report);
console.log(
  `publication-audit-report: ${report.summary.canonical_publication_count} canonical publications, `
  + `${report.summary.unexplained_orphan_count} unexplained orphan(s), `
  + `${report.summary.unresolved_metadata_count} unresolved metadata gap(s), `
  + `${report.summary.nonzero_delta_catalog_count} catalog(s) with a nonzero delta.`,
);
if (unexplainedOrphanPublications.length) {
  console.error(`  unexplained orphans: ${unexplainedOrphanPublications.join(', ')}`);
  process.exitCode = 1;
}
if (unresolvedMetadata.length) {
  console.error(`  unresolved metadata: ${unresolvedMetadata.join(', ')}`);
  process.exitCode = 1;
}
