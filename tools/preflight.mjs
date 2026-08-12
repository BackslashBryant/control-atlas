#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const canonicalDocs = [
  "docs/README.md",
  "docs/vision.md",
  "docs/PRD.md",
  "docs/DESIGN_PRINCIPLES.md",
  "docs/design/design-system.md",
  "docs/PAGE_CONTRACTS.md",
  "docs/architecture/ARCHITECTURE.md",
  "docs/DATA_POLICY.md",
  "docs/OPERATIONS.md",
  "docs/BACKLOG.md",
  "docs/THIRD_PARTY_NOTICES.md",
];

function walk(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const target = join(path, entry.name);
    return entry.isDirectory() ? walk(target) : [relative(root, target).replaceAll("\\", "/")];
  });
}

const failures = [];
for (const path of canonicalDocs) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) {
    failures.push(`missing canonical document: ${path}`);
    continue;
  }
  const text = readFileSync(absolute, "utf8");
  for (const field of ["Owner", "Status", "Last reviewed", "Supersession"]) {
    if (!text.includes(field)) failures.push(`${path}: missing ${field}`);
  }
}

const docFiles = walk(join(root, "docs"));
for (const path of docFiles) {
  if (!canonicalDocs.includes(path)) failures.push(`non-canonical document: ${path}`);
}
if (existsSync(join(root, "docs", "Plan.md"))) {
  failures.push("docs/Plan.md must be absent after a shipped initiative");
}

if (process.argv.includes("--json") || process.argv.includes("--ci")) {
  console.log(JSON.stringify({ ok: failures.length === 0, failures }, null, 2));
} else if (failures.length) {
  for (const failure of failures) console.error(`FAIL  ${failure}`);
} else {
  console.log(`PASS  documentation governance - ${canonicalDocs.length} canonical documents only`);
}

process.exit(failures.length ? 1 : 0);
