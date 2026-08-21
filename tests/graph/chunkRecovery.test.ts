import assert from "node:assert/strict";
import test from "node:test";

import {
  CHUNK_RELOAD_COOLDOWN_MS,
  CHUNK_RELOAD_KEY,
  claimChunkReload,
  isChunkLoadFailure,
  type ReloadClock,
} from "../../src/ui/lib/chunkRecovery";

function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    read: () => Object.fromEntries(map),
  };
}

function clockAt(at: number, storage: ReloadClock["storage"]): ReloadClock {
  return { now: () => at, storage };
}

test("a failed dynamic import is recognised however the browser words it", () => {
  for (const message of [
    "Failed to fetch dynamically imported module: https://example.test/assets/Page-a1b2.js",
    "error loading dynamically imported module",
    "Importing a module script failed.",
  ]) {
    assert.equal(isChunkLoadFailure(new Error(message)), true, message);
  }

  const named = Object.assign(new Error("boom"), { name: "ChunkLoadError" });
  assert.equal(isChunkLoadFailure(named), true, "webpack-style ChunkLoadError");
});

test("ordinary route failures are not treated as stale chunks", () => {
  // Reloading on these would throw away the page instead of letting the error
  // surface offer a retry, and a data outage would become a reload loop.
  for (const message of [
    "The requested data took too long to load.",
    "Resources did not load.",
    "Cannot read properties of undefined",
  ]) {
    assert.equal(isChunkLoadFailure(new Error(message)), false, message);
  }
  assert.equal(isChunkLoadFailure(undefined), false);
  assert.equal(isChunkLoadFailure(null), false);
});

test("a reload is claimed once and then withheld for the cooldown", () => {
  const storage = memoryStorage();
  assert.equal(claimChunkReload(clockAt(1_000_000, storage)), true, "first failure reloads");
  assert.equal(storage.read()[CHUNK_RELOAD_KEY], "1000000", "the attempt is recorded");

  assert.equal(
    claimChunkReload(clockAt(1_000_000 + CHUNK_RELOAD_COOLDOWN_MS - 1, storage)),
    false,
    "a chunk that is genuinely gone must not reload in a loop",
  );
});

test("a later deploy in the same session still recovers", () => {
  const storage = memoryStorage({ [CHUNK_RELOAD_KEY]: "1000000" });
  assert.equal(
    claimChunkReload(clockAt(1_000_000 + CHUNK_RELOAD_COOLDOWN_MS, storage)),
    true,
    "once the cooldown passes the next stale deploy is recoverable",
  );
});

test("without storage the error surfaces rather than risking a reload loop", () => {
  assert.equal(claimChunkReload({ now: () => 1, storage: null }), false);

  const throwing = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  assert.equal(claimChunkReload({ now: () => 1, storage: throwing }), false);
});
