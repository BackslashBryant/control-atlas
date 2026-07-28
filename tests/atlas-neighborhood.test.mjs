import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  atlasNeighborhoodShardId,
  buildAtlasNeighborhoodShards,
  buildAtlasNodeIndex,
} from "../src/app/atlas-neighborhood.mjs";

test("Atlas neighborhood sharding is deterministic and preserves canonical edges", () => {
  const graph = {
    nodes: [
      { id: "a", node_type: "control", label: "A", metadata: { item_id: "A", title: "Alpha" } },
      { id: "b", node_type: "control", label: "B", metadata: { item_id: "B", title: "Beta" } },
      { id: "c", node_type: "control", label: "C", metadata: { item_id: "C", title: "Gamma" } },
    ],
    edges: [
      {
        id: "edge:published",
        source_node_id: "a",
        target_node_id: "b",
        relationship_type: "maps_to",
        provenance_class: "federal_published",
        publication_status: "published",
        confidence: "direct",
        source_refs: [{ source_id: "source-a", ref_type: "primary", locator: "row-1" }],
      },
      {
        id: "edge:candidate",
        source_node_id: "a",
        target_node_id: "c",
        relationship_type: "related_to",
        provenance_class: "inferred",
        publication_status: "candidate",
        confidence: "low",
        source_refs: [],
      },
    ],
  };

  const first = buildAtlasNeighborhoodShards(graph, 8);
  const second = buildAtlasNeighborhoodShards(graph, 8);
  assert.deepEqual(first, second);
  assert.deepEqual(buildAtlasNodeIndex(graph)[0], ["a", "control", "A", "Alpha", ""]);

  const record = first
    .find((shard) => shard.shard_id === atlasNeighborhoodShardId("a", 8))
    .records.a;
  assert.equal(record.published_connection_count, 1);
  assert.equal(record.candidate_connection_count, 1);
  assert.deepEqual(record.structural_path, ["a"]);
  assert.deepEqual(record.edges.map((edge) => edge[0]), ["edge:published", "edge:candidate"]);

  const zeroRecord = first
    .find((shard) => shard.shard_id === atlasNeighborhoodShardId("c", 8))
    .records.c;
  assert.equal(zeroRecord.published_connection_count, 0);
  assert.equal(zeroRecord.candidate_connection_count, 1);
});

test("Atlas neighborhood records carry the canonical structural path for cold deep links", () => {
  const graph = {
    nodes: [
      { id: "x:root", node_type: "catalog", label: "Catalog", metadata: { catalog_id: "x" } },
      { id: "x:family", node_type: "family", label: "Family", metadata: { catalog_id: "x" } },
      { id: "x:item", node_type: "control", label: "Item", metadata: { catalog_id: "x" } },
    ],
    edges: [
      {
        id: "root-family",
        source_node_id: "x:root",
        target_node_id: "x:family",
        relationship_type: "contains",
        relationship_class: "structural",
        publication_status: "published",
        source_refs: [],
      },
      {
        id: "family-item",
        source_node_id: "x:family",
        target_node_id: "x:item",
        relationship_type: "contains",
        relationship_class: "structural",
        publication_status: "published",
        source_refs: [],
      },
    ],
  };
  const shards = buildAtlasNeighborhoodShards(graph, 8);
  const record = shards
    .find((shard) => shard.shard_id === atlasNeighborhoodShardId("x:item", 8))
    .records["x:item"];
  assert.deepEqual(record.structural_path, [
    "x:root",
    "x:family",
    "x:item",
  ]);
});

test("generated Atlas shards contain only incident canonical edges", () => {
  const canonicalEdges = new Map(
    JSON.parse(readFileSync("data/generated/edges.json", "utf8")).edges.map((edge) => [edge.id, edge]),
  );
  const canonicalNodeIds = new Set(
    JSON.parse(readFileSync("data/generated/nodes.json", "utf8")).nodes.map(
      (node) => node.id,
    ),
  );
  const shardDir = "data/generated/atlas-neighborhood";
  const shardedNodeIds = new Set();
  let recordCount = 0;
  for (const filename of readdirSync(shardDir)) {
    const artifact = JSON.parse(readFileSync(join(shardDir, filename), "utf8"));
    for (const [nodeId, record] of Object.entries(artifact.atlas_neighborhood_shard.records)) {
      recordCount += 1;
      shardedNodeIds.add(nodeId);
      for (const compactEdge of record.edges) {
        const [edgeId, sourceNodeId, targetNodeId] = compactEdge;
        assert.ok(canonicalEdges.has(edgeId), `${edgeId} must be canonical`);
        assert.ok(
          sourceNodeId === nodeId || targetNodeId === nodeId,
          `${edgeId} must touch ${nodeId}`,
        );
      }
    }
  }
  // Stronger than the previous hardcoded `recordCount === 11_486`: assert the
  // invariant that literal was standing in for — the shards cover EXACTLY the
  // canonical node set, with no missing and no orphaned shard records. A magic
  // number silently had to be bumped on every legitimate data change (it broke
  // when the GRC tier nodes were added) while never actually proving coverage.
  assert.equal(recordCount, canonicalNodeIds.size);
  const missing = [...canonicalNodeIds].filter((id) => !shardedNodeIds.has(id));
  const orphaned = [...shardedNodeIds].filter((id) => !canonicalNodeIds.has(id));
  assert.deepEqual(missing, [], "every canonical node needs a shard record");
  assert.deepEqual(orphaned, [], "no shard record may reference a dropped node");
});
