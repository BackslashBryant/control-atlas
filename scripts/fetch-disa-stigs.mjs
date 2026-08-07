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

// spec §6: the compilation URL is discovered from the real DL_BASE directory
// index (an Apache-style listing — public.cyber.mil/stigs/downloads/ itself
// is JS-rendered and exposes no static zip links from this environment),
// filtered to "*Library*.zip" entries and sorted by the embedded month name
// + year rather than plain alphabetical sort (which would pick a 2020 file
// over a 2026 one — "2" < "A" in ASCII).
const MONTH_ORDER = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};
function compilationSortKey(filename) {
  const match = filename.match(/Library_(?:(\d{4})_(\d{2})|([A-Za-z]+)_(\d{4}))/);
  if (!match) return [0, 0];
  if (match[1]) return [Number(match[1]), Number(match[2])];
  const month = MONTH_ORDER[match[3].toLowerCase()] || 0;
  return [Number(match[4]), month];
}
export function findLatestDisaLibraryUrl(directoryHtml) {
  const files = [...String(directoryHtml).matchAll(/href=["']([^"']*Library[^"']*\.zip)["']/gi)]
    .map((match) => match[1])
    .filter((file) => !file.includes('/'));
  if (!files.length) return null;
  const [latest] = [...new Set(files)].sort((a, b) => {
    const [ay, am] = compilationSortKey(a);
    const [by, bm] = compilationSortKey(b);
    return by - ay || bm - am;
  });
  return `${DL_BASE}${latest}`;
}

function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

export function findOfficialDisaCompilationUrl(html) {
  const matches = [...String(html).matchAll(/https:\/\/dl\.dod\.cyber\.mil\/[^\s"']*\/U_[^\s"']*STIG[^\s"']*Library[^\s"']*\.zip/gi)]
    .map((match) => match[0])
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

// spec §6: discover the latest official compilation from the real
// directory index, download the exact archive, and parse it — no more
// static allowlist of individual filenames (the old DISA_ARTIFACT_MANIFEST
// this replaced was already undefined dead code, silently swallowed into a
// fallback on every run).
async function discoverAndFetchCompilation(fetchImpl) {
  const indexResponse = await fetchImpl(DL_BASE);
  if (!indexResponse.ok) {
    throw new Error(`DISA directory index fetch failed: ${indexResponse.status} ${DL_BASE}`);
  }
  const indexHtml = await indexResponse.text();
  const compilationUrl = findLatestDisaLibraryUrl(indexHtml);
  if (!compilationUrl) {
    throw new Error(`No *Library*.zip compilation found in DISA directory index (${DL_BASE})`);
  }
  const zipResponse = await fetchImpl(compilationUrl);
  if (!zipResponse.ok) {
    throw new Error(`DISA compilation fetch failed: ${zipResponse.status} ${compilationUrl}`);
  }
  const archive = new Uint8Array(await zipResponse.arrayBuffer());
  const parsed = parseDisaCompilationArchive(archive, {
    artifactUrl: compilationUrl,
    sourceKeys: { stig: 'disa-stig-library', srg: 'disa-srg-library' },
  });
  return {
    ...parsed,
    sourceArtifact: compilationUrl,
    checksum: checksum(archive),
    fallbackMode: null,
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
    return await discoverAndFetchCompilation(fetchImpl);
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
  if (result.failed?.length) {
    console.log(`${result.failed.length} archive entr${result.failed.length === 1 ? 'y' : 'ies'} failed to parse (non-benchmark XML, expected in a ~2600-entry compilation): ${result.failed.map((f) => f.entryPath).join(', ')}`);
  }
  console.log(`Wrote ${result.stig.records.length} STIG rules, ${result.srg.records.length} SRG requirements, and ${result.relationships.relationships.length} DISA CCI references`);
}

if (process.argv[1]?.includes('fetch-disa-stigs.mjs')) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
