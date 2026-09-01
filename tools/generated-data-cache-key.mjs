#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve, relative } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_JSON = "package.json";
const GENERATION_SCRIPT_ROOTS = ["build:data", "generate:data"];

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

export function discoverGenerationEntrypoints(
  scripts,
  roots = GENERATION_SCRIPT_ROOTS,
) {
  const pending = [...roots];
  const visitedScripts = new Set();
  const entrypoints = new Set();

  while (pending.length) {
    const scriptName = pending.pop();
    if (!scriptName || visitedScripts.has(scriptName)) continue;
    const command = scripts[scriptName];
    if (typeof command !== "string" || !command.trim()) {
      throw new Error(`Generated-data package script missing: ${scriptName}`);
    }
    visitedScripts.add(scriptName);

    for (const segment of command.split(/\s*&&\s*/)) {
      const npmRun = segment.match(/^npm(?:\.cmd)?\s+run\s+([^\s]+)$/);
      if (npmRun) {
        pending.push(npmRun[1]);
        continue;
      }

      const localEntrypoint = segment.match(
        /^(?:node|tsx)\s+(\.\/[\w./-]+\.(?:c?js|mjs|tsx?))$/,
      );
      if (localEntrypoint) {
        entrypoints.add(normalize(localEntrypoint[1]).replace(/^\.\//, ""));
        continue;
      }

      throw new Error(
        `Unsupported generated-data command in ${scriptName}: ${segment}`,
      );
    }
  }

  return [...entrypoints].sort();
}

function generationEntrypoints() {
  const packageJson = JSON.parse(readFileSync(resolve(ROOT, PACKAGE_JSON), "utf8"));
  return discoverGenerationEntrypoints(packageJson.scripts || {});
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
    PACKAGE_JSON,
    "package-lock.json",
    ...trackedSourceData(),
    ...localDependencies(generationEntrypoints()),
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
