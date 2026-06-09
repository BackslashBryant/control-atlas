#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveSourceTier } from './lib/resolve-source-tier.mjs';
import {
  parse80053Catalog,
  parse800171Catalog,
  parseCsfCatalog,
} from './lib/oscal-normalize.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = new Date().toISOString();

const TARGETS = [
  {
    manifestKey: 'nist-800-53-rev5',
    outfile: 'controls-800-53.json',
    parse: parse80053Catalog,
  },
  {
    manifestKey: 'nist-csf-2',
    outfile: 'csf-subcategories.json',
    parse: parseCsfCatalog,
  },
  {
    manifestKey: 'nist-800-171-rev3',
    outfile: 'requirements-800-171.json',
    parse: parse800171Catalog,
  },
];

function readManifest() {
  return JSON.parse(readFileSync(join(ROOT, 'data', 'manifest.json'), 'utf8'));
}

function writeManifest(manifest) {
  manifest.generated_at = SNAPSHOT;
  writeFileSync(join(ROOT, 'data', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export async function fetchOscalCatalogs() {
  const manifest = readManifest();
  const results = [];

  for (const target of TARGETS) {
    const source = manifest.sources?.[target.manifestKey];
    if (!source) throw new Error(`manifest missing ${target.manifestKey}`);

    const resolved = resolveSourceTier(source);
    console.log(`Fetching ${target.manifestKey} from ${resolved.tier}: ${resolved.url}`);

    const response = await fetch(resolved.url);
    if (!response.ok) {
      throw new Error(`${target.manifestKey} fetch failed: ${response.status} ${resolved.url}`);
    }

    const catalogJson = await response.json();
    const doc = target.parse(catalogJson, target.manifestKey);
    const outPath = join(ROOT, 'data', target.outfile);
    writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');

    source.snapshot_date = SNAPSHOT;
    source.cadence = 'nightly';
    source.record_count = doc.records.length;
    source.resolved_from = resolved.tier;
    source.source = resolved.url;

    const bytes = Buffer.byteLength(JSON.stringify(doc), 'utf8');
    results.push({ key: target.manifestKey, records: doc.records.length, bytes });
    console.log(`  wrote ${target.outfile}: ${doc.records.length} records (${bytes} bytes)`);
  }

  writeManifest(manifest);
  return results;
}

if (process.argv[1]?.includes('fetch-oscal-catalogs.mjs')) {
  fetchOscalCatalogs().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
