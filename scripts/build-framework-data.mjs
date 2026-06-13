#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGraphArtifacts } from './lib/federal-graph.mjs';
import { loadSourceRegistry } from './lib/source-registry.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED = join(ROOT, 'data', 'generated');
const RUNTIME_COLLECTIONS = ['sources', 'nodes', 'edges', 'evidence', 'graph-health'];
const GOVERNANCE_FILES = ['build-manifest.json', 'source-manifests.json', 'graph-diff-summary.json'];

const CATALOGS = [
  ['controls-800-53.json', 'nist-800-53', 'nist-oscal', 'control'],
  ['800-53b-baselines.json', 'nist-800-53b', 'nist-800-53b-baselines', 'baseline'],
  ['fips-199.json', 'fips-199', 'nist-fips-199', 'impact_category'],
  ['fips-200.json', 'fips-200', 'nist-fips-200', 'requirement'],
  ['tasks-800-37.json', 'nist-800-37', 'nist-800-37-rev2', 'rmf_step'],
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
const identifier = (value) => String(value).replace(/[^A-Za-z0-9:_-]+/g, '-');

function relationshipId(prefix, sourceNodeId, targetNodeId, relationshipType) {
  return identifier(`${prefix}:${relationshipType}:${sourceNodeId}:${targetNodeId}`);
}

function nodeType(defaultType, recordId) {
  return defaultType === 'control' && String(recordId).includes('.') ? 'control_enhancement' : defaultType;
}

function familyCodeFromControlId(recordId) {
  return String(recordId || '').match(/^([A-Z]{2})-/)?.[1] || null;
}

function normalize53BBaselineId(value) {
  const label = String(value || '').toUpperCase();
  if (label.includes('PRIVACY')) return 'PRIVACY';
  if (label.includes('MODERATE')) return 'MODERATE';
  if (label.includes('HIGH')) return 'HIGH';
  if (label.includes('LOW')) return 'LOW';
  return null;
}

function assessmentNodeId(recordId) {
  return nodeId('nist-800-53a', recordId);
}

function pushEligibleNode(state, registry, node, sourceId) {
  const source = registry.byId.get(sourceId);
  if (!source?.graph_eligible) {
    state.findings.push({
      id: `finding:ineligible-node:${node.id}`,
      finding_type: 'ineligible_source_node',
      severity: 'warning',
      source_id: sourceId,
      subject_id: node.id,
      message: `Node ${node.id} was not published because its defining source is not graph eligible.`,
    });
    return;
  }
  state.nodes.push(node);
}

function buildAssessmentNode(record) {
  const assessment = record.metadata?.assessment;
  if (!assessment?.source_key) return null;
  return {
    id: assessmentNodeId(record.id),
    node_type: 'assessment_procedure',
    label: `${record.id} Assessment Procedure`,
    source_id: assessment.source_key,
    lifecycle_status: record.status === 'deprecated' ? 'deprecated' : 'active',
    metadata: {
      catalog_id: 'nist-800-53a',
      item_id: record.id,
      title: `${record.title || record.id} Assessment Procedure`,
      description: `Assessment procedures for ${record.id} ${record.title || ''}`.trim(),
      family: record.family || '',
      type: 'assessment_procedure',
      assessment_methods: assessment.methods.map((entry) => entry.method),
      assessment_method_details: assessment.methods,
      assessment_objects: assessment.objects,
      assessment_objectives: assessment.objectives,
      procedure_text: assessment.procedure_text || '',
      nist_control: record.id,
      references: null,
    },
  };
}

function buildNodes(registry) {
  const state = { nodes: [], findings: [] };
  const familyNodes = new Map();
  for (const [filename, catalogId, defaultSourceId, defaultType] of CATALOGS) {
    const path = join(ROOT, 'data', filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const record of document.records || []) {
      const sourceId = record.source?.key || defaultSourceId;
      const id = nodeId(catalogId, record.id);
      pushEligibleNode(state, registry, {
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
          nist_800_53b_baselines: record.metadata?.nist_800_53b_baselines || null,
          nist_control: record.nist_control || null,
          type: record.type || null,
          references: record.references || null,
        },
      }, sourceId);

      if (catalogId === 'nist-800-53') {
        const assessmentNode = buildAssessmentNode(record);
        if (assessmentNode) {
          pushEligibleNode(state, registry, assessmentNode, assessmentNode.source_id);
        }

        const familyCode = familyCodeFromControlId(record.id);
        if (familyCode && record.family) {
          const familyId = nodeId('nist-800-53', `FAMILY-${familyCode}`);
          if (!familyNodes.has(familyId)) {
            familyNodes.set(familyId, {
              id: familyId,
              node_type: 'family',
              label: `${familyCode} ${record.family} Family`,
              source_id: defaultSourceId,
              lifecycle_status: 'active',
              metadata: {
                catalog_id: 'nist-800-53',
                item_id: `FAMILY-${familyCode}`,
                title: record.family,
                description: `${record.family} controls and enhancements from NIST SP 800-53 Rev. 5.`,
                family: record.family,
                baselines: null,
                nist_800_53b_baselines: null,
                nist_control: null,
                type: 'control_family',
                references: null,
              },
            });
          }
        }
      }
    }
  }

  for (const familyNode of familyNodes.values()) {
    pushEligibleNode(state, registry, familyNode, familyNode.source_id);
  }

  return {
    nodes: state.nodes.sort((a, b) => a.id.localeCompare(b.id)),
    findings: state.findings,
  };
}

function addPublishedEdge(state, registry, nodeIds, payload) {
  const source = registry.byId.get(payload.sourceId);
  if (!source?.graph_eligible || !nodeIds.has(payload.sourceNodeId) || !nodeIds.has(payload.targetNodeId)) {
    state.findings.push({
      id: `finding:blocked-relationship:${payload.subjectId}`,
      finding_type: 'blocked_relationship',
      severity: 'warning',
      source_id: payload.sourceId,
      subject_id: payload.subjectId,
      message: `Relationship ${payload.subjectId} was blocked because its source or endpoint is not graph eligible.`,
    });
    return;
  }

  const edgeId = `edge:${payload.subjectId}`;
  const evidenceId = `evidence:${payload.subjectId}`;
  state.evidence.push({
    id: evidenceId,
    source_id: payload.sourceId,
    source_version: payload.sourceVersion || source.version,
    locator: payload.locator,
    retrieved_at: payload.retrievedAt || source.retrieved_at,
    checksum: payload.checksum || source.checksum,
    evidence_quality: payload.evidenceQuality || 'primary',
  });
  state.edges.push({
    id: edgeId,
    source_node_id: payload.sourceNodeId,
    target_node_id: payload.targetNodeId,
    relationship_type: payload.relationshipType,
    provenance_class: payload.provenanceClass || source.provenance_class,
    confidence: payload.confidence || 'direct',
    publication_status: payload.publicationStatus || 'published',
    evidence_ids: [evidenceId],
    display_label: payload.displayLabel || `${payload.sourceNodeId} ${payload.relationshipType} ${payload.targetNodeId}`,
    warning: payload.warning || null,
    inference_rule_id: payload.inferenceRuleId || null,
    rationale: payload.rationale || '',
  });
}

function addDocumentRelationshipEdges(state, registry, nodeIds) {
  for (const [filename, catalogId, defaultSourceId] of CATALOGS) {
    const path = join(ROOT, 'data', filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const record of document.records || []) {
      for (const relationship of record.metadata?.relationships || []) {
        const sourceNodeId = nodeId(catalogId, record.id);
        const targetNodeId = nodeId(relationship.target_catalog, relationship.target_id);
        const subjectId = relationshipId(filename.replace('.json', ''), sourceNodeId, targetNodeId, relationship.relationship_type || 'references');
        addPublishedEdge(state, registry, nodeIds, {
          subjectId,
          sourceId: record.source?.key || defaultSourceId,
          sourceNodeId,
          targetNodeId,
          relationshipType: relationship.relationship_type || 'references',
          locator: `${record.source?.locator || `${filename}#${record.id}`}->${relationship.target_catalog}:${relationship.target_id}`,
          retrievedAt: record.source?.snapshot_date,
          rationale: relationship.rationale || record.description || document.provenance || '',
        });
      }
    }
  }
}

function addFamilyMembershipEdges(state, registry, nodeIds) {
  const path = join(ROOT, 'data', 'controls-800-53.json');
  if (!existsSync(path)) return;
  const document = readJson(path);
  for (const record of document.records || []) {
    const familyCode = familyCodeFromControlId(record.id);
    if (!familyCode) continue;
    const sourceNodeId = nodeId('nist-800-53', `FAMILY-${familyCode}`);
    const targetNodeId = nodeId('nist-800-53', record.id);
    const subjectId = relationshipId('800-53-family-membership', sourceNodeId, targetNodeId, 'includes');
    addPublishedEdge(state, registry, nodeIds, {
      subjectId,
      sourceId: record.source?.key || 'nist-oscal',
      sourceNodeId,
      targetNodeId,
      relationshipType: 'includes',
      locator: record.source?.locator || `controls-800-53.json#${record.id}`,
      retrievedAt: record.source?.snapshot_date,
      rationale: `${record.id} is part of the ${record.family} family in NIST SP 800-53 Rev. 5.`,
    });
  }
}

function addBaselineMembershipEdges(state, registry, nodeIds) {
  const path = join(ROOT, 'data', 'controls-800-53.json');
  if (!existsSync(path)) return;
  const document = readJson(path);
  for (const record of document.records || []) {
    const baselineIds = [...new Set((record.metadata?.nist_800_53b_baselines || [])
      .map(normalize53BBaselineId)
      .filter(Boolean))];
    for (const baselineId of baselineIds) {
      const sourceNodeId = nodeId('nist-800-53b', baselineId);
      const targetNodeId = nodeId('nist-800-53', record.id);
      const subjectId = relationshipId('800-53b-membership', sourceNodeId, targetNodeId, 'includes');
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId: 'nist-800-53b-baselines',
        sourceNodeId,
        targetNodeId,
        relationshipType: 'includes',
        locator: `sp800-53b#${baselineId}:${record.id}`,
        rationale: `NIST SP 800-53B ${baselineId} baseline membership includes ${record.id}.`,
      });
    }
  }
}

function addAssessmentEdges(state, registry, nodeIds) {
  const path = join(ROOT, 'data', 'controls-800-53.json');
  if (!existsSync(path)) return;
  const document = readJson(path);
  for (const record of document.records || []) {
    const sourceId = record.metadata?.assessment?.source_key;
    if (!sourceId) continue;
    const sourceNodeId = assessmentNodeId(record.id);
    const targetNodeId = nodeId('nist-800-53', record.id);
    const subjectId = relationshipId('800-53a-assessment', sourceNodeId, targetNodeId, 'assesses');
    addPublishedEdge(state, registry, nodeIds, {
      subjectId,
      sourceId,
      sourceNodeId,
      targetNodeId,
      relationshipType: 'assesses',
      locator: `sp800-53a#${record.id}`,
      rationale: `NIST SP 800-53A assessment procedures for ${record.id} assess the corresponding control.`,
      displayLabel: `${sourceNodeId} assesses ${targetNodeId}`,
    });
  }
}

function buildEdges(registry, nodes) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const state = { edges: [], evidence: [], findings: [] };

  for (const [filename, sourceCatalog, targetCatalog, defaultSourceId] of MAPS) {
    const path = join(ROOT, 'maps', filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const [index, relationship] of (document.relationships || []).entries()) {
      const sourceNodeId = nodeId(sourceCatalog, relationship.source_id);
      const targetNodeId = nodeId(targetCatalog, relationship.target_id);
      const sourceId = relationship.evidence_source || document.source_key || defaultSourceId;
      const subjectId = `${filename.replace('.json', '')}:${index + 1}`;
      addPublishedEdge(state, registry, nodeIds, {
        subjectId,
        sourceId,
        sourceNodeId,
        targetNodeId,
        relationshipType: relationship.relationship_type || 'maps_to',
        sourceVersion: document.source_version,
        locator: relationship.source_locator || `${document.source_key || sourceId}#relationship`,
        retrievedAt: document.snapshot_date,
        checksum: document.checksum,
        rationale: relationship.why || document.provenance || '',
      });
    }
  }
  addDocumentRelationshipEdges(state, registry, nodeIds);
  addFamilyMembershipEdges(state, registry, nodeIds);
  addBaselineMembershipEdges(state, registry, nodeIds);
  addAssessmentEdges(state, registry, nodeIds);
  return state;
}

function artifact(collection, values, generatedAt) {
  return { schema_version: '1.0', generated_at: generatedAt, [collection]: values };
}

function existingGeneratedAt(collections) {
  let generatedAt = null;
  for (const [name, values] of Object.entries(collections)) {
    const path = join(GENERATED, `${name}.json`);
    if (!existsSync(path)) return null;
    const existing = readJson(path);
    const collection = name === 'graph-health' ? 'findings' : name;
    if (!existing.generated_at || existing.schema_version !== '1.0') return null;
    if (generatedAt && existing.generated_at !== generatedAt) return null;
    if (JSON.stringify(existing[collection]) !== JSON.stringify(values)) return null;
    generatedAt = existing.generated_at;
  }
  return generatedAt;
}

function loadExistingCollections() {
  const previous = {};
  for (const name of RUNTIME_COLLECTIONS) {
    const path = join(GENERATED, `${name}.json`);
    if (!existsSync(path)) continue;
    previous[name] = readJson(path);
  }
  return previous;
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function buildSourceManifests(graph) {
  const evidenceById = new Map(graph.evidence.map((entry) => [entry.id, entry]));
  const nodeCounts = countBy(graph.nodes, (node) => node.source_id);
  const evidenceCounts = countBy(graph.evidence, (entry) => entry.source_id);
  const edgeCounts = countBy(graph.edges, (edge) => evidenceById.get(edge.evidence_ids[0])?.source_id || '');
  const findingCounts = countBy(graph.findings, (entry) => entry.source_id);

  return graph.sources.map((source) => ({
    source_id: source.id,
    owner: source.owner,
    version: source.version,
    retrieved_at: source.retrieved_at,
    artifact_url: source.artifact_url,
    artifact_type: source.artifact_type,
    checksum: source.checksum,
    access_status: source.access_status,
    lifecycle_status: source.lifecycle_status,
    graph_eligible: source.graph_eligible,
    node_count: nodeCounts.get(source.id) || 0,
    relationship_count: edgeCounts.get(source.id) || 0,
    evidence_count: evidenceCounts.get(source.id) || 0,
    finding_count: findingCounts.get(source.id) || 0,
  })).sort((a, b) => a.source_id.localeCompare(b.source_id));
}

function createBuildManifest(graph) {
  return {
    kind: 'build_manifest',
    runtime_artifacts: RUNTIME_COLLECTIONS.map((name) => `${name}.json`),
    governance_artifacts: GOVERNANCE_FILES,
    source_registry_path: 'data/source-registry.json',
    source_registry_schema: '4.0',
    counts: {
      sources: graph.sources.length,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      evidence: graph.evidence.length,
      findings: graph.findings.length,
    },
  };
}

function buildDiffSummary(previous, collections, generatedAt) {
  const changedRuntimeArtifacts = RUNTIME_COLLECTIONS.filter((name) => {
    const previousCollection = previous[name];
    const currentCollection = collections[name];
    if (!previousCollection) return true;
    const previousPayload = JSON.stringify(previousCollection[name === 'graph-health' ? 'findings' : name]);
    return previousPayload !== JSON.stringify(currentCollection);
  });

  return {
    kind: 'graph_diff_summary',
    previous_generated_at: previous.sources?.generated_at || null,
    current_generated_at: generatedAt,
    changed_runtime_artifacts: changedRuntimeArtifacts,
    unchanged_runtime_artifacts: RUNTIME_COLLECTIONS.filter((name) => !changedRuntimeArtifacts.includes(name)),
  };
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

  const collections = {
    sources: graph.sources,
    nodes: graph.nodes,
    edges: graph.edges,
    evidence: graph.evidence,
    'graph-health': graph.findings,
  };
  const previousCollections = loadExistingCollections();
  const generatedAt = existingGeneratedAt(collections) || new Date().toISOString();

  const sourceManifests = buildSourceManifests(graph);
  const buildManifest = createBuildManifest(graph);
  const diffSummary = buildDiffSummary(previousCollections, collections, generatedAt);

  mkdirSync(GENERATED, { recursive: true });
  for (const entry of readdirSync(GENERATED)) {
    if (entry.endsWith('.json')) rmSync(join(GENERATED, entry));
  }
  for (const [name, values] of Object.entries(collections)) {
    const collection = name === 'graph-health' ? 'findings' : name;
    const value = artifact(collection, values, generatedAt);
    writeFileSync(join(GENERATED, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  }

  writeFileSync(join(GENERATED, 'source-manifests.json'), `${JSON.stringify(artifact('source_manifests', sourceManifests, generatedAt), null, 2)}\n`, 'utf8');
  writeFileSync(join(GENERATED, 'build-manifest.json'), `${JSON.stringify(artifact('build_manifest', buildManifest, generatedAt), null, 2)}\n`, 'utf8');
  writeFileSync(join(GENERATED, 'graph-diff-summary.json'), `${JSON.stringify(artifact('graph_diff_summary', diffSummary, generatedAt), null, 2)}\n`, 'utf8');

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
