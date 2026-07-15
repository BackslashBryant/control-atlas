import assert from "node:assert/strict";
import test from "node:test";

import { applyRelationshipClustering } from "../src/ui/lib/graphClustering.mjs";
import { groupRelationships } from "../src/app/relationship-groups.mjs";

function mockRuntime(nodes) {
  return {
    getNode(id) {
      return nodes.find((node) => node.id === id) ?? null;
    },
  };
}

test("applyRelationshipClustering collapses large DISA CCI groups", () => {
  const centerNodeId = "nist-800-53:AC-2";
  const centerNode = {
    id: centerNodeId,
    node_type: "control",
    metadata: { item_id: "AC-2" },
  };

  const cciNodes = Array.from({ length: 12 }, (_, index) => ({
    id: `disa-cci:CCI-${index}`,
    node_type: "cci",
    metadata: { item_id: `CCI-${index}` },
  }));

  const nodes = [centerNode, ...cciNodes];
  const edges = cciNodes.map((node, index) => ({
    id: `edge:cci-${index}`,
    source_node_id: centerNodeId,
    target_node_id: node.id,
    relationship_type: "maps_to",
    provenance_class: "federal_published",
    publication_status: "published",
    confidence: "high",
  }));

  const runtime = mockRuntime(nodes);
  const grouped = groupRelationships(edges, centerNodeId, runtime);
  const disaGroup = grouped.find((group) => group.label === "DISA CCIs");
  assert.ok(disaGroup);
  assert.equal(disaGroup.items.length, 12);

  const clustered = applyRelationshipClustering({
    centerNodeId,
    nodes,
    edges,
    runtime,
  });

  assert.ok(
    clustered.nodes.some((node) => node.id === "cluster:disa-ccis"),
    "expected synthetic DISA CCI cluster node",
  );
  assert.ok(clustered.nodes.length < nodes.length);
  assert.equal(clustered.clusterMeta.get("cluster:disa-ccis")?.memberCount, 12);
});

test("groupRelationships labels CSF 2.0 and SP 800-171 counterparts as named crosswalk groups, not 'other'", () => {
  const centerNodeId = "nist-800-53:AC-2";
  const centerNode = {
    id: centerNodeId,
    node_type: "control",
    metadata: { item_id: "AC-2" },
  };
  const csfNode = {
    id: "csf-2:PR.AA-01",
    node_type: "requirement",
    metadata: { catalog_id: "csf-2", item_id: "PR.AA-01" },
  };
  const sp171Node = {
    id: "nist-800-171:3.1.1",
    node_type: "requirement",
    metadata: { catalog_id: "nist-800-171", item_id: "3.1.1" },
  };

  const nodes = [centerNode, csfNode, sp171Node];
  const edges = [
    {
      id: "edge:ac2-csf",
      source_node_id: csfNode.id,
      target_node_id: centerNodeId,
      relationship_type: "maps_to",
    },
    {
      id: "edge:ac2-sp171",
      source_node_id: sp171Node.id,
      target_node_id: centerNodeId,
      relationship_type: "maps_to",
    },
  ];

  const runtime = mockRuntime(nodes);
  const grouped = groupRelationships(edges, centerNodeId, runtime);

  const csfGroup = grouped.find((g) => g.id === "csf");
  const sp171Group = grouped.find((g) => g.id === "sp171");
  const otherGroup = grouped.find((g) => g.id === "other");

  assert.ok(csfGroup, "Expected a named csf group");
  assert.equal(csfGroup.label, "CSF 2.0 crosswalks (NIST OLIR)");
  assert.equal(csfGroup.items.length, 1);

  assert.ok(sp171Group, "Expected a named sp171 group");
  assert.equal(sp171Group.label, "SP 800-171 mappings");
  assert.equal(sp171Group.items.length, 1);

  assert.ok(!otherGroup, "CSF and SP 800-171 counterparts must not land in 'other'");
});

test("applyRelationshipClustering expands a collapsed group on request", () => {
  const centerNodeId = "nist-800-53:AC-2";
  const centerNode = {
    id: centerNodeId,
    node_type: "control",
    metadata: { item_id: "AC-2" },
  };
  const cciNodes = Array.from({ length: 12 }, (_, index) => ({
    id: `disa-cci:CCI-${index}`,
    node_type: "cci",
    metadata: { item_id: `CCI-${index}` },
  }));
  const nodes = [centerNode, ...cciNodes];
  const edges = cciNodes.map((node, index) => ({
    id: `edge:cci-${index}`,
    source_node_id: centerNodeId,
    target_node_id: node.id,
    relationship_type: "maps_to",
    provenance_class: "federal_published",
    publication_status: "published",
    confidence: "high",
  }));
  const runtime = mockRuntime(nodes);

  const collapsed = applyRelationshipClustering({
    centerNodeId,
    nodes,
    edges,
    runtime,
  });
  const expanded = applyRelationshipClustering({
    centerNodeId,
    nodes,
    edges,
    runtime,
    expandedClusters: new Set(["disa-ccis"]),
  });

  assert.ok(
    collapsed.nodes.some((node) => node.id === "cluster:disa-ccis"),
  );
  assert.ok(
    !expanded.nodes.some((node) => node.id === "cluster:disa-ccis"),
  );
  assert.equal(expanded.nodes.length, nodes.length);
});
