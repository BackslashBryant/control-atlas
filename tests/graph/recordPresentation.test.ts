import assert from "node:assert/strict";
import test from "node:test";

import {
  missingRequiredRecordFields,
  recordPresentationProfile,
} from "../../src/shared/record-presentation.mjs";

test("record presentation profiles use source-native headings", () => {
  assert.equal(recordPresentationProfile("nist-800-53", "control").sections[0].heading, "Control Statement");
  assert.equal(recordPresentationProfile("nist-800-171", "requirement").sections[0].heading, "Requirement");
  assert.equal(recordPresentationProfile("disa-stig", "stig_rule").sections[0].heading, "Discussion");
  assert.equal(recordPresentationProfile("mitre-attack", "attack_technique").sections[0].heading, "Technique Description");
  assert.equal(recordPresentationProfile("mitre-d3fend", "defend_countermeasure").sections[0].heading, "Countermeasure Description");
  const assessmentProfile = recordPresentationProfile("nist-800-53a", "assessment_procedure");
  assert.equal(assessmentProfile.sections[0].heading, "Assessment Procedure");
  assert.equal(assessmentProfile.sections[0].field, "procedure_text");
});

test("record presentation rejects unknown kinds and missing required source fields", () => {
  assert.throws(
    () => recordPresentationProfile("future-catalog", "future_record"),
    /Missing record presentation profile/,
  );
  const profile = recordPresentationProfile("disa-stig", "stig_rule");
  assert.deepEqual(
    missingRequiredRecordFields(profile, { description: "Discussion", check_text: "Check" }),
    ["fix_text"],
  );
});

test("catalog-specific profiles preserve source-native nouns", () => {
  assert.equal(recordPresentationProfile("csf-2", "requirement").sections[0].heading, "Outcome");
  assert.equal(recordPresentationProfile("nist-ssdf", "requirement").sections[0].heading, "Practice");
  assert.equal(recordPresentationProfile("nist-ai-rmf", "requirement").sections[0].heading, "Action");
  assert.equal(recordPresentationProfile("dod-rai", "requirement").sections[0].heading, "Guidance");
});
