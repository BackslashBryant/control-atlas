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

const DL_BASE = 'https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/';

function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

export function findOfficialDisaCompilationUrl(html) {
  const matches = [...String(html).matchAll(/https:\/\/dl\.dod\.cyber\.mil\/[^"' ]+\.zip/gi)]
    .map((match) => match[0])
    .filter((url) => /U_.*STIG.*Library.*\.zip$/i || /U_.*\.zip$/i.test(url))
    .sort();
  return matches[0] || null;
}

export function extractDisaZipUrlsFromHtml(html) {
  const matches = [...String(html).matchAll(/href=["'](https:\/\/dl\.dod\.cyber\.mil\/wp-content\/uploads\/stigs\/zip\/[^"']+\.zip)["']/gi)]
    .map((match) => match[1]);
  return [...new Set(matches)];
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadCommittedArtifacts() {
  const stigData = readJson(COMMITTED_ARTIFACTS.stig);
  const srgData = readJson(COMMITTED_ARTIFACTS.srg);
  const relData = readJson(COMMITTED_ARTIFACTS.relationships);
  return {
    stig: stigData,
    srg: srgData,
    relationships: relData,
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
