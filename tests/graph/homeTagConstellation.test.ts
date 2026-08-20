import assert from "node:assert/strict";
import test from "node:test";

import librarySearchArtifact from "../../data/generated/library-search.json";

import { HOME_LIBRARY_DISCOVERY } from "../../src/ui/lib/homeTagConstellation";
import { rawTypesForKind } from "../../src/ui/lib/informationArchitecture";

const browseCounts = librarySearchArtifact.library_search.browse_counts;

test("Home Library discovery exposes six populated, canonical filter states", () => {
  assert.equal(HOME_LIBRARY_DISCOVERY.length, 6);
  assert.deepEqual(
    HOME_LIBRARY_DISCOVERY.map((item) => item.id),
    [
      "technical-rules",
      "requirements",
      "process-methods",
      "threats-defenses",
      "asset.mobile",
      "technology.operating-system",
    ],
  );

  for (const item of HOME_LIBRARY_DISCOVERY) {
    assert.ok(item.count > 0, `${item.id} resolves to records`);
    assert.ok(Boolean(item.patch.kind) !== Boolean(item.patch.tags?.length), `${item.id} owns one filter route`);
  }
});

test("Home Library discovery counts come directly from the Library browse artifact", () => {
  assert.deepEqual(
    HOME_LIBRARY_DISCOVERY.map((item) => [item.id, item.count]),
    [
      ["technical-rules", 17_021],
      ["requirements", 9_766],
      ["process-methods", 1_152],
      ["threats-defenses", 1_065],
      ["asset.mobile", 1_690],
      ["technology.operating-system", 5_694],
    ],
  );

  for (const item of HOME_LIBRARY_DISCOVERY) {
    const expected = item.patch.kind
      ? rawTypesForKind(item.patch.kind).reduce(
        (total, rawType) => total + Number(browseCounts.object_types[rawType as keyof typeof browseCounts.object_types] || 0),
        0,
      )
      : Number(browseCounts.tags[item.patch.tags?.[0] as keyof typeof browseCounts.tags] || 0);
    assert.equal(item.count, expected, item.id);
  }
});
