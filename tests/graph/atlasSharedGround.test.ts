import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { AtlasSemanticProjectionArtifact } from "../../src/ui/lib/atlasGraphProjection";

const artifact = JSON.parse(
  readFileSync(join("data", "generated", "atlas-network.json"), "utf8"),
) as AtlasSemanticProjectionArtifact;

const catalogOf = new Map(
  artifact.frameworks.nodes.map((node) => [node.id, node.publicationId]),
);
const shared = artifact.framework_shared_ground;
const between = (a: string, b: string) =>
  shared.find((edge) => {
    const pair = [catalogOf.get(edge.source), catalogOf.get(edge.target)].sort();
    return pair[0] === [a, b].sort()[0] && pair[1] === [a, b].sort()[1];
  });

test("the two zero trust catalogs meet on the controls they both select", () => {
  // Neither NIST nor DoD published a mapping between their zero trust
  // catalogs, so a map of published crosswalks alone draws them as unrelated.
  // They select 53 of the same 800-53 controls, which is the thing a
  // practitioner is looking for and the reason this derivation exists.
  const overlap = between("dod-zt", "nist-zt");
  assert.ok(overlap, "expected shared ground between dod-zt and nist-zt");
  assert.equal(overlap!.sharedCount, 53);
  assert.deepEqual(overlap!.viaPublicationIds, ["nist-800-53"]);
});

test("a derived overlap names the records it is made of", () => {
  const overlap = between("dod-zt", "nist-zt")!;
  assert.ok(overlap.sampleNodeIds.length > 0);
  for (const id of overlap.sampleNodeIds) {
    // Every claimed record must be followable back to a published location.
    assert.ok(artifact.record_locations[id], `${id} has no published location`);
    assert.equal(artifact.record_locations[id]!.publicationId, "nist-800-53");
  }
});

test("overlap strength is measured against the narrower framework", () => {
  // 53 of NIST ZT's 71 selected controls, not 53 of 800-53's 1,216.
  const overlap = between("dod-zt", "nist-zt")!;
  assert.ok(overlap.overlapRatio > 0.7, `ratio was ${overlap.overlapRatio}`);
  assert.ok(overlap.overlapRatio <= 1);
});

test("a published crosswalk is never restated as a derived overlap", () => {
  const published = new Set(
    artifact.frameworks.edges.map((edge) =>
      [catalogOf.get(edge.source), catalogOf.get(edge.target)].sort().join("|"),
    ),
  );
  for (const edge of shared) {
    const pair = [catalogOf.get(edge.source), catalogOf.get(edge.target)].sort().join("|");
    assert.ok(!published.has(pair), `${pair} is both published and derived`);
  }
});

test("derived overlaps are kept out of the published edge set", () => {
  // The two must never be counted together: one is what a publisher stated,
  // the other is what the records happen to say.
  const ids = new Set(artifact.frameworks.edges.map((edge) => edge.id));
  for (const edge of shared) assert.ok(!ids.has(edge.id));
  assert.equal(artifact.frameworks.edges.length, 27);
});

test("coincidental single-record overlaps are not reported", () => {
  for (const edge of shared) assert.ok(edge.sharedCount >= 3);
});

test("every derived overlap joins two frameworks that are actually drawn", () => {
  const drawn = new Set(artifact.frameworks.nodes.map((node) => node.id));
  for (const edge of shared) {
    assert.ok(drawn.has(edge.source), `${edge.source} not drawn`);
    assert.ok(drawn.has(edge.target), `${edge.target} not drawn`);
    assert.notEqual(edge.source, edge.target);
  }
});

test("ATT&CK reaches the control catalogs it has no direct mapping to", () => {
  // MITRE publishes ATT&CK to D3FEND, and D3FEND carries a thin mapping into
  // 800-53; the overlap is how the threat side reaches compliance at all.
  const overlap = between("mitre-attack", "nist-800-53");
  assert.ok(overlap, "expected ATT&CK to reach 800-53 through shared records");
  assert.deepEqual(overlap!.viaPublicationIds, ["mitre-d3fend"]);
});
