import assert from "node:assert/strict";
import test from "node:test";

import type { AtlasSpine } from "../../src/ui/lib/atlasDrilldown";
import { buildAtlasGraphModel, type AtlasGraphModelInput } from "../../src/ui/lib/atlasGraphModel";
import { buildAtlasSemanticProjections } from "../../src/ui/lib/atlasGraphProjection";
import { buildAtlasTreeModel } from "../../src/ui/lib/atlasTreeModel";

const areaNames = [
  "Governance", "Risk", "Compliance", "Architecture", "Implementation",
  "Assessment", "Operations", "Threats", "Knowledge",
];

const spine: AtlasSpine = {
  entries: [
    { id: "atlas:TRUNK", node_type: "trunk", label: "Cybersecurity", blurb: "Root", parent_id: null, child_count: 9, descendant_record_count: 2 },
    ...areaNames.map((label) => ({
      id: `atlas:LIMB-${label.toUpperCase()}`,
      node_type: "limb",
      label,
      blurb: `${label} area`,
      parent_id: "atlas:TRUNK",
      child_count: label === "Compliance" ? 1 : 0,
      descendant_record_count: label === "Compliance" ? 2 : 0,
    })),
    { id: "csf-2:CATALOG", node_type: "catalog", label: "NIST CSF 2.0", blurb: "Publisher publication", parent_id: "atlas:LIMB-COMPLIANCE", child_count: 0, descendant_record_count: 2 },
  ],
};

const input: AtlasGraphModelInput = {
  nodes: [
    { id: "atlas:TRUNK", node_type: "trunk", label: "Cybersecurity", source_id: "control-atlas-structure", metadata: {} },
    ...areaNames.map((label) => ({ id: `atlas:LIMB-${label.toUpperCase()}`, node_type: "limb", label, source_id: "control-atlas-structure", metadata: {} })),
    { id: "csf-2:CATALOG", node_type: "catalog", label: "NIST CSF 2.0", source_id: "nist-csf", metadata: { catalog_id: "csf-2" } },
    { id: "csf-2:GV.OC-01", node_type: "requirement", label: "Mission is understood", source_id: "nist-csf", metadata: { catalog_id: "csf-2", type: "csf-subcategory", family: "GV.OC", atlas_class: "discovery-facet" } },
    { id: "csf-2:GV.OC-02", node_type: "requirement", label: "Stakeholders are understood", source_id: "nist-csf", metadata: { catalog_id: "csf-2", type: "csf-subcategory", family: "GV.OC" } },
    { id: "authority:USC-44-3554", node_type: "statute", label: "FISMA", source_id: "us-code", metadata: {} },
  ],
  edges: [{
    id: "mapping:csf-to-fisma",
    source_node_id: "csf-2:GV.OC-01",
    target_node_id: "csf-2:GV.OC-02",
    relationship_type: "maps_to",
    relationship_class: "correlation",
    source_artifact_id: "artifact-nist-olir",
    source_refs: [{ source_id: "nist-olir-csf-800-53" }],
  }],
};

test("semantic Atlas separates publisher truth, presentation, and edge provenance", () => {
  const before = JSON.stringify(input);
  const artifact = buildAtlasSemanticProjections({
    graph: buildAtlasGraphModel(input),
    model: buildAtlasTreeModel(spine),
    generatedAt: "2026-08-16T00:00:00.000Z",
    catalogMemberships: [{
      catalogId: "csf-2",
      publicationSourceId: "nist-csf",
      ecosystemId: "ecosystem:nist",
      ecosystemLabel: "NIST",
      ecosystemDescription: "Authoritative publications and source records issued by NIST.",
      publicationDescription: "Cybersecurity Framework 2.0.",
      lifecycleStatus: "active",
      version: "2.0",
      publicationKind: "Outcome framework",
    }],
  });

  // Publisher-native navigation starts at a source ecosystem, not an editorial work area.
  assert.equal(artifact.landscape.nodes.filter((node) => node.atlasStructureRole === "root").length, 1);
  assert.equal(artifact.landscape.nodes.filter((node) => node.atlasStructureRole === "publisher_ecosystem").length, 1);
  assert.equal(artifact.landscape.nodes.filter((node) => node.atlasStructureRole === "area").length, 0);
  const authorityCount = artifact.landscape.nodes.filter((node) => node.objectLayer === "authority_document").length;
  assert.ok(authorityCount >= 0 && authorityCount <= 3, `authority group count: ${authorityCount}`);
  assert.ok(
    artifact.landscape.nodes.length >= 2 && artifact.landscape.nodes.length <= 20,
    `landscape budget violated: ${artifact.landscape.nodes.length} nodes`,
  );
  assert.equal(artifact.landscape.nodes.some((node) => node.id === "derived:unclassified"), false);
  assert.equal(new Set(artifact.landscape.nodes.flatMap((node) => node.canonicalNodeIds)).size, artifact.landscape.representedCanonicalNodeCount);
  const ecosystemPublication = artifact.ecosystems["ecosystem:nist"]!.nodes.find((node) => node.publicationId === "csf-2")!;
  assert.equal(ecosystemPublication.lifecycleStatus, "active");
  assert.equal(ecosystemPublication.version, "2.0");
  assert.equal(ecosystemPublication.publicationKind, "Outcome framework");
  assert.equal(artifact.areas["atlas:LIMB-COMPLIANCE"]!.nodes.some((node) => node.publicationId === "csf-2"), true);

  const publication = artifact.publications["csf-2"]!;
  const group = publication.nodes.find((node) => node.id.startsWith("group:csf-2:"))!;
  assert.equal(group.canonicalRecordCount, 2);
  assert.equal(group.objectLayer, "publisher_content");

  const detail = artifact.details[group.id]!;
  const record = detail.nodes.find((node) => node.id === "csf-2:GV.OC-01")!;
  assert.equal(record.nativeType, "csf-subcategory");
  // T4.1: an explicit metadata.atlas_class assertion wins over the node_type-based fallback.
  assert.equal(record.atlasClass, "discovery-facet");
  const fallbackRecord = detail.nodes.find((node) => node.id === "csf-2:GV.OC-02")!;
  assert.equal(fallbackRecord.atlasClass, "requirement");
  assert.equal(record.objectLayer, "publisher_content");
  assert.deepEqual(detail.edges[0]!.connectionSourceIds, ["artifact-nist-olir", "nist-olir-csf-800-53"]);
  assert.equal(JSON.stringify(input), before);
});
