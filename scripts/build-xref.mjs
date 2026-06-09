#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSearchTokens } from './lib/oscal-normalize.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_DATE = new Date().toISOString();
const XREF_MONOLITHIC_MAX = 20 * 1024 * 1024;
const OFFLINE_RECORD_CAP = 80;

const OFFLINE_PRIORITY_IDS = new Set([
  'AC-2',
  'AC-3',
  'AC-6',
  'PR.AA-01',
  '3.1.1',
  'AC.L1-3.1.1',
  'CVE-2023-12345',
  'FIPS-199-MODERATE',
  'RMF-AC-2',
  'CCI-000225',
  '10413',
]);

const SOURCE_FILES = [
  'controls-800-53.json',
  'csf-subcategories.json',
  'requirements-800-171.json',
  'tasks-800-37.json',
  'cmmc-practices.json',
  'fisma-reference.json',
  'cves.json',
  'ccis.json',
  'ai-rmf.json',
  'ssdf.json',
  'cisa-cpg.json',
];

const MAP_FILES = [
  '800-53-to-csf.json',
  '800-53-to-800-171.json',
  '800-53-to-800-37.json',
  '800-53-to-cmmc.json',
  '800-53-to-fedramp.json',
  '800-53-to-fisma.json',
  'cve-to-cwe-to-800-53.json',
  'cci-to-800-53.json',
  '800-53-to-airmf.json',
  '800-53-to-ssdf.json',
  'csf-to-cpg.json',
];

const MAP_PROVENANCE = {
  '800-53-to-csf.json': 'NIST SP 800-53 Rev. 5 to CSF 2.0 Informative Reference',
  '800-53-to-800-171.json': 'NIST SP 800-171 Rev 3 access control alignment',
  '800-53-to-800-37.json': 'NIST SP 800-37 Rev 2 RMF task alignment',
  '800-53-to-cmmc.json': 'DoD CMMC 2.0 practice mapping (800-171 bridge)',
  '800-53-to-fedramp.json': 'FedRAMP Rev 5 baseline inclusion',
  '800-53-to-fisma.json': 'FIPS 199 moderate impact reference',
  'cve-to-cwe-to-800-53.json': 'NVD CVE via MITRE heimdall_tools CWE-NIST CSV',
  'cci-to-800-53.json': 'Curated CCI to NIST 800-53 crosswalk',
  '800-53-to-airmf.json': 'NIST AI RMF to 800-53 Crosswalk',
  '800-53-to-ssdf.json': 'NIST SSDF to 800-53 Crosswalk',
  'csf-to-cpg.json': 'CISA CPG to CSF Crosswalk',
};

const SHARD_FILE_BY_TYPE = {
  '800-53-control': '800-53-control.json',
  'csf-subcategory': 'csf-subcategory.json',
  '800-171-requirement': '800-171-requirement.json',
  '800-37-task': '800-37-task.json',
  'cmmc-practice': 'cmmc-practice.json',
  'fisma-reference': 'fisma-reference.json',
  cve: 'cve.json',
  'cci': 'cci.json',
  'airmf-function': 'airmf-function.json',
  'ssdf-practice': 'ssdf-practice.json',
  'cisa-cpg': 'cisa-cpg.json',
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadSourceRecords() {
  const records = [];
  for (const file of SOURCE_FILES) {
    const path = join(ROOT, 'data', file);
    if (!existsSync(path)) continue;
    const doc = readJson(path);
    for (const record of doc.records || []) {
      records.push({
        ...record,
        source: record.source || {
          key: doc.source_key,
          snapshot_date: SNAPSHOT_DATE,
        },
        relationships: [],
      });
    }
  }
  return records;
}

function indexById(records) {
  const map = new Map();
  for (const record of records) {
    if (map.has(record.id)) {
      throw new Error(`duplicate record id ${record.id}`);
    }
    map.set(record.id, record);
  }
  return map;
}

function ensureRelationship(record, rel) {
  const exists = record.relationships.some(
    (r) => r.target_id === rel.target_id && r.target_type === rel.target_type,
  );
  if (!exists) record.relationships.push(rel);
}

function addRelationship(byId, sourceId, targetId, targetType, sourceLabel, why) {
  const src = byId.get(sourceId);
  const tgt = byId.get(targetId);
  if (!src) throw new Error(`map source missing record ${sourceId}`);
  if (!tgt) throw new Error(`map target missing record ${targetId}`);

  ensureRelationship(src, {
    target_id: targetId,
    target_type: targetType,
    source: sourceLabel,
    why,
  });
  ensureRelationship(tgt, {
    target_id: sourceId,
    target_type: src.type,
    source: sourceLabel,
    why: `Bidirectional link: ${why}`,
  });
}

function applyMaps(byId) {
  for (const file of MAP_FILES) {
    const mapPath = join(ROOT, 'maps', file);
    if (!existsSync(mapPath)) continue;
    const mapDoc = readJson(mapPath);
    const label = mapDoc.provenance || MAP_PROVENANCE[file] || mapDoc.source_key;

    if (file === '800-53-to-fedramp.json') {
      for (const edge of mapDoc.relationships || []) {
        const src = byId.get(edge.source_id);
        if (src && edge.baselines) src.fedramp_baselines = edge.baselines;
      }
      continue;
    }

    for (const edge of mapDoc.relationships || []) {
      if (edge.source_id === edge.target_id) continue;
      const target = byId.get(edge.target_id);
      if (!target) {
        console.warn(`${file}: skip unknown target ${edge.target_id}`);
        continue;
      }
      addRelationship(byId, edge.source_id, edge.target_id, target.type, label, edge.why);
    }
  }
}

function addPrdStigPlaceholder(byId) {
  // Removed STIG placeholder logic.
}

function validateBidirectional(byId) {
  for (const record of byId.values()) {
    for (const rel of record.relationships) {
      const reciprocal = byId.get(rel.target_id);
      if (!reciprocal) throw new Error(`${record.id} points to missing ${rel.target_id}`);
      const back = reciprocal.relationships.some((r) => r.target_id === record.id);
      if (!back) throw new Error(`${record.id} -> ${rel.target_id} is not bidirectional`);
    }
  }
}

function validateManifestTiers() {
  const manifest = readJson(join(ROOT, 'data', 'manifest.json'));
  const phase = manifest.phase;
  if (phase !== '2' && phase !== '3' && phase !== '4' && phase !== '5' && phase !== '6') {
    throw new Error('manifest.phase must be "2", "3", "4", "5", or "6"');
  }

  for (const [key, source] of Object.entries(manifest.sources || {})) {
    if (!source.source_tier) throw new Error(`manifest.sources.${key} missing source_tier`);
    if (!source.resolved_from) throw new Error(`manifest.sources.${key} missing resolved_from`);
    if (source.source_tier === 'gold' && source.resolved_from === 'bronze') {
      throw new Error(`manifest.sources.${key} cannot claim gold tier with bronze resolved_from`);
    }
    if (source.resolved_from === 'bronze' && source.authoritative !== false) {
      throw new Error(`manifest.sources.${key} bronze resolved_from requires authoritative: false`);
    }
  }
}

function updateManifestRecordCounts(byId, xrefMode) {
  const manifestPath = join(ROOT, 'data', 'manifest.json');
  const manifest = readJson(manifestPath);
  const counts = new Map();
  for (const record of byId.values()) {
    const key = record.source?.key;
    if (key) counts.set(key, (counts.get(key) || 0) + 1);
  }
  for (const [key, source] of Object.entries(manifest.sources || {})) {
    if (counts.has(key)) source.record_count = counts.get(key);
  }
  manifest.phase = '6';
  manifest.generated_at = SNAPSHOT_DATE;
  manifest.xref_mode = xrefMode;
  manifest.sharding_enabled = xrefMode === 'sharded';
  manifest.total_records = byId.size;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

function buildSearchIndex(records) {
  return records.map((record) => ({
    id: record.id,
    type: record.type,
    framework: record.framework,
    title: record.title,
    tokens: buildSearchTokens(record),
  }));
}

function writeShards(records) {
  const shardDir = join(ROOT, 'data', 'shards');
  if (existsSync(shardDir)) {
    for (const file of readFileSync(shardDir, 'utf8') ? [] : []) {
      /* rm children */
    }
    rmSync(shardDir, { recursive: true, force: true });
  }
  mkdirSync(shardDir, { recursive: true });

  const byType = new Map();
  for (const record of records) {
    if (!byType.has(record.type)) byType.set(record.type, []);
    byType.get(record.type).push(record);
  }

  const manifestShards = {};
  for (const [type, list] of byType.entries()) {
    const filename = SHARD_FILE_BY_TYPE[type] || `${type.replace(/[^a-z0-9]+/gi, '-')}.json`;
    const path = `data/shards/${filename}`;
    writeFileSync(
      join(ROOT, path),
      `${JSON.stringify({ schema_version: '1.0', type, records: list.sort((a, b) => a.id.localeCompare(b.id)) }, null, 2)}\n`,
      'utf8',
    );
    manifestShards[type] = path;
  }
  return manifestShards;
}

function pickOfflineRecords(records) {
  const picked = new Map();
  for (const id of OFFLINE_PRIORITY_IDS) {
    const record = records.find((r) => r.id === id);
    if (record) picked.set(record.id, record);
  }
  const typesSeen = new Set([...picked.values()].map((r) => r.type));
  for (const record of records) {
    if (picked.size >= OFFLINE_RECORD_CAP) break;
    if (!typesSeen.has(record.type)) {
      picked.set(record.id, record);
      typesSeen.add(record.type);
    }
  }
  for (const record of records) {
    if (picked.size >= OFFLINE_RECORD_CAP) break;
    if (!picked.has(record.id)) picked.set(record.id, record);
  }
  return [...picked.values()];
}

function syncOfflineSnapshot(manifest, searchIndex, offlineRecords) {
  const htmlPath = join(ROOT, 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  const payload = {
    manifest,
    schema_version: '1.0',
    snapshot_date: SNAPSHOT_DATE,
    xref_mode: manifest.xref_mode || 'monolithic',
    search_index: searchIndex.filter((e) => offlineRecords.some((r) => r.id === e.id)),
    records: offlineRecords,
  };
  const json = JSON.stringify(payload, null, 2);
  const snapshotRe = /<script id="offlineSnapshot"[^>]*>[\s\S]*?<\/script>/;
  if (!snapshotRe.test(html)) throw new Error('offlineSnapshot block not found in index.html');
  const replaced = html.replace(
    snapshotRe,
    `<script id="offlineSnapshot" type="application/json">\n${json}\n  </script>`,
  );
  writeFileSync(htmlPath, replaced, 'utf8');
}

export function buildXref() {
  const byId = indexById(loadSourceRecords());
  applyMaps(byId);
  addPrdStigPlaceholder(byId);
  validateBidirectional(byId);

  const records = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const xrefPayload = {
    schema_version: '1.0',
    snapshot_date: SNAPSHOT_DATE,
    records,
  };

  const monolithicBytes = Buffer.byteLength(JSON.stringify(xrefPayload), 'utf8');
  const searchIndex = buildSearchIndex(records);
  let xrefMode = 'monolithic';

  if (monolithicBytes > XREF_MONOLITHIC_MAX) {
    xrefMode = 'sharded';
    writeFileSync(
      join(ROOT, 'data', 'search-index.json'),
      `${JSON.stringify({ schema_version: '1.0', snapshot_date: SNAPSHOT_DATE, entries: searchIndex }, null, 2)}\n`,
      'utf8',
    );
    const shards = writeShards(records);
    const manifest = readJson(join(ROOT, 'data', 'manifest.json'));
    manifest.shards = shards;
    writeFileSync(join(ROOT, 'data', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    writeFileSync(
      join(ROOT, 'data', 'xref-map.json'),
      `${JSON.stringify({ schema_version: '1.0', snapshot_date: SNAPSHOT_DATE, xref_mode: 'sharded', record_count: records.length, records: [] }, null, 2)}\n`,
      'utf8',
    );
  } else {
    writeFileSync(join(ROOT, 'data', 'xref-map.json'), `${JSON.stringify({ ...xrefPayload, xref_mode: 'monolithic' }, null, 2)}\n`, 'utf8');
    writeFileSync(
      join(ROOT, 'data', 'search-index.json'),
      `${JSON.stringify({ schema_version: '1.0', snapshot_date: SNAPSHOT_DATE, entries: searchIndex }, null, 2)}\n`,
      'utf8',
    );
  }

  validateManifestTiers();
  updateManifestRecordCounts(byId, xrefMode);

  const manifest = readJson(join(ROOT, 'data', 'manifest.json'));
  const offlineRecords = pickOfflineRecords(records);
  syncOfflineSnapshot(manifest, searchIndex, offlineRecords);

  return { recordCount: records.length, xrefMode, monolithicBytes };
}

function main() {
  const result = buildXref();
  console.log(
    `Built xref: ${result.recordCount} records, mode=${result.xrefMode}, size=${result.monolithicBytes} bytes`,
  );
}

if (process.argv[1]?.includes('build-xref.mjs')) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
