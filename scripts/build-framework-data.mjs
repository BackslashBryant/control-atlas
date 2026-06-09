#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCalculatedPaths, reconcileAssertions } from './lib/framework-engine.mjs';

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
  ['800-53-to-csf.json', 'nist-800-53', 'csf-2', 'maps_to', 'nist-informative-references'],
  ['800-53-to-800-171.json', 'nist-800-53', 'nist-800-171', 'maps_to', 'nist-oscal'],
  ['cci-to-800-53.json', 'disa-cci', 'nist-800-53', 'maps_to', 'disa-cci-list'],
];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function itemKey(frameworkId, itemId) {
  return `${frameworkId}:${itemId}`;
}

function buildItems(sourceRegistry) {
  const items = [];
  for (const [filename, frameworkId] of SOURCE_CATALOGS) {
    const path = join(ROOT, 'data', filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    const framework = FRAMEWORKS.find((item) => item.id === frameworkId);
    for (const record of document.records || []) {
      const source = sourceRegistry.sources.find((item) => item.id === record.source?.key)
        || sourceRegistry.sources.find((item) => item.id === framework.source_id);
      items.push({
        key: itemKey(frameworkId, record.id),
        framework_id: frameworkId,
        item_id: record.id,
        title: record.title || record.id,
        text: record.description || '',
        hierarchy: record.family || record.group || '',
        metadata: {
          baselines: record.fedramp_baselines || null,
          nist_control: record.nist_control || null,
          type: record.type || null,
          status: record.status || null,
          references: record.references || null,
        },
        canonical_evidence: {
          tier: source?.tier || 'bronze',
          source_id: source?.id || record.source?.key || 'unknown',
          artifact: source?.artifact || '',
          locator: record.source?.locator || `${filename}#${record.id}`,
          snapshot_date: record.source?.snapshot_date || SNAPSHOT,
          checksum: record.source?.checksum || document.checksum || null,
          agreement: 'agrees',
        },
      });
    }
  }
  return items.sort((a, b) => a.key.localeCompare(b.key));
}

function buildAssertions(items, sourceRegistry) {
  const keys = new Set(items.map((item) => item.key));
  const assertions = [];
  for (const [filename, sourceFramework, targetFramework, relationshipType, sourceId] of MAPS) {
    const path = join(ROOT, 'maps', filename);
    if (!existsSync(path)) continue;
    const document = readJson(path);
    for (const [index, relationship] of (document.relationships || []).entries()) {
      const sourceKey = itemKey(sourceFramework, relationship.source_id);
      const targetKey = itemKey(targetFramework, relationship.target_id);
      if (!keys.has(sourceKey) || !keys.has(targetKey)) continue;
      const evidenceSourceId = relationship.evidence_source || sourceId;
      const evidenceSource = sourceRegistry.sources.find((source) => source.id === evidenceSourceId);
      assertions.push({
        id: `${filename.replace('.json', '')}:${index + 1}`,
        source_key: sourceKey,
        target_key: targetKey,
        relationship_type: relationshipType,
        rationale: relationship.why || document.provenance || '',
        evidence: [{
          tier: evidenceSource?.tier || 'bronze',
          source_id: evidenceSourceId,
          artifact: evidenceSource?.artifact || document.source_artifact || filename,
          locator: relationship.source_locator || `${filename}#relationships[${index}]`,
          snapshot_date: document.snapshot_date || SNAPSHOT,
          checksum: document.checksum || null,
          agreement: 'agrees',
        }],
      });
    }
  }
  return assertions;
}

function buildCoverage(frameworks, items, mappings, blocked, sourceRegistry) {
  return {
    generated_at: SNAPSHOT,
    frameworks: frameworks.map((framework) => {
      const frameworkItems = items.filter((item) => item.framework_id === framework.id);
      const mapped = frameworkItems.filter((item) => mappings.some((mapping) => mapping.source_key === item.key || mapping.target_key === item.key));
      return {
        framework_id: framework.id,
        catalog_items: frameworkItems.length,
        mapped_items: mapped.length,
        mapped_percent: frameworkItems.length ? Number((mapped.length * 100 / frameworkItems.length).toFixed(1)) : 0,
        status: framework.status,
      };
    }),
    mappings: {
      published: mappings.length,
      blocked: blocked.length,
      evidence_gaps: mappings.filter((mapping) => mapping.evidence_gaps.length).length,
    },
    sources: sourceRegistry.sources.map((source) => ({
      id: source.id,
      name: source.name,
      tier: source.tier,
      issuer: source.issuer,
      artifact: source.artifact,
      frameworks: source.frameworks,
    })),
  };
}

export function buildFrameworkData() {
  const sourceRegistry = readJson(join(ROOT, 'data', 'source-registry.json'));
  const items = buildItems(sourceRegistry);
  const assertions = buildAssertions(items, sourceRegistry);
  const { published: mappings, blocked } = reconcileAssertions(assertions);
  const paths = buildCalculatedPaths(mappings);
  const evidence = Object.fromEntries([...mappings, ...blocked].map((assertion) => [
    assertion.id,
    {
      assertion_id: assertion.id,
      status: assertion.status || 'blocked',
      block_reason: assertion.block_reason || null,
      gaps: assertion.evidence_gaps || [],
      sources: assertion.evidence || [],
    },
  ]));
  const coverage = buildCoverage(FRAMEWORKS, items, mappings, blocked, sourceRegistry);
  const catalog = { schema_version: '2.0', generated_at: SNAPSHOT, frameworks: FRAMEWORKS, items, mappings, paths, evidence, coverage };
  const bootstrap = { schema_version: '2.0', generated_at: SNAPSHOT, frameworks: FRAMEWORKS, coverage };

  mkdirSync(GENERATED, { recursive: true });
  for (const [name, value] of Object.entries({ frameworks: FRAMEWORKS, items, mappings, paths, evidence, coverage, bootstrap, catalog })) {
    writeFileSync(join(GENERATED, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  }
  return { items: items.length, mappings: mappings.length, paths: paths.length, blocked: blocked.length };
}

if (process.argv[1]?.includes('build-framework-data.mjs')) {
  const result = buildFrameworkData();
  console.log(`Built framework data: ${result.items} items, ${result.mappings} direct mappings, ${result.paths} calculated paths, ${result.blocked} blocked`);
}
