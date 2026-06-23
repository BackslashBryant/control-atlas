import assert from "node:assert/strict";
import test from "node:test";

import { classifySource } from "../../src/ui/graph/classifySource.ts";
import { sourceToGraphRole } from "../../src/ui/graph/sourceToGraphRole.ts";

const expectations = [
  ["nist-sp-800-53-r5", "control-catalog"],
  ["fips-199", "authority"],
  ["fips-200", "authority"],
  ["nist-sp-800-53a-r5", "assessment-scoping"],
  ["disa-stig-library", "implementation-standard"],
  ["disa-cci-list", "mapping-crosswalk"],
  ["mitre-attack-enterprise", "threat-defense"],
  ["mitre-d3fend", "threat-defense"],
] as const;

test("sources map to compliance roles rather than publishers", () => {
  for (const [sourceId, expectedRole] of expectations) {
    assert.equal(sourceToGraphRole(classifySource(sourceId)), expectedRole);
  }
});
