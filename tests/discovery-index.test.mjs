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

test("discovery index contains governed cross-content classes", () => {
  const types = new Set(index.entries.map((e) => e.content_type));
  assert.deepEqual([...types].sort(), ["catalog", "guide", "resource", "template"]);
  assert.ok(index.counts.record > 30_000);
  assert.ok(index.counts.catalog >= 20);
  assert.equal(index.counts.guide, 1);
});

test("records retain the existing governed runtime index without duplicating its payload", () => {
  const records = index.collections.find((collection) => collection.content_type === "record");
  assert.deepEqual(records, {
    content_type: "record",
    source_artifact: "library-search",
    indexed_count: index.counts.record,
    query_owner: "runtime-library-search",
    route_template: "#/record/{catalog_id}/{item_id}",
  });
  assert.equal(index.entries.some((entry) => entry.content_type === "record"), false);
});

test("no duplicate content_ids", () => {
  const ids = index.entries.map((e) => e.content_id);
  assert.equal(ids.length, new Set(ids).size, "all content_ids should be unique");
});

test("tpl-impl-stmt has expected direct tags", () => {
  const entry = index.entries.find((e) => e.content_id === "tpl-impl-stmt");
  assert.ok(entry, "tpl-impl-stmt should be in index");
  assert.equal(entry.template_name, "implementation_statement_worksheet");
  assert.equal(entry.route, "#/build/documents/implementation_statement_worksheet");
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
    assert.ok(Array.isArray(entry.source_refs), "source_refs must be an array");
    assert.equal(typeof entry.publisher, "string", "publisher required");
    assert.equal(typeof entry.catalog_id, "string", "catalog_id required");
    assert.ok(Array.isArray(entry.direct_tags), "direct_tags must be array");
    assert.ok(Array.isArray(entry.derived_tags), "derived_tags must be array");
  }
});

test("catalogs and guides retain governed identity, provenance, and routes", () => {
  const catalog = index.entries.find((entry) => entry.content_id === "catalog:nist-800-53");
  assert.equal(catalog?.content_type, "catalog");
  assert.equal(catalog?.catalog_id, "nist-800-53");
  assert.deepEqual(catalog?.source_refs, ["nist-800-53"]);
  assert.equal(catalog?.route, "#/library/publication/nist-800-53");
  assert.ok(catalog?.direct_tags.includes("framework.rmf"));

  const guide = index.entries.find((entry) => entry.content_id === "guide:cloud-and-shared-responsibility");
  assert.deepEqual(guide?.direct_tags, ["environment.cloud"]);
  assert.deepEqual(guide?.source_refs, ["fedramp-rev5"]);
  assert.equal(guide?.route, "#/guides?pattern=cloud-and-shared-responsibility");
});

test("derived tags do not duplicate direct tags", () => {
  for (const entry of index.entries) {
    const directSet = new Set(entry.direct_tags);
    for (const dt of entry.derived_tags) {
      assert.ok(!directSet.has(dt), `${entry.content_id}: derived tag ${dt} duplicates a direct tag`);
    }
  }
});
