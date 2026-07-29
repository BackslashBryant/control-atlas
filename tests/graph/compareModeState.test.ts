import assert from "node:assert/strict";
import test from "node:test";

import {
  activateCompareMode,
  compareConfigurationReady,
  COMPARE_MODES,
  nextMissingCompareInput,
} from "../../src/ui/lib/compareModeState";
import { normalizeViewState } from "../../src/ui/lib/viewState";

test("each Compare mode has distinct required input state after one activation", () => {
  assert.equal(COMPARE_MODES.length, 5);
  for (const mode of COMPARE_MODES) {
    const state = normalizeViewState("matrix", {
      view: "matrix",
      ...activateCompareMode(mode.id),
    });
    assert.equal(state.view, "matrix");
    assert.equal(state.intent, mode.id);
    assert.equal(compareConfigurationReady(state), false);
    assert.ok(nextMissingCompareInput(state));
  }
});

test("catalog comparison requires an explicit published mapping source", () => {
  const state = normalizeViewState("matrix", {
    view: "matrix",
    ...activateCompareMode("frameworks"),
    source: "nist-800-53",
    target: "csf-2",
  });
  assert.equal(state.view, "matrix");
  assert.equal(nextMissingCompareInput(state), "mappingSource");
  assert.equal(
    compareConfigurationReady(
      { ...state, mappingSource: "nist-olir" },
      ["nist-olir"],
    ),
    true,
  );
  assert.equal(
    compareConfigurationReady(
      { ...state, mappingSource: "forged-source" },
      ["nist-olir"],
    ),
    false,
  );
});

test("item mappings require a named published structure before resolving an identifier", () => {
  const state = normalizeViewState("matrix", {
    view: "matrix",
    ...activateCompareMode("item-mapping"),
    items: "AC-2",
    mappingSource: "nist-olir",
  });
  assert.equal(nextMissingCompareInput(state, ["nist-olir"]), "source");
  assert.equal(
    compareConfigurationReady(
      { ...state, source: "nist-800-53" },
      ["nist-olir"],
    ),
    true,
  );
});
