import assert from "node:assert/strict";
import test from "node:test";

import { TAXONOMY_TAG_BY_ID } from "../../src/shared/taxonomy-contract.mjs";
import { resolveIdentity, resolveIdentityByKey } from "../../src/shared/identity-registry.mjs";
import { selectLibraryResultTags } from "../../src/ui/lib/libraryResultTags";

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

test("Library result tags prioritize high-signal dimensions and return governed objects unchanged", () => {
  const server = { id: "asset.server", kind: "asset_class", label: "Server", provenance: "inferred" };
  const microsoft = { id: "vendor.microsoft", kind: "vendor_brand", label: "Microsoft", provenance: "inferred" };
  const disa = { id: "organization.disa", kind: "organization", label: "DISA", provenance: "inferred" };
  const stig = { id: "program.stig", kind: "program", label: "STIG", provenance: "inferred" };
  const selected = selectLibraryResultTags({
    publication: "DISA STIG",
    publisher: "DISA",
    taxonomyTags: [server, microsoft, disa, stig],
    title: "Both the log file and Event Tracing for Windows must be enabled.",
  });

  assert.deepEqual(selected.map((tag) => tag.id), ["asset.server", "program.stig", "vendor.microsoft"]);
  assert.equal(selected[0], server);
  assert.equal(selected[1], stig);
  assert.equal(selected[2], microsoft);
});

test("Library result tags prefer publisher provenance and keep one tag per dimension", () => {
  const inferredDomain = { id: "domain.audit-accountability", kind: "domain", label: "Audit and Accountability", provenance: "inferred" };
  const publisherDomain = { id: "domain.access-control", kind: "domain", label: "Access Control", provenance: "publisher" };
  const asset = { id: "asset.server", kind: "asset_class", label: "Server", provenance: "inferred" };
  const program = { id: "program.stig", kind: "program", label: "STIG", provenance: "inferred" };
  const vendor = { id: "vendor.microsoft", kind: "vendor_brand", label: "Microsoft", provenance: "inferred" };
  const selected = selectLibraryResultTags({
    publication: "DISA STIG",
    publisher: "DISA",
    taxonomyTags: [inferredDomain, publisherDomain, asset, program, vendor],
    title: "A governed record",
  });

  assert.deepEqual(selected.map((tag) => tag.id), ["domain.access-control", "asset.server", "program.stig"]);
  assert.equal(selected.length, 3);
});

test("Library result tags suppress redundant publisher, publication, and duplicate labels", () => {
  const mitre = selectLibraryResultTags({
    publication: "MITRE ATT&CK",
    publisher: "MITRE",
    taxonomyTags: [{ id: "organization.mitre", kind: "organization", label: "MITRE", provenance: "inferred" }],
    title: "/etc/passwd and /etc/shadow",
  });
  const fedramp = selectLibraryResultTags({
    publication: "FedRAMP Rev. 5",
    publisher: "Other",
    taxonomyTags: [
      { id: "organization.fedramp", kind: "organization", label: "FedRAMP", provenance: "inferred" },
      { id: "framework.fedramp", kind: "framework", label: "FedRAMP", provenance: "inferred" },
    ],
    title: "High Baseline",
  });
  const cmmc = selectLibraryResultTags({
    publication: "CMMC 2.0",
    publisher: "Other",
    taxonomyTags: [
      { id: "organization.dod", kind: "organization", label: "DoD", provenance: "inferred" },
      { id: "framework.cmmc", kind: "framework", label: "CMMC", provenance: "inferred" },
      { id: "program.cmmc", kind: "program", label: "CMMC", provenance: "inferred" },
    ],
    title: "CMMC Level 1",
  });

  assert.deepEqual(mitre, []);
  assert.deepEqual(fedramp, []);
  assert.deepEqual(cmmc.map((tag) => tag.id), ["organization.dod"]);
});

test("Library result tags expose publisher-backed domains without identity filler", () => {
  const domain = { id: "domain.access-control", kind: "domain", label: "Access Control", provenance: "publisher" };
  const selected = selectLibraryResultTags({
    publication: "SP 800-53 Rev. 5",
    publisher: "NIST",
    taxonomyTags: [
      domain,
      { id: "organization.nist", kind: "organization", label: "NIST", provenance: "inferred" },
      { id: "framework.rmf", kind: "framework", label: "RMF", provenance: "inferred" },
    ],
    title: "Access Control Decisions",
  });

  assert.deepEqual(selected, [domain]);
  assert.deepEqual(selectLibraryResultTags({ publication: "Microsoft Zero Trust", publisher: "Microsoft", taxonomyTags: [], title: "Applications" }), []);
});
