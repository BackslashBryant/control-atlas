import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCatalogCoverageList,
  catalogCoverageMessage,
} from "../../src/ui/lib/catalogCoverage";

test("coverage uses actual cross-catalog mapping counts, not general connectivity", () => {
  const [coverage] = buildCatalogCoverageList([
    {
      id: "nist-ai-rmf",
      name: "AI RMF",
      node_count: 92,
      connected_count: 92,
      cross_catalog_connected_count: 0,
    },
  ]);

  assert.equal(coverage.connected, 0);
  assert.equal(coverage.pct, 0);
});

test("coverage suppresses a stale bootstrap entry instead of inventing zero percent", () => {
  assert.deepEqual(
    buildCatalogCoverageList([
      {
        id: "stale",
        name: "Stale catalog",
        node_count: 10,
      } as never,
    ]),
    [],
  );
});

test("unmapped publications explain the gap according to mandate evidence", () => {
  assert.equal(
    catalogCoverageMessage({
      id: "nist-ai-rmf",
      name: "AI RMF",
      total: 92,
      connected: 0,
      pct: 0,
      mandate: "issued_without_federal_mandate",
      mandateNote: "NIST publishes this framework for voluntary use.",
    }),
    "Issued without a federal mandate — no crosswalk is published. NIST publishes this framework for voluntary use.",
  );
  assert.equal(
    catalogCoverageMessage({
      id: "nist-800-171",
      name: "SP 800-171",
      total: 110,
      connected: 0,
      pct: 0,
      mandate: "contractual",
    }),
    "",
  );
});

test("thin mandated publications report the absence of published mappings", () => {
  assert.equal(
    catalogCoverageMessage({
      id: "cui-policy",
      name: "CUI Program",
      total: 128,
      connected: 2,
      pct: 2,
      mandate: "statutory",
    }),
    "",
  );
  assert.equal(
    catalogCoverageMessage({
      id: "dod-zt",
      name: "DoD Zero Trust Strategy",
      total: 53,
      connected: 0,
      pct: 0,
      mandate: "federal_policy_or_regulatory_mandate",
    }),
    "",
  );
});
