#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseDisaCompilationArchive } from '../tools/importers/disa-stig-adapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DISCOVERY_URL = 'https://public.cyber.mil/stigs/downloads/';
const COMMITTED_ARTIFACTS = {
  stig: join(ROOT, 'data', 'stig-rules.json'),
  srg: join(ROOT, 'data', 'srg-requirements.json'),
  relationships: join(ROOT, 'maps', 'stig-srg-to-cci.json'),
};

// Product-owner-approved catalog: DISA GENERIC, technology-class STIGs/SRGs only.
// Never add vendor/product benchmarks (Microsoft, Cisco, RHEL, Kubernetes, Apache, etc.)
// Each entry is an independently-published DISA zip on dl.dod.cyber.mil (filenames verified
// against the public.cyber.mil/stigs/downloads/ document library on 2026-07-04). Some zips
// bundle more than one XCCDF benchmark (e.g. WLAN Mgmt+Platform, EVVM Policy/Session/Endpoint).
const DISA_ARTIFACT_MANIFEST = [
  { file: 'U_ASD_V6R4_STIG.zip', hintKind: 'stig', name: 'Application Security and Development STIG' },
  { file: 'U_Firewall_V3R3_SRG.zip', hintKind: 'srg', name: 'Network Firewall SRG' },
  { file: 'U_NDM_V5R4_SRG.zip', hintKind: 'srg', name: 'Network Device Management SRG' },
  { file: 'U_Network_Infrastructure_Policy_V10R7_STIG.zip', hintKind: 'stig', name: 'Network Infrastructure Policy STIG' },
  { file: 'U_Layer_2_Switch_V3R4_SRG.zip', hintKind: 'srg', name: 'Network Layer 2 Switch SRG' },
  { file: 'U_Router_V5R2_SRG.zip', hintKind: 'srg', name: 'Network Router SRG' },
  { file: 'U_Web_Server_V4R4_SRG.zip', hintKind: 'srg', name: 'Web Server SRG' },
  { file: 'U_Network_WLAN_Y23M10_STIG.zip', hintKind: 'stig', name: 'Network WLAN STIG (AP/Bridge/Controller Mgmt+Platform: covers WLAN Policy, Access Point, Controller)' },
  { file: 'U_IDPS_V3R4_SRG.zip', hintKind: 'srg', name: 'Intrusion Detection and Prevention System SRG (Wireless IDPS)' },
  { file: 'U_EVVM_Y26M01_SRG.zip', hintKind: 'srg', name: 'Enterprise Voice, Video, and Messaging SRG (covers Voice Video Services Policy, VVS Session Manager/Local Session Controller, VVS Endpoint)' },
  { file: 'U_UEM_Y25M10_SRG.zip', hintKind: 'srg', name: 'Unified Endpoint Management SRG (covers Mobile Device Management Server)' },
  { file: 'U_Application_Server_V4R4_SRG.zip', hintKind: 'srg', name: 'Application Server SRG' },
  { file: 'U_Database_V4R5_SRG.zip', hintKind: 'srg', name: 'Database SRG' },
  { file: 'U_Domain_Name_System_V4R2_SRG.zip', hintKind: 'srg', name: 'Domain Name System SRG' },
  { file: 'U_GPOS_V3R3_SRG.zip', hintKind: 'srg', name: 'General Purpose Operating System SRG' },
  { file: 'U_VPN_V3R4_SRG.zip', hintKind: 'srg', name: 'VPN SRG' },
  { file: 'U_Cloud_Computing_Y26M06_SRG.zip', hintKind: 'srg', name: 'Cloud Computing SRG (Mission Owner Network/OS)' },
  { file: 'U_Traditional_Security_Checklist_V2R8.zip', hintKind: 'stig', name: 'Traditional Security Checklist' },
  { file: 'U_MS_Windows_11_V1R6_STIG.zip', hintKind: 'stig', name: 'Microsoft Windows 11 STIG' },
  { file: 'U_RHEL_9_V1R3_STIG.zip', hintKind: 'stig', name: 'Red Hat Enterprise Linux 9 STIG' },
  { file: 'U_Oracle_Database_19c_V1R3_STIG.zip', hintKind: 'stig', name: 'Oracle Database 19c STIG' },
  { file: 'U_Kubernetes_V1R11_STIG.zip', hintKind: 'stig', name: 'Kubernetes STIG' },
];

const DL_BASE = 'https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/';

function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

// Retained for the DISA STIG/SRG compilation-zip path (single-URL bundles). Not used by the
// per-artifact manifest fetch below, but kept for callers that pass an explicit compilation URL.
export function findOfficialDisaCompilationUrl(html) {
  const matches = [...String(html).matchAll(/https:\/\/dl\.dod\.cyber\.mil\/[^"' ]+\.zip/gi)]
    .map((match) => match[0])
    .filter((url) => /U_.*STIG.*Library.*\.zip$/i.test(url))
    .sort();
  return matches[0] || null;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadCommittedArtifacts() {
  return {
    stig: readJson(COMMITTED_ARTIFACTS.stig),
    srg: readJson(COMMITTED_ARTIFACTS.srg),
    relationships: readJson(COMMITTED_ARTIFACTS.relationships),
    sourceArtifact: DISCOVERY_URL,
    checksum: checksum(
      `${readFileSync(COMMITTED_ARTIFACTS.stig, 'utf8')}\n${readFileSync(COMMITTED_ARTIFACTS.srg, 'utf8')}\n${readFileSync(COMMITTED_ARTIFACTS.relationships, 'utf8')}`,
    ),
    fallbackMode: 'committed-official-snapshot',
  };
}

async function fetchManifestArtifacts(fetchImpl) {
  const stigRecords = [];
  const srgRecords = [];
  const relationships = [];

  for (const entry of DISA_ARTIFACT_MANIFEST) {
    const url = `${DL_BASE}${entry.file}`;
    const response = await fetchImpl(url);
    if (!response.ok) {
      throw new Error(`DISA artifact fetch failed: ${response.status} ${url}`);
    }
    const archive = new Uint8Array(await response.arrayBuffer());
    const parsed = parseDisaCompilationArchive(archive, {
      artifactUrl: url,
      sourceKeys: { stig: 'disa-stig-library', srg: 'disa-srg-library' },
      hintKind: entry.hintKind,
    });
    stigRecords.push(...parsed.stig.records);
    srgRecords.push(...parsed.srg.records);
    relationships.push(...parsed.relationships.relationships);
  }

  const snapshotDate = '2026-07-04';
  return {
    stig: {
      schema_version: '2.0',
      source_key: 'disa-stig-library',
      source_artifact: DISCOVERY_URL,
      source_version: 'multiple (see per-record source.version)',
      snapshot_date: snapshotDate,
      checksum: checksum(JSON.stringify(stigRecords)),
      records: stigRecords,
    },
    srg: {
      schema_version: '2.0',
      source_key: 'disa-srg-library',
      source_artifact: DISCOVERY_URL,
      source_version: 'multiple (see per-record source.version)',
      snapshot_date: snapshotDate,
      checksum: checksum(JSON.stringify(srgRecords)),
      records: srgRecords,
    },
    relationships: {
      schema_version: '2.0',
      source_key: 'disa-stig-srg-cci-references',
      source_artifact: DISCOVERY_URL,
      source_version: 'multiple (see per-relationship source_locator)',
      snapshot_date: snapshotDate,
      checksum: checksum(JSON.stringify(relationships)),
      provenance: 'Official DISA public STIG and SRG references to CCIs',
      relationships,
    },
  };
}

export async function fetchDisaStigs(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const explicitUrl = options.compilationUrl || process.env.DISA_STIG_COMPILATION_URL || '';

  if (explicitUrl) {
    const zipResponse = await fetchImpl(explicitUrl);
    if (!zipResponse.ok) {
      return loadCommittedArtifacts();
    }
    const archive = new Uint8Array(await zipResponse.arrayBuffer());
    const parsed = parseDisaCompilationArchive(archive, {
      artifactUrl: explicitUrl,
      sourceKeys: {
        stig: 'disa-stig-library',
        srg: 'disa-srg-library',
      },
    });
    return {
      ...parsed,
      sourceArtifact: explicitUrl,
      checksum: checksum(archive),
      fallbackMode: null,
    };
  }

  try {
    const parsed = await fetchManifestArtifacts(fetchImpl);
    return {
      ...parsed,
      sourceArtifact: DISCOVERY_URL,
      checksum: checksum(
        `${JSON.stringify(parsed.stig)}\n${JSON.stringify(parsed.srg)}\n${JSON.stringify(parsed.relationships)}`,
      ),
      fallbackMode: null,
    };
  } catch {
    return loadCommittedArtifacts();
  }
}

async function main() {
  const result = await fetchDisaStigs();
  if (result.fallbackMode && process.env.CONTROL_ATLAS_REQUIRE_FRESH_FETCH === '1') {
    throw new Error(`DISA refresh required a live upstream fetch but used ${result.fallbackMode}`);
  }
  writeFileSync(join(ROOT, 'data', 'stig-rules.json'), `${JSON.stringify(result.stig, null, 2)}\n`, 'utf8');
  writeFileSync(join(ROOT, 'data', 'srg-requirements.json'), `${JSON.stringify(result.srg, null, 2)}\n`, 'utf8');
  writeFileSync(join(ROOT, 'maps', 'stig-srg-to-cci.json'), `${JSON.stringify(result.relationships, null, 2)}\n`, 'utf8');
  if (result.fallbackMode) {
    console.log(`DISA fetch fallback: ${result.fallbackMode}`);
  }
  console.log(`Wrote ${result.stig.records.length} STIG rules, ${result.srg.records.length} SRG requirements, and ${result.relationships.relationships.length} DISA CCI references`);
}

if (process.argv[1]?.includes('fetch-disa-stigs.mjs')) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
