#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractNistPagesInventory } from './lib/nist-pages-discovery.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'data', 'nist-pages-discovery.json');
const SOURCE_URL = 'https://pages.nist.gov/pages-root/';

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'ControlAtlas-ingestion/1.0 (+https://github.com/rambulls/control-atlas)' },
  });
  if (!response.ok) throw new Error(`NIST Pages discovery failed: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const html = bytes.toString('utf8');
  const checksum = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  const entries = extractNistPagesInventory(html, SOURCE_URL);
  if (entries.length < 200) throw new Error(`NIST Pages discovery unexpectedly returned only ${entries.length} projects`);

  let retrievedAt = new Date().toISOString();
  if (existsSync(OUT)) {
    const previous = JSON.parse(readFileSync(OUT, 'utf8'));
    if (previous.source?.sha256 === checksum) retrievedAt = previous.source.retrieved_at;
  }
  const candidates = entries.filter((entry) => entry.disposition === 'candidate').length;
  const output = {
    schema_version: '1.0',
    source: {
      url: SOURCE_URL,
      retrieved_at: retrievedAt,
      byte_length: bytes.length,
      sha256: checksum,
    },
    reconciliation: {
      discovered_projects: entries.length,
      candidate_projects: candidates,
      excluded_projects: entries.length - candidates,
      classified_projects: entries.length,
    },
    entries,
  };
  const temporary = `${OUT}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  renameSync(temporary, OUT);
  console.log(`Discovered ${entries.length} NIST Pages projects (${candidates} cybersecurity/governance candidates).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
