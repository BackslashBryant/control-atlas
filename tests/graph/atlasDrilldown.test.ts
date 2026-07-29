import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  edge("family-ac-1", "nist-800-53:FAMILY-AC", "nist-800-53:AC-1", "contains"),
  edge("family-ac-2", "nist-800-53:FAMILY-AC", "nist-800-53:AC-2", "contains"),
  edge("family-au-2", "nist-800-53:FAMILY-AU", "nist-800-53:AU-2", "contains"),
  edge("low-ac-1", "nist-800-53b:LOW", "nist-800-53:AC-1", "selects"),
  edge("moderate-ac-1", "nist-800-53b:MODERATE", "nist-800-53:AC-1", "selects"),
  edge("moderate-ac-2", "nist-800-53b:MODERATE", "nist-800-53:AC-2", "selects"),
  edge("moderate-au-2", "nist-800-53b:MODERATE", "nist-800-53:AU-2", "selects"),
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
    description: `${title} official description`,
    metadata: {
      catalog_id: catalogId,
      item_id: itemId,
      title,
      description: `${title} official description`,
    },
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  relationshipType: string,
  relationshipClass = relationshipType === "contains"
    ? "structural"
    : relationshipType === "selects"
      ? "applicability"
      : "correlation",
): AtlasDrillEdge {
  return {
    id,
    source_node_id: source,
    target_node_id: target,
    relationship_type: relationshipType,
    relationship_class: relationshipClass,
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
        description: "Moderate Impact Baseline official description",
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

test("CA-ATL-005: supported framework selector exposes four validated hierarchy groups", () => {
  const structuralNodes: AtlasDrillNode[] = [
    node("nist-800-53:CATALOG", "catalog", "CATALOG", "SP 800-53"),
    node("nist-800-53:FAMILY-AC", "family", "FAMILY-AC", "Access Control"),
    node("csf-2:CATALOG", "catalog", "CATALOG", "CSF 2.0", "csf-2"),
    node("csf-2:FUNCTION-GV", "function", "GV", "Govern", "csf-2"),
    node("cmmc-2:CATALOG", "catalog", "CATALOG", "CMMC 2.0", "cmmc-2"),
    node("cmmc-2:LEVEL-1", "program_level", "LEVEL-1", "Level 1", "cmmc-2"),
    node(
      "mitre-attack:CATALOG",
      "catalog",
      "CATALOG",
      "MITRE ATT&CK Enterprise",
      "mitre-attack",
    ),
    node(
      "mitre-attack:TA0001",
      "tactic",
      "TA0001",
      "Initial Access",
      "mitre-attack",
    ),
  ];
  const structuralEdges: AtlasDrillEdge[] = [
    edge(
      "nist-root",
      "nist-800-53:CATALOG",
      "nist-800-53:FAMILY-AC",
      "contains",
    ),
    edge(
      "csf-root",
      "csf-2:CATALOG",
      "csf-2:FUNCTION-GV",
      "contains",
    ),
    edge(
      "cmmc-root",
      "cmmc-2:CATALOG",
      "cmmc-2:LEVEL-1",
      "contains",
    ),
    edge(
      "attack-root",
      "mitre-attack:CATALOG",
      "mitre-attack:TA0001",
      "contains",
    ),
  ];

  const model = buildAtlasDrilldownModel({
    nodes: structuralNodes,
    edges: structuralEdges,
  });
  assert.equal(model.frameworkGroups.length, 4);
  assert.deepEqual(
    model.frameworkGroups.flatMap((group) =>
      group.frameworks.map((framework) => framework.id),
    ),
    ["nist-800-53", "csf-2", "cmmc-2", "mitre-attack"],
  );
  assert.ok(
    model.frameworkGroups
      .flatMap((group) => group.frameworks)
      .every((framework) => framework.units.length > 0),
  );
});

test("generated framework selector choices are meaningful and never dead ends", () => {
  const generatedNodes = JSON.parse(
    readFileSync("data/generated/nodes.json", "utf8"),
  ).nodes as AtlasDrillNode[];
  const generatedEdges = JSON.parse(
    readFileSync("data/generated/edges.json", "utf8"),
  ).edges as AtlasDrillEdge[];
  const model = buildAtlasDrilldownModel({
    nodes: generatedNodes,
    edges: generatedEdges,
  });
  const frameworks = model.frameworkGroups.flatMap(
    (group) => group.frameworks,
  );

  assert.deepEqual(
    frameworks.map((framework) => framework.id),
    ["nist-800-53", "csf-2", "cmmc-2", "mitre-attack"],
  );
  assert.ok(
    frameworks.every(
      (framework) =>
        framework.units.length > 0 &&
        framework.units.every(
          (unit) => unit.id.length > 0 && unit.label.trim().length > 0,
        ),
    ),
  );
});

test("guided Atlas indexes structural edges once instead of rescanning per unit", () => {
  const scaleNodes: AtlasDrillNode[] = [
    node("nist-800-53:CATALOG", "catalog", "CATALOG", "SP 800-53"),
  ];
  const scaleEdges: AtlasDrillEdge[] = [];
  for (let familyIndex = 0; familyIndex < 100; familyIndex += 1) {
    const familyId = `nist-800-53:FAMILY-${familyIndex}`;
    scaleNodes.push(
      node(familyId, "family", `FAMILY-${familyIndex}`, `Family ${familyIndex}`),
    );
    scaleEdges.push(
      edge(`root-${familyIndex}`, "nist-800-53:CATALOG", familyId, "contains"),
    );
    for (let recordIndex = 0; recordIndex < 10; recordIndex += 1) {
      const recordId = `nist-800-53:C-${familyIndex}-${recordIndex}`;
      scaleNodes.push(
        node(
          recordId,
          "control",
          `C-${familyIndex}-${recordIndex}`,
          `Control ${familyIndex}-${recordIndex}`,
        ),
      );
      scaleEdges.push(
        edge(
          `record-${familyIndex}-${recordIndex}`,
          familyId,
          recordId,
          "contains",
        ),
      );
    }
  }

  let endpointReads = 0;
  const trackedEdges = scaleEdges.map(
    (candidate) =>
      new Proxy(candidate, {
        get(target, property, receiver) {
          if (property === "source_node_id" || property === "target_node_id") {
            endpointReads += 1;
          }
          return Reflect.get(target, property, receiver);
        },
      }),
  );

  const model = buildAtlasDrilldownModel({
    nodes: scaleNodes,
    edges: trackedEdges,
  });

  assert.equal(model.frameworkGroups[0]?.frameworks[0]?.units.length, 100);
  assert.ok(
    endpointReads < scaleEdges.length * 20,
    `expected linear edge indexing, observed ${endpointReads} endpoint reads`,
  );
});
