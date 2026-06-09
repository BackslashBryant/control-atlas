#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_DATA_BYTES = 80 * 1024 * 1024;

function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

const files = walk('data');
let total = 0;
for (const file of files) {
  const size = statSync(file).size;
  total += size;
  if (size > MAX_FILE_BYTES) throw new Error(`${file} exceeds 20 MiB static artifact budget`);
}
if (total > MAX_DATA_BYTES) throw new Error('data directory exceeds 80 MiB budget');

console.log(`Data size check passed: ${files.length} files, ${total} bytes`);
