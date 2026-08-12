import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  missingRequiredRecordFields,
  recordPresentationProfile,
  SUPPORTED_RECORD_TYPES,
} from "../../src/shared/record-presentation.mjs";
import {
  buildSourceTextPresentation,
  isValidSourceTextPresentation,
} from "../../src/shared/source-text-presentation.mjs";

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

test("every supported record form has a presentation contract", () => {
  assert.equal(new Set(SUPPORTED_RECORD_TYPES).size, SUPPORTED_RECORD_TYPES.length);
  for (const recordType of SUPPORTED_RECORD_TYPES) {
    const profile = recordPresentationProfile("generic", recordType);
    assert.ok(profile.sections.length > 0, `${recordType} sections`);
    assert.ok(profile.required.length > 0, `${recordType} required fields`);
  }
});

test("V-256609 formatting keeps exact command and configuration source ranges", () => {
  const records = JSON.parse(readFileSync("data/stig-rules.json", "utf8")).records;
  const record = records.find((entry: any) => entry.id === "V-256609");
  assert.ok(record, "V-256609 must remain in the current DISA corpus");
  const { check_text: check, fix_text: fix } = record;

  for (const text of [check, fix]) {
    const presentation = buildSourceTextPresentation(text);
    assert.equal(isValidSourceTextPresentation(text, presentation), true);
    const snippets = presentation.blocks.filter((block) => block.kind === "code");
    assert.ok(snippets.length > 0);
    for (const snippet of snippets) {
      assert.equal(text.slice(snippet.start, snippet.end), text.substring(snippet.start, snippet.end));
      assert.match(text.slice(snippet.start, snippet.end), /^# /);
    }
  }
  const fixPresentation = buildSourceTextPresentation(fix);
  assert.equal(fixPresentation.blocks.filter((block) => block.kind === "list").length, 2);
  assert.equal(fixPresentation.blocks.filter((block) => block.kind === "code").length, 2);
});
