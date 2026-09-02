import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateRelationshipRows,
  createFederalGraphRuntime,
} from "../src/app/runtime.mjs";
import { readGeneratedCollection } from "../scripts/lib/generated-graph-artifacts.mjs";
import { compareTaxonomyTags } from "../src/ui/lib/compareTaxonomy.mjs";

test("compareTaxonomyTags deduplicates and separates shared and differing governed tags", () => {
  const result = compareTaxonomyTags([
    {
      from_taxonomy_tags: [
        { id: "framework.rmf", kind: "framework", label: "RMF" },
        { id: "organization.nist", kind: "organization", label: "NIST" },
        { id: "organization.nist", kind: "organization", label: "NIST" },
      ],
      targets: [{
        to_taxonomy_tags: [
          { id: "organization.nist", kind: "organization", label: "NIST" },
          { id: "framework.nist-csf", kind: "framework", label: "NIST CSF" },
        ],
      }],
    },
  ]);
  assert.deepEqual(result.shared.map((tag) => tag.id), ["organization.nist"]);
  assert.deepEqual(result.onlySource.map((tag) => tag.id), ["framework.rmf"]);
  assert.deepEqual(result.onlyTarget.map((tag) => tag.id), ["framework.nist-csf"]);
});

test("aggregateRelationshipRows groups flat edges by source item and preserves all targets", () => {
  const flatRows = [
    {
      edge_id: "edge-1",
      from_id: "nist-800-53:AC-1",
      from_item_id: "AC-1",
      from_title: "Policy and Procedures",
      from_catalog_id: "nist-800-53",
      to_id: "csf-2:GV.PO-01",
      to_item_id: "GV.PO-01",
      to_title: "Policy Established",
      to_catalog_id: "csf-2",
      relationship_type: "maps_to",
      provenance_class: "federal_published",
      confidence: "direct",
      publication_status: "published",
      rationale: "Direct alignment on policy requirements.",
      navigation_note: "NIST to CSF policy mapping",
      source_refs: [{ source_id: "nist-olir" }],
    },
    {
      edge_id: "edge-2",
      from_id: "nist-800-53:AC-1",
      from_item_id: "AC-1",
      from_title: "Policy and Procedures",
      from_catalog_id: "nist-800-53",
      to_id: "csf-2:GV.PO-02",
      to_item_id: "GV.PO-02",
      to_title: "Policy Maintained",
      to_catalog_id: "csf-2",
      relationship_type: "maps_to",
      provenance_class: "federal_published",
      confidence: "direct",
      publication_status: "published",
      rationale: "Direct alignment on maintenance.",
      navigation_note: "",
      source_refs: [{ source_id: "nist-olir" }],
    },
    {
      edge_id: "edge-3",
      from_id: "nist-800-53:AC-2",
      from_item_id: "AC-2",
      from_title: "Account Management",
      from_catalog_id: "nist-800-53",
      to_id: "csf-2:PR.AC-01",
      to_item_id: "PR.AC-01",
      to_title: "Identities Managed",
      to_catalog_id: "csf-2",
      relationship_type: "subset_of",
      provenance_class: "federal_published",
      confidence: "inferred",
      publication_status: "published",
      rationale: "",
      navigation_note: "",
      source_refs: [{ source_id: "nist-olir" }],
    },
  ];

  const aggregated = aggregateRelationshipRows(flatRows);
  assert.equal(aggregated.length, 2, "3 flat edges across 2 source items must collapse into 2 aggregated rows");

  // First source item (AC-1)
  const ac1 = aggregated[0];
  assert.equal(ac1.from_item_id, "AC-1");
  assert.equal(ac1.from_title, "Policy and Procedures");
  assert.equal(ac1.targets.length, 2);
  assert.equal(ac1.targets[0].to_item_id, "GV.PO-01");
  assert.equal(ac1.targets[0].relationship_type, "maps_to");
  assert.equal(ac1.targets[0].rationale, "Direct alignment on policy requirements.");
  assert.equal(ac1.targets[1].to_item_id, "GV.PO-02");

  // Second source item (AC-2)
  const ac2 = aggregated[1];
  assert.equal(ac2.from_item_id, "AC-2");
  assert.equal(ac2.targets.length, 1);
  assert.equal(ac2.targets[0].to_item_id, "PR.AC-01");
  assert.equal(ac2.targets[0].confidence, "inferred");
});

test("runtime.buildAggregatedRelationshipRows returns grouped structure and summary stats", () => {
  const runtime = createFederalGraphRuntime({
    sources: readGeneratedCollection(".", "sources").sources,
    nodes: readGeneratedCollection(".", "nodes").nodes,
    edges: readGeneratedCollection(".", "edges").edges,
    evidence: readGeneratedCollection(".", "evidence").evidence,
    findings: readGeneratedCollection(".", "graph-health").findings,
  });

  const result = runtime.buildAggregatedRelationshipRows({
    source_catalog: "nist-800-171",
    target_catalog: "nist-800-53",
  });

  assert.ok(result.rows.length > 0, "Aggregated rows should be populated");
  assert.ok(result.flat_rows.length >= result.rows.length, "Flat rows count must be >= aggregated rows count");
  assert.equal(result.summary.source_record_count, result.rows.length);

  for (const row of result.rows) {
    assert.ok(row.from_item_id);
    assert.ok(Array.isArray(row.targets));
    assert.ok(row.targets.length > 0);
  }
});

test("runtime.exportRelationshipRows handles aggregated rows across CSV, Markdown, and JSON", () => {
  const runtime = createFederalGraphRuntime({
    sources: readGeneratedCollection(".", "sources").sources,
    nodes: readGeneratedCollection(".", "nodes").nodes,
    edges: readGeneratedCollection(".", "edges").edges,
    evidence: readGeneratedCollection(".", "evidence").evidence,
    findings: readGeneratedCollection(".", "graph-health").findings,
  });

  const result = runtime.buildAggregatedRelationshipRows({
    source_catalog: "nist-800-171",
    target_catalog: "nist-800-53",
  });

  // CSV export
  const csv = runtime.exportRelationshipRows(result.rows, "csv");
  assert.ok(csv.startsWith('"From ID","From Title","Mapped Target IDs"'));
  assert.ok(csv.includes("3.1.1"));

  // Markdown export
  const md = runtime.exportRelationshipRows(result.rows, "markdown");
  assert.ok(md.startsWith("| From ID | From Title | Mapped Target IDs |"));
  assert.ok(md.includes("3.1.1"));

  // JSON export
  const jsonStr = runtime.exportRelationshipRows(result.rows, "json");
  const parsed = JSON.parse(jsonStr);
  assert.ok(Array.isArray(parsed));
  assert.equal(parsed.length, result.rows.length);
  assert.ok(parsed[0].targets.length > 0);
});
