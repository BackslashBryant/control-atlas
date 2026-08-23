import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  TAXONOMY_CONTRACT,
  TAXONOMY_TAGS,
  TAXONOMY_TAG_BY_ID,
  taxonomyTagMatchesQuery,
} from "../src/shared/taxonomy-contract.mjs";

const ORIGINAL_IDS = [
  "asset.application", "asset.container", "asset.database",
  "asset.identity-system", "asset.iot", "asset.mobile",
  "asset.network-device", "asset.physical-security", "asset.server",
  "asset.virtualization", "asset.workstation",
  "environment.cloud",
  "technology.operating-system", "technology.active-directory",
  "technology.ios", "technology.android",
  "vendor.amazon", "vendor.apple", "vendor.cisco", "vendor.google",
  "vendor.ibm", "vendor.juniper", "vendor.microsoft", "vendor.oracle",
  "vendor.red-hat", "vendor.vmware",
  "product.microsoft-windows", "product.red-hat-enterprise-linux",
  "product.vmware-vsphere",
  "domain.access-control", "domain.assessment-authorization-monitoring",
  "domain.audit-accountability", "domain.awareness-training",
  "domain.configuration-management", "domain.contingency-planning",
  "domain.identification-authentication", "domain.incident-response",
  "domain.maintenance", "domain.media-protection",
  "domain.pii-processing-transparency", "domain.personnel-security",
  "domain.physical-security", "domain.planning",
  "domain.program-management", "domain.risk-assessment",
  "domain.security-assessment", "domain.security-assessment-monitoring",
  "domain.supply-chain-risk-management",
  "domain.system-communications-protection",
  "domain.system-information-integrity",
  "domain.system-services-acquisition",
];

test("all 52 original tag IDs are present and unchanged", () => {
  assert.equal(ORIGINAL_IDS.length, 51);
  for (const id of ORIGINAL_IDS) {
    assert.ok(TAXONOMY_TAG_BY_ID.has(id), `Missing original tag: ${id}`);
  }
});

test("new dimension terms are valid", () => {
  const newDimensions = ["organization", "tool", "framework", "program", "artifact", "topic"];
  for (const dim of newDimensions) {
    const tags = TAXONOMY_TAGS.filter((t) => t.dimension === dim);
    assert.ok(tags.length > 0, `No tags in dimension: ${dim}`);
    for (const tag of tags) {
      assert.ok(tag.id.startsWith(`${dim}.`), `Tag ${tag.id} doesn't match dimension ${dim}`);
      assert.ok(tag.label, `Tag ${tag.id} missing label`);
      assert.ok(Array.isArray(tag.aliases), `Tag ${tag.id} missing aliases array`);
      assert.equal(tag.validation_state, "approved");
    }
  }
});

test("generated registry matches curated input counts", () => {
  const registry = JSON.parse(readFileSync("data/generated/taxonomy-registry.json", "utf8"));
  const terms = JSON.parse(readFileSync("data/curated/taxonomy-terms.json", "utf8"));
  const relationships = JSON.parse(readFileSync("data/curated/taxonomy-relationships.json", "utf8"));

  assert.equal(registry.terms.length, terms.terms.length);
  assert.equal(registry.dimensions.length, terms.dimensions.length);
  assert.equal(registry.relationships.length, relationships.relationships.length);
});

test("TAXONOMY_TAG_BY_ID lookups work for old and new tags", () => {
  assert.ok(TAXONOMY_TAG_BY_ID.get("asset.application"));
  assert.ok(TAXONOMY_TAG_BY_ID.get("organization.disa"));
  assert.ok(TAXONOMY_TAG_BY_ID.get("tool.emass"));
  assert.ok(TAXONOMY_TAG_BY_ID.get("framework.rmf"));
  assert.ok(TAXONOMY_TAG_BY_ID.get("artifact.ssp"));
  assert.ok(TAXONOMY_TAG_BY_ID.get("topic.authorization"));
  assert.equal(TAXONOMY_TAG_BY_ID.get("nonexistent.tag"), undefined);
});

test("taxonomyTagMatchesQuery works for new terms and aliases", () => {
  const disa = TAXONOMY_TAG_BY_ID.get("organization.disa");
  assert.ok(taxonomyTagMatchesQuery(disa, "disa"));
  assert.ok(taxonomyTagMatchesQuery(disa, "Defense Information Systems Agency"));
  assert.ok(!taxonomyTagMatchesQuery(disa, "nist"));

  const emass = TAXONOMY_TAG_BY_ID.get("tool.emass");
  assert.ok(taxonomyTagMatchesQuery(emass, "emass"));
  assert.ok(taxonomyTagMatchesQuery(emass, "Enterprise Mission Assurance"));
});

test("relationships reference valid endpoints", () => {
  const registry = JSON.parse(readFileSync("data/generated/taxonomy-registry.json", "utf8"));
  const termIds = new Set(registry.terms.map((t) => t.id));
  for (const rel of registry.relationships) {
    assert.ok(termIds.has(rel.from), `Relationship from unknown term: ${rel.from}`);
    assert.ok(termIds.has(rel.to), `Relationship to unknown term: ${rel.to}`);
    assert.ok(rel.relationship, `Relationship type missing for ${rel.from} → ${rel.to}`);
  }
});

test("contract dimensions include all 12 expected dimensions", () => {
  const dimIds = TAXONOMY_CONTRACT.dimensions.map((d) => d.id);
  const expected = [
    "asset_class", "environment", "technology", "vendor_brand", "product", "domain",
    "organization", "tool", "framework", "program", "artifact", "topic",
  ];
  for (const id of expected) {
    assert.ok(dimIds.includes(id), `Missing dimension: ${id}`);
  }
  assert.equal(dimIds.length, 12);
});
