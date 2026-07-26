import assert from "node:assert/strict";
import test from "node:test";
import {
  pickCanonicalCciParent,
  deriveCciHierarchyParents,
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
