import { readFileSync } from "node:fs";

import { createFederalGraphRuntime } from "../../src/app/runtime.mjs";

const manifest = JSON.parse(
  readFileSync("data/generated/library-search-manifest.json", "utf8"),
).library_search_manifest;
const shards = manifest.shards.map((entry) =>
  JSON.parse(
    readFileSync(`data/generated/${entry.path}`, "utf8"),
  ).library_search_shard,
);
const benchmark = JSON.parse(
  readFileSync("tests/benchmarks/search-quality.json", "utf8"),
);
const runtime = createFederalGraphRuntime({
  sources: [],
  nodes: [],
  edges: [],
  evidence: [],
  findings: [],
  librarySearchShards: shards,
});

const startedAt = performance.now();
const results = benchmark.queries.map((fixture) => {
  const queryStartedAt = performance.now();
  const matches = runtime.searchLibrary(fixture.query).slice(0, fixture.top_k);
  const ids = matches.map((entry) => entry.id);
  const passed = fixture.expected_ids.length === 0
    ? ids.length === 0
    : fixture.expected_ids.some((id) => ids.includes(id));
  return {
    ...fixture,
    passed,
    result_ids: ids,
    elapsed_ms: Number((performance.now() - queryStartedAt).toFixed(2)),
  };
});

const byAudience = Object.fromEntries(
  ["expert", "novice"].map((audience) => {
    const relevant = results.filter((result) => result.audience === audience);
    return [
      audience,
      {
        passed: relevant.filter((result) => result.passed).length,
        total: relevant.length,
        pass_rate: relevant.length
          ? Number(
              (
                relevant.filter((result) => result.passed).length /
                relevant.length
              ).toFixed(3),
            )
          : 0,
      },
    ];
  }),
);

process.stdout.write(
  `${JSON.stringify(
    {
      engine: "current-minisearch",
      corpus_documents: shards.reduce(
        (total, shard) => total + shard.documents.length,
        0,
      ),
      elapsed_ms: Number((performance.now() - startedAt).toFixed(2)),
      summary: byAudience,
      results,
    },
    null,
    2,
  )}\n`,
);
