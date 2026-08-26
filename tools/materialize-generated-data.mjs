#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  linkSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(ROOT, process.argv[2] || 'dist/site/data/generated');
const destination = resolve(ROOT, 'data/generated');

if (!existsSync(source)) {
  throw new Error(`Generated-data artifact is missing: ${relative(ROOT, source)}`);
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });

let files = 0;
function materialize(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const sourcePath = join(directory, entry.name);
    const relativePath = relative(source, sourcePath);
    const destinationPath = join(destination, relativePath);
    if (entry.isDirectory()) {
      mkdirSync(destinationPath, { recursive: true });
      materialize(sourcePath);
      continue;
    }
    if (!entry.isFile() || entry.name.endsWith('.gz')) continue;
    mkdirSync(dirname(destinationPath), { recursive: true });
    try {
      linkSync(sourcePath, destinationPath);
    } catch {
      copyFileSync(sourcePath, destinationPath);
    }
    files += 1;
  }
}

materialize(source);
console.log(`Materialized ${files} generated-data files from ${relative(ROOT, source)}.`);
