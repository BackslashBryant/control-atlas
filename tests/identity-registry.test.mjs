import assert from "node:assert/strict";
import test from "node:test";

import {
  IDENTITY_REGISTRY,
  resolveIdentity,
  resolveIdentityByKey,
} from "../src/shared/identity-registry.mjs";
import { TAXONOMY_TAG_BY_ID } from "../src/shared/taxonomy-contract.mjs";

test("every identity key resolves", () => {
  for (const entry of IDENTITY_REGISTRY) {
    const found = resolveIdentityByKey(entry.key);
    assert.ok(found, `Key "${entry.key}" did not resolve`);
    assert.equal(found.key, entry.key);
  }
});

test("term_ids reference valid taxonomy terms", () => {
  for (const entry of IDENTITY_REGISTRY) {
    for (const tid of entry.term_ids) {
      assert.ok(TAXONOMY_TAG_BY_ID.has(tid), `Identity "${entry.key}" references unknown term "${tid}"`);
    }
  }
});

test("fallback present for every entry", () => {
  for (const entry of IDENTITY_REGISTRY) {
    assert.ok(entry.fallback, `Identity "${entry.key}" missing fallback`);
    assert.ok(entry.fallback.kind, `Identity "${entry.key}" fallback missing kind`);
    assert.ok(entry.fallback.value, `Identity "${entry.key}" fallback missing value`);
  }
});

test("unknown keys return null", () => {
  assert.equal(resolveIdentity("nonexistent.term"), null);
  assert.equal(resolveIdentityByKey("nonexistent-key"), null);
});

test("resolveIdentity finds entries by term ID", () => {
  const disa = resolveIdentity("organization.disa");
  assert.ok(disa);
  assert.equal(disa.key, "disa");
  assert.equal(disa.label, "DISA");

  const emass = resolveIdentity("tool.emass");
  assert.ok(emass);
  assert.equal(emass.key, "emass");
});

test("identity entries have required verification fields", () => {
  for (const entry of IDENTITY_REGISTRY) {
    assert.ok(entry.verification_status, `Identity "${entry.key}" missing verification_status`);
    assert.ok(
      entry.verification_status === "verified_official" || entry.verification_status === "fallback_only",
      `Identity "${entry.key}" has invalid verification_status: "${entry.verification_status}"`,
    );
  }
});
