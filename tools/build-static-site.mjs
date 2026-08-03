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
  "data/generated/build-manifest.json",
  "data/generated/catalog-bootstrap.json",
  "data/generated/library-search.json",
  "data/generated/commons-search-index.json",
  "data/generated/atlas-neighborhood-manifest.json",
];

const COPY_PATHS = [
  ["data", "data"],
  ["maps", "maps"],
];
const VITE_BUILD_COMMAND = "vite build";
const reuseGenerated = process.argv.includes("--reuse-generated");

function copyIntoDist(sourceRelativePath, destRelativePath) {
  const sourcePath = join(ROOT, sourceRelativePath);
  const destPath = join(DIST, destRelativePath);
  if (!existsSync(sourcePath)) {
    throw new Error(`Required build input missing: ${sourceRelativePath}`);
  }
  mkdirSync(dirname(destPath), { recursive: true });
  cpSync(sourcePath, destPath, { recursive: true });
}

function readGeneratedArtifact(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
}

function assertGeneratedDataComplete() {
  for (const sourceRelativePath of REQUIRED_GENERATED_FILES) {
    if (!existsSync(join(ROOT, sourceRelativePath))) {
      throw new Error(`Required generated artifact missing: ${sourceRelativePath}`);
    }
  }

  const catalogBootstrap = readGeneratedArtifact(
    "data/generated/catalog-bootstrap.json",
  ).catalog_bootstrap;
  for (const catalog of catalogBootstrap?.catalogs ?? []) {
    const path = `data/generated/catalog-records/${catalog.id}.json`;
    if (!existsSync(join(ROOT, path))) {
      throw new Error(`Generated data cache is incomplete: ${path}`);
    }
  }

  const neighborhoodManifest = readGeneratedArtifact(
    "data/generated/atlas-neighborhood-manifest.json",
  ).atlas_neighborhood_manifest;
  for (const shard of neighborhoodManifest?.shards ?? []) {
    const path = `data/generated/${shard.path}`;
    if (!existsSync(join(ROOT, path))) {
      throw new Error(`Generated data cache is incomplete: ${path}`);
    }
  }
}

if (reuseGenerated) {
  console.log("Reusing committed generated data (input scope excludes graph builders and source data).");
} else {
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
}

assertGeneratedDataComplete();

execFileSync("npx", VITE_BUILD_COMMAND.split(" "), {
  cwd: ROOT,
  stdio: "inherit",
  shell: process.platform === "win32",
});

const commitSha =
  process.env.CONTROL_ATLAS_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
writeFileSync(
  join(DIST, "release.json"),
  `${JSON.stringify({ schema_version: "1.0", commit_sha: commitSha })}\n`,
  "utf8",
);

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
