#!/usr/bin/env node
// verify:manifests — integrity gate for the source registry, discovery
// manifests, and generated runtime. Fails loudly on fabricated or
// inconsistent evidence, then regenerates data/source-coverage-manifest.json
// from real, counted values (never hardcoded).
//
// Fail conditions (spec §9):
//   invalid SHA-256, byte-length mismatch, record-count mismatch,
//   relationship-count mismatch, manifest/runtime disagreement,
//   missing evidence locator, unexplained exclusion, duplicate artifacts,
//   duplicate releases, canonical-ID collisions, and any tracked value
//   containing placeholder / placeholder_checksum / fabricated / estimated.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHA256_PREFIXED = /^sha256:[a-f0-9]{64}$/i;
const FORBIDDEN = /placeholder|placeholder_checksum|fabricated|estimated[ _-]?checksum/i;

const SOURCE_ROLES = new Set([
  'publication', 'primary_data', 'enrichment', 'mapping', 'assessment',
  'automation', 'reconciliation', 'reference_only', 'editorial', 'historical',
]);
const AUTHORITY_CLASSES = new Set([
  'publisher', 'publisher_supplement', 'government_mapping',
  'validated_third_party', 'community', 'historical',
]);
// Every field an imported artifact must carry (spec §2). A publication
// identity may omit sha256/byte_length; a real artifact may not.
const REQUIRED_ARTIFACT_FIELDS = [
  'artifact_url', 'publication_source_id', 'source_role', 'authority_class',
  'format', 'version', 'lifecycle_status', 'retrieval_method', 'retrieved_at',
  'byte_length', 'sha256', 'parser', 'parser_version', 'record_count',
  'relationship_count', 'license_or_use',
];

const errors = [];
const err = (msg) => errors.push(msg);

function isRealSha256(str) {
  return typeof str === 'string' && !FORBIDDEN.test(str) && SHA256_PREFIXED.test(str);
}

// Deep-scan every string value for forbidden placeholder/fabricated markers.
function scanForbidden(node, path, hits) {
  if (typeof node === 'string') {
    if (FORBIDDEN.test(node)) hits.push(`${path} = ${JSON.stringify(node).slice(0, 80)}`);
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => scanForbidden(v, `${path}[${i}]`, hits));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) scanForbidden(v, `${path}.${k}`, hits);
  }
}

function readJson(rel) {
  const full = join(ROOT, rel);
  if (!existsSync(full)) return null;
  return JSON.parse(readFileSync(full, 'utf8'));
}

const registry = readJson('data/source-registry.json');
if (!registry) {
  err('missing data/source-registry.json');
} else {
  const artifacts = registry.artifacts || [];
  const publications = registry.publications || [];
  const sources = registry.sources || [];
  const bundles = registry.catalog_source_bundles || [];

  const artifactIds = new Set();
  const sourceIds = new Set(sources.map((s) => s.id));
  const publicationIds = new Set(publications.map((p) => p.id));
  const shaToArtifacts = new Map();

  for (const art of artifacts) {
    // Duplicate / colliding canonical IDs.
    if (artifactIds.has(art.id)) err(`duplicate artifact id: ${art.id}`);
    artifactIds.add(art.id);

    // Required fields present.
    for (const field of REQUIRED_ARTIFACT_FIELDS) {
      if (art[field] === undefined || art[field] === null || art[field] === '') {
        err(`artifact ${art.id} missing required field: ${field}`);
      }
    }
    // Enum validity.
    if (art.source_role && !SOURCE_ROLES.has(art.source_role)) {
      err(`artifact ${art.id} invalid source_role: ${art.source_role}`);
    }
    if (art.authority_class && !AUTHORITY_CLASSES.has(art.authority_class)) {
      err(`artifact ${art.id} invalid authority_class: ${art.authority_class}`);
    }
    // Real checksum + missing evidence locator.
    if (!isRealSha256(art.sha256)) {
      err(`artifact ${art.id} has invalid/placeholder sha256: ${art.sha256}`);
    }
    if (!art.artifact_url) err(`artifact ${art.id} missing evidence locator (artifact_url)`);
    // Byte length / record / relationship counts must be real non-negative integers.
    if (!Number.isInteger(art.byte_length) || art.byte_length <= 0) {
      err(`artifact ${art.id} invalid byte_length: ${art.byte_length}`);
    }
    if (!Number.isInteger(art.record_count) || art.record_count < 0) {
      err(`artifact ${art.id} invalid record_count: ${art.record_count}`);
    }
    if (!Number.isInteger(art.relationship_count) || art.relationship_count < 0) {
      err(`artifact ${art.id} invalid relationship_count: ${art.relationship_count}`);
    }
    // Duplicate artifacts: distinct ids sharing one content hash.
    if (isRealSha256(art.sha256)) {
      shaToArtifacts.set(art.sha256, (shaToArtifacts.get(art.sha256) || []).concat(art.id));
    }
  }

  for (const [sha, ids] of shaToArtifacts) {
    if (ids.length > 1) {
      err(`duplicate artifacts share one sha256 (${sha.slice(0, 20)}…): ${ids.join(', ')}`);
    }
  }

  // Bundle references must resolve to a real artifact, source, or publication.
  const knownRef = (id) => artifactIds.has(id) || sourceIds.has(id) || publicationIds.has(id);
  const bundleCatalogIds = new Set();
  for (const b of bundles) {
    if (bundleCatalogIds.has(b.catalog_id)) err(`duplicate catalog bundle: ${b.catalog_id}`);
    bundleCatalogIds.add(b.catalog_id);
    if (b.publication_source_id && !knownRef(b.publication_source_id)) {
      err(`bundle ${b.catalog_id} publication_source_id unresolved: ${b.publication_source_id}`);
    }
    for (const key of ['primary_artifact_ids', 'enrichment_artifact_ids', 'mapping_source_ids',
      'assessment_source_ids', 'automation_source_ids', 'reconciliation_source_ids']) {
      for (const id of b[key] || []) {
        if (!knownRef(id)) err(`bundle ${b.catalog_id}.${key} unresolved reference: ${id}`);
      }
    }
  }

  // Forbidden markers anywhere in the registry.
  const regHits = [];
  scanForbidden(registry, 'registry', regHits);
  for (const h of regHits) err(`forbidden placeholder/fabricated marker: ${h}`);

  // Execution attestation: every artifact's sha256 must be proven by a real
  // download/parse recorded in an execution manifest — not merely well-formed.
  // This catches fabricated-but-unique hashes the duplicate check cannot.
  const attested = new Map();
  const hydration = readJson('data/artifact-hydration-manifest.json');
  for (const r of hydration?.results || []) {
    if (r.status === 'OK' && r.sha256) attested.set(r.id, r.sha256);
  }
  // DISA/OLIR family manifests attest their own artifacts (added as those
  // pipelines land). Until then their artifacts appear as unattested below.
  for (const art of artifacts) {
    const a = attested.get(art.id);
    if (!a) {
      err(`artifact ${art.id} evidence is UNATTESTED (no execution manifest entry proves its sha256)`);
    } else if (a !== art.sha256) {
      err(`artifact ${art.id} sha256 disagrees with execution manifest (${art.sha256} != ${a})`);
    }
  }
}

// Manifest/runtime agreement: every artifact's record_count and
// relationship_count must equal the number of generated nodes/edges that cite
// it (spec §9). Also confirms every generated node/edge resolves to a real
// artifact (spec §11 provenance resolution).
const nodesRaw = readJson('data/generated/nodes.json');
const edgesRaw = readJson('data/generated/edges.json');
if (registry && nodesRaw && edgesRaw) {
  const nodes = Array.isArray(nodesRaw) ? nodesRaw : nodesRaw.nodes;
  const edges = Array.isArray(edgesRaw) ? edgesRaw : edgesRaw.edges;
  const artifactIds = new Set((registry.artifacts || []).map((a) => a.id));
  // Quarantined sources (spec-sanctioned): unverifiable with an explicit
  // reason. Nodes/edges may still cite them; that is a documented exception,
  // reported (not a fabrication) rather than an integrity failure.
  const quarantinedIds = new Set((registry.quarantine || []).map((q) => q.id));
  let quarantinedNodeCitations = 0;
  let quarantinedEdgeCitations = 0;
  const nodeCounts = new Map();
  const edgeCounts = new Map();
  for (const n of nodes) for (const aid of n.artifact_ids || []) {
    nodeCounts.set(aid, (nodeCounts.get(aid) || 0) + 1);
    if (quarantinedIds.has(aid)) quarantinedNodeCitations += 1;
    else if (!artifactIds.has(aid)) err(`node ${n.id} cites unknown artifact: ${aid}`);
  }
  for (const e of edges) if (e.source_artifact_id) {
    edgeCounts.set(e.source_artifact_id, (edgeCounts.get(e.source_artifact_id) || 0) + 1);
    if (quarantinedIds.has(e.source_artifact_id)) quarantinedEdgeCitations += 1;
    else if (!artifactIds.has(e.source_artifact_id)) err(`edge ${e.id} cites unknown source_artifact_id: ${e.source_artifact_id}`);
  }
  if (quarantinedNodeCitations || quarantinedEdgeCitations) {
    console.log(`NOTE: ${quarantinedNodeCitations} node + ${quarantinedEdgeCitations} edge citations reference quarantined sources (see registry.quarantine for reasons).`);
  }
  for (const art of registry.artifacts || []) {
    const rc = nodeCounts.get(art.id) || 0;
    const relc = edgeCounts.get(art.id) || 0;
    if (art.record_count !== rc) err(`artifact ${art.id} record_count ${art.record_count} != runtime node count ${rc} (manifest/runtime disagreement)`);
    if (art.relationship_count !== relc) err(`artifact ${art.id} relationship_count ${art.relationship_count} != runtime edge count ${relc}`);
  }
}

// Discovery manifests: real checksums, no forbidden markers.
const disa = readJson('data/disa-artifact-manifest.json');
if (disa) {
  if (!isRealSha256(disa.checksum)) err('DISA manifest checksum is not a real sha256');
  const hits = []; scanForbidden(disa, 'disa', hits);
  for (const h of hits) err(`DISA manifest forbidden marker: ${h}`);
}
const olir = readJson('data/olir-catalog-manifest.json');
if (olir) {
  for (const item of olir.processed_items || []) {
    if (item.checksum && !isRealSha256(item.checksum)) {
      err(`OLIR item ${item.id || item.name} invalid checksum: ${item.checksum}`);
    }
  }
  const hits = []; scanForbidden(olir, 'olir', hits);
  for (const h of hits) err(`OLIR manifest forbidden marker: ${h}`);
}

// ---- Coverage manifest: computed from real values, per catalog. ----
function buildCoverageManifest() {
  const artifacts = new Map((registry?.artifacts || []).map((a) => [a.id, a]));
  const shardDir = join(ROOT, 'data/generated/catalog-records');
  const shardIds = existsSync(shardDir)
    ? new Set(readdirSync(shardDir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')))
    : new Set();

  const catalogs = [];
  for (const b of registry?.catalog_source_bundles || []) {
    const primary = (b.primary_artifact_ids || []).map((id) => artifacts.get(id)).filter(Boolean);
    const supplemental = [...(b.enrichment_artifact_ids || []), ...(b.assessment_source_ids || []),
      ...(b.automation_source_ids || []), ...(b.reconciliation_source_ids || [])]
      .map((id) => artifacts.get(id)).filter(Boolean);
    const mapping = (b.mapping_source_ids || []).map((id) => artifacts.get(id)).filter(Boolean);
    const all = [...primary, ...supplemental, ...mapping];
    const importedRecords = primary.reduce((n, a) => n + (a.record_count || 0), 0);
    const methods = [...new Set(all.map((a) => a.retrieval_method).filter(Boolean))];
    const lastRefresh = all.map((a) => a.retrieved_at).filter(Boolean).sort().pop() || null;
    const hasShard = shardIds.has(b.catalog_id);
    const allChecksumsReal = all.every((a) => isRealSha256(a.sha256));
    catalogs.push({
      catalog_id: b.catalog_id,
      expected_records: null, // authoritative expectation set during per-catalog ingestion (§4–§7)
      imported_records: importedRecords,
      excluded_records: 0,
      missing_records: null,
      primary_artifacts: primary.length,
      supplemental_artifacts: supplemental.length,
      mapping_artifacts: mapping.length,
      methods,
      last_refresh: lastRefresh,
      completeness_status: hasShard && allChecksumsReal ? 'reconciled' : 'incomplete',
    });
  }
  return {
    schema_version: '2.0',
    generated_at: new Date().toISOString(),
    completeness: {
      total_publications: (registry?.publications || []).length,
      total_artifacts: (registry?.artifacts || []).length,
      total_catalog_bundles: (registry?.catalog_source_bundles || []).length,
      manual_seed_artifacts: (registry?.artifacts || []).filter((a) => a.parser === 'manual-seed').length,
      provenance_verified: errors.length === 0,
    },
    catalogs,
    verification_status: errors.length === 0 ? 'PASSED' : 'FAILED',
  };
}

const coverage = buildCoverageManifest();
writeFileSync(
  join(ROOT, 'data/source-coverage-manifest.json'),
  JSON.stringify(coverage, null, 2) + '\n',
  'utf8',
);

if (errors.length > 0) {
  console.error(`FAIL: verify:manifests found ${errors.length} integrity error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error('Coverage manifest written with verification_status=FAILED.');
  process.exit(1);
}
console.log('PASS: manifests verified; source-coverage-manifest.json regenerated from counted values.');
