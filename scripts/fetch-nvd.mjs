#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const HEIMDALL_CWE_CSV =
  'https://raw.githubusercontent.com/mitre/heimdall_tools/master/lib/data/cwe-nist-mapping.csv';

/** PRD zero-state + bootstrap seeds */
const SEED_CVES = ['CVE-2023-12345', 'CVE-2024-0001'];

const SNAPSHOT = new Date().toISOString();

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const MANUAL_CWE_TO_80053 = {
  'CWE-287': ['AC-2', 'IA-2'],
  'CWE-1188': ['AC-2', 'AC-3'],
};

function parseCweCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const map = new Map();
  for (const [cwe, controls] of Object.entries(MANUAL_CWE_TO_80053)) {
    map.set(cwe, new Set(controls));
  }
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cweNum = line.match(/^(\d+),/)?.[1];
    const nistMatch = line.match(/,([A-Z]{2,3}(?:\.[A-Z]{2,3})?-\d+(?:\.\d+)?),\s*\d+,/);
    const nistId = nistMatch?.[1];
    if (!cweNum || !nistId) continue;
    const cweId = `CWE-${cweNum}`;
    const ctrl = nistId.toUpperCase();
    if (!map.has(cweId)) map.set(cweId, new Set());
    map.get(cweId).add(ctrl);
  }
  return map;
}

async function loadCweTo80053() {
  const response = await fetch(HEIMDALL_CWE_CSV);
  if (!response.ok) throw new Error(`heimdall CWE CSV fetch failed: ${response.status}`);
  return parseCweCsv(await response.text());
}

async function fetchCve(cveId, apiKey) {
  const url = `${NVD_API}?cveId=${encodeURIComponent(cveId)}`;
  const headers = { Accept: 'application/json' };
  if (apiKey) headers.apiKey = apiKey;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`NVD ${cveId}: ${response.status}`);
  const body = await response.json();
  const item = body.vulnerabilities?.[0]?.cve;
  if (!item) return null;

  const descriptions = (item.descriptions || [])
    .filter((d) => d.lang === 'en')
    .map((d) => d.value);
  const cwes = (item.weaknesses || [])
    .flatMap((w) => w.description || [])
    .map((d) => d.value)
    .filter((v) => v && v.startsWith('CWE-'));

  return {
    id: cveId,
    type: 'cve',
    framework: 'nvd',
    title: descriptions[0]?.slice(0, 120) || cveId,
    description: descriptions[0] || 'No English description in NVD response.',
    cwes: [...new Set(cwes)],
    published: item.published,
    last_modified: item.lastModified,
    source: { key: 'nist-nvd', snapshot_date: SNAPSHOT },
  };
}

export async function fetchNvdSeed(options = {}) {
  const apiKey = options.apiKey || process.env.NVD_API_KEY || '';
  const statePath = join(ROOT, 'data', 'nvd-sync-state.json');
  const state = existsSync(statePath) ? readJson(statePath) : { seeded: [], last_run: null };

  const cweMap = await loadCweTo80053();
  const records = [];
  const mapEdges = [];

  for (const cveId of SEED_CVES) {
    console.log(`Fetching NVD ${cveId}...`);
    let record;
    try {
      record = await fetchCve(cveId, apiKey);
    } catch (error) {
      console.warn(`  ${error.message} — using placeholder record`);
      record = {
        id: cveId,
        type: 'cve',
        framework: 'nvd',
        title: `Placeholder for ${cveId}`,
        description:
          'NVD fetch unavailable in this environment. Re-run refresh:data with NVD_API_KEY for live metadata.',
        cwes: cveId === 'CVE-2023-12345' ? ['CWE-287'] : ['CWE-1188'],
        source: { key: 'nist-nvd', snapshot_date: SNAPSHOT },
      };
    }
    if (!record) {
      console.warn(`  no NVD payload for ${cveId}`);
      continue;
    }
    records.push(record);

    for (const cwe of record.cwes) {
      const controls = cweMap.get(cwe);
      if (!controls) continue;
      for (const controlId of controls) {
        mapEdges.push({
          source_id: record.id,
          target_id: controlId,
          cwe,
          why: `NVD weakness ${cwe} maps to ${controlId} via MITRE heimdall_tools CWE-NIST CSV (Silver-derived).`,
        });
      }
    }

    await new Promise((r) => setTimeout(r, apiKey ? 600 : 1200));
  }

  if (!records.some((r) => r.id === 'CVE-2023-12345')) {
    records.unshift({
      id: 'CVE-2023-12345',
      type: 'cve',
      framework: 'nvd',
      title: 'PRD example CVE (placeholder)',
      description:
        'Bootstrap placeholder for PRD zero-state search when NVD has no entry for this synthetic ID.',
      cwes: ['CWE-287'],
      source: { key: 'nist-nvd', snapshot_date: SNAPSHOT },
    });
  }

  if (!records.length) {
    throw new Error('NVD fetch produced no CVE records');
  }

  writeJson(join(ROOT, 'data', 'cves.json'), {
    schema_version: '1.0',
    source_key: 'nist-nvd',
    records,
  });

  const seen = new Set();
  const relationships = [];
  for (const edge of mapEdges) {
    const key = `${edge.source_id}->${edge.target_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    relationships.push(edge);
  }

  writeJson(join(ROOT, 'maps', 'cve-to-cwe-to-800-53.json'), {
    schema_version: '1.0',
    source_key: 'nist-nvd',
    provenance: 'NVD CVE weaknesses via MITRE heimdall_tools cwe-nist-mapping.csv',
    relationships,
  });

  state.seeded = SEED_CVES;
  state.last_run = SNAPSHOT;
  writeJson(statePath, state);

  const manifest = readJson(join(ROOT, 'data', 'manifest.json'));
  const nvd = manifest.sources?.['nist-nvd'] || {
    name: 'NIST National Vulnerability Database',
    source_tier: 'gold',
    resolved_from: 'gold',
    source_urls: {
      gold: NVD_API,
      silver: 'https://nvd.nist.gov/',
      bronze: 'none',
    },
    authoritative: true,
    source_trust: 'authoritative',
    schema_version: '1.0',
    cadence: 'nightly',
    notes: 'Phase 3 seed CVE list; expand via nvd-sync-state in later runs.',
  };
  nvd.snapshot_date = SNAPSHOT;
  nvd.record_count = records.length;
  nvd.cadence = 'nightly';
  manifest.sources['nist-nvd'] = nvd;
  manifest.generated_at = SNAPSHOT;
  writeJson(join(ROOT, 'data', 'manifest.json'), manifest);

  console.log(`Wrote cves.json (${records.length} records), map (${relationships.length} edges)`);
  return { records: records.length, mapEdges: relationships.length };
}

if (process.argv[1]?.includes('fetch-nvd.mjs')) {
  fetchNvdSeed().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
