#!/usr/bin/env node
import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_HTML_MAX = 2 * 1024 * 1024;
const DATA_DIR_MAX = 25 * 1024 * 1024;

function dirSize(dir) {
  let total = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) total += dirSize(path);
    else total += stat.size;
  }
  return total;
}

function main() {
  const manifestPath = join(ROOT, 'data', 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const shardingEnabled = manifest.sharding_enabled === true;

  const indexSize = statSync(join(ROOT, 'index.html')).size;
  if (indexSize > INDEX_HTML_MAX) {
    throw new Error(`index.html ${indexSize} bytes exceeds ${INDEX_HTML_MAX} byte budget`);
  }

  const dataSize = dirSize(join(ROOT, 'data'));
  if (!shardingEnabled && dataSize > DATA_DIR_MAX) {
    throw new Error(
      `data/ ${dataSize} bytes exceeds ${DATA_DIR_MAX} without sharding_enabled — rebuild with sharded xref`,
    );
  }

  if (!existsSync(join(ROOT, 'data', 'search-index.json'))) {
    throw new Error('data/search-index.json missing after Phase 3 build');
  }

  const xrefPath = join(ROOT, 'data', 'xref-map.json');
  if (manifest.xref_mode === 'monolithic') {
    const xref = JSON.parse(readFileSync(xrefPath, 'utf8'));
    if (!Array.isArray(xref.records) || xref.records.length < 100) {
      throw new Error('monolithic xref-map expected substantial record count');
    }
  } else if (manifest.xref_mode === 'sharded') {
    const shardDir = join(ROOT, 'data', 'shards');
    if (!existsSync(shardDir)) throw new Error('sharded mode requires data/shards/');
    const shardFiles = readdirSync(shardDir).filter((f) => f.endsWith('.json'));
    if (shardFiles.length < 3) throw new Error('expected multiple shard files');
  }

  console.log(
    `Data size check passed: index.html=${indexSize}, data/=${dataSize}, mode=${manifest.xref_mode}`,
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
