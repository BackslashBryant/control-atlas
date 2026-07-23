#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_SEGMENT = "dist/site";
const DIST = join(ROOT, ...DIST_SEGMENT.split("/"));
const REQUIRED_GENERATED_FILES = [
  "data/generated/library-search-manifest.json",
  "data/generated/commons-search-index.json",
];

const COPY_PATHS = [
  ["data", "data"],
  ["maps", "maps"],
];
const VITE_BUILD_COMMAND = "vite build";
const DATA_BUILD_COMMAND = ["./scripts/build-framework-data.mjs"];
const COMMONS_BUILD_COMMAND = ["./scripts/build-commons-index.mjs"];

function copyIntoDist(sourceRelativePath, destRelativePath) {
  const sourcePath = join(ROOT, sourceRelativePath);
  const destPath = join(DIST, destRelativePath);
  if (!existsSync(sourcePath)) {
    throw new Error(`Required build input missing: ${sourceRelativePath}`);
  }
  mkdirSync(dirname(destPath), { recursive: true });
  cpSync(sourcePath, destPath, { recursive: true });
}

execFileSync(process.execPath, DATA_BUILD_COMMAND, {
  cwd: ROOT,
  stdio: "inherit",
});

execFileSync(process.execPath, COMMONS_BUILD_COMMAND, {
  cwd: ROOT,
  stdio: "inherit",
});

for (const sourceRelativePath of REQUIRED_GENERATED_FILES) {
  if (!existsSync(join(ROOT, sourceRelativePath))) {
    throw new Error(
      `Required generated artifact missing: ${sourceRelativePath}`,
    );
  }
}

execFileSync("npx", VITE_BUILD_COMMAND.split(" "), {
  cwd: ROOT,
  stdio: "inherit",
  shell: process.platform === "win32",
});

for (const [sourceRelativePath, destRelativePath] of COPY_PATHS) {
  copyIntoDist(sourceRelativePath, destRelativePath);
}

console.log("Compressing JSON files with gzip...");
function getFiles(dir) {
  const result = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...getFiles(fullPath));
    } else {
      result.push(fullPath);
    }
  }
  return result;
}

for (const file of getFiles(DIST)) {
  if (file.endsWith(".json")) {
    const content = readFileSync(file);
    const compressed = gzipSync(content, { level: 9 });
    writeFileSync(`${file}.gz`, compressed);
  }
}

console.log(`Built staged static site at ${DIST}`);
