import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAtlasDrilldownModel,
  type AtlasDrillEdge,
  type AtlasDrillNode,
} from "../../src/ui/lib/atlasDrilldown";
import {
  normalizeViewState,
  parseViewState,
  serializeViewState,
} from "../../src/ui/lib/viewState";

const nodes: AtlasDrillNode[] = [
  node("nist-800-53:FAMILY-AC", "family", "FAMILY-AC", "Access Control"),
  node("nist-800-53:FAMILY-AU", "family", "FAMILY-AU", "Audit and Accountability"),
  node("nist-800-53:AC-1", "control", "AC-1", "Policy and Procedures"),
  node("nist-800-53:AC-2", "control", "AC-2", "Account Management"),
  node("nist-800-53:AU-2", "control", "AU-2", "Event Logging"),
  node("nist-800-53b:LOW", "baseline", "LOW", "Low Impact Baseline", "nist-800-53b"),
  node(
    "nist-800-53b:MODERATE",
    "baseline",
    "MODERATE",
    "Moderate Impact Baseline",
    "nist-800-53b",
  ),
  node("nist-800-37:RMF-SELECT", "rmf_step", "RMF-SELECT", "Select", "nist-800-37"),
];

const edges: AtlasDrillEdge[] = [
  edge("family-ac-1", "nist-800-53:FAMILY-AC", "nist-800-53:AC-1", "includes"),
  edge("family-ac-2", "nist-800-53:FAMILY-AC", "nist-800-53:AC-2", "includes"),
  edge("family-au-2", "nist-800-53:FAMILY-AU", "nist-800-53:AU-2", "includes"),
  edge("low-ac-1", "nist-800-53b:LOW", "nist-800-53:AC-1", "includes"),
  edge("moderate-ac-1", "nist-800-53b:MODERATE", "nist-800-53:AC-1", "includes"),
  edge("moderate-ac-2", "nist-800-53b:MODERATE", "nist-800-53:AC-2", "includes"),
  edge("moderate-au-2", "nist-800-53b:MODERATE", "nist-800-53:AU-2", "includes"),
  edge("rmf-select", "nist-800-37:RMF-SELECT", "nist-800-53b:MODERATE", "selects"),
];

function node(
  id: string,
  nodeType: string,
  itemId: string,
  title: string,
  catalogId = "nist-800-53",
): AtlasDrillNode {
  return {
    id,
    node_type: nodeType,
    label: `${itemId} ${title}`,
    plain_language_summary: `${title} summary`,
    metadata: { catalog_id: catalogId, item_id: itemId, title },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  relationshipType: string,
): AtlasDrillEdge {
  return {
    id,
    source_node_id: source,
    target_node_id: target,
    relationship_type: relationshipType,
    publication_status: "published",
  };
}

test("baseline choices contain only selected records grouped by real family edges", () => {
  const model = buildAtlasDrilldownModel({ nodes, edges });
  const low = model.baselines.find((baseline) => baseline.itemId === "LOW");
  const moderate = model.baselines.find(
    (baseline) => baseline.itemId === "MODERATE",
  );

  assert.equal(low?.recordCount, 1);
  assert.deepEqual(
    moderate?.families.map((family) => [
      family.itemId,
      family.records.map((record) => record.itemId),
    ]),
    [
      ["FAMILY-AC", ["AC-1", "AC-2"]],
      ["FAMILY-AU", ["AU-2"]],
    ],
  );
});

test("RMF choices expose only published graph results and preserve relationship class", () => {
  const model = buildAtlasDrilldownModel({ nodes, edges });

  assert.deepEqual(
    model.rmfSteps.find((step) => step.itemId === "RMF-SELECT")?.results,
    [
      {
        id: "nist-800-53b:MODERATE",
        itemId: "MODERATE",
        label: "Moderate Impact Baseline",
        description: "Moderate Impact Baseline summary",
        nodeType: "baseline",
        relationshipType: "selects",
      },
    ],
  );
});

test("guided Atlas selections survive URL serialization and parsing", () => {
  const state = normalizeViewState("atlas-map", {
    view: "atlas-map",
    atlasAxis: "framework",
    atlasFramework: "nist-800-53",
    atlasBaseline: "nist-800-53b:MODERATE",
    atlasFamily: "nist-800-53:FAMILY-AC",
  });
  const parsed = parseViewState(serializeViewState(state));

  assert.equal(parsed.view, "atlas-map");
  if (parsed.view !== "atlas-map") return;
  assert.equal(parsed.atlasAxis, "framework");
  assert.equal(parsed.atlasFramework, "nist-800-53");
  assert.equal(parsed.atlasBaseline, "nist-800-53b:MODERATE");
  assert.equal(parsed.atlasFamily, "nist-800-53:FAMILY-AC");
  assert.equal(parsed.atlasRmfStep, "");
});
