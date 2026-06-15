#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'site');
const REQUIRED_GENERATED_FILES = ['data/generated/library-search.json'];

const COPY_PATHS = [
  ['src/index.html', 'index.html'],
  ['src/favicon.svg', 'favicon.svg'],
  ['src/app', 'app'],
  ['src/content', 'content'],
  ['src/styles', 'styles'],
  ['data', 'data'],
  ['maps', 'maps'],
  ['lib', 'lib'],
];

function copyIntoDist(sourceRelativePath, destRelativePath) {
  const sourcePath = join(ROOT, sourceRelativePath);
  const destPath = join(DIST, destRelativePath);
  if (!existsSync(sourcePath)) {
    throw new Error(`Required build input missing: ${sourceRelativePath}`);
  }
  mkdirSync(dirname(destPath), { recursive: true });
  cpSync(sourcePath, destPath, { recursive: true });
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

for (const [sourceRelativePath, destRelativePath] of COPY_PATHS) {
  copyIntoDist(sourceRelativePath, destRelativePath);
}

for (const sourceRelativePath of REQUIRED_GENERATED_FILES) {
  if (!existsSync(join(ROOT, sourceRelativePath))) {
    throw new Error(`Required generated artifact missing: ${sourceRelativePath}`);
  }
}

console.log(`Built staged static site at ${DIST}`);
