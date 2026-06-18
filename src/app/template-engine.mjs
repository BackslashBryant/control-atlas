/**
 * @typedef {Object} TextSection
 * @property {"text"} type
 * @property {string} heading
 * @property {string} content
 *
 * @typedef {Object} TableSection
 * @property {"table"} type
 * @property {string} heading
 * @property {string[]} headers
 * @property {any[][]} rows
 *
 * @typedef {TextSection | TableSection} DocSection
 *
 * @typedef {Object} TemplateDocument
 * @property {string} title
 * @property {string} description
 * @property {DocSection[]} sections
 */

const DISCLAIMER = "Control Atlas is an open-source reference tool. It is not an official government system and does not make compliance, authorization, or risk decisions. All mappings and templates are reference aids based on public sources. Official decisions remain with the applicable Authorizing Official, agency, or program office.";

/**
 * @param {{ id: string, title?: string }} control
 * @returns {string}
 */
function controlReference(control) {
  return control.title ? `${control.title} (${control.id})` : control.id;
}

/**
 * @param {any} options
 * @param {any[]} controls
 * @returns {TemplateDocument}
 */
function generateSecurityPlanStarter(options, controls) {
  const headers = ["Control ID", "Control Title", "Implementation Status", "Responsible Role"];
  if (options.includeImplementationPrompts) headers.push("Implementation Prompt");
  if (options.includeEvidenceExpectations) headers.push("Evidence Expectation");
  if (options.includeInheritancePrompts) headers.push("Inheritance Prompt");
  if (options.includeReciprocityPrompts) headers.push("Reciprocity Prompt");
  if (options.includeStigReferences) headers.push("STIG References");
  headers.push("Notes");

  const ph = (txt) => (options.includePlaceholders ? txt : "");

  const rows = controls.map(c => {
    const row = [c.id, c.title, ph("[Status]"), ph("[Role]")];
    if (options.includeImplementationPrompts) row.push(`How is ${controlReference(c)} implemented in the ${options.environment || 'system'} environment?`);
    if (options.includeEvidenceExpectations) row.push(`Expected evidence for ${controlReference(c)}.`);
    if (options.includeInheritancePrompts) row.push(`Is ${controlReference(c)} inherited from a parent common control provider?`);
    if (options.includeReciprocityPrompts) row.push(`Can assessment results for ${controlReference(c)} be reused via reciprocity?`);
    if (options.includeStigReferences) row.push(ph("[Related STIG/SRG Rules]"));
    row.push(ph("[Notes]"));
    return row;
  });

  /** @type {DocSection[]} */
  const sections = [
    { type: "text", heading: "System Overview", content: ph("[Insert system name and description here]") },
    { type: "text", heading: "Authorization Boundary", content: ph("[Describe the authorization boundary here]") },
    { type: "text", heading: "System Environment", content: `Environment type: ${options.environment || 'Generic'}` },
    { type: "text", heading: "Data Types", content: ph("[List data types and sensitivity levels]") },
    { type: "text", heading: "User Roles", content: ph("[List user roles and privileges]") },
    { type: "text", heading: "Interconnections", content: ph("[List system interconnections]") },
    { type: "table", heading: "Control Baseline", headers, rows },
    { type: "text", heading: "Revision History", content: ph("[Version / Date / Author / Notes]") }
  ];

  if (options.includeSourceFootnotes) {
    sections.push({
      type: "text",
      heading: "Source Information and Footnotes",
      content: `Framework context: ${options.framework || 'Generic NIST SP 800-53'}\nEnvironment type: ${options.environment || 'Generic'}`
    });
  }

  return {
    title: "System Security Plan (SSP) Starter",
    description: "Blank planning structure for a system security plan.",
    sections
  };
}

/**
 * @param {any} options
 * @param {any[]} controls
 * @returns {TemplateDocument}
 */
function generateImplementationStatementWorksheet(options, controls) {
  const headers = ["Control ID", "Control Title", "Implementation Statement", "Responsible Role"];
  if (options.includeImplementationPrompts) headers.push("Implementation Prompt");
  headers.push("Status");

  const ph = (txt) => (options.includePlaceholders ? txt : "");

  const rows = controls.map(c => {
    const row = [c.id, c.title, ph("[Draft statement here]"), ph("[Role]")];
    if (options.includeImplementationPrompts) row.push(`Describe the technical controls, policies, or mechanisms implementing ${controlReference(c)}.`);
    row.push(ph("[Status]"));
    return row;
  });

  /** @type {DocSection[]} */
  const sections = [
    { type: "table", heading: "Implementation Statements", headers, rows }
  ];

  if (options.includeSourceFootnotes) {
    sections.push({
      type: "text",
      heading: "Source Metadata",
      content: `Derived from framework: ${options.framework || 'Generic'} under environment: ${options.environment || 'Generic'}.`
    });
  }

  return {
    title: "Control Implementation Statement Worksheet",
    description: "Worksheet to draft control implementation statements.",
    sections
  };
}

/**
 * @param {any} options
 * @param {any[]} controls
 * @returns {TemplateDocument}
 */
function generateEvidenceExpectationMatrix(options, controls) {
  const headers = ["Control ID", "Control Title", "Control Family"];
  if (options.includeStigReferences) headers.push("Related STIG/SRG");
  if (options.includeEvidenceExpectations) headers.push("Evidence Type", "Example Artifacts");
  headers.push("Owner Role", "Review Cadence", "Notes");

  const ph = (txt) => (options.includePlaceholders ? txt : "");

  const rows = controls.map(c => {
    const row = [c.id, c.title, c.family || ''];
    if (options.includeStigReferences) row.push(ph("[STIG references]"));
    if (options.includeEvidenceExpectations) row.push(ph("[Evidence type]"), ph("[Example artifacts]"));
    row.push(ph("[Role]"), ph("[Cadence]"), ph("[Notes]"));
    return row;
  });

  /** @type {DocSection[]} */
  const sections = [
    { type: "table", heading: "Evidence Expectations", headers, rows }
  ];

  if (options.includeSourceFootnotes) {
    sections.push({
      type: "text",
      heading: "Source Metadata",
      content: `Generated evidence expectations under baseline: ${options.framework || 'Generic'}.`
    });
  }

  return {
    title: "Evidence Expectation Matrix",
    description: "Reference matrix for expected evidence types.",
    sections
  };
}

/**
 * @param {any} options
 * @returns {TemplateDocument}
 */
function generateSTIGEvidenceChecklist(options) {
  const headers = ["STIG Title", "STIG ID", "Rule ID", "Severity", "Requirement"];
  if (options.includeEvidenceExpectations) headers.push("Evidence Expectation");
  headers.push("Validation Method", "NA Justification", "Deviation", "Notes");

  const ph = (txt) => (options.includePlaceholders ? txt : "");

  const row = [ph("[STIG Title]"), ph("[STIG ID]"), ph("[Rule ID]"), ph("[Severity]"), ph("[Requirement title]")];
  if (options.includeEvidenceExpectations) row.push(ph("[Expected evidence]"));
  row.push(ph("[Method]"), ph("[If N/A]"), ph("[If Deviation]"), ph("[Notes]"));

  /** @type {DocSection[]} */
  const sections = [
    { type: "table", heading: "STIG Rules", headers, rows: [row] }
  ];

  if (options.includeSourceFootnotes) {
    sections.push({
      type: "text",
      heading: "Source Metadata",
      content: "STIG/SRG checklist generated from public DISA guidelines."
    });
  }

  return {
    title: "STIG Evidence Checklist",
    description: "Blank checklist for STIG rule compliance evidence.",
    sections
  };
}

/**
 * @param {any} options
 * @param {any[]} controls
 * @returns {TemplateDocument}
 */
function generateInheritanceWorksheet(options, controls) {
  const headers = ["Control ID", "Control Title", "Inheritance Type"];
  if (options.includeInheritancePrompts) headers.push("Provider Responsibility", "Customer Responsibility");
  headers.push("Evidence Dependency", "Local Review Needed", "Notes");

  const ph = (txt) => (options.includePlaceholders ? txt : "");

  const rows = controls.map(c => {
    const row = [c.id, c.title, ph("[Type]")];
    if (options.includeInheritancePrompts) row.push(ph("[Provider resp]"), ph("[Customer resp]"));
    row.push(ph("[Dependency]"), ph("[Yes/No]"), ph("[Notes]"));
    return row;
  });

  /** @type {DocSection[]} */
  const sections = [
    { type: "table", heading: "Inheritance Plan", headers, rows }
  ];

  if (options.includeSourceFootnotes) {
    sections.push({
      type: "text",
      heading: "Source Metadata",
      content: `Inheritance mapping for ${options.framework || 'selected baseline'}.`
    });
  }

  return {
    title: "Inheritance Worksheet",
    description: "Worksheet to plan control inheritance.",
    sections
  };
}

/**
 * @param {any} options
 * @returns {TemplateDocument}
 */
function generateReciprocityChecklist(options) {
  const ph = (txt) => (options.includePlaceholders ? txt : "");

  const headers = ["Item", "Status"];
  if (options.includeReciprocityPrompts) headers.push("Reciprocity Guidance");
  headers.push("Notes");

  const rows = [
    ["SSP (System Security Plan)", ph("[Status]")],
    ["SAR (Security Assessment Report)", ph("[Status]")],
    ["POA&M (Plan of Action and Milestones)", ph("[Status]")],
    ["Boundary Comparison", ph("[Status]")],
    ["Risk Acceptance Review", ph("[Status]")],
    ["Artifact Freshness", ph("[Status]")]
  ];

  if (options.includeReciprocityPrompts) {
    rows[0].push("Verify the System Security Plan (SSP) matches the receiving agency's boundary requirements.");
    rows[1].push("Confirm Security Assessment Report (SAR) results show adequate independent testing.");
    rows[2].push("Assess open POA&M items and scheduled remediation dates.");
    rows[3].push("Check if data flow and boundary align with the new deployment.");
    rows[4].push("Ensure all accepted risks are signed off by the original AO.");
    rows[5].push("Confirm artifacts are less than 1 year old or fit review cadence.");
  }
  rows.forEach(r => {
    if (r.length < headers.length) {
      r.push(ph("[Notes]"));
    } else {
      r.splice(headers.length - 1, 0, ph("[Notes]"));
    }
  });

  /** @type {DocSection[]} */
  const sections = [
    { type: "text", heading: "Granting Authorization Reference", content: ph("[Reference ID/Name]") },
    { type: "text", heading: "Receiving Organization", content: ph("[Organization Name]") },
    { type: "table", heading: "Body of Evidence Checklist", headers, rows }
  ];

  if (options.includeSourceFootnotes) {
    sections.push({
      type: "text",
      heading: "Source Metadata",
      content: "Reciprocity checklists are reference tools based on NIST SP 800-37 Rev. 2."
    });
  }

  return {
    title: "Reciprocity Checklist",
    description: "Checklist to review a package for reciprocity.",
    sections
  };
}

/**
 * @param {any} options
 * @returns {TemplateDocument}
 */
function generatePOAMStarter(options) {
  const ph = (txt) => (options.includePlaceholders ? txt : "");

  const headers = ["Weakness ID", "Source", "Related Control", "Description", "Risk Statement", "Severity", "Planned Remediation"];
  if (options.includeImplementationPrompts) headers.push("Milestone / Step");
  headers.push("Scheduled Date", "Responsible Role", "Status", "Notes");

  const row = [ph("[ID-1]"), ph("[Source]"), ph("[Control]"), ph("[Description]"), ph("[Risk]"), ph("[Severity]"), ph("[Remediation]")];
  if (options.includeImplementationPrompts) row.push(ph("[Milestone]"));
  row.push(ph("[Date]"), ph("[Role]"), ph("[Open/Closed]"), ph("[Notes]"));

  /** @type {DocSection[]} */
  const sections = [
    { type: "table", heading: "POA&M Items", headers, rows: [row] }
  ];

  if (options.includeSourceFootnotes) {
    sections.push({
      type: "text",
      heading: "Source Metadata",
      content: "POA&M starter table aligned with NIST SP 800-37 RMF requirements."
    });
  }

  return {
    title: "POA&M Starter",
    description: "Blank Plan of Action and Milestones tracker.",
    sections
  };
}

/**
 * @param {any} options
 * @param {any[]} controls
 * @returns {TemplateDocument}
 */
function generateAssessmentPlanningWorksheet(options, controls) {
  const headers = ["Control ID", "Control Title"];
  if (options.includeEvidenceExpectations) headers.push("Assessment Method");
  headers.push("Assessor", "Target Date", "Status", "Observations");

  const ph = (txt) => (options.includePlaceholders ? txt : "");

  const rows = controls.map(c => {
    const row = [c.id, c.title];
    if (options.includeEvidenceExpectations) row.push(ph("[Test/Interview/Examine]"));
    row.push(ph("[Assessor]"), ph("[Date]"), ph("[Status]"), ph("[Notes]"));
    return row;
  });

  /** @type {DocSection[]} */
  const sections = [
    { type: "table", heading: "Assessment Plan", headers, rows }
  ];

  if (options.includeSourceFootnotes) {
    sections.push({
      type: "text",
      heading: "Source Metadata",
      content: `Assessment worksheet generated for baseline: ${options.framework || 'Generic'}.`
    });
  }

  return {
    title: "Assessment Planning Worksheet",
    description: "Worksheet to plan control assessments.",
    sections
  };
}

/**
 * @param {any} options
 * @returns {TemplateDocument}
 */
function generateConMonCalendar(options) {
  const ph = (txt) => (options.includePlaceholders ? txt : "");

  const headers = ["Activity/Artifact", "Control Reference", "Frequency"];
  if (options.includeSourceFootnotes) headers.push("Source Basis Reference");
  headers.push("Next Review Date", "Responsible Role", "Status");

  const row = [ph("[Activity name]"), ph("[Controls]"), ph("[Annual/Monthly]")];
  if (options.includeSourceFootnotes) row.push(ph("[NIST SP 800-137]"));
  row.push(ph("[Date]"), ph("[Role]"), ph("[Status]"));

  /** @type {DocSection[]} */
  const sections = [
    { type: "table", heading: "Monitoring Schedule", headers, rows: [row] }
  ];

  if (options.includeSourceFootnotes) {
    sections.push({
      type: "text",
      heading: "Source Metadata",
      content: "Continuous Monitoring schedule based on NIST SP 800-137 continuous monitoring guidelines."
    });
  }

  return {
    title: "Continuous Monitoring Calendar",
    description: "Calendar template for continuous monitoring activities.",
    sections
  };
}

function escapeCsv(val) {
  if (val == null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function formatMarkdown(doc) {
  let out = `# ${doc.title}\n\n${doc.description}\n\n> **Disclaimer:** ${DISCLAIMER}\n\n`;
  for (const sec of doc.sections) {
    out += `## ${sec.heading}\n\n`;
    if (sec.type === 'text') {
      out += `${sec.content}\n\n`;
    } else if (sec.type === 'table') {
      out += `| ${sec.headers.join(' | ')} |\n`;
      out += `| ${sec.headers.map(() => '---').join(' | ')} |\n`;
      for (const row of sec.rows) {
        out += `| ${row.map(c => String(c).replace(/\n/g, '<br>')).join(' | ')} |\n`;
      }
      out += '\n';
    }
  }
  return out;
}

function formatCsv(doc) {
  const table = doc.sections.find(s => s.type === 'table');
  let out = `# ${doc.title}\n# Disclaimer: ${DISCLAIMER.replace(/\n/g, ' ')}\n`;
  if (table) {
    out += table.headers.map(escapeCsv).join(',') + '\n';
    for (const row of table.rows) {
      out += row.map(escapeCsv).join(',') + '\n';
    }
  } else {
    out += "Section,Content\n";
    for (const sec of doc.sections) {
      if (sec.type === 'text') {
        out += `${escapeCsv(sec.heading)},${escapeCsv(sec.content)}\n`;
      }
    }
  }
  return out;
}

function formatJson(doc) {
  const output = {
    title: doc.title,
    description: doc.description,
    disclaimer: DISCLAIMER,
    sections: doc.sections
  };
  return JSON.stringify(output, null, 2);
}

function formatYaml(doc) {
  let out = `title: "${doc.title.replace(/"/g, '\\"')}"\n`;
  out += `description: "${doc.description.replace(/"/g, '\\"')}"\n`;
  out += `disclaimer: "${DISCLAIMER.replace(/"/g, '\\"')}"\n`;
  out += `sections:\n`;
  for (const sec of doc.sections) {
    out += `  - heading: "${sec.heading.replace(/"/g, '\\"')}"\n`;
    out += `    type: ${sec.type}\n`;
    if (sec.type === 'text') {
      out += `    content: "${sec.content.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
    } else if (sec.type === 'table') {
      out += `    headers:\n`;
      for (const h of sec.headers) {
        out += `      - "${h.replace(/"/g, '\\"')}"\n`;
      }
      out += `    rows:\n`;
      for (const row of sec.rows) {
        out += `      - [${row.map(c => `"${String(c).replace(/"/g, '\\"')}"`).join(', ')}]\n`;
      }
    }
  }
  return out;
}

export function generateTemplate(options, dataset) {
  let controls = [];
  if (options.framework) {
    controls = dataset.nodes
      .filter(n => (n.node_type === 'control' || n.node_type === 'control_enhancement') && n.metadata?.catalog_id === options.framework)
      .map(n => ({
        id: n.metadata?.item_id || n.id,
        title: n.metadata?.title || n.label || n.id,
        family: n.metadata?.control_family || ''
      }));
  }
  if (controls.length === 0) {
    controls = [
      { id: "[Control ID]", title: "[Control Title]", family: "[Family]" }
    ];
  }

  let doc;
  switch (options.templateType) {
    case 'security_plan_starter':
      doc = generateSecurityPlanStarter(options, controls);
      break;
    case 'implementation_statement_worksheet':
      doc = generateImplementationStatementWorksheet(options, controls);
      break;
    case 'evidence_expectation_matrix':
      doc = generateEvidenceExpectationMatrix(options, controls);
      break;
    case 'stig_evidence_checklist':
      doc = generateSTIGEvidenceChecklist(options);
      break;
    case 'inheritance_worksheet':
      doc = generateInheritanceWorksheet(options, controls);
      break;
    case 'reciprocity_checklist':
      doc = generateReciprocityChecklist(options);
      break;
    case 'poam_starter':
      doc = generatePOAMStarter(options);
      break;
    case 'assessment_planning_worksheet':
      doc = generateAssessmentPlanningWorksheet(options, controls);
      break;
    case 'conmon_calendar':
      doc = generateConMonCalendar(options);
      break;
    default:
      doc = generateSecurityPlanStarter(options, controls);
  }

  let content;
  let extension;
  let mimeType;

  switch (options.format) {
    case 'csv':
      content = formatCsv(doc);
      extension = 'csv';
      mimeType = 'text/csv';
      break;
    case 'json':
      content = formatJson(doc);
      extension = 'json';
      mimeType = 'application/json';
      break;
    case 'yaml':
      content = formatYaml(doc);
      extension = 'yaml';
      mimeType = 'text/yaml';
      break;
    case 'markdown':
    default:
      content = formatMarkdown(doc);
      extension = 'md';
      mimeType = 'text/markdown';
      break;
  }

  const filename = `${options.templateType.replace(/_/g, '-')}-${new Date().toISOString().split('T')[0]}.${extension}`;
  return { content, filename, mimeType };
}
