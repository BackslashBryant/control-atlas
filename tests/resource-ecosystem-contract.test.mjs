import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { searchDirectoryResources } from "../src/ui/lib/resourcesDirectory.mjs";

const dataset = JSON.parse(readFileSync("data/commons-resource-dataset.json", "utf8"));
const manifest = JSON.parse(readFileSync("data/commons-candidate-manifest.json", "utf8"));
const disposition = JSON.parse(readFileSync("data/resource-ecosystem-disposition.json", "utf8"));
const byId = new Map(dataset.resources.map((resource) => [resource.id, resource]));
const expectedCollections = [
  "dod-cybersecurity-portals",
  "reciprocity-authorization-reuse",
  "implementation-assessment-tools",
  "product-assurance-approved-products",
  "cloud-devsecops-software-factories",
  "cmmc-defense-industrial-base",
  "cyber-workforce-training",
  "practitioner-communities",
];

test("eight required collections are populated and mutually resolvable", () => {
  assert.deepEqual(dataset.collections.map((collection) => collection.id), expectedCollections);
  for (const collection of dataset.collections) {
    assert.ok(collection.resourceIds.length >= 4, `${collection.id} has useful coverage`);
    for (const id of collection.resourceIds) {
      assert.ok(byId.has(id), `${collection.id} resolves ${id}`);
      assert.ok(byId.get(id).featuredCollections.includes(collection.id), `${id} links back to ${collection.id}`);
    }
  }
});

test("every card and detail field has explicit source, access, identity, and review metadata", () => {
  for (const resource of dataset.resources) {
    assert.ok(resource.cardPurpose.length >= 20, `${resource.id} card purpose`);
    assert.ok(resource.publisherType, `${resource.id} publisher type`);
    assert.ok(resource.officialStatus, `${resource.id} official status`);
    assert.ok(resource.brandKey, `${resource.id} brand key`);
    assert.ok(resource.sourceEvidence, `${resource.id} source evidence`);
    assert.ok(resource.verificationMethod, `${resource.id} verification method`);
    assert.match(resource.lastCheckedAt, /^2026-08-03$/);
    assert.ok(Array.isArray(resource.technologyScopes));
    assert.ok(Array.isArray(resource.searchAliases));
    assert.ok(Array.isArray(resource.featuredCollections));
  }
});

test("parent and child ecosystem relationships resolve without becoming publication duplicates", () => {
  for (const resource of dataset.resources) {
    if (resource.parentEcosystemId) assert.ok(byId.has(resource.parentEcosystemId), `${resource.id} parent resolves`);
    for (const childId of resource.childResourceIds) assert.ok(byId.has(childId), `${resource.id} child resolves`);
  }
  assert.equal(byId.get("directory-common-criteria-products").parentEcosystemId, "ecosystem-common-criteria");
  assert.equal(byId.get("tool-platform-one-ironbank").parentEcosystemId, "ecosystem-platform-one");
});

test("aliases find current resources and removed publications stay out of Resources", () => {
  assert.equal(searchDirectoryResources(dataset.resources, "Repo One")[0]?.id, "tool-platform-one-ironbank");
  assert.ok(searchDirectoryResources(dataset.resources, "8140").some((resource) => resource.id === "official-dod-8140-matrix"));
  assert.ok(searchDirectoryResources(dataset.resources, "FedVTE").some((resource) => resource.id === "training-cisa-learning"));
  for (const removed of ["official-dodi-8510-01", "official-nist-sp800-171a", "official-cisa-cpgs", "official-eo-14028"]) {
    assert.equal(byId.has(removed), false, `${removed} remains Library-owned`);
  }
});

test("communities carry one exact safety warning and rejected candidates remain auditable", () => {
  const warning = "Do not post CUI, credentials, system details, assessment evidence, or other non-public organizational information.";
  for (const resource of dataset.resources.filter((entry) => entry.resourceType === "community_forum")) {
    assert.equal(resource.warnings.filter((entry) => entry === warning).length, 1, `${resource.id} warning exactly once`);
  }
  assert.equal(manifest.acceptedCount, dataset.resources.length);
  assert.equal(disposition.candidates.length, manifest.totalEvaluated);
  assert.ok(manifest.rejectedCandidates.some((candidate) => /Tenable Audit Files/.test(candidate.candidateName)));
  assert.ok(manifest.rejectedCandidates.some((candidate) => /Platform One Party Bus/.test(candidate.candidateName)));
});
