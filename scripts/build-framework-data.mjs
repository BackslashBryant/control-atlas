#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGraphArtifacts } from './lib/federal-graph.mjs';
import { loadSourceRegistry } from './lib/source-registry.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED = join(ROOT, 'data', 'generated');
const GENERATED_AT = new Date().toISOString();

const CATALOGS = [
  ['controls-800-53.json', 'nist-800-53', 'nist-oscal', 'control'],
  ['requirements-800-171.json', 'nist-800-171', 'nist-oscal', 'requirement'],
  ['csf-subcategories.json', 'csf-2', 'nist-oscal', 'requirement'],
  ['cmmc-practices.json', 'cmmc-2', 'dod-cmmc-rule', 'program'],
  ['fedramp-baselines.json', 'fedramp-rev5', 'fedramp-rev5', 'baseline'],
  ['ccis.json', 'disa-cci', 'disa-cci-list', 'requirement'],
  ['ai-rmf.json', 'nist-ai-rmf', 'nist-ai-rmf-playbook', 'requirement'],
  ['ssdf.json', 'nist-ssdf', 'nist-ssdf-oscal', 'requirement'],
  ['dod-rai.json', 'dod-rai', 'dod-rai-toolkit', 'requirement'],
];

const MAPS = [
  ['800-53-to-csf.json', 'nist-800-53', 'csf-2', 'nist-olir-csf2-to-sp800-53'],
  ['800-53-to-800-171.json', 'nist-800-171', 'nist-800-53', 'nist-800-171-oscal-mappings'],
  ['cci-to-800-53.json', 'disa-cci', 'nist-800-53', 'disa-cci-nist-references'],
];

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const nodeId = (catalogId, recordId) => `${catalogId}:${recordId}`;

function nodeType(defaultType, recordId) {
  return defaultType === 'control' && String(recordId).includes('.') ? 'control_enhancement' : defaultType;
}

function buildNodes(registry) {
  const nodes = [];
  const findings = [];
  for (const [filename, catalogId, defaultSourceId, defaultType] of CATALOGS) {
    const path = join(ROOT, 'data', filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const record of document.records || []) {
      const sourceId = record.source?.key || defaultSourceId;
      const source = registry.byId.get(sourceId);
      const id = nodeId(catalogId, record.id);
      if (!source?.graph_eligible) {
        findings.push({
          id: `finding:ineligible-node:${id}`,
          finding_type: 'ineligible_source_node',
          severity: 'warning',
          source_id: sourceId,
          subject_id: id,
          message: `Node ${id} was not published because its defining source is not graph eligible.`,
        });
        continue;
      }
      nodes.push({
        id,
        node_type: nodeType(defaultType, record.id),
        label: record.title ? `${record.id} ${record.title}` : String(record.id),
        source_id: sourceId,
        lifecycle_status: record.status === 'deprecated' ? 'deprecated' : 'active',
        metadata: {
          catalog_id: catalogId,
          item_id: record.id,
          title: record.title || record.id,
          description: record.description || '',
          family: record.family || record.group || '',
          baselines: record.fedramp_baselines || record.metadata?.baselines || null,
          nist_control: record.nist_control || null,
          type: record.type || null,
          references: record.references || null,
        },
      });
    }
  }
  return { nodes: nodes.sort((a, b) => a.id.localeCompare(b.id)), findings };
}

function buildEdges(registry, nodes) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = [];
  const evidence = [];
  const findings = [];

  for (const [filename, sourceCatalog, targetCatalog, defaultSourceId] of MAPS) {
    const path = join(ROOT, 'maps', filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const [index, relationship] of (document.relationships || []).entries()) {
      const sourceNodeId = nodeId(sourceCatalog, relationship.source_id);
      const targetNodeId = nodeId(targetCatalog, relationship.target_id);
      const sourceId = relationship.evidence_source || document.source_key || defaultSourceId;
      const source = registry.byId.get(sourceId);
      const subjectId = `${filename.replace('.json', '')}:${index + 1}`;
      if (!source?.graph_eligible || !nodeIds.has(sourceNodeId) || !nodeIds.has(targetNodeId)) {
        findings.push({
          id: `finding:blocked-relationship:${subjectId}`,
          finding_type: 'blocked_relationship',
          severity: 'warning',
          source_id: sourceId,
          subject_id: subjectId,
          message: `Relationship ${subjectId} was blocked because its source or endpoint is not graph eligible.`,
        });
        continue;
      }

      const evidenceId = `evidence:${subjectId}`;
      const edgeId = `edge:${subjectId}`;
      evidence.push({
        id: evidenceId,
        source_id: sourceId,
        source_version: document.source_version || source.version,
        locator: relationship.source_locator || `${document.source_key || sourceId}#relationship`,
        retrieved_at: document.snapshot_date || source.retrieved_at,
        checksum: document.checksum || source.checksum,
        evidence_quality: 'primary',
      });
      edges.push({
        id: edgeId,
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        relationship_type: relationship.relationship_type || 'maps_to',
        provenance_class: source.provenance_class,
        confidence: 'direct',
        publication_status: 'published',
        evidence_ids: [evidenceId],
        display_label: `${sourceNodeId} maps to ${targetNodeId}`,
        warning: null,
        inference_rule_id: null,
        rationale: relationship.why || document.provenance || '',
      });
    }
  }
  return { edges, evidence, findings };
}

function artifact(collection, values) {
  return { schema_version: '1.0', generated_at: GENERATED_AT, [collection]: values };
}

export function buildFrameworkData() {
  const registry = loadSourceRegistry(readJson(join(ROOT, 'data', 'source-registry.json')));
  const nodeState = buildNodes(registry);
  const edgeState = buildEdges(registry, nodeState.nodes);
  const findings = [...nodeState.findings, ...edgeState.findings];
  const graph = {
    sources: registry.sources,
    nodes: nodeState.nodes,
    edges: edgeState.edges,
    evidence: edgeState.evidence,
    findings,
  };
  const errors = validateGraphArtifacts(graph);
  if (errors.length) throw new Error(`Invalid federal graph:\n- ${errors.join('\n- ')}`);

  mkdirSync(GENERATED, { recursive: true });
  for (const entry of readdirSync(GENERATED)) {
    if (entry.endsWith('.json')) rmSync(join(GENERATED, entry));
  }
  for (const [name, value] of Object.entries({
    sources: artifact('sources', graph.sources),
    nodes: artifact('nodes', graph.nodes),
    edges: artifact('edges', graph.edges),
    evidence: artifact('evidence', graph.evidence),
    'graph-health': artifact('findings', graph.findings),
  })) {
    writeFileSync(join(GENERATED, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  }
  return {
    sources: graph.sources.length,
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    evidence: graph.evidence.length,
    findings: graph.findings.length,
  };
}

if (process.argv[1]?.includes('build-framework-data.mjs')) {
  const result = buildFrameworkData();
  console.log(`Built federal graph: ${result.sources} sources, ${result.nodes} nodes, ${result.edges} edges, ${result.evidence} evidence records, ${result.findings} findings`);
}
