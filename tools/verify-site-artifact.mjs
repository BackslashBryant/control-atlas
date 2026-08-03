#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join } from "node:path";

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] ?? "";
}

const expectedSha = argumentValue("--sha") || process.env.GITHUB_SHA || "";
if (!/^[0-9a-f]{40}$/i.test(expectedSha)) {
  throw new Error("verify-site-artifact requires a full 40-character commit SHA");
}

const path = join(process.cwd(), "dist", "site", "release.json");
const release = JSON.parse(readFileSync(path, "utf8"));
if (release.schema_version !== "1.0" || release.commit_sha !== expectedSha) {
  throw new Error(
    `Site artifact SHA mismatch: expected ${expectedSha}, found ${release.commit_sha || "missing"}`,
  );
}

console.log(`Verified site artifact for ${expectedSha}`);
