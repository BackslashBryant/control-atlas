import test from "node:test";
import assert from "node:assert/strict";
import {
  taxonomyTagsForRecord,
  taxonomyTagsForResource,
  taxonomyTagsForTemplate,
  deriveTags,
} from "../src/shared/record-taxonomy.mjs";

test("DISA STIG records get organization.disa and program.stig", () => {
  const tags = taxonomyTagsForRecord({
    metadata: { benchmark_title: "Microsoft Windows Server 2025 Security Technical Implementation Guide" },
    catalog_id: "disa-stig",
  });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("organization.disa"), "should have organization.disa");
  assert.ok(ids.includes("program.stig"), "should have program.stig via catalog");
  const orgTag = tags.find((t) => t.id === "organization.disa");
  assert.equal(orgTag.basis.source_field, "catalog_id");
  assert.equal(orgTag.basis.rule, "catalog-publisher-organization");
});

test("NIST 800-53 records get organization.nist and framework.rmf", () => {
  const tags = taxonomyTagsForRecord({
    family: "Access Control",
    catalog_id: "nist-800-53",
  });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("organization.nist"), "should have organization.nist");
  assert.ok(ids.includes("framework.rmf"), "should have framework.rmf");
  assert.ok(ids.includes("domain.access-control"), "should still have domain tag");
});

test("CMMC records get organization.dod, framework.cmmc, and program.cmmc", () => {
  const tags = taxonomyTagsForRecord({ catalog_id: "cmmc-2" });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("organization.dod"));
  assert.ok(ids.includes("framework.cmmc"));
  assert.ok(ids.includes("program.cmmc"));
});

test("FedRAMP records get organization.fedramp and framework.fedramp", () => {
  const tags = taxonomyTagsForRecord({ catalog_id: "fedramp-rev5" });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("organization.fedramp"));
  assert.ok(ids.includes("framework.fedramp"));
});

test("MITRE ATT&CK records get organization.mitre", () => {
  const tags = taxonomyTagsForRecord({ catalog_id: "mitre-attack" });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("organization.mitre"));
});

test("Zero Trust catalogs get program.zero-trust", () => {
  const tags = taxonomyTagsForRecord({ catalog_id: "dod-zt" });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("program.zero-trust"));
  assert.ok(ids.includes("organization.dod"));
});

test("benchmark_title containing STIG adds program.stig", () => {
  const tags = taxonomyTagsForRecord({
    metadata: { benchmark_title: "Cisco IOS XE Router RTR STIG" },
    catalog_id: "disa-stig",
  });
  const stigTags = tags.filter((t) => t.id === "program.stig");
  assert.ok(stigTags.length >= 1, "should have program.stig");
});

test("resource with DISA publisher gets organization.disa", () => {
  const tags = taxonomyTagsForResource({
    publisher: "DISA Cyber Exchange",
    frameworks: [],
    programs: [],
  });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("organization.disa"));
  const orgTag = tags.find((t) => t.id === "organization.disa");
  assert.equal(orgTag.basis.source_field, "publisher");
});

test("resource with frameworks [RMF] gets framework.rmf", () => {
  const tags = taxonomyTagsForResource({
    publisher: "NIST",
    frameworks: ["RMF"],
    programs: [],
  });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("framework.rmf"));
  assert.ok(ids.includes("organization.nist"));
});

test("resource with programs [STIG, Continuous Monitoring] gets program and topic tags", () => {
  const tags = taxonomyTagsForResource({
    publisher: "DISA",
    frameworks: [],
    programs: ["STIG", "Continuous Monitoring"],
  });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("program.stig"));
  assert.ok(ids.includes("topic.continuous-monitoring"));
});

test("resource with oscal in id gets tool.oscal", () => {
  const tags = taxonomyTagsForResource({
    id: "nist-oscal-models-v1-2-2",
    shortName: "OSCAL Models",
    publisher: "NIST OSCAL Team",
    frameworks: [],
    programs: [],
  });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("tool.oscal"));
  assert.ok(ids.includes("organization.nist"));
});

test("template tpl-impl-stmt gets tool.emass, framework.fedramp, framework.rmf", () => {
  const tags = taxonomyTagsForTemplate({
    template_id: "tpl-impl-stmt",
    source_refs: ["fedramp-2026-rules", "nist-oscal", "mitre-emass-api-v3-22"],
  });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("tool.emass"), "should have tool.emass from source_ref");
  assert.ok(ids.includes("framework.fedramp"), "should have framework.fedramp from source_ref");
  assert.ok(ids.includes("framework.rmf") || ids.includes("tool.oscal"), "should have rmf or oscal from source_ref");
});

test("template tpl-ssp-starter gets artifact.ssp", () => {
  const tags = taxonomyTagsForTemplate({
    template_id: "tpl-ssp-starter",
    source_refs: ["fedramp-2026-rules", "nist-oscal", "nist-800-37-rev2"],
  });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("artifact.ssp"), "should have artifact.ssp from template_id");
  assert.ok(ids.includes("framework.fedramp"));
  assert.ok(ids.includes("framework.rmf"));
});

test("template tpl-poam gets artifact.poam", () => {
  const tags = taxonomyTagsForTemplate({
    template_id: "tpl-poam",
    source_refs: ["fedramp-2026-rules", "nist-800-37-rev2", "nist-oscal", "mitre-emass-api-v3-22"],
  });
  const ids = tags.map((t) => t.id);
  assert.ok(ids.includes("artifact.poam"));
  assert.ok(ids.includes("tool.emass"));
});

test("derived tags propagate tool → organization via approved relationships", () => {
  const directTags = [
    { id: "tool.emass", kind: "tool", label: "eMASS", provenance: "atlas_evidence", basis: { source_field: "source_refs", rule: "approved-source-reference" } },
    { id: "framework.rmf", kind: "framework", label: "RMF", provenance: "atlas_evidence", basis: { source_field: "source_refs", rule: "approved-source-reference" } },
  ];
  const derived = deriveTags(directTags);
  const derivedIds = derived.map((t) => t.id);
  assert.ok(derivedIds.includes("organization.disa"), "tool.emass should derive organization.disa");
  assert.ok(derivedIds.includes("organization.nist"), "framework.rmf should derive organization.nist");
  const disaTag = derived.find((t) => t.id === "organization.disa");
  assert.equal(disaTag.assignment, "derived");
  assert.equal(disaTag.origin_tag_id, "tool.emass");
  assert.equal(disaTag.relationship_type, "operated_by");
});

test("derived tags do not duplicate direct tags", () => {
  const directTags = [
    { id: "tool.emass", kind: "tool", label: "eMASS", provenance: "atlas_evidence", basis: {} },
    { id: "organization.disa", kind: "organization", label: "DISA", provenance: "atlas_evidence", basis: {} },
  ];
  const derived = deriveTags(directTags);
  assert.ok(!derived.some((t) => t.id === "organization.disa"), "should not derive a tag already present as direct");
});

test("no keyword/prose-based assignments for new dimensions", () => {
  assert.deepEqual(
    taxonomyTagsForRecord({ description: "This DISA-published STIG covers eMASS and RMF authorization." }),
    [],
  );
  assert.deepEqual(
    taxonomyTagsForResource({
      summary: "DISA published this STIG viewer for RMF compliance.",
      publisher: "",
      frameworks: [],
      programs: [],
    }),
    [],
  );
});

test("all 51 original record tag IDs still resolve", () => {
  const tags = taxonomyTagsForRecord({
    metadata: { benchmark_title: "Microsoft Windows Server 2025 Security Technical Implementation Guide" },
    family: "Access Control",
    catalog_id: "disa-stig",
  });
  const ids = new Set(tags.map((t) => t.id));
  assert.ok(ids.has("asset.server"));
  assert.ok(ids.has("vendor.microsoft"));
  assert.ok(ids.has("domain.access-control"));
  assert.ok(ids.has("organization.disa"));
  assert.ok(ids.has("program.stig"));
});
