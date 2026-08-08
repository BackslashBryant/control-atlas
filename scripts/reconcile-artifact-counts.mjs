#!/usr/bin/env node
// reconcile-artifact-counts — set each artifact's record_count and
// relationship_count to the ACTUAL number of generated graph nodes/edges whose
// provenance cites that artifact. This makes the manifest agree with the
// runtime by construction (spec §9 manifest/runtime agreement) and gives a
// uniform, execution-derived count for every format (JSON, XLSX, PDF, HTML).
//
// Runs AFTER build:data. Download-time counters in hydrate-artifacts.mjs remain
// a cross-check; the graph is the authority for what an artifact contributed.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readGeneratedCollection } from './lib/generated-graph-artifacts.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = join(ROOT, 'data/source-registry.json');

function readJson(rel) {
  const full = join(ROOT, rel);
  if (!existsSync(full)) return null;
  return JSON.parse(readFileSync(full, 'utf8'));
}

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
const nodesRaw = readGeneratedCollection(ROOT, 'nodes');
const edgesRaw = readGeneratedCollection(ROOT, 'edges');
if (!nodesRaw || !edgesRaw) {
  console.error('reconcile-artifact-counts: run build:data first (missing generated nodes/edges).');
  process.exit(1);
}
const nodes = Array.isArray(nodesRaw) ? nodesRaw : nodesRaw.nodes;
const edges = Array.isArray(edgesRaw) ? edgesRaw : edgesRaw.edges;

const nodeCounts = new Map();
for (const n of nodes) {
  for (const aid of n.artifact_ids || []) nodeCounts.set(aid, (nodeCounts.get(aid) || 0) + 1);
}
const edgeCounts = new Map();
for (const e of edges) {
  if (e.source_artifact_id) edgeCounts.set(e.source_artifact_id, (edgeCounts.get(e.source_artifact_id) || 0) + 1);
}

let changed = 0;
for (const art of registry.artifacts || []) {
  const rc = nodeCounts.get(art.id) || 0;
  const relc = edgeCounts.get(art.id) || 0;
  if (art.record_count !== rc || art.relationship_count !== relc) {
    art.record_count = rc;
    art.relationship_count = relc;
    changed += 1;
  }
}

writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n', 'utf8');
console.log(`reconcile-artifact-counts: updated ${changed} artifact count(s) from graph (${nodes.length} nodes, ${edges.length} edges).`);
