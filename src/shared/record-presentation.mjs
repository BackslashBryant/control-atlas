const DESCRIPTION = Object.freeze({ field: "description", heading: "Requirement", kind: "text" });

const BASE_PROFILES = Object.freeze({
  assessment_procedure: Object.freeze({
    sections: Object.freeze([
      Object.freeze({ field: "procedure_text", heading: "Assessment Procedure", kind: "text" }),
      Object.freeze({ field: "assessment_objectives", heading: "Objectives", kind: "objectives" }),
      Object.freeze({ field: "assessment_method_details", heading: "Methods", kind: "methods" }),
    ]),
    required: Object.freeze(["procedure_text", "assessment_objectives", "assessment_method_details"]),
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
  iot_capability_domain: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Capability Domain", kind: "text" })]), required: Object.freeze(["description"]) }),
  iot_capability: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Capability", kind: "text" })]), required: Object.freeze(["description"]) }),
  iot_subcapability: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Sub-Capability", kind: "text" })]), required: Object.freeze(["description"]) }),
  iot_capability_element: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Capability Element", kind: "text" }), Object.freeze({ field: "publisher_mappings", heading: "Publisher Mappings", kind: "publisher_mappings" })]), required: Object.freeze(["description"]) }),
  iot_capability_subelement: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Capability Sub-Element", kind: "text" }), Object.freeze({ field: "publisher_mappings", heading: "Publisher Mappings", kind: "publisher_mappings" })]), required: Object.freeze(["description"]) }),
  mobile_threat_category: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Threat Category", kind: "text" })]), required: Object.freeze(["description"]) }),
  mobile_threat: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Threat", kind: "text" }), Object.freeze({ field: "threat_origin", heading: "Published Origin", kind: "text" }), Object.freeze({ field: "exploit_examples", heading: "Exploit Examples", kind: "list" }), Object.freeze({ field: "cve_examples", heading: "CVE Examples", kind: "list" }), Object.freeze({ field: "countermeasures", heading: "Possible Countermeasures", kind: "countermeasures" })]), required: Object.freeze(["description"]) }),
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
  zt_assessment_question: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Assessment Guidance", kind: "text" }), Object.freeze({ field: "answer_options", heading: "Answer Options", kind: "list" })]), required: Object.freeze(["description", "answer_options"]) }),
  zt_build: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Implementation Summary", kind: "text" }), Object.freeze({ field: "architecture_sections", heading: "Architecture", kind: "structured" }), Object.freeze({ field: "implementation_sections", heading: "Implementation Guide", kind: "structured" })]), required: Object.freeze(["description", "architecture_sections", "implementation_sections"]) }),
  zt_capability: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Capability", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_collaborator: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Collaborator", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_cloud_native_requirement: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Cloud-Native Zero Trust Requirement", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_document: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Document Summary", kind: "text" }), Object.freeze({ field: "document_sections", heading: "Publisher Overview", kind: "structured" })]), required: Object.freeze(["description", "document_sections"]) }),
  zt_overlay_section: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Overlay Section", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_logical_component: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Logical Component", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_mapping_document: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Mapping Workbook", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_pillar: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Pillar Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_product_component: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Implemented Function", kind: "text" }), Object.freeze({ field: "mapping_targets", heading: "Publisher Mapping Targets", kind: "mapping_targets" })]), required: Object.freeze(["description"]) }),
  zt_publication: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Publication Summary", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_reference_component: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Reference Architecture Function", kind: "text" })]), required: Object.freeze(["description"]) }),
  zt_tenet: Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Tenet", kind: "text" })]), required: Object.freeze(["description"]) }),
});

const CATALOG_OVERRIDES = Object.freeze({
  "disa-cci:requirement": Object.freeze({ sections: Object.freeze([DESCRIPTION, Object.freeze({ field: "references", heading: "Publisher References", kind: "references" })]), required: Object.freeze(["description"]) }),
  "csf-2:requirement": Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Outcome", kind: "text" })]), required: Object.freeze(["description"]) }),
  "dod-rai:requirement": Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Guidance", kind: "text" })]), required: Object.freeze(["description"]) }),
  "dod-zt:zt_activity": Object.freeze({ sections: Object.freeze([Object.freeze({ field: "description", heading: "Activity", kind: "text" }), Object.freeze({ field: "outcomes", heading: "Published Outcomes", kind: "text" }), Object.freeze({ field: "end_state", heading: "Published End State", kind: "text" }), Object.freeze({ field: "predecessors", heading: "Predecessor Activities", kind: "list" }), Object.freeze({ field: "successors", heading: "Successor Activities", kind: "list" })]), required: Object.freeze(["description"]) }),
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
