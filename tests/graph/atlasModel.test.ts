import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAtlasGroups,
  buildAtlasRows,
  selectAtlasOverviewGroups,
  resolveAtlasRelationshipLens,
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
      relationship_class: "correlation",
      provenance_class: "federal_published",
      publication_status: "published",
      confidence: "direct",
    },
    {
      id: "edge:candidate",
      source_node_id: "nist-800-53:AC-2",
      target_node_id: "disa-cci:CCI-000001",
      relationship_type: "related_to",
      relationship_class: "correlation",
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
  assert.equal(groups[0]?.lens, "cross-framework");
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
    lens: "structure" as const,
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

test("relationship lens resolution chooses the first populated explicit lens", () => {
  const implementOnly = [
    {
      id: "disa",
      label: "DISA implementation",
      description: "Implementation link",
      placement: "downstream" as const,
      lens: "implementation" as const,
      items: [{} as never],
    },
  ];
  assert.equal(resolveAtlasRelationshipLens(implementOnly, ""), "implementation");
  assert.equal(
    resolveAtlasRelationshipLens(implementOnly, "control"),
    "implementation",
  );
});

test("CA-ATL-004: enhancements remain structural while applicability is a separate lens", () => {
  const explicit: AtlasNeighborhoodRecord = {
    center_node: record.center_node,
    nodes: [
      record.center_node,
      {
        id: "nist-800-53:AC-2.1",
        node_type: "control_enhancement",
        metadata: { item_id: "AC-2.1", title: "Automated system accounts" },
      },
      {
        id: "nist-800-53b:MODERATE",
        node_type: "baseline",
        metadata: { item_id: "MODERATE", title: "Moderate baseline" },
      },
    ],
    edges: [
      {
        id: "edge:enhancement",
        source_node_id: "nist-800-53:AC-2",
        target_node_id: "nist-800-53:AC-2.1",
        relationship_type: "contains",
        relationship_class: "structural",
        provenance_class: "federal_published",
        publication_status: "published",
        confidence: "direct",
      },
      {
        id: "edge:baseline",
        source_node_id: "nist-800-53b:MODERATE",
        target_node_id: "nist-800-53:AC-2",
        relationship_type: "selects",
        relationship_class: "applicability",
        provenance_class: "federal_published",
        publication_status: "published",
        confidence: "direct",
      },
    ],
    published_connection_count: 2,
    candidate_connection_count: 0,
  };

  const groups = buildAtlasGroups(explicit, publishedOnly);
  assert.equal(
    groups.find((group) => group.id === "enhancements")?.lens,
    "structure",
  );
  assert.equal(
    groups.find((group) => group.id === "nistBaseline")?.lens,
    "applicability",
  );
  assert.deepEqual(
    new Set(buildAtlasRows(explicit, publishedOnly).map((row) => row.edge.id)),
    new Set(
      groups.flatMap((group) => group.items.map((item) => item.edge.id)),
    ),
  );
});
