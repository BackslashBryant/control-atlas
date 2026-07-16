#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_PATH = join(ROOT, 'data', 'source-registry.json');
const VOLATILE_KEYS = new Set(['generated_at', 'observed_at', 'retrieved_at', 'snapshot_date']);

const ARTIFACTS = new Map([
  ['nist-oscal', ['data/controls-800-53.json', 'data/requirements-800-171.json', 'data/csf-subcategories.json']],
  ['nist-800-171-rev2', 'data/requirements-800-171-rev2.json'],
  ['nist-800-172-rev3', 'data/requirements-800-172.json'],
  ['disa-cci-list', 'data/ccis.json'],
  ['disa-stig-library', 'data/stig-rules.json'],
  ['disa-srg-library', 'data/srg-requirements.json'],
  ['disa-stig-srg-cci-references', 'maps/stig-srg-to-cci.json'],
  ['nist-ai-rmf-playbook', 'data/ai-rmf.json'],
  ['nist-ssdf-oscal', 'data/ssdf.json'],
  ['fedramp-rev5', 'data/fedramp-baselines.json'],
  ['nist-800-53b-baselines', 'data/800-53b-baselines.json'],
  ['nist-800-53a-assessment-procedures', 'data/controls-800-53.json'],
  ['nist-800-171-oscal-mappings', 'maps/800-53-to-800-171.json'],
  ['disa-cci-nist-references', 'maps/cci-to-800-53.json'],
  ['mitre-attack-enterprise', 'data/attack-techniques-enterprise.json'],
  ['mitre-attack-ics', 'data/attack-techniques-ics.json'],
  ['mitre-d3fend-ontology', 'data/d3fend-countermeasures.json'],
  ['mitre-d3fend-mappings', ['maps/attack-to-d3fend.json', 'maps/d3fend-to-800-53.json']],
  ['nist-olir-csf2-to-sp800-53', 'maps/800-53-to-csf.json'],
]);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .filter((key) => !VOLATILE_KEYS.has(key))
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
}

export function artifactHash(document) {
  const stable = JSON.stringify(canonicalize(document));
  return `sha256:${createHash('sha256').update(stable).digest('hex')}`;
}

function artifactVersion(document) {
  if (Array.isArray(document)) {
    return document.map(artifactVersion).find(Boolean) || null;
  }
  return document.source_version || document.version || document.records?.[0]?.source?.version || null;
}

export function reconcileFreshness(registry, artifactDocuments, runDate, observedSourceIds = []) {
  const registrySources = new Map(registry.sources.map((source) => [source.id, source]));
  const observations = new Set(observedSourceIds);
  for (const freshness of registry.freshness.sources) {
    if (freshness.sync_model === 'link_out' && observations.has(freshness.source_id)) {
      freshness.last_checked = runDate;
      continue;
    }
    if (freshness.sync_model !== 'auto_synced') continue;
    const document = artifactDocuments.get(freshness.source_id);
    if (!document) throw new Error(`Missing refreshed artifact for ${freshness.source_id}`);
    const nextHash = artifactHash(document);
    freshness.last_checked = runDate;
    if (freshness.hash !== nextHash) freshness.last_imported = runDate;
    freshness.hash = nextHash;
    const nextVersion = artifactVersion(document);
    if (nextVersion) registrySources.get(freshness.source_id).version = String(nextVersion);
  }
  return registry;
}

export function reconcileSourceFreshness(runDate = new Date().toISOString().slice(0, 10)) {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  const documents = new Map(
    [...ARTIFACTS].map(([sourceId, relativePaths]) => [
      sourceId,
      (Array.isArray(relativePaths) ? relativePaths : [relativePaths]).map((relativePath) =>
        JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8')),
      ),
    ]),
  );
  const observations = JSON.parse(
    readFileSync(join(ROOT, 'data', 'stig-source-observations.json'), 'utf8'),
  ).observations.map((entry) => entry.source_id);
  const updated = reconcileFreshness(registry, documents, runDate, observations);
  writeFileSync(REGISTRY_PATH, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  return updated.freshness.sources;
}

if (process.argv[1]?.includes('reconcile-source-freshness.mjs')) {
  try {
    const entries = reconcileSourceFreshness();
    console.log(`Reconciled freshness metadata for ${entries.length} sources`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
