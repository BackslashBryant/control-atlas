const DISCLAIMER = "Control Atlas is an open-source reference tool. It is not an official government system and does not make compliance, authorization, or risk decisions. All mappings and templates are reference aids based on public sources. Official decisions remain with the applicable Authorizing Official, agency, or program office.";

function generateSecurityPlanStarter(options, controls) {
  return {
    title: "System Security Plan (SSP) Starter",
    description: "Blank planning structure for a system security plan.",
    sections: [
      { type: "text", heading: "System Overview", content: "[Insert system name and description here]" },
      { type: "text", heading: "Authorization Boundary", content: "[Describe the authorization boundary here]" },
      { type: "text", heading: "System Environment", content: `Archetype: ${options.environment || 'Generic'}` },
      { type: "text", heading: "Data Types", content: "[List data types and sensitivity levels]" },
      { type: "text", heading: "User Roles", content: "[List user roles and privileges]" },
      { type: "text", heading: "Interconnections", content: "[List system interconnections]" },
      { 
        type: "table", 
        heading: "Control Baseline", 
        headers: ["Control ID", "Control Title", "Implementation Status", "Responsible Role", "Notes"],
        rows: controls.map(c => [c.id, c.title, "[Status]", "[Role]", "[Notes]"])
      },
      { type: "text", heading: "Revision History", content: "[Version / Date / Author / Notes]" }
    ]
  };
}

function generateImplementationStatementWorksheet(options, controls) {
  return {
    title: "Control Implementation Statement Worksheet",
    description: "Worksheet to draft control implementation statements.",
    sections: [
      {
        type: "table",
        heading: "Implementation Statements",
        headers: ["Control ID", "Control Title", "Implementation Statement", "Responsible Role", "Status"],
        rows: controls.map(c => [c.id, c.title, "[Draft statement here]", "[Role]", "[Status]"])
      }
    ]
  };
}

function generateEvidenceExpectationMatrix(options, controls) {
  return {
    title: "Evidence Expectation Matrix",
    description: "Reference matrix for expected evidence types.",
    sections: [
      {
        type: "table",
        heading: "Evidence Expectations",
        headers: ["Control ID", "Control Title", "Control Family", "Related STIG/SRG", "Related CCIs", "Evidence Type", "Example Artifacts", "Owner Role", "Review Cadence", "Notes"],
        rows: controls.map(c => [
          c.id, c.title, c.family || '', 
          "[STIG references]", "[CCI references]", 
          "[Evidence type]", "[Example artifacts]", "[Role]", "[Cadence]", "[Notes]"
        ])
      }
    ]
  };
}

function generateSTIGEvidenceChecklist(options, controls) {
  // Normally we would pass STIG rules, for now we will use a generic placeholder table
  return {
    title: "STIG Evidence Checklist",
    description: "Blank checklist for STIG rule compliance evidence.",
    sections: [
      {
        type: "table",
        heading: "STIG Rules",
        headers: ["STIG Title", "STIG ID", "Rule ID", "Severity", "Requirement", "Evidence Expectation", "Validation Method", "NA Justification", "Deviation", "Notes"],
        rows: [
          ["[STIG Title]", "[STIG ID]", "[Rule ID]", "[Severity]", "[Requirement title]", "[Expected evidence]", "[Method]", "[If N/A]", "[If Deviation]", "[Notes]"]
        ]
      }
    ]
  };
}

function generateInheritanceWorksheet(options, controls) {
  return {
    title: "Inheritance Worksheet",
    description: "Worksheet to plan control inheritance.",
    sections: [
      {
        type: "table",
        heading: "Inheritance Plan",
        headers: ["Control ID", "Control Title", "Inheritance Type", "Common Control Provider", "Provider Responsibility", "Customer Responsibility", "Evidence Dependency", "Local Review Needed", "Notes"],
        rows: controls.map(c => [
          c.id, c.title, "[Type]", "[Provider]", "[Provider resp]", "[Customer resp]", "[Dependency]", "[Yes/No]", "[Notes]"
        ])
      }
    ]
  };
}

function generateReciprocityChecklist(options) {
  return {
    title: "Reciprocity Checklist",
    description: "Checklist to review a package for reciprocity.",
    sections: [
      { type: "text", heading: "Granting Authorization Reference", content: "[Reference ID/Name]" },
      { type: "text", heading: "Receiving Organization", content: "[Organization Name]" },
      {
        type: "table",
        heading: "Body of Evidence Checklist",
        headers: ["Item", "Status", "Notes"],
        rows: [
          ["SSP", "[Status]", "[Notes]"],
          ["SAR", "[Status]", "[Notes]"],
          ["POA&M", "[Status]", "[Notes]"],
          ["Boundary Comparison", "[Status]", "[Notes]"],
          ["Risk Acceptance Review", "[Status]", "[Notes]"],
          ["Artifact Freshness", "[Status]", "[Notes]"]
        ]
      }
    ]
  };
}

function generatePOAMStarter(options) {
  return {
    title: "POA&M Starter",
    description: "Blank Plan of Action and Milestones tracker.",
    sections: [
      {
        type: "table",
        heading: "POA&M Items",
        headers: ["Weakness ID", "Source", "Related Control", "Description", "Risk Statement", "Severity", "Planned Remediation", "Milestone", "Scheduled Date", "Responsible Role", "Status", "Notes"],
        rows: [
          ["[ID-1]", "[Source]", "[Control]", "[Description]", "[Risk]", "[Severity]", "[Remediation]", "[Milestone]", "[Date]", "[Role]", "[Open/Closed]", "[Notes]"]
        ]
      }
    ]
  };
}

function generateAssessmentPlanningWorksheet(options, controls) {
  return {
    title: "Assessment Planning Worksheet",
    description: "Worksheet to plan control assessments.",
    sections: [
      {
        type: "table",
        heading: "Assessment Plan",
        headers: ["Control ID", "Control Title", "Assessment Method", "Assessor", "Target Date", "Status", "Observations"],
        rows: controls.map(c => [c.id, c.title, "[Test/Interview/Examine]", "[Assessor]", "[Date]", "[Status]", "[Notes]"])
      }
    ]
  };
}

function generateConMonCalendar(options) {
  return {
    title: "Continuous Monitoring Calendar",
    description: "Calendar template for continuous monitoring activities.",
    sections: [
      {
        type: "table",
        heading: "Monitoring Schedule",
        headers: ["Activity/Artifact", "Control Reference", "Frequency", "Next Review Date", "Responsible Role", "Status"],
        rows: [
          ["[Activity name]", "[Controls]", "[Annual/Monthly]", "[Date]", "[Role]", "[Status]"]
        ]
      }
    ]
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
  // CSV can only effectively represent one table. We use the first table section or flatten.
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
  // Very basic YAML formatter since we don't have a library
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
  // Find controls if a framework/baseline is selected
  let controls = [];
  if (options.framework) {
    controls = dataset.nodes
      .filter(n => n.type === 'control' && n.id.startsWith(options.framework))
      .map(n => ({
        id: n.id,
        title: n.title || n.id,
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
      doc = generateSTIGEvidenceChecklist(options, controls);
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
