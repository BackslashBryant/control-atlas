import assert from "node:assert/strict";
import test from "node:test";

import { readGeneratedCollection } from "../scripts/lib/generated-graph-artifacts.mjs";
import { createFederalGraphRuntime } from "../src/app/runtime.mjs";

// Loads the real, currently-generated graph (same artifacts the shipped
// Compare page reads) so these tests prove the capability contract against
// production data, not a hand-built fixture that could drift from it.
function loadRuntime() {
  const sources = readGeneratedCollection(".", "sources").sources;
  const nodes = readGeneratedCollection(".", "nodes").nodes;
  const edges = readGeneratedCollection(".", "edges").edges;
  const evidence = readGeneratedCollection(".", "evidence").evidence;
  const findings = readGeneratedCollection(".", "graph-health").findings;
  return createFederalGraphRuntime({ sources, nodes, edges, evidence, findings });
}

let runtime;
test.before(() => {
  runtime = loadRuntime();
});

test("T3.12: every catalog offered as a selectable Publication A has >=1 valid target, and every offered target yields >=1 renderable, evidenced row", () => {
  const catalogs = runtime.getCatalogs();
  const selectableSources = catalogs.filter(
    (catalog) => runtime.getConnectedCatalogs(catalog.id).length > 0,
  );
  assert.ok(
    selectableSources.length > 0,
    "at least one catalog must be selectable, or the frameworks mode has no valid configuration",
  );
  for (const source of selectableSources) {
    const targets = runtime.getConnectedCatalogs(source.id);
    assert.ok(
      targets.length > 0,
      `${source.id} is selectable as Publication A but has no valid Publication B`,
    );
    for (const target of targets) {
      const rows = runtime.buildRelationshipRows({
        source_catalog: source.id,
        target_catalog: target.id,
        include_candidates: false,
      });
      assert.ok(
        rows.rows.length > 0,
        `${source.id} -> ${target.id} is offered as a valid pair but renders zero published rows`,
      );
      // Every renderable row must resolve to at least one named, citable
      // mapping source — a row a UI cannot attribute is not a promise kept.
      for (const row of rows.rows) {
        const hasResolvableSource = (row.source_refs || []).some(
          (reference) => reference.source_id || reference.sourceId,
        );
        assert.ok(
          hasResolvableSource,
          `${source.id} -> ${target.id} row ${row.edge_id} has no resolvable mapping source`,
        );
      }
    }
  }
});

test("T3.13: SP 800-171 Rev. 3 is selectable in the frameworks mode and completes real comparisons (the T0.6 baseline dead-end does not reproduce against current data)", () => {
  const catalogs = runtime.getCatalogs();
  assert.ok(
    catalogs.some((catalog) => catalog.id === "nist-800-171"),
    "nist-800-171 must exist as a catalog",
  );
  const targets = runtime.getConnectedCatalogs("nist-800-171");
  assert.ok(
    targets.length > 0,
    "nist-800-171 must be selectable as Publication A: T0.6 documented it as a dead-end, and that must not still be true",
  );
  const targetIds = targets.map((target) => target.id).sort();
  // These three targets are the current real, evidenced crosswalks. If this
  // list ever shrinks to zero the SP 800-171 dead-end has returned; if it
  // changes shape (grows/shrinks membership) that is real data movement to
  // re-verify, not a reason to loosen this assertion to "length > 0" only.
  assert.deepEqual(targetIds, ["csf-2", "cui-policy", "nist-800-53"]);

  for (const targetId of targetIds) {
    const rows = runtime.buildRelationshipRows({
      source_catalog: "nist-800-171",
      target_catalog: targetId,
      include_candidates: false,
    });
    assert.ok(
      rows.rows.length > 0,
      `nist-800-171 -> ${targetId} must render at least one published row`,
    );
    const mappingSourceIds = new Set();
    for (const row of rows.rows) {
      for (const reference of row.source_refs || []) {
        const sourceId = reference.source_id || reference.sourceId;
        if (sourceId) mappingSourceIds.add(sourceId);
      }
    }
    assert.ok(
      mappingSourceIds.size > 0,
      `nist-800-171 -> ${targetId} must resolve to at least one named mapping source`,
    );
  }
});

test("a catalog with zero cross-catalog capability is never offered as Publication A or Publication B", () => {
  const catalogs = runtime.getCatalogs();
  const noPartnerCatalogs = catalogs.filter(
    (catalog) => runtime.getConnectedCatalogs(catalog.id).length === 0,
  );
  for (const catalog of noPartnerCatalogs) {
    for (const other of catalogs) {
      if (other.id === catalog.id) continue;
      const reachable = runtime
        .getConnectedCatalogs(other.id)
        .some((target) => target.id === catalog.id);
      assert.equal(
        reachable,
        false,
        `${catalog.id} has no outgoing valid target but is reachable as a target from ${other.id} — connection direction should be symmetric`,
      );
    }
  }
});
