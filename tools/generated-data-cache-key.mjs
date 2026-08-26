#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ENTRYPOINTS = [
  "scripts/build-taxonomy-registry.mjs",
  "scripts/build-framework-data.mjs",
  "scripts/build-commons-index.mjs",
  "scripts/build-discovery-index.mjs",
];

function normalize(path) {
  return path.replaceAll("\\", "/");
}

function trackedSourceData() {
  return execFileSync("git", ["ls-files", "-z", "data", "maps"], {
    cwd: ROOT,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean)
    .map(normalize)
    .filter((path) => !path.startsWith("data/generated/"));
}

function localDependencies(entrypoints) {
  const pending = entrypoints.map((path) => resolve(ROOT, path));
  const visited = new Set();
  const importPattern = /(?:from\s+|import\s*\(\s*)["']([^"']+)["']/g;

  while (pending.length) {
    const absolutePath = pending.pop();
    if (!absolutePath || visited.has(absolutePath)) continue;
    if (!existsSync(absolutePath)) {
      throw new Error(`Generated-data dependency missing: ${relative(ROOT, absolutePath)}`);
    }
    visited.add(absolutePath);
    const source = readFileSync(absolutePath, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1];
      if (!specifier.startsWith(".")) continue;
      let dependency = resolve(dirname(absolutePath), specifier);
      if (!extname(dependency)) dependency += ".mjs";
      const rel = normalize(relative(ROOT, dependency));
      if (rel.startsWith("data/generated/")) continue;
      pending.push(dependency);
    }
  }

  return [...visited].map((path) => normalize(relative(ROOT, path)));
}

export function generatedDataCacheInputs() {
  return [...new Set([
    "package-lock.json",
    ...trackedSourceData(),
    ...localDependencies(ENTRYPOINTS),
  ])].sort();
}

export function calculateGeneratedDataCacheKey() {
  const hash = createHash("sha256");
  for (const path of generatedDataCacheInputs()) {
    hash.update(path);
    hash.update("\0");
    hash.update(readFileSync(resolve(ROOT, path)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.stdout.write(`${calculateGeneratedDataCacheKey()}\n`);
}
