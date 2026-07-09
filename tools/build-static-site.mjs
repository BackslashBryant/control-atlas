#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_SEGMENT = "dist/site";
const DIST = join(ROOT, ...DIST_SEGMENT.split("/"));
const REQUIRED_GENERATED_FILES = [
  "data/generated/library-search-manifest.json",
];

const COPY_PATHS = [
  ["data", "data"],
  ["maps", "maps"],
  ["lib/d3.min.js", "lib/d3.min.js"],
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

console.log(`Built staged static site at ${DIST}`);
