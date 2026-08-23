import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX_PATH = join(ROOT, "data", "generated", "discovery-index.json");

function ensureIndex() {
  if (!existsSync(INDEX_PATH)) {
    execFileSync("node", ["scripts/build-discovery-index.mjs"], { cwd: ROOT, stdio: "pipe" });
  }
  return JSON.parse(readFileSync(INDEX_PATH, "utf8"));
}

const index = ensureIndex();

test("discovery index builds without errors and has entries", () => {
  assert.ok(index.schema_version, "should have schema_version");
  assert.ok(index.entries.length > 0, "should have entries");
});

test("discovery index contains both resources and templates", () => {
  const types = new Set(index.entries.map((e) => e.content_type));
  assert.ok(types.has("resource"), "should have resources");
  assert.ok(types.has("template"), "should have templates");
});

test("no duplicate content_ids", () => {
  const ids = index.entries.map((e) => e.content_id);
  assert.equal(ids.length, new Set(ids).size, "all content_ids should be unique");
});

test("tpl-impl-stmt has expected direct tags", () => {
  const entry = index.entries.find((e) => e.content_id === "tpl-impl-stmt");
  assert.ok(entry, "tpl-impl-stmt should be in index");
  assert.ok(entry.direct_tags.includes("tool.emass"), "should have tool.emass");
  assert.ok(entry.direct_tags.includes("framework.fedramp"), "should have framework.fedramp");
});

test("derived tags propagate tool → organization", () => {
  const entry = index.entries.find((e) => e.content_id === "tpl-impl-stmt");
  assert.ok(entry.derived_tags.includes("organization.disa"), "tool.emass should derive organization.disa");
  assert.ok(entry.derived_tags.includes("organization.nist"), "tool.oscal should derive organization.nist");
});

test("DISA-published resources have organization.disa", () => {
  const disaResources = index.entries.filter(
    (e) => e.content_type === "resource" && e.direct_tags.includes("organization.disa"),
  );
  assert.ok(disaResources.length > 0, "at least one resource should have organization.disa");
});

test("every entry has required shape", () => {
  for (const entry of index.entries) {
    assert.ok(entry.content_id, "content_id required");
    assert.ok(entry.content_type, "content_type required");
    assert.ok(entry.title, "title required");
    assert.ok(entry.route, "route required");
    assert.ok(Array.isArray(entry.direct_tags), "direct_tags must be array");
    assert.ok(Array.isArray(entry.derived_tags), "derived_tags must be array");
  }
});

test("derived tags do not duplicate direct tags", () => {
  for (const entry of index.entries) {
    const directSet = new Set(entry.direct_tags);
    for (const dt of entry.derived_tags) {
      assert.ok(!directSet.has(dt), `${entry.content_id}: derived tag ${dt} duplicates a direct tag`);
    }
  }
});
