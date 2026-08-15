import assert from "node:assert/strict";
import test from "node:test";

import { TAXONOMY_CONTRACT } from "../../src/shared/taxonomy-contract.mjs";
import {
  HOME_TAG_COUNT,
  HOME_TAG_GROUPS,
} from "../../src/ui/lib/homeTagConstellation";

test("Home tag constellation is governed, bounded, and ordered by source-backed count", () => {
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
    assert.ok(group.tags.every((tag) => tag.count > 0), `${group.id} only shows populated tags`);
    assert.ok(group.tags.every((tag) => tag.scale >= 0 && tag.scale <= 1), `${group.id} uses a bounded scale`);
    assert.deepEqual(
      group.tags.map((tag) => tag.count),
      group.tags.map((tag) => tag.count).sort((left, right) => right - left),
      `${group.id} is count ordered`,
    );
  }
});

test("Home tag constellation preserves the highest-count governed tags per dimension", () => {
  assert.deepEqual(
    HOME_TAG_GROUPS.map((group) => [group.id, group.tags.map((tag) => tag.id)]),
    [
      ["asset_class", ["asset.server", "asset.network-device", "asset.mobile"]],
      ["environment", ["environment.cloud"]],
      ["technology", ["technology.operating-system", "technology.ios", "technology.android"]],
      ["vendor_brand", ["vendor.microsoft", "vendor.ibm", "vendor.red-hat"]],
      ["product", ["product.red-hat-enterprise-linux", "product.vmware-vsphere", "product.microsoft-windows"]],
      ["domain", ["domain.access-control", "domain.system-services-acquisition", "domain.system-communications-protection"]],
    ],
  );
});
