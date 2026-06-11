#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCalculatedPaths,
  buildEvidenceEntry,
  reconcileAssertions,
} from './lib/framework-engine.mjs';
import { loadSourceRegistry } from './lib/source-registry.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED = join(ROOT, 'data', 'generated');
const SNAPSHOT = new Date().toISOString();

const FRAMEWORKS = [
  { id: 'nist-800-53', name: 'NIST SP 800-53 Rev. 5', issuer: 'NIST', status: 'active', source_id: 'nist-oscal' },
  { id: 'nist-800-171', name: 'NIST SP 800-171 Rev. 3', issuer: 'NIST', status: 'active', source_id: 'nist-oscal' },
  { id: 'csf-2', name: 'NIST Cybersecurity Framework 2.0', issuer: 'NIST', status: 'active', source_id: 'nist-oscal' },
  { id: 'cmmc-2', name: 'CMMC 2.0', issuer: 'DoD', status: 'limited-public-scope', source_id: 'dod-cmmc-rule' },
  { id: 'fedramp-rev5', name: 'FedRAMP Rev. 5 Baselines', issuer: 'FedRAMP', status: 'limited-public-scope', source_id: 'fedramp-rev5' },
  { id: 'disa-cci', name: 'Control Correlation Identifiers', issuer: 'DISA', status: 'active', source_id: 'disa-cci-list' },
  { id: 'nist-ai-rmf', name: 'NIST AI Risk Management Framework', issuer: 'NIST', status: 'active', source_id: 'nist-ai-rmf-playbook' },
  { id: 'nist-ssdf', name: 'NIST Secure Software Development Framework', issuer: 'NIST', status: 'active', source_id: 'nist-ssdf-oscal' },
  { id: 'dod-rai', name: 'DoD Responsible AI Toolkit', issuer: 'DoD', status: 'limited-public-scope', source_id: 'dod-rai-toolkit' },
];

const SOURCE_CATALOGS = [
  ['controls-800-53.json', 'nist-800-53'],
  ['requirements-800-171.json', 'nist-800-171'],
  ['csf-subcategories.json', 'csf-2'],
  ['cmmc-practices.json', 'cmmc-2'],
  ['fedramp-baselines.json', 'fedramp-rev5'],
  ['ccis.json', 'disa-cci'],
  ['ai-rmf.json', 'nist-ai-rmf'],
  ['ssdf.json', 'nist-ssdf'],
  ['dod-rai.json', 'dod-rai'],
];

const MAPS = [
  ['800-53-to-csf.json', 'nist-800-53', 'csf-2', 'maps_to', 'nist-csf-53-supplemental'],
  ['800-53-to-800-171.json', 'nist-800-53', 'nist-800-171', 'maps_to', 'nist-800-171-oscal-mappings'],
  ['cci-to-800-53.json', 'disa-cci', 'nist-800-53', 'maps_to', 'disa-cci-nist-references'],
];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function itemKey(frameworkId, itemId) {
  return `${frameworkId}:${itemId}`;
}

export function evidenceFromSource(source, document, relationship, overrides = {}) {
  const sourceId = overrides.sourceId || relationship.evidence_source || document.source_key || source?.id;
  return {
    tier: source?.tier || 'bronze',
    source_id: sourceId,
    authority_type: source?.authority_type || 'research_candidate',
    artifact: source?.artifact || document.source_artifact || '',
    locator: relationship.source_locator || overrides.locator || `${document.source_key || sourceId}#relationship`,
    snapshot_date: document.snapshot_date || SNAPSHOT.slice(0, 10),
    checksum: document.checksum || null,
    agreement: overrides.agreement || 'agrees',
  };
}

function buildItems(registryState) {
  const items = [];
  for (const [filename, frameworkId] of SOURCE_CATALOGS) {
    const path = join(ROOT, 'data', filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    const framework = FRAMEWORKS.find((item) => item.id === frameworkId);
    for (const record of document.records || []) {
      const source = registryState.byId.get(record.source?.key)
        || registryState.byId.get(framework.source_id);
      items.push({
        key: itemKey(frameworkId, record.id),
        framework_id: frameworkId,
        item_id: record.id,
        title: record.title || record.id,
        text: record.description || '',
        hierarchy: record.family || record.group || '',
        metadata: {
          baselines: record.fedramp_baselines || record.metadata?.baselines || null,
          nist_control: record.nist_control || null,
          type: record.type || null,
          status: record.status || null,
          references: record.references || null,
        },
        canonical_evidence: {
          tier: source?.tier || 'bronze',
          source_id: source?.id || record.source?.key || 'unknown',
          authority_type: source?.authority_type || 'research_candidate',
          artifact: source?.artifact || '',
          locator: record.source?.locator || `${filename}#${record.id}`,
          snapshot_date: record.source?.snapshot_date || SNAPSHOT.slice(0, 10),
          checksum: record.source?.checksum || document.checksum || null,
          agreement: 'agrees',
        },
      });
    }
  }
  return items.sort((a, b) => a.key.localeCompare(b.key));
}

function buildAssertions(items, registryState) {
  const keys = new Set(items.map((item) => item.key));
  const assertions = [];
  for (const [filename, sourceFramework, targetFramework, relationshipType, defaultSourceId] of MAPS) {
    const path = join(ROOT, 'maps', filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const [index, relationship] of (document.relationships || []).entries()) {
      const sourceKey = itemKey(sourceFramework, relationship.source_id);
      const targetKey = itemKey(targetFramework, relationship.target_id);
      if (!keys.has(sourceKey) || !keys.has(targetKey)) continue;
      const evidenceSourceId = relationship.evidence_source || document.source_key || defaultSourceId;
      const evidenceSource = registryState.byId.get(evidenceSourceId);
      assertions.push({
        id: `${filename.replace('.json', '')}:${index + 1}`,
        source_key: sourceKey,
        target_key: targetKey,
        relationship_type: relationshipType,
        rationale: relationship.why || document.provenance || '',
        evidence: [evidenceFromSource(evidenceSource, document, relationship, { sourceId: evidenceSourceId })],
      });
    }
  }
  return assertions;
}

function pairKey(sourceFramework, targetFramework) {
  return `${sourceFramework}->${targetFramework}`;
}

function buildCoverage(frameworks, items, mappings, paths, blocked, candidates, registryState) {
  const mappingCountsBySource = {};
  const mappingCountsByPair = {};
  for (const mapping of mappings) {
    const sourceId = mapping.evidence?.[0]?.source_id || 'unknown';
    mappingCountsBySource[sourceId] = (mappingCountsBySource[sourceId] || 0) + 1;
    const sourceFramework = mapping.source_key.split(':')[0];
    const targetFramework = mapping.target_key.split(':')[0];
    const key = pairKey(sourceFramework, targetFramework);
    mappingCountsByPair[key] = (mappingCountsByPair[key] || 0) + 1;
  }

  const pathCountsByPair = {};
  for (const path of paths) {
    const sourceFramework = path.source_key.split(':')[0];
    const targetFramework = path.target_key.split(':')[0];
    const key = pairKey(sourceFramework, targetFramework);
    pathCountsByPair[key] = (pathCountsByPair[key] || 0) + 1;
  }

  const blockedByReason = blocked.reduce((acc, item) => {
    const reason = item.block_reason || 'unknown';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  const candidatesBySource = candidates.reduce((acc, item) => {
    const sourceId = item.evidence?.[0]?.source_id || 'unknown';
    acc[sourceId] = (acc[sourceId] || 0) + 1;
    return acc;
  }, {});

  return {
    generated_at: SNAPSHOT,
    frameworks: frameworks.map((framework) => {
      const frameworkItems = items.filter((item) => item.framework_id === framework.id);
      const mapped = frameworkItems.filter((item) =>
        mappings.some((mapping) => mapping.source_key === item.key || mapping.target_key === item.key));
      return {
        framework_id: framework.id,
        catalog_items: frameworkItems.length,
        mapped_items: mapped.length,
        mapped_percent: frameworkItems.length ? Number((mapped.length * 100 / frameworkItems.length).toFixed(1)) : 0,
        status: framework.status,
        limited_reason: framework.status === 'limited-public-scope'
          ? 'Public artifacts describe program structure but not complete machine-readable crosswalk coverage.'
          : null,
      };
    }),
    mappings: {
      published: mappings.length,
      blocked: blocked.length,
      candidates: candidates.length,
      evidence_gaps: mappings.filter((mapping) => mapping.evidence_gaps.length).length,
      by_source: mappingCountsBySource,
      by_pair: mappingCountsByPair,
    },
    paths: {
      published: paths.length,
      by_pair: pathCountsByPair,
    },
    blocked_by_reason: blockedByReason,
    candidates_by_source: candidatesBySource,
    sources: registryState.sources.map((source) => ({
      id: source.id,
      name: source.name,
      tier: source.tier,
      authority_type: source.authority_type,
      issuer: source.issuer,
      artifact: source.artifact,
      frameworks: source.frameworks,
      status: source.status,
    })),
  };
}

export function buildSourceHealth(registryState, mappings, blocked, candidates, mapDocuments = []) {
  const usedSources = new Set();
  for (const mapping of mappings) {
    for (const entry of mapping.evidence || []) usedSources.add(entry.source_id);
  }
  for (const item of [...blocked, ...candidates]) {
    for (const entry of item.evidence || []) usedSources.add(entry.source_id);
  }

  const mapBySource = new Map(mapDocuments.map((doc) => [doc.source_key, doc]));
  const staleDays = 180;
  const now = Date.now();

  return {
    generated_at: SNAPSHOT,
    sources: registryState.sources.map((source) => {
      const mapDoc = mapBySource.get(source.id);
      const snapshotDate = mapDoc?.snapshot_date || null;
      const ageDays = snapshotDate
        ? Math.floor((now - Date.parse(snapshotDate)) / (1000 * 60 * 60 * 24))
        : null;
      return {
        id: source.id,
        tier: source.tier,
        authority_type: source.authority_type,
        status: source.status,
        used_in_publish_path: usedSources.has(source.id),
        artifact: source.artifact,
        parser: source.parser,
        refresh_strategy: source.refresh_strategy,
        snapshot_date: snapshotDate,
        checksum: mapDoc?.checksum || null,
        stale: ageDays !== null ? ageDays > staleDays : false,
      };
    }),
    blocked_assertions: blocked.length,
    candidate_assertions: candidates.length,
    published_mappings: mappings.length,
  };
}

function compactCatalogItems(items) {
  return items.map(({ key, framework_id, item_id, title, hierarchy, metadata, canonical_evidence }) => ({
    key,
    framework_id,
    item_id,
    title,
    hierarchy,
    metadata: {
      baselines: metadata?.baselines || null,
      nist_control: metadata?.nist_control || null,
      type: metadata?.type || null,
      status: metadata?.status || null,
    },
    canonical_evidence: {
      tier: canonical_evidence.tier,
      source_id: canonical_evidence.source_id,
      authority_type: canonical_evidence.authority_type,
      locator: canonical_evidence.locator,
      agreement: canonical_evidence.agreement,
    },
  }));
}

function compactMappings(mappings) {
  return mappings.map((mapping) => ({
    id: mapping.id,
    source_key: mapping.source_key,
    target_key: mapping.target_key,
    relationship_type: mapping.relationship_type,
    status: mapping.status,
    evidence_gaps: mapping.evidence_gaps,
    evidence: (mapping.evidence || []).map((entry) => ({
      tier: entry.tier,
      source_id: entry.source_id,
      authority_type: entry.authority_type,
      locator: entry.locator,
      agreement: entry.agreement,
    })),
  }));
}

function compactPaths(paths) {
  return paths.map((path) => ({
    id: path.id,
    source_key: path.source_key,
    target_key: path.target_key,
    item_keys: path.item_keys,
    confidence: path.confidence,
    evidence_gaps: path.evidence_gaps,
    hops: (path.hops || []).map((hop) => ({
      assertion_id: hop.assertion_id,
      source_id: hop.source_id,
      locator: hop.locator,
      tier: hop.tier,
      authority_type: hop.authority_type,
    })),
  }));
}

export function buildFrameworkData() {
  const registryState = loadSourceRegistry(readJson(join(ROOT, 'data', 'source-registry.json')));
  const items = buildItems(registryState);
  const assertions = buildAssertions(items, registryState);
  const { published: mappings, blocked, candidates } = reconcileAssertions(assertions);
  const paths = buildCalculatedPaths(mappings);
  const evidence = Object.fromEntries([...mappings, ...blocked, ...candidates].map((assertion) => [
    assertion.id,
    buildEvidenceEntry(assertion),
  ]));
  const mapDocuments = MAPS
    .map(([filename]) => join(ROOT, 'maps', filename))
    .filter((path) => existsSync(path))
    .map((path) => readJson(path));
  const coverage = buildCoverage(FRAMEWORKS, items, mappings, paths, blocked, candidates, registryState);
  const sourceHealth = buildSourceHealth(registryState, mappings, blocked, candidates, mapDocuments);
  const catalog = {
    schema_version: '2.1',
    generated_at: SNAPSHOT,
    frameworks: FRAMEWORKS,
    items: compactCatalogItems(items),
    mappings: compactMappings(mappings),
    paths: compactPaths(paths),
    evidence,
    coverage,
  };
  const bootstrap = { schema_version: '2.1', generated_at: SNAPSHOT, frameworks: FRAMEWORKS, coverage };

  mkdirSync(GENERATED, { recursive: true });
  for (const [name, value] of Object.entries({
    frameworks: FRAMEWORKS,
    items,
    mappings,
    paths,
    evidence,
    coverage,
    bootstrap,
    catalog,
    candidates,
    'source-health': sourceHealth,
  })) {
    writeFileSync(join(GENERATED, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  }
  return {
    items: items.length,
    mappings: mappings.length,
    paths: paths.length,
    blocked: blocked.length,
    candidates: candidates.length,
  };
}

if (process.argv[1]?.includes('build-framework-data.mjs')) {
  const result = buildFrameworkData();
  console.log(`Built framework data: ${result.items} items, ${result.mappings} direct mappings, ${result.paths} calculated paths, ${result.blocked} blocked, ${result.candidates} candidates`);
}
