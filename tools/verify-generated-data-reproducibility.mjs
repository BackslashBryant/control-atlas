#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  existsSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  readFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runNpmScriptSync } from './lib/process-runner.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED = join(ROOT, 'data/generated');
const ORIGINAL = join(ROOT, `data/.generated-original-${process.pid}`);
const FIRST = join(ROOT, `data/.generated-first-${process.pid}`);

function generatedFiles(directory) {
  const files = [];
  const pending = [directory];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      // Editors, sync layers, and atomic writers may expose a short-lived
      // dot-prefixed sibling while replacing a generated artifact. It is not
      // part of the published contract and must not make the digest race the
      // filesystem replacement.
      if (entry.name.startsWith('.')) continue;
      const path = join(current, entry.name);
      if (entry.isDirectory()) pending.push(path);
      else if (entry.isFile()) files.push(path);
    }
  }
  return files.sort((left, right) => relative(directory, left).localeCompare(relative(directory, right)));
}

function digest(directory) {
  const hash = createHash('sha256');
  let bytes = 0;
  const files = generatedFiles(directory);
  for (const path of files) {
    const relativePath = relative(directory, path).replaceAll('\\', '/');
    const content = readFileSync(path);
    hash.update(relativePath);
    hash.update('\0');
    hash.update(content);
    hash.update('\0');
    bytes += statSync(path).size;
  }
  return { sha256: hash.digest('hex'), files: files.length, bytes };
}

function differingPaths(leftDirectory, rightDirectory) {
  const fileHashes = (directory) => new Map(generatedFiles(directory).map((path) => {
    const relativePath = relative(directory, path).replaceAll('\\', '/');
    return [relativePath, createHash('sha256').update(readFileSync(path)).digest('hex')];
  }));
  const left = fileHashes(leftDirectory);
  const right = fileHashes(rightDirectory);
  return [...new Set([...left.keys(), ...right.keys()])]
    .filter((path) => left.get(path) !== right.get(path))
    .sort()
    .slice(0, 25);
}

function generate() {
  runNpmScriptSync('generate:data', [], {
    cwd: ROOT,
    env: process.env,
    stdio: 'inherit',
  });
  if (!existsSync(GENERATED)) throw new Error('generate:data did not create data/generated');
}

for (const path of [ORIGINAL, FIRST]) {
  if (existsSync(path)) throw new Error(`Refusing to overwrite temporary path ${path}`);
}

let originalMoved = false;
try {
  if (existsSync(GENERATED)) {
    renameSync(GENERATED, ORIGINAL);
    originalMoved = true;
  }

  generate();
  const first = digest(GENERATED);
  renameSync(GENERATED, FIRST);

  generate();
  const second = digest(GENERATED);
  if (first.sha256 !== second.sha256 || first.files !== second.files || first.bytes !== second.bytes) {
    const differences = differingPaths(FIRST, GENERATED);
    throw new Error(`Generated data is not reproducible: ${JSON.stringify({ first, second, differences })}`);
  }

  rmSync(FIRST, { recursive: true, force: true });
  if (originalMoved) rmSync(ORIGINAL, { recursive: true, force: true });
  console.log(`PASS: clean generation reproduced ${second.files} files and ${second.bytes} bytes (${second.sha256}).`);
} catch (error) {
  rmSync(GENERATED, { recursive: true, force: true });
  if (existsSync(FIRST)) rmSync(FIRST, { recursive: true, force: true });
  if (originalMoved && existsSync(ORIGINAL)) renameSync(ORIGINAL, GENERATED);
  throw error;
}
