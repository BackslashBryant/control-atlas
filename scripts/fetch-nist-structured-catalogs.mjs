#!/usr/bin/env node
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import { writeJsonAtomically } from './lib/write-json-atomically.mjs';
import {
  nistStructuredSha256,
  parseNistIoTRequirementWorkbooks,
  parseNistMobileThreatCatalogue,
} from '../tools/importers/nist-structured-catalog-adapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'data', 'curated', 'nist-structured-catalogs');
const MANIFEST = join(OUTPUT, 'source-manifest.json');
const SOURCES = {
  iot_sp80053: {
    source_key: 'nist-iot-requirements-80053-mapping-draft',
    url: 'https://pages.nist.gov/IoT-Device-Cybersecurity-Requirement-Catalogs/InformativeReferences/files/DRAFT_NIST_IoT_Device_Cybersecurity_Requirements_Catalog_to_800-53.xlsx',
    format: 'xlsx',
    mapping_kind: 'sp_800_53',
  },
  iot_csf: {
    source_key: 'nist-iot-requirements-csf11-mapping-draft',
    url: 'https://pages.nist.gov/IoT-Device-Cybersecurity-Requirement-Catalogs/InformativeReferences/files/DRAFT_NIST_IoT_Device_Cybersecurity_Requirements_Catalog_to_Cybersecurity_Framework.xlsx',
    format: 'xlsx',
    mapping_kind: 'csf_1_1',
  },
  mtc_json: {
    source_key: 'nist-mobile-threat-catalogue',
    url: 'https://pages.nist.gov/mobile-threat-catalogue/mtc-data.json',
    format: 'json',
  },
  mtc_csv: {
    source_key: 'nist-mobile-threat-catalogue-cve-list',
    url: 'https://pages.nist.gov/mobile-threat-catalogue/mtc-cve-list.csv',
    format: 'csv',
  },
};

async function fetchBytes(source) {
  const response = await fetch(source.url, {
    headers: { 'User-Agent': 'Control-Atlas-source-integrity' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`${source.source_key} fetch failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function priorRetrievedAt(sourceKey, checksum) {
  try {
    const prior = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    return prior.sources.find((entry) => entry.source_key === sourceKey && entry.sha256 === checksum)?.retrieved_at || null;
  } catch {
    return null;
  }
}

async function main() {
  mkdirSync(OUTPUT, { recursive: true });
  const downloaded = {};
  const manifestSources = [];
  for (const [key, source] of Object.entries(SOURCES)) {
    const bytes = await fetchBytes(source);
    downloaded[key] = bytes;
    const checksum = nistStructuredSha256(bytes);
    manifestSources.push({
      ...source,
      sha256: checksum,
      byte_length: bytes.length,
      retrieved_at: priorRetrievedAt(source.source_key, checksum) || new Date().toISOString(),
    });
  }
  const iot = await parseNistIoTRequirementWorkbooks(
    downloaded.iot_sp80053,
    downloaded.iot_csf,
    { sp80053: SOURCES.iot_sp80053, csf: SOURCES.iot_csf },
  );
  const mobile = parseNistMobileThreatCatalogue(
    downloaded.mtc_json,
    downloaded.mtc_csv,
    { json: SOURCES.mtc_json, csv: SOURCES.mtc_csv },
  );
  writeJsonAtomically(join(OUTPUT, 'iot-requirements.json'), { schema_version: '1.0', records: iot.records });
  writeJsonAtomically(join(OUTPUT, 'mobile-threats.json'), { schema_version: '1.0', records: mobile.records });
  writeJsonAtomically(MANIFEST, {
    schema_version: '1.0',
    sources: manifestSources,
    reconciliation: { iot: iot.reconciliation, mobile_threats: mobile.reconciliation },
  });
  console.log(JSON.stringify({ iot: iot.reconciliation, mobile_threats: mobile.reconciliation }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
