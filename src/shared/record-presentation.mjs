const DESCRIPTION = Object.freeze({ field: "description", heading: "Requirement", kind: "text" });

const BASE_PROFILES = Object.freeze({
  assessment_procedure: Object.freeze({
    sections: Object.freeze([
      Object.freeze({ field: "description", heading: "Assessment Procedure", kind: "text" }),
      Object.freeze({ field: "assessment_objectives", heading: "Objectives", kind: "objectives" }),
      Object.freeze({ field: "assessment_method_details", heading: "Methods", kind: "methods" }),
    ]),
    required: Object.freeze(["description", "assessment_objectives", "assessment_method_details"]),
  }),
  attack_technique: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Technique Description", kind: "text" })]), required: Object.freeze(["description"]) }),
  baseline: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Baseline", kind: "text" })]), required: Object.freeze(["description"]) }),
  benchmark: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Benchmark Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  catalog: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Publication Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  category: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Category Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  control: Object.freeze({
    sections: Object.freeze([
      Object.freeze({ field: "description", heading: "Control Statement", kind: "text" }),
      Object.freeze({ field: "discussion", heading: "Discussion", kind: "text" }),
    ]),
    required: Object.freeze(["description"]),
  }),
  control_enhancement: Object.freeze({
    sections: Object.freeze([
      Object.freeze({ field: "description", heading: "Control Statement", kind: "text" }),
      Object.freeze({ field: "discussion", heading: "Discussion", kind: "text" }),
    ]),
    required: Object.freeze(["description"]),
  }),
  defend_countermeasure: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Countermeasure Description", kind: "text" })]), required: Object.freeze(["description"]) }),
  family: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Family Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  function: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Function Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  group: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Group Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  impact_category: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Impact Category", kind: "text" })]), required: Object.freeze(["description"]) }),
  policy: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Policy Statement", kind: "text" })]), required: Object.freeze(["description"]) }),
  program: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Program Level", kind: "text" })]), required: Object.freeze(["description"]) }),
  requirement: Object.freeze({
    sections: Object.freeze([
      DESCRIPTION,
      Object.freeze({ field: "discussion", heading: "Discussion", kind: "text" }),
      Object.freeze({ field: "implementation_examples", heading: "Implementation Examples", kind: "list" }),
    ]),
    required: Object.freeze(["description"]),
  }),
  rmf_step: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "RMF Step", kind: "text" })]), required: Object.freeze(["description"]) }),
  srg_requirement: Object.freeze({
    sections: Object.freeze([
      Object.freeze({ field: "description", heading: "Discussion", kind: "text" }),
      Object.freeze({ field: "check_text", heading: "Check", kind: "text" }),
      Object.freeze({ field: "fix_text", heading: "Fix", kind: "text" }),
    ]),
    required: Object.freeze(["description", "check_text", "fix_text"]),
  }),
  stig_rule: Object.freeze({
    sections: Object.freeze([
      Object.freeze({ field: "description", heading: "Discussion", kind: "text" }),
      Object.freeze({ field: "check_text", heading: "Check", kind: "text" }),
      Object.freeze({ field: "fix_text", heading: "Fix", kind: "text" }),
    ]),
    required: Object.freeze(["description", "check_text", "fix_text"]),
  }),
  tactic: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Tactic Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_activity: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Activity", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_capability: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Capability", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_document: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Document Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_overlay_section: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Overlay Section", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_pillar: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Pillar Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_tenet: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Tenet", kind: "text" })]), required: Object.freeze(["description"]) }),
});

const CATALOG_OVERRIDES = Object.freeze({
  "csf-2:requirement": Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Outcome", kind: "text" })]), required: Object.freeze(["description"]) }),
  "dod-rai:requirement": Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Guidance", kind: "text" })]), required: Object.freeze(["description"]) }),
  "nist-ai-rmf:requirement": Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Action", kind: "text" })]), required: Object.freeze(["description"]) }),
  "nist-ssdf:requirement": Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Practice", kind: "text" })]), required: Object.freeze(["description"]) }),
});

export const SUPPORTED_RECORD_TYPES = Object.freeze(Object.keys(BASE_PROFILES));

export function recordPresentationProfile(catalogId, nodeType) {
  const profile = CATALOG_OVERRIDES[`${catalogId}:${nodeType}`] || BASE_PROFILES[nodeType];
  if (!profile) throw new Error(`Missing record presentation profile for ${catalogId}:${nodeType}`);
  return profile;
}

export function missingRequiredRecordFields(profile, metadata = {}) {
  return profile.required.filter((field) => {
    const value = metadata[field];
    return Array.isArray(value) ? value.length === 0 : !String(value || "").trim();
  });
}
