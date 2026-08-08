import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { readGeneratedCollection } from "../scripts/lib/generated-graph-artifacts.mjs";
import { createFederalGraphRuntime } from "../src/app/runtime.mjs";

function loadSearchRuntime() {
  const librarySearch = readGeneratedCollection(".", "library-search").library_search;

  return createFederalGraphRuntime({
    sources: [],
    nodes: [],
    edges: [],
    evidence: [],
    findings: [],
    librarySearch,
  });
}

test("checked-in novice and expert search benchmark passes", () => {
  const runtime = loadSearchRuntime();
  const benchmark = JSON.parse(
    readFileSync("tests/benchmarks/search-quality.json", "utf8"),
  );

  const failures = benchmark.queries.flatMap((fixture) => {
    const resultIds = runtime
      .searchLibrary(fixture.query)
      .slice(0, fixture.top_k)
      .map((entry) => entry.id);
    const passed =
      fixture.expected_ids.length === 0
        ? resultIds.length === 0
        : fixture.expected_ids.some((id) => resultIds.includes(id));

    return passed
      ? []
      : [{ id: fixture.id, query: fixture.query, resultIds }];
  });

  assert.deepEqual(failures, []);
});
