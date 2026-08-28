import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildTemplateDocument } from '../src/app/template-engine.mjs';

const registry = JSON.parse(readFileSync('data/template-registry.json', 'utf8'));
const dataset = {
  nodes: [
    {
      id: 'nist-800-53:AC-2',
      node_type: 'control',
      lifecycle_status: 'active',
      plain_language_summary: 'Manage accounts through an approved lifecycle.',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-2',
        title: 'Account Management',
        control_family: 'Access Control',
      },
    },
  ],
  edges: [],
  sources: [],
};

function build(templateType) {
  return buildTemplateDocument(
    {
      templateType,
      framework: ['hardware_baseline', 'software_baseline', 'ppsm_preparation_worksheet', 'stig_evidence_checklist', 'poam_starter', 'reciprocity_checklist'].includes(templateType)
        ? ''
        : 'nist-800-53',
      environment: 'Cloud SaaS',
      sourceRefs: registry.templates.find((item) => item.name === templateType)?.source_refs || [],
    },
    dataset,
  ).doc;
}

function headers(templateType, heading) {
  const table = build(templateType).sections.find(
    (section) => section.type === 'table' && (!heading || section.heading === heading),
  );
  assert.ok(table, `${templateType} missing expected table ${heading || ''}`);
  return table.headers;
}

const REQUIRED_FIELDS = {
  implementation_statement_worksheet: ['acronym', 'implementationStatus', 'controlDesignation', 'responsibleEntities', 'implementationNarrative', 'Evidence References', 'slcmFrequency', 'Review Notes'],
  evidence_expectation_matrix: ['Evidence Owner', 'Collection Method', 'Collection Cadence', 'Evidence Date / Period', 'Repository / Location', 'Confidence', 'Review Status', 'Assessor Notes'],
  inheritance_worksheet: ['Provider Evidence', 'Evidence Version / Date', 'Evidence Freshness Status', 'Local Responsibility', 'Local Delta', 'Validation Method', 'Decision Basis', 'Decision Owner', 'Review Date', 'Notes / Gaps'],
  reciprocity_checklist: ['Artifact / Decision Reference', 'Version / Date', 'Owner', 'Status', 'Freshness / Scope Check', 'Receiving-Environment Delta', 'Risk / Gap', 'Required Action', 'Due Date', 'Decision / Disposition'],
  poam_starter: ['externalUid', 'status', 'vulnerabilityDescription', 'sourceIdentifyingVulnerability', 'pocOrganization', 'resources', 'Milestones with Completion Dates', 'scheduledCompletionDate', 'Evidence Needed for Closure', 'comments'],
  assessment_planning_worksheet: ['Assessment Objective / Scope', 'Assessment Method', 'Assessor Role', 'Evidence to Request', 'Sampling Approach', 'Tool / Procedure', 'Target Start', 'Target Complete', 'Status', 'Result / Test Success', 'Finding / POA&M Reference'],
  conmon_calendar: ['Deliverable / Evidence', 'Collection Method', 'Frequency', 'Owner', 'Reviewer / Recipient', 'Evidence Location', 'Next Due', 'Completed Date', 'Status', 'Result / Threshold', 'Escalation / Follow-up'],
  hardware_baseline: ['assetName', 'componentType', 'assetIpAddress', 'publicFacing', 'manufacturer', 'modelNumber', 'serialNumber', 'osIosFwVersion', 'approvalStatus', 'criticalAsset', 'Asset Owner', 'Last Verified', 'Lifecycle Status'],
  software_baseline: ['softwareVendor', 'softwareName', 'version', 'softwareType', 'softwareDependencies', 'cryptographicHash', 'approvalStatus', 'endOfLifeSupportDate', 'Software Owner', 'Authority / Approved Use', 'Last Verified'],
  ppsm_preparation_worksheet: ['System / Boundary', 'Mission or Business Need', 'Service Name', 'Protocol', 'Port / Range', 'Transport', 'Source Zone / Address', 'Destination Zone / Address', 'Direction', 'Public / External Exposure', 'Existing PPSM / Approval Reference', 'Review Status'],
};

test('professionalized artifacts retain the operational fields needed to do the job', () => {
  for (const [templateType, expected] of Object.entries(REQUIRED_FIELDS)) {
    const actual = headers(templateType);
    for (const field of expected) {
      assert.ok(actual.includes(field), `${templateType} missing operational field: ${field}`);
    }
  }
});

test('STIG preparation table exactly matches the official STIG Viewer 12-column CSV contract', () => {
  assert.deepEqual(headers('stig_evidence_checklist', 'STIG Viewer CSV Import Rows'), [
    'Benchmark ID',
    'Rule ID',
    'Status',
    'Comments',
    'Finding Details',
    'Severity Override',
    'Severity Override Reason',
    'FQDN',
    'IP Address',
    'MAC Address',
    'Host Name',
    'Technology Area',
  ]);
});

test('all twelve artifacts include compatibility limitations and source metadata', () => {
  assert.equal(registry.templates.length, 12);
  for (const template of registry.templates) {
    const doc = build(template.name);
    const sections = new Map(doc.sections.map((section) => [section.heading, section]));
    assert.ok(sections.has('Compatibility and Use'), `${template.name} missing compatibility section`);
    assert.ok(sections.has('Source Metadata'), `${template.name} missing source metadata`);
    assert.ok(sections.has('Review and Handoff Checklist'), `${template.name} missing final quality-control steps`);
    assert.match(sections.get('Compatibility and Use').content, /Classification:/);
    assert.match(sections.get('Compatibility and Use').content, /Limit:/);
    assert.doesNotMatch(template.description, /eMASS[- ]importable|FedRAMP[- ]approved|guarantees compliance/i);
  }
});

test('evidence operations and dense control cross-references are separated', () => {
  const doc = build('evidence_expectation_matrix');
  const evidence = doc.sections.find((section) => section.heading === 'Evidence Expectations');
  const references = doc.sections.find((section) => section.heading === 'Control Cross-Reference Index');
  assert.ok(evidence, 'evidence operating table must exist');
  assert.ok(references, 'cross-reference index must exist');
  assert.doesNotMatch(evidence.headers.join('|'), /CCI|STIG/, 'dense mappings do not belong in the operating view');
  assert.deepEqual(references.headers, ['Control ID', 'Control Title', 'Related CCIs', 'Related STIG/SRG']);
});

test('the SSP starter stays compact and hands control-by-control work to its dedicated companion', () => {
  const doc = build('security_plan_starter');
  const familyIndex = doc.sections.find((section) => section.heading === 'Control Family Index');
  const scope = doc.sections.find((section) => section.heading === 'Selected Control Scope');
  assert.ok(familyIndex, 'SSP starter needs a compact control-family index');
  assert.ok(scope, 'SSP starter needs an exact selected-scope summary');
  assert.match(scope.content, /1 published control record/);
  assert.match(scope.content, /Implementation Statement Worksheet/);
  assert.deepEqual(familyIndex.headers, ['Control Family', 'Selected Records', 'Compact ID Index', 'Detailed Work Location']);
  assert.equal(familyIndex.rows.length, 1);
  assert.match(familyIndex.rows[0].join(' | '), /Access Control.*AC-2.*Implementation Statement Worksheet/);
  assert.equal(doc.sections.some((section) => section.heading === 'Control Baseline'), false);
  assert.equal(doc.sections.some((section) => section.heading === 'STIG/SRG References'), false);
});

test('FedRAMP-related companions state the current 2026 transition boundary', () => {
  const affected = [
    'security_plan_starter',
    'implementation_statement_worksheet',
    'evidence_expectation_matrix',
    'inheritance_worksheet',
    'reciprocity_checklist',
    'poam_starter',
    'assessment_planning_worksheet',
    'conmon_calendar',
    'hardware_baseline',
    'software_baseline',
  ];
  for (const templateType of affected) {
    const section = build(templateType).sections.find(
      (candidate) => candidate.heading === 'Current FedRAMP 2026 Context',
    );
    assert.ok(section, `${templateType} needs current FedRAMP context`);
  }
  assert.match(
    build('security_plan_starter').sections.find((section) => section.heading === 'Current FedRAMP 2026 Context').content,
    /Certification Package Overview replaces the historical Rev5 SSP/i,
  );
  assert.match(
    build('assessment_planning_worksheet').sections.find((section) => section.heading === 'Current FedRAMP 2026 Context').content,
    /does not require a separate SAP or SAR for either 20x or Rev5/i,
  );
  assert.match(
    build('poam_starter').sections.find((section) => section.heading === 'Current FedRAMP 2026 Context').content,
    /not automatically an agency POA&M/i,
  );
  assert.match(
    build('hardware_baseline').sections.find((section) => section.heading === 'Current FedRAMP 2026 Context').content,
    /machine-readable information-resource data.*code used to generate it/i,
  );
});
