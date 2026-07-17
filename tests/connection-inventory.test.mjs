import assert from "node:assert/strict";
import test from "node:test";

import { buildConnectionInventory } from "../src/ui/lib/connectionInventory.mjs";

test("connection inventory counts records and published incident links by practical category", () => {
  const inventory = buildConnectionInventory(
    [
      { id: "r1", node_type: "requirement" },
      { id: "r2", node_type: "srg_requirement" },
      { id: "c1", node_type: "control" },
      { id: "c2", node_type: "control_enhancement" },
      { id: "t1", node_type: "attack_technique" },
    ],
    [
      { source_node_id: "r1", target_node_id: "c1", publication_status: "published" },
      { source_node_id: "r2", target_node_id: "c1", publication_status: "published" },
      { source_node_id: "c1", target_node_id: "c2", publication_status: "published" },
      { source_node_id: "t1", target_node_id: "r1", publication_status: "candidate" },
    ],
  );

  assert.equal(inventory.totalRecords, 5);
  assert.equal(inventory.publishedLinks, 3);
  assert.deepEqual(
    inventory.rows.find((row) => row.id === "requirements"),
    {
      id: "requirements",
      label: "Requirements",
      totalRecords: 2,
      connectedRecords: 2,
      publishedLinks: 2,
      relatedCategories: ["Controls"],
    },
  );
  assert.deepEqual(
    inventory.rows.find((row) => row.id === "controls"),
    {
      id: "controls",
      label: "Controls",
      totalRecords: 2,
      connectedRecords: 2,
      publishedLinks: 3,
      relatedCategories: ["Requirements"],
    },
  );
  assert.deepEqual(
    inventory.rows.find((row) => row.id === "threats-defenses"),
    {
      id: "threats-defenses",
      label: "Threats and defenses",
      totalRecords: 1,
      connectedRecords: 0,
      publishedLinks: 0,
      relatedCategories: [],
    },
  );
});
