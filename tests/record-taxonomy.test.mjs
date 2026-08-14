import test from "node:test";
import assert from "node:assert/strict";
import { taxonomyTagsForRecord, taxonomyTagsForResource } from "../src/shared/record-taxonomy.mjs";

test("taxonomy tags use explicit benchmark-title terms and retain their basis", () => {
  const tags = taxonomyTagsForRecord({
    metadata: { benchmark_title: "Microsoft Windows Server 2025 Security Technical Implementation Guide" },
  });
  assert.deepEqual(tags, [
    { id: "asset.server", kind: "asset_class", label: "Server", provenance: "inferred", basis: { source_field: "metadata.benchmark_title", rule: "explicit-server-term" } },
    { id: "technology.operating-system", kind: "technology", label: "Operating system", provenance: "inferred", basis: { source_field: "metadata.benchmark_title", rule: "explicit-operating-system-term" } },
    { id: "product.microsoft-windows", kind: "product", label: "Microsoft Windows", provenance: "inferred", basis: { source_field: "metadata.benchmark_title", rule: "explicit-product-title" } },
    { id: "vendor.microsoft", kind: "vendor_brand", label: "Microsoft", provenance: "inferred", basis: { source_field: "metadata.benchmark_title", rule: "explicit-publisher-title-prefix" } },
  ]);
});

test("taxonomy distinguishes workstation, cloud, and Active Directory from explicit titles", () => {
  const tags = taxonomyTagsForRecord({
    metadata: { benchmark_title: "Microsoft Azure Active Directory Windows 11 Security Technical Implementation Guide" },
  });
  assert.deepEqual(tags.map((tag) => [tag.kind, tag.label]), [
    ["asset_class", "Workstation"], ["asset_class", "Identity system"], ["environment", "Cloud"], ["technology", "Operating system"], ["technology", "Active Directory"], ["vendor_brand", "Microsoft"],
  ]);
});

test("publisher security domains use exact NIST family fields and ignore incidental free text", () => {
  assert.deepEqual(taxonomyTagsForRecord({ family: "Physical and Environmental Protection" }).map((tag) => tag.label), ["Physical security", "Physical Security"]);
  assert.deepEqual(taxonomyTagsForRecord({ family: "Physical Protection" }).map((tag) => tag.label), ["Physical security", "Physical Security"]);
  assert.deepEqual(taxonomyTagsForRecord({ family: "Access Control" }), [
    { id: "domain.access-control", kind: "domain", label: "Access Control", provenance: "publisher", basis: { source_field: "family", rule: "exact-publisher-family" } },
  ]);
  assert.deepEqual(taxonomyTagsForRecord({ family: "Incident response" }).map((tag) => tag.id), ["domain.incident-response"]);
  assert.deepEqual(taxonomyTagsForRecord({ family: "Catalog" }), []);
  assert.deepEqual(taxonomyTagsForRecord({ description: "Guide for physical server rooms" }), []);
});

test("DISA CCI related NIST families remain exact publisher classifications", () => {
  assert.deepEqual(
    taxonomyTagsForRecord({
      catalog_id: "disa-cci",
      family: "Policy",
      related_categories: [
        { code: "AC", label: "Access Control", provenance: "referenced" },
        { code: "SC", label: "System and Communications Protection", provenance: "referenced" },
      ],
      description: "Mentions incident response, mobile devices, and cloud systems.",
    }),
    [
      { id: "domain.access-control", kind: "domain", label: "Access Control", provenance: "publisher", basis: { source_field: "metadata.related_categories[]", rule: "exact-publisher-related-category" } },
      { id: "domain.system-communications-protection", kind: "domain", label: "System and Communications Protection", provenance: "publisher", basis: { source_field: "metadata.related_categories[]", rule: "exact-publisher-related-category" } },
    ],
  );
  assert.deepEqual(
    taxonomyTagsForRecord({
      related_categories: [
        { code: "AC", label: "Access Control", provenance: "inferred" },
        { code: "ZZ", label: "Access Control", provenance: "referenced" },
        { code: "AC", label: "Access Controls", provenance: "referenced" },
      ],
    }),
    [],
  );
});

test("catalog scope may supply publisher classification without parsing prose", () => {
  assert.deepEqual(
    taxonomyTagsForRecord({ catalog_id: "nist-iot-cybersecurity", description: "mentions a mobile phone" }),
    [{ id: "asset.iot", kind: "asset_class", label: "IoT", provenance: "publisher", basis: { source_field: "catalog_id", rule: "publisher-catalog-scope" } }],
  );
});

test("resource taxonomy uses only reviewed structured scope and compatibility fields", () => {
  assert.deepEqual(
    taxonomyTagsForResource({
      technologyScopes: ["Kubernetes", "cloud native", "Windows"],
      compatibility: { operatingSystems: ["Linux"] },
      summary: "A database product mentions Active Directory and mobile devices.",
    }).map((tag) => [tag.id, tag.basis.source_field]),
    [
      ["technology.operating-system", "compatibility.operatingSystems"],
      ["product.microsoft-windows", "technologyScopes"],
      ["asset.container", "technologyScopes"],
      ["environment.cloud", "technologyScopes"],
    ],
  );
  assert.deepEqual(taxonomyTagsForResource({ summary: "Windows Kubernetes cloud native" }), []);
});
