#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_DATA_BYTES = 80 * 1024 * 1024;
const MAX_INITIAL_SEARCH_BYTES = 3_200_000;

function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

function checkInitialSearchBudget() {
  const manifestPath = join(
    "data",
    "generated",
    "library-search-manifest.json",
  );
  if (!existsSync(manifestPath)) {
    return;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const eagerShardIds = manifest.library_search_manifest?.eager_shard_ids || [];
  let total = statSync(manifestPath).size;
  for (const catalogId of eagerShardIds) {
    const shardPath = join(
      "data",
      "generated",
      "library-search",
      `${catalogId}.json`,
    );
    if (!existsSync(shardPath)) {
      throw new Error(`Missing eager library search shard: ${shardPath}`);
    }
    total += statSync(shardPath).size;
  }

  if (total > MAX_INITIAL_SEARCH_BYTES) {
    throw new Error(
      `Initial library search bootstrap exceeds ${MAX_INITIAL_SEARCH_BYTES} bytes: ${total}`,
    );
  }

  console.log(
    `Initial search budget check passed: ${eagerShardIds.length} eager shards, ${total} bytes`,
  );
}

const files = walk("data");
let total = 0;
for (const file of files) {
  const size = statSync(file).size;
  total += size;
  if (size > MAX_FILE_BYTES)
    throw new Error(`${file} exceeds 20 MiB static artifact budget`);
}
if (total > MAX_DATA_BYTES)
  throw new Error("data directory exceeds 80 MiB budget");

checkInitialSearchBudget();

console.log(`Data size check passed: ${files.length} files, ${total} bytes`);
