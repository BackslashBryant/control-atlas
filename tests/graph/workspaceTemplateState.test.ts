import assert from "node:assert/strict";
import test from "node:test";

import { normalizeViewState, parseViewState, serializeViewState } from "../../src/ui/lib/viewState";
import { canonicalizeHashLocation } from "../../src/ui/lib/routeIdentity";

test("Library area facets survive normalize, serialize, and parse", () => {
  const state = normalizeViewState("search", {
    view: "search",
    area: "atlas:LIMB-ASSESSMENT",
    query: "assessment",
  });

  assert.equal(state.view, "search");
  assert.equal(state.area, "atlas:LIMB-ASSESSMENT");
  const parsed = parseViewState(serializeViewState(state));
  assert.equal(parsed.view, "search");
  assert.equal(parsed.area, "atlas:LIMB-ASSESSMENT");
});

test("Resources map view survives normalize, serialize, and parse", () => {
  const state = normalizeViewState("commons", {
    view: "commons",
    query: "OSCAL",
    viewMode: "map",
  });

  assert.equal(state.view, "commons");
  assert.equal(state.viewMode, "map");
  const parsed = parseViewState(serializeViewState(state));
  assert.equal(parsed.view, "commons");
  assert.equal(parsed.viewMode, "map");
  assert.deepEqual(canonicalizeHashLocation("/resources?viewMode=map"), {
    canonicalPath: "/resources?viewMode=map",
    recoveryMessage: "",
    requiresReplace: false,
  });
});
