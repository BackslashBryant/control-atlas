import assert from "node:assert/strict";
import test from "node:test";

import sources from "../../data/generated/sources.json";
import { buildSourceRegister } from "../../src/ui/lib/sourceRegister";

test("source register exposes exact identity and trust fields for the full registry", () => {
  const rows = buildSourceRegister(sources.sources);
  assert.equal(rows.length, sources.sources.length);
  for (const row of rows) {
    assert.ok(row.publication, row.id);
    assert.ok(row.publisher, row.id);
    assert.ok(row.coverage, row.id);
    assert.ok(row.version, row.id);
    assert.ok(row.currentThrough, row.id);
    assert.ok(row.status, row.id);
  }
});

test("source register applies query and facets before presentation", () => {
  const rows = buildSourceRegister(sources.sources, {
    query: "800-53",
    lifecycle: "active",
  });
  assert.ok(rows.length > 0);
  assert.ok(rows.every((row) => /800-53/i.test(
    `${row.id} ${row.publication} ${row.coverage}`,
  )));
  assert.ok(rows.every((row) => row.status === "active"));
  assert.equal(buildSourceRegister(sources.sources, { query: "not-a-source" }).length, 0);
});
