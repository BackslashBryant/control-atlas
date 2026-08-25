import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildAtlasBrandSignals,
  countLibraryTaxonomyTags,
  deriveAtlasScopeMetrics,
} from "../../src/shared/brand-signals.mjs";
import { createBrandSignalPicker } from "../../src/shared/brand-rotation";

function generated(name: string) {
  return JSON.parse(readFileSync(`data/generated/${name}`, "utf8"));
}

const librarySearchIndex = generated("library-search-index.json");
const connectionInventory = generated("connection-inventory.json");
const publicationIdentityIndex = generated("publication-identity-index.json");
const shards = librarySearchIndex.sharded_collection.shards.map(({ path }: { path: string }) =>
  generated(path),
);
const tagCounts = countLibraryTaxonomyTags(librarySearchIndex, shards);

function currentSignals(capabilities = {
  search: true,
  sources: true,
  compare: true,
  guides: true,
  connections: true,
}) {
  return buildAtlasBrandSignals({
    publicationIdentityIndex,
    tagCounts,
    capabilities,
  });
}

test("scope metrics are exact, corpus-wide, and cross-checked", () => {
  const metrics = deriveAtlasScopeMetrics({
    librarySearchIndex,
    connectionInventory,
    publicationIdentityIndex,
  });

  assert.equal(metrics.records, librarySearchIndex.library_search_index.document_count);
  assert.equal(metrics.connections, connectionInventory.connection_inventory.publishedLinks);
  assert.equal(metrics.publications, publicationIdentityIndex.identities.length);
  assert.match(metrics.compact.records, /^\d+K\+$/);
  assert.match(metrics.compact.connections, /^\d+K\+$/);
});

test("invalid or disagreeing metric inputs fail instead of displaying zero", () => {
  assert.throws(
    () => deriveAtlasScopeMetrics({
      librarySearchIndex: {
        library_search_index: { document_count: 3 },
        sharded_collection: { record_count: 2 },
      },
      connectionInventory,
      publicationIdentityIndex,
    }),
    /record counts disagree/,
  );
  assert.throws(
    () => deriveAtlasScopeMetrics({
      librarySearchIndex,
      connectionInventory: { connection_inventory: { publishedLinks: 0 } },
      publicationIdentityIndex,
    }),
    /connections must be a positive integer/,
  );
});

test("brand signals are eligible, deterministic, deduplicated, and non-navigational", () => {
  const signals = currentSignals();
  assert.ok(signals.length > 10);
  assert.deepEqual(signals, currentSignals());
  assert.equal(new Set(signals.map(({ label }: { label: string }) => label.toLowerCase())).size, signals.length);

  for (const signal of signals) {
    assert.ok(signal.count > 0, `${signal.label} has no current coverage`);
    assert.ok(signal.splashEligible);
    assert.ok(["source", "content", "topic", "action"].includes(signal.category));
    assert.equal("route" in signal, false);
    assert.equal("destination" in signal, false);
    assert.equal("surface" in signal, false);
    assert.equal("keyboard" in signal, false);
  }
});

test("zero-coverage topics and unavailable practitioner actions are excluded", () => {
  const withoutCapabilities = currentSignals({
    search: false,
    sources: false,
    compare: false,
    guides: false,
    connections: false,
  });
  assert.equal(withoutCapabilities.some(({ category }: { category: string }) => category === "action"), false);

  const withoutTopics = buildAtlasBrandSignals({
    publicationIdentityIndex,
    tagCounts: new Map(),
    capabilities: { search: true },
  });
  assert.equal(withoutTopics.some(({ category }: { category: string }) => category === "topic"), false);
});

test("random rotation exhausts a shuffled signal bag before repeating", () => {
  const signals = currentSignals().slice(0, 6);
  const pickSignal = createBrandSignalPicker(signals, () => 0);
  const firstCycle = signals.map(() => pickSignal());
  const firstCycleIds = firstCycle.map(({ id }) => id);

  assert.equal(new Set(firstCycleIds).size, signals.length);
  assert.deepEqual(new Set(firstCycleIds), new Set(signals.map(({ id }) => id)));

  const secondCycleFirst = pickSignal();
  assert.notEqual(secondCycleFirst.id, firstCycle.at(-1)?.id);
});
