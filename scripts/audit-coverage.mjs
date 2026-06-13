#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { validateGraphArtifacts } from './lib/federal-graph.mjs';
import { loadSourceRegistry } from './lib/source-registry.mjs';

const registry = loadSourceRegistry(JSON.parse(readFileSync('data/source-registry.json', 'utf8')));
const graph = {
  sources: JSON.parse(readFileSync('data/generated/sources.json', 'utf8')).sources,
  nodes: JSON.parse(readFileSync('data/generated/nodes.json', 'utf8')).nodes,
  edges: JSON.parse(readFileSync('data/generated/edges.json', 'utf8')).edges,
  evidence: JSON.parse(readFileSync('data/generated/evidence.json', 'utf8')).evidence,
  findings: JSON.parse(readFileSync('data/generated/graph-health.json', 'utf8')).findings,
};
const buildManifest = JSON.parse(readFileSync('data/generated/build-manifest.json', 'utf8')).build_manifest;
const sourceManifests = JSON.parse(readFileSync('data/generated/source-manifests.json', 'utf8')).source_manifests;
const errors = validateGraphArtifacts(graph);
if (errors.length) throw new Error(`Graph audit failed:\n- ${errors.join('\n- ')}`);

const excluded = registry.sources.filter((source) => source.eligibility_status === 'excluded');
const candidateEdges = graph.edges.filter((edge) => edge.publication_status === 'candidate');
const assessmentNodes = graph.nodes.filter((node) => node.node_type === 'assessment_procedure');
console.log('=== GovFrame Federal Graph Audit ===');
console.log(`Sources: ${graph.sources.length} (${excluded.length} excluded from publishing)`);
console.log(`Nodes: ${graph.nodes.length}`);
console.log(`Assessment procedure nodes: ${assessmentNodes.length}`);
console.log(`Edges: ${graph.edges.length} (${candidateEdges.length} inferred candidates)`);
console.log(`Evidence: ${graph.evidence.length}`);
console.log(`Graph-health findings: ${graph.findings.length}`);
console.log(`Governance artifacts: ${buildManifest.governance_artifacts.length}`);
console.log(`Source manifests: ${sourceManifests.length}`);
console.log('Graph audit passed');
