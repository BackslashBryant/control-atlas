#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonAtomically } from './lib/write-json-atomically.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DISCOVERY_PATH = join(ROOT, 'data', 'nist-structured-asset-discovery.json');
const OUTPUT_PATH = join(ROOT, 'data', 'nist-structured-asset-triage.json');

const INGESTED_PROJECTS = new Map([
  ['IoT-Device-Cybersecurity-Requirement-Catalogs', 'nist-iot-cybersecurity'],
  ['zero-trust-architecture', 'nist-zt'],
]);

function dispositionFor(asset) {
  const projects = new Set(asset.projects || []);
  for (const [project, catalogId] of INGESTED_PROJECTS) {
    if (projects.has(project)) {
      return {
        status: 'ingested_catalog',
        target: catalogId,
        reason: 'Publisher-structured rows are parsed into the catalog with exact worksheet, row, and cell provenance.',
      };
    }
  }
  if (projects.has('mobile-threat-catalogue')) {
    if (asset.format === 'xml') {
      return {
        status: 'redundant_representation',
        target: 'nist-mobile-threats',
        reason: 'The publisher JSON is the canonical threat payload and the CSV independently reconciles CVEs; this XML is a duplicate representation, not a missing catalog.',
      };
    }
    return {
      status: 'ingested_catalog',
      target: 'nist-mobile-threats',
      reason: 'Threat/category content is parsed from publisher JSON and every CSV CVE is reconciled.',
    };
  }
  if (projects.has('sctools')) {
    return {
      status: 'queued_resource',
      target: 'resources:nist-security-content-tools',
      reason: 'Historical experimental NIST security-content schemas support a Resource entry, not a second control catalog beside current NIST publications.',
    };
  }
  if (projects.has('minex')) {
    return {
      status: 'queued_resource',
      target: 'resources:nist-minex',
      reason: 'Biometric interoperability test results are useful identity-assurance supporting material, not publisher-native control records.',
    };
  }
  if (projects.has('Public_Safety_Analytics_Resources')) {
    return {
      status: 'queued_resource',
      target: 'resources:nist-public-safety-analytics',
      reason: 'The workbook is a resource compendium for AI analytics and belongs in Resources rather than the compliance graph.',
    };
  }
  return {
    status: 'out_of_scope',
    target: null,
    reason: 'The discovered file is scientific, tutorial, build-tool, or third-party feed material without a cybersecurity governance, control, threat, or implementation role.',
  };
}

const discoveryBytes = readFileSync(DISCOVERY_PATH);
const discovery = JSON.parse(discoveryBytes.toString('utf8'));
const assets = (discovery.assets || []).map((asset) => ({ ...asset, ...dispositionFor(asset) }));
const counts = Object.fromEntries(
  [...new Set(assets.map((asset) => asset.status))]
    .sort()
    .map((status) => [status, assets.filter((asset) => asset.status === status).length]),
);

writeJsonAtomically(OUTPUT_PATH, {
  schema_version: '1.0',
  source_inventory: 'data/nist-structured-asset-discovery.json',
  source_inventory_sha256: `sha256:${createHash('sha256').update(discoveryBytes).digest('hex')}`,
  reconciliation: {
    assets_discovered: discovery.reconciliation.structured_assets_discovered,
    assets_classified: assets.length,
    unclassified_assets: assets.filter((asset) => !asset.status).length,
    ...counts,
  },
  assets,
});

console.log(`Classified ${assets.length}/${discovery.reconciliation.structured_assets_discovered} NIST structured assets: ${JSON.stringify(counts)}`);
