#!/usr/bin/env node
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDisaCompilationArchive } from '../tools/importers/disa-stig-adapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DISCOVERY_URL = 'https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/';
const COMMITTED_ARTIFACTS = {
  stig: join(ROOT, 'data', 'stig-rules.json'),
  srg: join(ROOT, 'data', 'srg-requirements.json'),
  relationships: join(ROOT, 'maps', 'stig-srg-to-cci.json'),
  manifest: join(ROOT, 'data', 'disa-artifact-manifest.json'),
};

export async function discoverDisaArtifacts(fetchImpl) {
  const response = await fetchImpl(DISCOVERY_URL);
  if (!response.ok) throw new Error(`DISA discovery failed: ${response.status} ${DISCOVERY_URL}`);
  
  const html = await response.text();
  const matches = html.match(/<A HREF="([^"]+\.zip)">/gi) || [];
  const zips = matches.map(m => m.match(/href="([^"]+)"/i)[1]);
  
  if (!zips.length) throw new Error('No ZIP artifacts found in DISA directory.');
  return zips.map(file => `${DISCOVERY_URL}${file}`);
}

export function selectCurrentCompilation(urls) {
  const compilations = urls.filter(u => /(compilation|Library)/i.test(u) && !/sunset/i.test(u));
  if (!compilations.length) throw new Error('No current compilation ZIP found.');
  
  // Sort reverse alphabetically to get the latest year/month. e.g. U_SRG-STIG_Library_October_2025.zip vs July_2026.zip
  // Wait, alphabetical isn't chronological. Let's extract year and month to sort accurately, or just assume the most recent modified date.
  // We'll parse the filename.
  const parsed = compilations.map(url => {
    const match = url.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)_(\d{4})/i);
    let year = match ? parseInt(match[1]) : 0;
    let month = 0;
    if (match) {
      const monthStr = url.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i)[1].toLowerCase();
      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      month = months.indexOf(monthStr);
    }
    // Handle YYYY_MM format if present like 2020_01
    const match2 = url.match(/(\d{4})_(\d{2})/);
    if (match2) {
      year = parseInt(match2[1]);
      month = parseInt(match2[2]) - 1;
    }
    return { url, year, month };
  }).sort((a, b) => (b.year - a.year) || (b.month - a.month));

  return parsed[0].url;
}

import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { statSync } from 'node:fs';

export async function downloadArtifact(url, fetchImpl) {
  const tempFile = join(tmpdir(), 'disa_compilation.zip');
  console.log(`Downloading with curl to ${tempFile}...`);
  
  let success = false;
  for (let i = 0; i < 10; i++) {
    try {
      execSync(`curl.exe -skL -C - "${url}" -o "${tempFile}"`, { stdio: 'inherit' });
      success = true;
      break;
    } catch (err) {
      console.log(`Download interrupted, retrying... (attempt ${i + 1}/10)`);
    }
  }
  
  if (!success) {
    throw new Error(`Download failed permanently after retries for ${url}`);
  }
  
  const contentLength = statSync(tempFile).size;
  if (contentLength < 1000) {
    throw new Error(`Download failed or file too small: ${contentLength} bytes from ${url}`);
  }
  
  const buffer = readFileSync(tempFile);
  return { buffer, contentLength };
}

export function reconcileDisaInventory(urls, parsedResult) {
  const { inventory } = parsedResult;
  // Factual count of parsed STIGs/SRGs
  let stigRecords = 0;
  let srgRecords = 0;
  if (parsedResult.stig) stigRecords = parsedResult.stig.records.length;
  if (parsedResult.srg) srgRecords = parsedResult.srg.records.length;

  return {
    discovered_urls: urls.length,
    compilation_entries: inventory.length,
    ingested_files: inventory.filter(i => i.status === 'ingested').length,
    excluded_files: inventory.filter(i => i.status === 'excluded').length,
    failed_files: inventory.filter(i => i.status === 'failed').length,
    ignored_files: inventory.filter(i => i.status === 'ignored').length,
    stig_records_parsed: stigRecords,
    srg_records_parsed: srgRecords,
    cci_relationships: parsedResult.relationships ? parsedResult.relationships.relationships.length : 0,
    inventory_details: inventory
  };
}

export async function fetchDisaStigs(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  try {
    console.log('Discovering DISA artifacts...');
    const urls = await discoverDisaArtifacts(fetchImpl);
    console.log(`Discovered ${urls.length} ZIP URLs.`);
    const compilationUrl = selectCurrentCompilation(urls);
    console.log('Selected compilation URL:', compilationUrl);
    
    console.log('Downloading artifact...');
    const { buffer, contentLength } = await downloadArtifact(compilationUrl, fetchImpl);
    console.log(`Downloaded ${contentLength} bytes. Parsing archive...`);
    
    // Inventory, Parse, Classify stages are all handled inside the adapter's pipeline logic
    const parsed = parseDisaCompilationArchive(buffer, {
      artifactUrl: compilationUrl,
      sourceKeys: { stig: 'disa-stig-library', srg: 'disa-srg-library' },
    });
    console.log('Parsing complete. Reconciling inventory...');
    
    const reconciliation = reconcileDisaInventory(urls, parsed);
    console.log('Reconciliation complete.');
    
    const manifest = {
      discovery_source: DISCOVERY_URL,
      artifact_url: compilationUrl,
      byte_length: contentLength,
      retrieval_timestamp: new Date().toISOString(),
      checksum: parsed.checksum,
      reconciliation,
    };
    
    return {
      stig: parsed.stig,
      srg: parsed.srg,
      relationships: parsed.relationships,
      manifest,
      fallbackMode: null
    };
  } catch (error) {
    console.error('DISA fetch failed, falling back:', error.message);
    if (process.env.CONTROL_ATLAS_REQUIRE_FRESH_FETCH === '1') {
      throw error;
    }
    // Fallback
    return {
      stig: JSON.parse(readFileSync(COMMITTED_ARTIFACTS.stig, 'utf8')),
      srg: JSON.parse(readFileSync(COMMITTED_ARTIFACTS.srg, 'utf8')),
      relationships: JSON.parse(readFileSync(COMMITTED_ARTIFACTS.relationships, 'utf8')),
      manifest: JSON.parse(readFileSync(COMMITTED_ARTIFACTS.manifest, 'utf8')),
      fallbackMode: 'committed-official-snapshot'
    };
  }
}

async function main() {
  const result = await fetchDisaStigs();
  if (result.fallbackMode && process.env.CONTROL_ATLAS_REQUIRE_FRESH_FETCH === '1') {
    throw new Error(`DISA refresh required a live upstream fetch but used ${result.fallbackMode}`);
  }
  
  if (result.stig) writeFileSync(COMMITTED_ARTIFACTS.stig, `${JSON.stringify(result.stig, null, 2)}\n`, 'utf8');
  if (result.srg) writeFileSync(COMMITTED_ARTIFACTS.srg, `${JSON.stringify(result.srg, null, 2)}\n`, 'utf8');
  if (result.relationships) writeFileSync(COMMITTED_ARTIFACTS.relationships, `${JSON.stringify(result.relationships, null, 2)}\n`, 'utf8');
  if (result.manifest) writeFileSync(COMMITTED_ARTIFACTS.manifest, `${JSON.stringify(result.manifest, null, 2)}\n`, 'utf8');
  
  if (result.fallbackMode) {
    console.log(`DISA fetch fallback: ${result.fallbackMode}`);
  } else {
    console.log(`Wrote ${result.manifest.reconciliation.stig_records_parsed} STIG rules, ${result.manifest.reconciliation.srg_records_parsed} SRG requirements, and ${result.manifest.reconciliation.cci_relationships} DISA CCI references`);
  }
}

if (process.argv[1]?.includes('fetch-disa-stigs.mjs')) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
