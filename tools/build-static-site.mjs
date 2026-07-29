#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_SEGMENT = "dist/site";
const DIST = join(ROOT, ...DIST_SEGMENT.split("/"));
const REQUIRED_GENERATED_FILES = [
  "data/generated/library-search.json",
  "data/generated/commons-search-index.json",
];

const COPY_PATHS = [
  ["data", "data"],
  ["maps", "maps"],
];
const VITE_BUILD_COMMAND = "vite build";

function copyIntoDist(sourceRelativePath, destRelativePath) {
  const sourcePath = join(ROOT, sourceRelativePath);
  const destPath = join(DIST, destRelativePath);
  if (!existsSync(sourcePath)) {
    throw new Error(`Required build input missing: ${sourceRelativePath}`);
  }
  mkdirSync(dirname(destPath), { recursive: true });
  cpSync(sourcePath, destPath, { recursive: true });
}

// Run deterministic artifact builders in-process. On Windows, repeatedly
// nesting Node through execFileSync can terminate before diagnostics are
// emitted; direct module execution preserves the same package-script owners
// and surfaces the actual exception.
const { buildFrameworkData } = await import(
  pathToFileURL(join(ROOT, "scripts/build-framework-data.mjs")).href
);
const graphResult = buildFrameworkData();
console.log(
  `Built federal graph: ${graphResult.sources} sources, ${graphResult.nodes} nodes, ${graphResult.edges} edges, ${graphResult.evidence} evidence records, ${graphResult.findings} findings`,
);
await import(pathToFileURL(join(ROOT, "scripts/build-commons-index.mjs")).href);

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
