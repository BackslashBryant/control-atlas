#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseDisaCompilationArchive } from '../tools/importers/disa-stig-adapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DISCOVERY_URL = 'https://public.cyber.mil/stigs/compilations/';
const COMMITTED_ARTIFACTS = {
  stig: join(ROOT, 'data', 'stig-rules.json'),
  srg: join(ROOT, 'data', 'srg-requirements.json'),
  relationships: join(ROOT, 'maps', 'stig-srg-to-cci.json'),
};

function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

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

export async function fetchDisaStigs(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const explicitUrl = options.compilationUrl || process.env.DISA_STIG_COMPILATION_URL || '';
  const pageResponse = await fetchImpl(DISCOVERY_URL);
  if (!pageResponse.ok) {
    throw new Error(`DISA compilation page fetch failed: ${pageResponse.status} ${DISCOVERY_URL}`);
  }
  const html = await pageResponse.text();
  const zipUrl = explicitUrl || findOfficialDisaCompilationUrl(html);
  if (!zipUrl) {
    return loadCommittedArtifacts();
  }

  const zipResponse = await fetchImpl(zipUrl);
  if (!zipResponse.ok) {
    return loadCommittedArtifacts();
  }

  const archive = new Uint8Array(await zipResponse.arrayBuffer());
  const parsed = parseDisaCompilationArchive(archive, {
    artifactUrl: zipUrl,
    sourceKeys: {
      stig: 'disa-stig-library',
      srg: 'disa-srg-library',
    },
  });

  return {
    ...parsed,
    sourceArtifact: zipUrl,
    checksum: checksum(archive),
    fallbackMode: null,
  };
}

async function main() {
  const result = await fetchDisaStigs();
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
