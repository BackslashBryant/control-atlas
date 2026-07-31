import assert from "node:assert/strict";
import test from "node:test";
import {
  pickCanonicalCciParent,
  deriveCciHierarchyParents,
  deriveAssessmentProcedureParents,
  deriveEditorialSpine,
  deriveSyntheticCatalogs,
} from "../scripts/hierarchy-derivation.mjs";

const catalogs = {
  assessmentProcedureItemIds: new Set(["AC-1", "AC-2.1"]),
  controlItemIds: new Set(["AC-1", "AC-2", "AC-2.1", "AC-3"]),
};

test("pickCanonicalCciParent prefers an assessment_procedure match over a control-only match", () => {
  const picked = pickCanonicalCciParent(["AC-3", "AC-1"], catalogs);
  assert.deepEqual(picked, { controlId: "AC-1", tier: "assessment_procedure" });
});

test("pickCanonicalCciParent falls back to the control tier when no candidate has an assessment_procedure", () => {
  const picked = pickCanonicalCciParent(["AC-3"], catalogs);
  assert.deepEqual(picked, { controlId: "AC-3", tier: "control" });
});

test("pickCanonicalCciParent keeps first-occurrence order (direct evidence before crosswalk-derived)", () => {
  const picked = pickCanonicalCciParent(["AC-2.1", "AC-1"], catalogs);
  assert.deepEqual(picked, { controlId: "AC-2.1", tier: "assessment_procedure" });
});

test("pickCanonicalCciParent returns null when nothing resolves", () => {
  assert.equal(pickCanonicalCciParent(["ZZ-99"], catalogs), null);
  assert.equal(pickCanonicalCciParent([], catalogs), null);
});

test("deriveCciHierarchyParents resolves via direct relationships first, crosswalk second, and reports genuine residue", () => {
  const result = deriveCciHierarchyParents({
    cciItemIds: ["CCI-A", "CCI-B", "CCI-C"],
    directRelationships: [{ source_id: "CCI-A", target_id: "AC-1" }],
    crosswalkRelationships: [
      { source_id: "CCI-B", target_id: "AC-3" },
      { source_id: "CCI-C", target_id: "ZZ-99" },
    ],
    ...catalogs,
  });
  assert.deepEqual(result.parents.get("CCI-A"), {
    controlId: "AC-1",
    tier: "assessment_procedure",
  });
  assert.deepEqual(result.parents.get("CCI-B"), {
    controlId: "AC-3",
    tier: "control",
  });
  assert.equal(result.parents.has("CCI-C"), false);
  assert.deepEqual(result.unresolved, ["CCI-C"]);
});

test("deriveCciHierarchyParents dedupes repeated candidates without changing the outcome", () => {
  const result = deriveCciHierarchyParents({
    cciItemIds: ["CCI-A"],
    directRelationships: [
      { source_id: "CCI-A", target_id: "AC-3" },
      { source_id: "CCI-A", target_id: "AC-3" },
    ],
    crosswalkRelationships: [{ source_id: "CCI-A", target_id: "AC-1" }],
    ...catalogs,
  });
  // AC-3 (control-only) came first in direct evidence; AC-1 (assessment_procedure)
  // is only in crosswalk-derived evidence but still wins the tier preference.
  assert.deepEqual(result.parents.get("CCI-A"), {
    controlId: "AC-1",
    tier: "assessment_procedure",
  });
});

test("deriveAssessmentProcedureParents reverses the single assesses edge into a parent", () => {
  const { parents, extraTargets } = deriveAssessmentProcedureParents([
    { source_id: "AC-2.1_smt.a", target_id: "AC-2.1" },
    { source_id: "AC-3_obj.1", target_id: "AC-3" },
  ]);
  assert.deepEqual(parents.get("AC-2.1_smt.a"), { controlId: "AC-2.1" });
  assert.deepEqual(parents.get("AC-3_obj.1"), { controlId: "AC-3" });
  assert.equal(extraTargets.size, 0);
});

test("deriveAssessmentProcedureParents keeps the first target and reports extras rather than dropping them", () => {
  const { parents, extraTargets } = deriveAssessmentProcedureParents([
    { source_id: "AC-2.1_smt.a", target_id: "AC-2.1" },
    { source_id: "AC-2.1_smt.a", target_id: "AC-2" },
    { source_id: "AC-2.1_smt.a", target_id: "AC-1" },
  ]);
  assert.deepEqual(parents.get("AC-2.1_smt.a"), { controlId: "AC-2.1" });
  assert.deepEqual(extraTargets.get("AC-2.1_smt.a"), ["AC-2", "AC-1"]);
});

const spineFixture = {
  trunk: { id: "atlas:TRUNK", label: "Cybersecurity" },
  limbs: [
    { id: "atlas:LIMB-COMPLIANCE", label: "Compliance" },
    { id: "atlas:LIMB-THREAT", label: "Threats & Defense" },
  ],
  catalogLimbs: {
    "nist-800-53": "atlas:LIMB-COMPLIANCE",
    "mitre-attack": "atlas:LIMB-THREAT",
  },
  syntheticCatalogs: [
    { catalog_id: "fips-199", limb: "atlas:LIMB-COMPLIANCE" },
    { catalog_id: "ghost", limb: "atlas:LIMB-THREAT" },
  ],
};

const catalogIdOf = (node) => node.metadata.catalog_id;

test("deriveEditorialSpine emits one edge per limb plus one per resolved catalog root", () => {
  const roots = [
    { id: "nist-800-53:CATALOG", metadata: { catalog_id: "nist-800-53" } },
    { id: "mitre-attack:CATALOG", metadata: { catalog_id: "mitre-attack" } },
  ];
  const { organizesEdges, unassigned } = deriveEditorialSpine(roots, spineFixture, catalogIdOf);
  assert.equal(organizesEdges.length, spineFixture.limbs.length + roots.length);
  assert.deepEqual(unassigned, []);
  assert.ok(
    organizesEdges.some((e) => e.source_id === "atlas:TRUNK" && e.target_id === "atlas:LIMB-COMPLIANCE"),
  );
  assert.ok(
    organizesEdges.some((e) => e.source_id === "atlas:LIMB-THREAT" && e.target_id === "mitre-attack:CATALOG"),
  );
});

test("deriveEditorialSpine reports an unassigned catalog root rather than dropping it", () => {
  const roots = [{ id: "unknown-cat:CATALOG", metadata: { catalog_id: "unknown-cat" } }];
  const { organizesEdges, unassigned } = deriveEditorialSpine(roots, spineFixture, catalogIdOf);
  assert.deepEqual(unassigned, ["unknown-cat:CATALOG"]);
  // only the limb->trunk edges, no catalog edge for the unassigned root
  assert.equal(organizesEdges.length, spineFixture.limbs.length);
});

test("deriveSyntheticCatalogs collects same-catalog children and reports declared-but-empty wrappers", () => {
  const nodes = [
    { id: "fips-199:FIPS-199-HIGH", metadata: { catalog_id: "fips-199" } },
    { id: "fips-199:FIPS-199-LOW", metadata: { catalog_id: "fips-199" } },
    { id: "nist-800-53:AC-2", metadata: { catalog_id: "nist-800-53" } },
  ];
  const { wrappers, empty } = deriveSyntheticCatalogs(nodes, spineFixture, catalogIdOf);
  assert.equal(wrappers.length, 1);
  assert.deepEqual(wrappers[0], {
    catalogId: "fips-199",
    catalogNodeId: "fips-199:CATALOG",
    limbId: "atlas:LIMB-COMPLIANCE",
    childIds: ["fips-199:FIPS-199-HIGH", "fips-199:FIPS-199-LOW"],
  });
  assert.deepEqual(empty, ["ghost"]);
});
