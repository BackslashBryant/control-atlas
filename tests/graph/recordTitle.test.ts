import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRecordConnectionGroups,
  familyQualifiedRecordId,
  formatRecordTitle,
  humanReadableEvidenceLocator,
  officialRecordName,
  recordIdentityFor,
  recordDisplayTitle,
  recordPublisherName,
} from "../../src/ui/lib/recordTitle";

test("shared record titles do not repeat leading official identifiers", () => {
  assert.equal(
    formatRecordTitle("T1195.002", "T1195.002 COMPROMISE SOFTWARE SUPPLY CHAIN"),
    "T1195.002 COMPROMISE SOFTWARE SUPPLY CHAIN",
  );
  assert.equal(
    formatRecordTitle("SV-230221r991565_rule", "SV-230221r991565_rule — Account policy"),
    "SV-230221r991565_rule — Account policy",
  );
  assert.equal(
    formatRecordTitle("CCI-000001", "cci-000001 Cryptographic protection"),
    "cci-000001 Cryptographic protection",
  );
  assert.equal(
    formatRecordTitle("AC-2", "Account Management"),
    "AC-2 — Account Management",
  );
});

test("shared record titles preserve legitimate later identifier references", () => {
  assert.equal(
    formatRecordTitle("AC-2", "Account Management for AC-2 implementations"),
    "AC-2 — Account Management for AC-2 implementations",
  );
  assert.equal(
    recordDisplayTitle({
      id: "nist-800-53:AC-2",
      node_type: "control",
      metadata: { item_id: "AC-2", title: "Account Management" },
    }),
    "AC-2 — Account Management",
  );
});

test("record template qualifies ambiguous numeric identifiers without changing official IDs", () => {
  assert.equal(
    familyQualifiedRecordId("3.1.1", "Access Control", "nist-800-171-rev2"),
    "AC-3.1.1",
  );
  assert.equal(
    familyQualifiedRecordId("3.10.1", "Physical Protection", "nist-800-172"),
    "PE-3.10.1",
  );
  assert.equal(
    familyQualifiedRecordId(
      "3.12.1",
      "Security Assessment and Monitoring",
      "nist-800-171",
    ),
    "CA-3.12.1",
  );
  assert.equal(
    familyQualifiedRecordId("3.6.1", "Incident response", "nist-800-171-rev2"),
    "IR-3.6.1",
  );
  assert.equal(familyQualifiedRecordId("AC-2", "Access Control"), "AC-2");
  assert.equal(
    familyQualifiedRecordId("3.1.1", "Unknown family", "nist-800-171-rev2"),
    "3.1.1",
  );
  assert.equal(
    familyQualifiedRecordId("3.1.1", "Access Control", "unrelated-catalog"),
    "3.1.1",
  );
});

test("record template never derives a record name from body text", () => {
  assert.equal(
    officialRecordName("3.1.1", "3.1.1"),
    "",
  );
  assert.equal(
    officialRecordName("AC-2", "Account Management"),
    "Account Management",
  );
});

test("record identities use publisher, source-native category, and official identifier", () => {
  assert.equal(recordIdentityFor({ publisher: "NIST", catalogId: "nist-800-53", family: "Access Control", itemId: "AC-2" }), "NIST AC-2");
  assert.equal(recordIdentityFor({ publisher: "NIST", catalogId: "nist-800-171", family: "Access Control", itemId: "3.1.1" }), "NIST AC 3.1.1");
  assert.equal(recordIdentityFor({ publisher: "MITRE", catalogId: "mitre-attack", family: "Initial Access", itemId: "T1195.002" }), "MITRE Initial Access T1195.002");
  assert.equal(recordIdentityFor({ publisher: "MITRE", catalogId: "mitre-d3fend", family: "Harden", itemId: "D3-AA" }), "MITRE Harden D3-AA");
  assert.equal(recordIdentityFor({ publisher: "DISA", catalogId: "disa-cci", family: "Policy and Technical", itemId: "CCI-000001" }), "DISA Policy and Technical CCI-000001");
  assert.equal(recordIdentityFor({ publisher: "DISA", catalogId: "disa-stig", family: "IBM Hardware Management Console Security Technical Implementation Guide", itemId: "V-256876", metadata: { identity_category: "HMC" } }), "DISA HMC V-256876");
});

test("record publisher names use official compact forms", () => {
  assert.equal(recordPublisherName("National Institute of Standards and Technology"), "NIST");
  assert.equal(recordPublisherName("Defense Information Systems Agency"), "DISA");
  assert.equal(recordPublisherName("The MITRE Corporation"), "MITRE");
});

test("record citations suppress file, path, fragment, and internal-id locators", () => {
  assert.equal(humanReadableEvidenceLocator("Table 3"), "Table 3");
  assert.equal(humanReadableEvidenceLocator("32 CFR 170.14"), "32 CFR 170.14");
  assert.equal(humanReadableEvidenceLocator("Relationships#PR.AA-01"), "");
  assert.equal(humanReadableEvidenceLocator("U_CCI_List.xml#CCI-000010"), "");
  assert.equal(humanReadableEvidenceLocator("folder\\mapping.json"), "");
  assert.equal(humanReadableEvidenceLocator("13c67bb0-9c04-442b-8c7f-0e4f55f995a5"), "");
});

test("record connections include only published cross-catalog correlations", () => {
  const nodes = new Map([
    ["center", { id: "center", metadata: { catalog_id: "nist-800-171-rev2", item_id: "3.1.1", title: "3.1.1" } }],
    ["parent", { id: "parent", metadata: { catalog_id: "nist-800-171-rev2", item_id: "FAMILY-AC", title: "Access Control" } }],
    ["same", { id: "same", metadata: { catalog_id: "nist-800-171-rev2", item_id: "3.1.2", title: "Access Enforcement" } }],
    ["cmmc", { id: "cmmc", metadata: { catalog_id: "cmmc-2", item_id: "L2-AC.1.001", title: "Limit system access" } }],
    ["cci", { id: "cci", metadata: { catalog_id: "disa-cci", item_id: "CCI-000001", title: "Access control" } }],
  ]);
  const groups = buildRecordConnectionGroups(
    "center",
    "nist-800-171-rev2",
    [
      { source_node_id: "parent", target_node_id: "center", relationship_type: "contains", relationship_class: "structural", publication_status: "published" },
      { source_node_id: "center", target_node_id: "same", relationship_type: "maps_to", relationship_class: "correlation", publication_status: "published" },
      { id: "edge-1", source_node_id: "center", target_node_id: "cmmc", relationship_type: "maps_to", relationship_class: "correlation", publication_status: "published", provenance_class: "federal_published", source_refs: [{ source_id: "nist-olir", source_name: "NIST OLIR", source_version: "2.0", locator: "Relationships#PR.AA-01", evidence_quality: "publisher asserted" }] },
      { id: "edge-2", source_node_id: "center", target_node_id: "cmmc", relationship_type: "equivalent_to", relationship_class: "correlation", publication_status: "published", provenance_class: "federal_referenced", source_refs: [{ source_id: "cmmc-model", source_name: "CMMC Model", source_version: "2.0", locator: "Table 3", evidence_quality: "direct" }] },
      { source_node_id: "center", target_node_id: "cci", relationship_type: "references", relationship_class: "correlation", publication_status: "candidate" },
      { source_node_id: "center", target_node_id: "cci", relationship_type: "references" },
    ],
    (id) => nodes.get(id),
    (catalogId) => ({ "cmmc-2": "CMMC 2.0", "disa-cci": "DISA CCI" })[catalogId] || catalogId,
  );
  assert.deepEqual(groups, [{
    catalogId: "cmmc-2",
    label: "CMMC 2.0",
    items: [{
      nodeId: "cmmc",
      itemId: "L2-AC.1.001",
      title: "Limit system access",
      relationshipType: "maps_to",
      edgeId: "edge-1",
      provenanceClass: "federal_published",
      sourceRefs: [{ sourceId: "nist-olir", sourceName: "NIST OLIR", sourceVersion: "2.0", locator: "Relationships#PR.AA-01", evidenceQuality: "publisher asserted" }],
    }, {
      nodeId: "cmmc",
      itemId: "L2-AC.1.001",
      title: "Limit system access",
      relationshipType: "equivalent_to",
      edgeId: "edge-2",
      provenanceClass: "federal_referenced",
      sourceRefs: [{ sourceId: "cmmc-model", sourceName: "CMMC Model", sourceVersion: "2.0", locator: "Table 3", evidenceQuality: "direct" }],
    }],
  }]);
});

test("record connections omit counterparts without public display identity", () => {
  const groups = buildRecordConnectionGroups(
    "center",
    "nist-800-53",
    [{
      id: "edge-private",
      source_node_id: "center",
      target_node_id: "internal-node-id",
      relationship_type: "maps_to",
      relationship_class: "correlation",
      publication_status: "published",
    }],
    () => ({ id: "internal-node-id", metadata: { catalog_id: "private-catalog" } }),
    () => "",
  );
  assert.deepEqual(groups, []);
});

test("record connections never infer missing relationship provenance", () => {
  const groups = buildRecordConnectionGroups(
    "center",
    "nist-800-53",
    [{
      id: "edge-incomplete",
      source_node_id: "center",
      target_node_id: "public-node",
      relationship_class: "correlation",
      publication_status: "published",
    }],
    () => ({
      id: "public-node",
      metadata: {
        catalog_id: "csf-2",
        item_id: "PR.AA-01",
        title: "Identities and credentials are managed",
      },
    }),
    () => "NIST CSF 2.0",
  );
  assert.deepEqual(groups, []);
});
