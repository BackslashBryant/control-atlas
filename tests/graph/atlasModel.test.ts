import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAtlasGroups,
  buildAtlasRows,
  selectAtlasOverviewGroups,
  resolveAtlasPathStage,
  type AtlasFilterState,
} from "../../src/ui/lib/atlasModel";
import type { AtlasNeighborhoodRecord } from "../../src/ui/lib/runtimeLoader";

const record: AtlasNeighborhoodRecord = {
  center_node: {
    id: "nist-800-53:AC-2",
    node_type: "control",
    metadata: { item_id: "AC-2", title: "Account Management" },
  },
  nodes: [
    {
      id: "nist-800-53:AC-2",
      node_type: "control",
      metadata: { item_id: "AC-2", title: "Account Management" },
    },
    {
      id: "csf-2:PR.AA-01",
      node_type: "requirement",
      metadata: { item_id: "PR.AA-01", title: "Identity management" },
    },
    {
      id: "disa-cci:CCI-000001",
      node_type: "requirement",
      metadata: { item_id: "CCI-000001", title: "CCI requirement" },
    },
  ],
  edges: [
    {
      id: "edge:published",
      source_node_id: "nist-800-53:AC-2",
      target_node_id: "csf-2:PR.AA-01",
      relationship_type: "maps_to",
      provenance_class: "federal_published",
      publication_status: "published",
      confidence: "direct",
    },
    {
      id: "edge:candidate",
      source_node_id: "nist-800-53:AC-2",
      target_node_id: "disa-cci:CCI-000001",
      relationship_type: "related_to",
      provenance_class: "inferred",
      publication_status: "candidate",
      confidence: "low",
    },
  ],
  published_connection_count: 1,
  candidate_connection_count: 1,
};

const publishedOnly: AtlasFilterState = {
  relationshipType: "",
  provenance: "",
  confidence: "",
  nodeType: "",
  includeCandidates: false,
  search: "",
};

test("Atlas Path, Map groups, and List rows derive from one published edge set", () => {
  const rows = buildAtlasRows(record, publishedOnly);
  const groups = buildAtlasGroups(record, publishedOnly);
  assert.deepEqual(rows.map((row) => row.edge.id), ["edge:published"]);
  assert.deepEqual(
    groups.flatMap((group) => group.items.map((item) => item.edge.id)),
    ["edge:published"],
  );
  assert.equal(groups[0]?.id, "csf");
  assert.equal(groups[0]?.placement, "lateral");
  assert.equal(groups[0]?.stage, "requirement");
  assert.equal(groups[0]?.rmfStage, "select");
});

test("candidate links appear only after the explicit toggle", () => {
  assert.equal(buildAtlasRows(record, publishedOnly).length, 1);
  const withCandidates = buildAtlasRows(record, {
    ...publishedOnly,
    includeCandidates: true,
  });
  assert.equal(withCandidates.length, 2);
  assert.equal(
    withCandidates.filter(
      (row) => row.edge.publication_status === "candidate",
    ).length,
    1,
  );
});

test("bounded Map keeps every available direction before filling six slots", () => {
  const makeGroup = (
    id: string,
    placement: "upstream" | "lateral" | "downstream",
  ) => ({
    id,
    label: id,
    description: id,
    placement,
    stage: "requirement" as const,
    rmfStage: "select" as const,
    items: [],
  });
  const groups = [
    makeGroup("up-1", "upstream"),
    makeGroup("up-2", "upstream"),
    makeGroup("up-3", "upstream"),
    makeGroup("side-1", "lateral"),
    makeGroup("side-2", "lateral"),
    makeGroup("down-1", "downstream"),
    makeGroup("down-2", "downstream"),
  ];
  const selected = selectAtlasOverviewGroups(groups, 6);
  assert.equal(selected.length, 6);
  assert.deepEqual(
    new Set(selected.map((group) => group.placement)),
    new Set(["upstream", "lateral", "downstream"]),
  );
});

test("legacy stage links resolve to the renamed decomposition stages", () => {
  const implementOnly = [
    {
      id: "disa",
      label: "DISA implementation",
      description: "Implementation link",
      placement: "downstream" as const,
      stage: "implementation" as const,
      rmfStage: "implement" as const,
      items: [{} as never],
    },
  ];
  assert.equal(resolveAtlasPathStage(implementOnly, ""), "implementation");
  assert.equal(
    resolveAtlasPathStage(implementOnly, "control"),
    "control",
  );
});
