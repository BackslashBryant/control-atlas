import assert from "node:assert/strict";
import test from "node:test";

import type { AtlasSpine } from "../../src/ui/lib/atlasDrilldown";
import { buildAtlasTree } from "../../src/ui/lib/atlasDecomposition";
import { buildAtlasGraphModel, type AtlasGraphModelInput } from "../../src/ui/lib/atlasGraphModel";
import {
  atlasProjectionRecordLabels,
  buildAtlasSemanticProjections,
} from "../../src/ui/lib/atlasGraphProjection";
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
    { id: "csf-2:GV.OC-01", node_type: "requirement", label: "Mission is understood", source_id: "nist-csf", metadata: { catalog_id: "csf-2", publisher_item_id: "GV.OC-01", type: "csf-subcategory", family: "GV.OC", atlas_class: "discovery-facet" } },
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
  assert.equal(record.publisherItemId, "GV.OC-01");
  assert.equal(artifact.schema_version, "2.2");
  // T4.1: an explicit metadata.atlas_class assertion wins over the node_type-based fallback.
  assert.equal(record.atlasClass, "discovery-facet");
  const fallbackRecord = detail.nodes.find((node) => node.id === "csf-2:GV.OC-02")!;
  assert.equal(fallbackRecord.atlasClass, "requirement");
  assert.equal(record.objectLayer, "publisher_content");
  assert.deepEqual(detail.edges[0]!.connectionSourceIds, ["artifact-nist-olir", "nist-olir-csf-800-53"]);

  assert.equal(
    buildAtlasTree(artifact, {
      areaId: "ecosystem:nist",
      publicationId: "",
      detailId: "",
    }).scopeCount,
    artifact.ecosystems["ecosystem:nist"]!.representedCanonicalNodeCount,
  );
  assert.equal(
    buildAtlasTree(artifact, {
      areaId: "ecosystem:nist",
      publicationId: "csf-2",
      detailId: "",
    }).scopeCount,
    2,
  );
  assert.equal(detail.representedCanonicalNodeCount, 2);
  assert.equal(detail.nodes.length, 2);
  assert.equal(
    buildAtlasTree(artifact, {
      areaId: "ecosystem:nist",
      publicationId: "csf-2",
      detailId: group.id,
    }).scopeCount,
    detail.representedCanonicalNodeCount,
  );
  assert.equal(JSON.stringify(input), before);
});

test("semantic Atlas projects stable publisher-native structural labels", () => {
  const records = [
    {
      id: "csf-2:CATEGORY-PR.AA",
      node_type: "category",
      label: "Identity Management, Authentication, and Access Control",
      metadata: {
        catalog_id: "csf-2",
        item_id: "CATEGORY-PR.AA",
        publisher_item_id: "PR.AA",
        title: "Identity Management, Authentication, and Access Control",
        family: "Test structure",
      },
    },
    {
      id: "csf-2:TACTIC-TA0001",
      node_type: "tactic",
      label: "Initial Access",
      metadata: {
        catalog_id: "csf-2",
        item_id: "TACTIC-TA0001",
        publisher_item_id: "TA0001",
        title: "Initial Access",
        family: "Test structure",
      },
    },
    {
      id: "csf-2:FAMILY-AC",
      node_type: "family",
      label: "Access Control",
      metadata: {
        catalog_id: "csf-2",
        item_id: "FAMILY-AC",
        publisher_item_id: "AC",
        title: "Access Control",
        family: "Test structure",
      },
    },
    {
      id: "csf-2:LEVEL-1",
      node_type: "program",
      label: "CMMC Level 1",
      metadata: {
        catalog_id: "csf-2",
        item_id: "LEVEL-1",
        title: "CMMC Level 1",
        family: "Test structure",
      },
    },
    {
      id: "csf-2:AC-2",
      node_type: "control",
      label: "Account Management",
      metadata: {
        catalog_id: "csf-2",
        item_id: "AC-2",
        title: "Account Management",
        family: "Test structure",
      },
    },
    {
      id: "csf-2:GOVERN-1",
      node_type: "control",
      label: "GOVERN-1",
      metadata: {
        catalog_id: "csf-2",
        item_id: "GOVERN-1",
        title: "GOVERN-1",
        family: "Test structure",
      },
    },
    {
      id: "csf-2:FUNCTION-PR",
      node_type: "function",
      label: "PROTECT",
      metadata: {
        catalog_id: "csf-2",
        item_id: "FUNCTION-PR",
        publisher_item_id: "PR",
        title: "PROTECT",
        family: "Single-record group",
      },
    },
  ];
  const graph = buildAtlasGraphModel({
    nodes: [
      { id: "atlas:TRUNK", node_type: "trunk", label: "Cybersecurity", source_id: "control-atlas-structure", metadata: {} },
      { id: "csf-2:CATALOG", node_type: "catalog", label: "NIST CSF 2.0", source_id: "nist-csf", metadata: { catalog_id: "csf-2" } },
      ...records.map((record) => ({ ...record, source_id: "test-source" })),
    ],
    edges: [],
  });
  const artifact = buildAtlasSemanticProjections({
    graph,
    model: buildAtlasTreeModel(spine),
    generatedAt: "2026-09-01T00:00:00.000Z",
    catalogMemberships: [{
      catalogId: "csf-2",
      publicationSourceId: "nist-csf",
      ecosystemId: "ecosystem:nist",
      ecosystemLabel: "NIST",
      ecosystemDescription: "NIST publications.",
      publicationDescription: "Test publication.",
      lifecycleStatus: "active",
      version: "2.0",
      publicationKind: "Outcome framework",
    }],
  });
  const labels = atlasProjectionRecordLabels(artifact);
  assert.deepEqual(
    Object.fromEntries(records.map((record) => [record.id, labels.get(record.id)])),
    {
      "csf-2:CATEGORY-PR.AA": "PR.AA \u2014 Identity Management, Authentication, and Access Control",
      "csf-2:TACTIC-TA0001": "TA0001 \u2014 Initial Access",
      "csf-2:FAMILY-AC": "AC \u2014 Access Control",
      "csf-2:LEVEL-1": "CMMC Level 1",
      "csf-2:AC-2": "AC-2 \u2014 Account Management",
      "csf-2:GOVERN-1": "GOVERN-1",
      "csf-2:FUNCTION-PR": "PR \u2014 PROTECT",
    },
  );
  assert.equal(
    artifact.record_locations["csf-2:CATEGORY-PR.AA"]?.label,
    "PR.AA \u2014 Identity Management, Authentication, and Access Control",
  );
  for (const detail of Object.values(artifact.details)) {
    for (const node of detail.nodes) {
      assert.equal(node.drill?.targetId, node.id, `${node.id} keeps its canonical drill target`);
    }
  }
  assert.equal(artifact.schema_version, "2.2");
});
