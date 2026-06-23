import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_MAP_WARNINGS,
  isDefaultMapVisible,
  isVisibleWithOptionalFilters,
} from "../../src/ui/graph/defaultMapFilter.ts";
import { classifySource } from "../../src/ui/graph/classifySource.ts";

const noOptionalFilters = {
  showSupportingReferences: false,
  showDraftOrLegacy: false,
  showRegistryOnly: false,
};

test("default map includes default and add-to-default dispositions", () => {
  assert.equal(isDefaultMapVisible(classifySource("fips-199")), true);
  assert.equal(isDefaultMapVisible(classifySource("fisma-44-usc-3551")), true);
});

test("default map excludes supporting, registry-only, and draft-gated sources", () => {
  assert.equal(
    isVisibleWithOptionalFilters(
      classifySource("stig-viewer-public-catalog"),
      noOptionalFilters,
    ),
    false,
  );
  assert.equal(
    isVisibleWithOptionalFilters(
      classifySource("disa-stig-downloads"),
      noOptionalFilters,
    ),
    false,
  );
  assert.equal(
    isVisibleWithOptionalFilters(
      classifySource("olir-csf-2-to-800-53-r5-2"),
      noOptionalFilters,
    ),
    false,
  );
});

test("optional filters expose only their matching source groups", () => {
  assert.equal(
    isVisibleWithOptionalFilters(classifySource("stig-viewer-public-catalog"), {
      ...noOptionalFilters,
      showSupportingReferences: true,
    }),
    true,
  );
  assert.equal(
    isVisibleWithOptionalFilters(classifySource("disa-stig-downloads"), {
      ...noOptionalFilters,
      showRegistryOnly: true,
    }),
    true,
  );
  assert.equal(
    isVisibleWithOptionalFilters(classifySource("olir-csf-2-to-800-53-r5-2"), {
      ...noOptionalFilters,
      showDraftOrLegacy: true,
    }),
    true,
  );
});

test("filter warnings use the required copy", () => {
  assert.equal(
    DEFAULT_MAP_WARNINGS.draftOrLegacy,
    "Draft and legacy sources may not represent current authoritative guidance.",
  );
  assert.equal(
    DEFAULT_MAP_WARNINGS.supportingReferences,
    "Supporting references add context but do not drive authoritative mappings.",
  );
  assert.equal(
    DEFAULT_MAP_WARNINGS.registryOnly,
    "Registry-only entries are retained for provenance and discovery, not default map navigation.",
  );
});
