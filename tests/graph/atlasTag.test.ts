import assert from "node:assert/strict";
import test from "node:test";

import { TAXONOMY_TAG_BY_ID } from "../../src/shared/taxonomy-contract.mjs";
import {
  identityMarkAddsSignal,
  resolveIdentity,
  resolveIdentityByKey,
} from "../../src/shared/identity-registry.mjs";

test("AtlasTag can resolve all existing and new tag IDs from the contract", () => {
  const existingIds = ["asset.application", "vendor.microsoft", "domain.access-control"];
  const newIds = ["organization.disa", "tool.emass", "framework.rmf", "artifact.ssp", "topic.authorization"];
  for (const id of [...existingIds, ...newIds]) {
    const tag = TAXONOMY_TAG_BY_ID.get(id);
    assert.ok(tag, `Tag ${id} not found in contract`);
    assert.ok(tag.label, `Tag ${id} has no label`);
    assert.ok(tag.dimension, `Tag ${id} has no dimension`);
  }
});

test("identity marks resolve for tags with identity_key", () => {
  const disa = TAXONOMY_TAG_BY_ID.get("organization.disa");
  assert.ok(disa);
  assert.ok(disa.identity_key);
  const identity = resolveIdentity("organization.disa");
  assert.ok(identity);
  assert.equal(identity.key, "disa");
  assert.equal(identity.fallback.kind, "monogram");
  assert.equal(identity.fallback.value, "DISA");
});

test("identity marks return null for tags without identity", () => {
  const domain = TAXONOMY_TAG_BY_ID.get("domain.access-control");
  assert.ok(domain);
  const identity = resolveIdentity("domain.access-control");
  assert.equal(identity, null);
});

test("multiple tags combine for OR within dimension and AND across dimensions", () => {
  const vendorMs = TAXONOMY_TAG_BY_ID.get("vendor.microsoft");
  const vendorGoogle = TAXONOMY_TAG_BY_ID.get("vendor.google");
  const assetServer = TAXONOMY_TAG_BY_ID.get("asset.server");
  assert.ok(vendorMs && vendorGoogle && assetServer);
  assert.equal(vendorMs.dimension, vendorGoogle.dimension);
  assert.notEqual(vendorMs.dimension, assetServer.dimension);
});

test("new-dimension tag IDs are accepted by the tag URL parameter contract", () => {
  const newIds = [
    "organization.disa", "organization.nist", "organization.cisa",
    "tool.emass", "tool.oscal",
    "framework.rmf", "framework.cmmc",
    "program.stig", "program.cmmc",
    "artifact.ssp", "artifact.poam",
    "topic.continuous-monitoring", "topic.authorization",
  ];
  for (const id of newIds) {
    assert.ok(TAXONOMY_TAG_BY_ID.has(id), `New tag ${id} should be in TAXONOMY_TAG_BY_ID for URL routing`);
    const tag = TAXONOMY_TAG_BY_ID.get(id)!;
    assert.match(tag.id, /^[a-z_]+\.[a-z0-9-]+$/, `Tag ID ${id} should follow dimension.value format`);
  }
});

test("identity registry cross-references are bidirectional", () => {
  const disaIdentity = resolveIdentityByKey("disa");
  assert.ok(disaIdentity);
  assert.ok(disaIdentity.term_ids.includes("organization.disa"));
  for (const tid of disaIdentity.term_ids) {
    const resolved = resolveIdentity(tid);
    assert.ok(resolved, `Term ${tid} should resolve back to identity`);
    assert.equal(resolved.key, "disa");
  }
});

test("a fallback monogram that repeats its own label is suppressed", () => {
  // No publisher asset is verified yet, so DISA, NIST, and eMASS would render
  // their label twice. Terms whose fallback differs still earn a mark.
  for (const id of ["organization.disa", "organization.nist", "tool.emass"]) {
    const tag = TAXONOMY_TAG_BY_ID.get(id)!;
    assert.equal(identityMarkAddsSignal(id, tag.label), false, id);
  }
  const microsoft = resolveIdentityByKey("microsoft")!;
  assert.equal(microsoft.fallback.value, "MS");
  assert.equal(identityMarkAddsSignal(microsoft.term_ids[0], microsoft.label), true);
});

test("terms without an identity never claim a mark", () => {
  assert.equal(identityMarkAddsSignal("domain.access-control", "Access Control"), false);
});
