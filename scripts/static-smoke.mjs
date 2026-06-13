#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { loadSourceRegistry } from './lib/source-registry.mjs';

const required = [
  'index.html',
  'app/app.mjs',
  'app/runtime.mjs',
  'styles/app.css',
  'data/source-registry.json',
  'data/generated/sources.json',
  'data/generated/nodes.json',
  'data/generated/edges.json',
  'data/generated/evidence.json',
  'data/generated/graph-health.json',
  'data/generated/build-manifest.json',
  'data/generated/source-manifests.json',
  'data/generated/graph-diff-summary.json',
];
for (const path of required) assert.ok(existsSync(path), `${path} is required`);

const registry = loadSourceRegistry(JSON.parse(readFileSync('data/source-registry.json', 'utf8')));
const nodes = JSON.parse(readFileSync('data/generated/nodes.json', 'utf8')).nodes;
const edges = JSON.parse(readFileSync('data/generated/edges.json', 'utf8')).edges;
const evidence = JSON.parse(readFileSync('data/generated/evidence.json', 'utf8')).evidence;
const findings = JSON.parse(readFileSync('data/generated/graph-health.json', 'utf8')).findings;
const buildManifest = JSON.parse(readFileSync('data/generated/build-manifest.json', 'utf8')).build_manifest;
const sourceManifests = JSON.parse(readFileSync('data/generated/source-manifests.json', 'utf8')).source_manifests;
const app = readFileSync('app/app.mjs', 'utf8');

assert.equal(registry.registry.schema_version, '4.0');
assert.ok(nodes.length > 6000, 'normalized federal graph nodes required');
assert.ok(edges.length > 3000, 'source-backed federal graph edges required');
assert.equal(edges.length, evidence.length, 'each current edge must have evidence');
assert.ok(findings.length > 0, 'blocked and unsupported relationships must be reported');
assert.ok(!edges.some((edge) => edge.publication_status === 'blocked'), 'blocked relationships cannot be edges');
assert.ok(nodes.some((node) => node.id === 'nist-800-53a:AC-2'), 'assessment procedures must be present');
assert.ok(edges.some((edge) => edge.relationship_type === 'assesses'), 'assessment edges must be present');
assert.ok(buildManifest.governance_artifacts.includes('build-manifest.json'));
assert.ok(sourceManifests.some((entry) => entry.source_id === 'nist-800-53a-assessment-procedures'));
assert.match(app, /data\/generated\/graph-health\.json/);
assert.doesNotMatch(app, /catalog\.json|schema_version:\s*['"]2\.1/);
assert.doesNotMatch(app, /build-manifest\.json|source-manifests\.json|graph-diff-summary\.json/);

console.log(`Static smoke passed: ${registry.sources.length} sources, ${nodes.length} nodes, ${edges.length} edges, ${findings.length} findings`);
