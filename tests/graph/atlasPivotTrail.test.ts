import assert from "node:assert/strict";
import test from "node:test";

import {
  PIVOT_TRAIL_LIMIT,
  describePivotTrail,
  parsePivotTrail,
  pushPivot,
  serializePivotTrail,
  truncatePivotTrail,
  type AtlasPivotStep,
} from "../../src/ui/lib/atlasPivotTrail";
import type { AtlasSemanticProjectionArtifact } from "../../src/ui/lib/atlasGraphProjection";

function step(publicationId: string, nodeId = "", ecosystemId = "ecosystem:nist"): AtlasPivotStep {
  return { ecosystemId, publicationId, nodeId };
}

test("a crossing survives serialization unchanged", () => {
  const trail = [step("nist-800-53", "nist-800-53:AC-2")];
  assert.deepEqual(parsePivotTrail(serializePivotTrail(trail)), trail);
});

test("an empty trail encodes and decodes as nothing", () => {
  assert.equal(serializePivotTrail([]), "");
  assert.deepEqual(parsePivotTrail(""), []);
});

test("crossings accumulate oldest first", () => {
  let trail = "";
  trail = pushPivot(trail, step("nist-800-53", "nist-800-53:AC-2"));
  trail = pushPivot(trail, step("dod-zt", "dod-zt:CAP-1-1", "ecosystem:dod-cio"));
  assert.deepEqual(
    parsePivotTrail(trail).map((entry) => entry.publicationId),
    ["nist-800-53", "dod-zt"],
  );
});

test("returning to a framework already on the route truncates back to it", () => {
  // Out and back is one round trip. Appending would claim the reader visited
  // three frameworks when they visited two.
  let trail = "";
  trail = pushPivot(trail, step("nist-800-53", "nist-800-53:AC-2"));
  trail = pushPivot(trail, step("csf-2", "csf-2:PR.AA-01"));
  trail = pushPivot(trail, step("nist-800-53", "nist-800-53:IA-2"));
  assert.deepEqual(
    parsePivotTrail(trail).map((entry) => entry.publicationId),
    ["nist-800-53"],
  );
});

test("a crossing with no framework is not recorded", () => {
  assert.equal(pushPivot("", step("", "orphan")), "");
});

test("the route is capped so the URL stays usable", () => {
  let trail = "";
  for (let index = 0; index < PIVOT_TRAIL_LIMIT + 4; index += 1) {
    trail = pushPivot(trail, step(`catalog-${index}`, `catalog-${index}:1`));
  }
  const steps = parsePivotTrail(trail);
  assert.equal(steps.length, PIVOT_TRAIL_LIMIT);
  // The recent route is what the reader is still reasoning about, so the
  // oldest crossings are the ones dropped.
  assert.equal(steps.at(-1)?.publicationId, `catalog-${PIVOT_TRAIL_LIMIT + 3}`);
});

test("separators inside an id cannot corrupt the encoding", () => {
  const trail = serializePivotTrail([step("we~ird", "no|de")]);
  const parsed = parsePivotTrail(trail);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0]?.publicationId, "weird");
  assert.equal(parsed[0]?.nodeId, "node");
});

test("a malformed trail is ignored rather than throwing", () => {
  assert.deepEqual(parsePivotTrail("garbage"), []);
  assert.deepEqual(parsePivotTrail("a|b"), []);
  assert.deepEqual(
    parsePivotTrail("a|b|c~broken").map((entry) => entry.publicationId),
    ["b"],
  );
});

test("stepping back drops everything after that point", () => {
  let trail = "";
  trail = pushPivot(trail, step("nist-800-53", "nist-800-53:AC-2"));
  trail = pushPivot(trail, step("dod-zt", "dod-zt:CAP-1-1", "ecosystem:dod-cio"));
  assert.equal(truncatePivotTrail(trail, 0), "");
  assert.deepEqual(
    parsePivotTrail(truncatePivotTrail(trail, 1)).map((entry) => entry.publicationId),
    ["nist-800-53"],
  );
});

test("a described crossing carries the spoken framework name and the record left behind", () => {
  const artifact = {
    publications: { "nist-800-53": { label: "SP 800-53 Rev. 5 Catalog" } },
    record_locations: { "nist-800-53:AC-2": { label: "AC-2 — Account Management" } },
  } as unknown as AtlasSemanticProjectionArtifact;
  const [described] = describePivotTrail(
    serializePivotTrail([step("nist-800-53", "nist-800-53:AC-2")]),
    artifact,
  );
  assert.equal(described?.label, "800-53");
  assert.equal(described?.recordLabel, "AC-2 — Account Management");
});

test("a crossing describes itself without an artifact", () => {
  const [described] = describePivotTrail(
    serializePivotTrail([step("csf-2", "csf-2:PR.AA-01")]),
    null,
  );
  assert.equal(described?.label, "CSF 2.0");
  assert.equal(described?.recordLabel, "");
});
