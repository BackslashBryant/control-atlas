#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const MAX_FILE_BYTES = 35 * 1024 * 1024;
const MAX_COMPLETE_SEARCH_GZIP_BYTES = 300_000;

function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

function checkCompleteSearchBudget() {
  const artifactPath = join("data", "generated", "library-search.json");
  if (!existsSync(artifactPath)) {
    return;
  }

  const compressedBytes = gzipSync(readFileSync(artifactPath), {
    level: 9,
  }).byteLength;
  if (compressedBytes > MAX_COMPLETE_SEARCH_GZIP_BYTES) {
    throw new Error(
      `Complete library search artifact exceeds ${MAX_COMPLETE_SEARCH_GZIP_BYTES} compressed bytes: ${compressedBytes}`,
    );
  }

  console.log(
    `Complete search budget check passed: ${compressedBytes} compressed bytes`,
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
checkCompleteSearchBudget();

console.log(
  `Data inventory check passed: ${files.length} files, ${total} bytes total`,
);
