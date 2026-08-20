import assert from "node:assert/strict";
import test from "node:test";

import { TAXONOMY_CONTRACT } from "../../src/shared/taxonomy-contract.mjs";
import {
  HOME_TAG_COUNT,
  HOME_TAG_GROUPS,
} from "../../src/ui/lib/homeTagConstellation";

test("Home tag constellation is governed, bounded, and fixed in taxonomy order", () => {
  assert.equal(HOME_TAG_GROUPS.length, TAXONOMY_CONTRACT.dimensions.length);
  assert.equal(HOME_TAG_COUNT, 16);
  assert.deepEqual(
    HOME_TAG_GROUPS.map((group) => group.id),
    TAXONOMY_CONTRACT.dimensions.map((dimension) => dimension.id),
  );

  const contractIds = new Set(TAXONOMY_CONTRACT.tags.map((tag) => tag.id));
  for (const group of HOME_TAG_GROUPS) {
    assert.ok(group.tags.length >= 1 && group.tags.length <= 3, `${group.id} has a bounded selection`);
    assert.ok(group.tags.every((tag) => contractIds.has(tag.id)), `${group.id} uses governed stable IDs`);
    assert.ok(group.tags.every((tag) => tag.dimension === group.id), `${group.id} keeps dimension ownership`);
    assert.ok(group.tags.every((tag) => !("count" in tag)), `${group.id} does not expose popularity`);
  }
});

test("Home tag constellation preserves the first populated governed tags per dimension", () => {
  assert.deepEqual(
    HOME_TAG_GROUPS.map((group) => [group.id, group.tags.map((tag) => tag.id)]),
    [
      ["asset_class", ["asset.application", "asset.container", "asset.database"]],
      ["environment", ["environment.cloud"]],
      ["technology", ["technology.operating-system", "technology.active-directory", "technology.ios"]],
      ["vendor_brand", ["vendor.amazon", "vendor.apple", "vendor.cisco"]],
      ["product", ["product.microsoft-windows", "product.red-hat-enterprise-linux", "product.vmware-vsphere"]],
      ["domain", ["domain.access-control", "domain.assessment-authorization-monitoring", "domain.audit-accountability"]],
    ],
  );
});
