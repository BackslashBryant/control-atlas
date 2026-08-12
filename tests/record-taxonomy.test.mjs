import test from "node:test";
import assert from "node:assert/strict";
import { taxonomyTagsForRecord } from "../src/shared/record-taxonomy.mjs";

test("taxonomy tags use explicit benchmark-title terms and retain their basis", () => {
  const tags = taxonomyTagsForRecord({
    metadata: { benchmark_title: "Microsoft Windows Server 2025 Security Technical Implementation Guide" },
  });
  assert.deepEqual(tags, [
    { id: "asset_class:server", kind: "asset_class", label: "Server", provenance: "inferred", basis: { source_field: "metadata.benchmark_title", rule: "explicit-server-term" } },
    { id: "vendor_brand:microsoft", kind: "vendor_brand", label: "Microsoft", provenance: "inferred", basis: { source_field: "metadata.benchmark_title", rule: "explicit-publisher-title-prefix" } },
  ]);
});

test("taxonomy distinguishes workstation, cloud, and Active Directory from explicit titles", () => {
  const tags = taxonomyTagsForRecord({
    metadata: { benchmark_title: "Microsoft Azure Active Directory Windows 11 Security Technical Implementation Guide" },
  });
  assert.deepEqual(tags.map((tag) => [tag.kind, tag.label]), [
    ["asset_class", "Workstation"], ["environment", "Cloud"], ["domain", "Active Directory"], ["vendor_brand", "Microsoft"],
  ]);
});

test("physical security uses the exact publisher family and ignores incidental free text", () => {
  assert.deepEqual(taxonomyTagsForRecord({ family: "Physical and Environmental Protection" }).map((tag) => tag.label), ["Physical Security"]);
  assert.deepEqual(taxonomyTagsForRecord({ description: "Guide for physical server rooms" }), []);
});
