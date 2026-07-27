import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildTemplateDocument, generateTemplate } from '../src/app/template-engine.mjs';
import { renderOfficeDocument } from '../src/app/office-export.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(join(__dirname, '../data/template-registry.json'), 'utf8'));

const dataset = {
  nodes: [
    {
      id: 'nist-800-53:AC-2',
      node_type: 'control',
      label: 'AC-2 Account Management',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-2',
        title: 'Account Management',
        control_family: 'Access Control',
      },
    },
  ],
  sources: [
    {
      id: 'nist-oscal',
      display_name: 'SP 800-53 Rev. 5',
      version: '2026-06-09',
    },
  ],
};

for (const template of registry.templates) {
  for (const format of template.supported_formats) {
    test(`export contract: ${template.name} (${format}) is a generated document with source context`, async () => {
      const { doc, frameworkResolutionError } = buildTemplateDocument(
        {
          templateType: template.name,
          framework: 'nist-800-53',
          environment: 'Cloud SaaS',
          format,
          sourceRefs: template.source_refs || [],
          sources: dataset.sources,
        },
        dataset,
      );
      assert.equal(frameworkResolutionError, null, 'Template should resolve the selected framework');
      const content = JSON.stringify(doc);
      assert.match(content, /Source Metadata/, 'Generated document is missing source metadata');
      assert.match(content, /Limit:/, 'Generated document is missing its limitation');
      const rendered = renderOfficeDocument(doc, format);
      assert.equal(rendered.extension, format, `Unexpected export extension for ${format}`);
      assert.ok(rendered.bytes.byteLength > 0, 'Generated document is empty');
      assert.equal(String.fromCharCode(...rendered.bytes.slice(0, 2)), 'PK');
    });
  }
}

test('all twelve artifact companions are registered', () => {
  assert.equal(registry.templates.length, 12);
});

test('registry templates have non-empty source_refs', () => {
  for (const template of registry.templates) {
    assert.ok(Array.isArray(template.source_refs), `${template.name} missing source_refs`);
    assert.ok(template.source_refs.length > 0, `${template.name} has empty source_refs`);
  }
});

// ---------------------------------------------------------------------------
// Task 1: withdrawn controls must be excluded from the shared control-
// collection path used by every template.
// ---------------------------------------------------------------------------

const withdrawnDataset = {
  nodes: [
    {
      id: 'nist-800-53:AC-2',
      node_type: 'control',
      label: 'AC-2 Account Management',
      lifecycle_status: 'active',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-2',
        title: 'Account Management',
        control_family: 'Access Control',
      },
    },
    {
      id: 'nist-800-53:AC-13',
      node_type: 'control',
      label: 'AC-13 Supervision and Review',
      lifecycle_status: 'withdrawn',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-13',
        title: 'Supervision and Review',
        control_family: 'Access Control',
      },
    },
  ],
  sources: dataset.sources,
};

test('withdrawn controls are excluded from generated template output', () => {
  const result = generateTemplate(
    {
      templateType: 'security_plan_starter',
      framework: 'nist-800-53',
      environment: 'Generic',
      format: 'markdown',
      sourceRefs: ['nist-oscal'],
      sources: withdrawnDataset.sources,
    },
    withdrawnDataset,
  );

  assert.match(result.content, /AC-2/, 'Expected active control AC-2 present');
  assert.doesNotMatch(result.content, /AC-13\b/, 'Withdrawn control AC-13 must not appear in output');
});

// ---------------------------------------------------------------------------
// Task 2: fedramp-rev5 (or any catalog with only `baseline` nodes) must
// resolve member controls via baseline-membership edges instead of emitting
// a placeholder row.
// ---------------------------------------------------------------------------

const fedrampDataset = {
  nodes: [
    {
      id: 'fedramp-rev5:LOW',
      node_type: 'baseline',
      label: 'LOW Low Baseline',
      lifecycle_status: 'active',
      metadata: {
        catalog_id: 'fedramp-rev5',
        item_id: 'LOW',
        title: 'Low Baseline',
      },
    },
    {
      id: 'nist-800-53:AC-2',
      node_type: 'control',
      label: 'AC-2 Account Management',
      lifecycle_status: 'active',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-2',
        title: 'Account Management',
        control_family: 'Access Control',
      },
    },
    {
      id: 'nist-800-53:AC-1',
      node_type: 'control',
      label: 'AC-1 Policy and Procedures',
      lifecycle_status: 'active',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-1',
        title: 'Policy and Procedures',
        control_family: 'Access Control',
      },
    },
    {
      id: 'nist-800-53:AC-13',
      node_type: 'control',
      label: 'AC-13 Supervision and Review',
      lifecycle_status: 'withdrawn',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-13',
        title: 'Supervision and Review',
        control_family: 'Access Control',
      },
    },
  ],
  edges: [
    {
      id: 'edge:fedramp-membership:includes:fedramp-rev5:LOW:nist-800-53:AC-2',
      source_node_id: 'fedramp-rev5:LOW',
      target_node_id: 'nist-800-53:AC-2',
      relationship_type: 'includes',
    },
    {
      id: 'edge:fedramp-membership:includes:fedramp-rev5:LOW:nist-800-53:AC-1',
      source_node_id: 'fedramp-rev5:LOW',
      target_node_id: 'nist-800-53:AC-1',
      relationship_type: 'includes',
    },
    {
      id: 'edge:fedramp-membership:includes:fedramp-rev5:LOW:nist-800-53:AC-13',
      source_node_id: 'fedramp-rev5:LOW',
      target_node_id: 'nist-800-53:AC-13',
      relationship_type: 'includes',
    },
  ],
  sources: dataset.sources,
};

test('fedramp-rev5 resolves member controls via baseline edges instead of a placeholder row', () => {
  const result = generateTemplate(
    {
      templateType: 'security_plan_starter',
      framework: 'fedramp-rev5',
      environment: 'Generic',
      format: 'markdown',
      sourceRefs: ['nist-oscal'],
      sources: fedrampDataset.sources,
    },
    fedrampDataset,
  );

  assert.match(result.content, /AC-1\b/, 'Expected AC-1 resolved via baseline membership edge');
  assert.match(result.content, /AC-2\b/, 'Expected AC-2 resolved via baseline membership edge');
  assert.doesNotMatch(result.content, /AC-13\b/, 'Withdrawn AC-13 must be excluded even when resolved via edges');
  // "[Control ID]" now legitimately appears in the blank Inheritance Summary
  // starter rows; "[Control Title]" only appears in the placeholder-control
  // fallback row, so it is the fallback detector.
  assert.doesNotMatch(result.content, /\[Control Title\]/, 'Should not fall back to placeholder row when resolution succeeds');
  assert.equal(result.frameworkResolutionError, null);

  // Natural/sorted order: AC-1 before AC-2.
  const ac1Index = result.content.indexOf('AC-1');
  const ac2Index = result.content.indexOf('AC-2');
  assert.ok(ac1Index >= 0 && ac2Index >= 0 && ac1Index < ac2Index, 'Expected sorted natural order AC-1 before AC-2');
});

// ---------------------------------------------------------------------------
// Markdown layout (spr-20260709 WS2): wide tables are restructured — no pipe
// table wider than 6 columns; guidance/placeholder text renders as prose.
// ---------------------------------------------------------------------------

function maxMarkdownTableColumns(markdown) {
  let max = 0;
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|')) continue;
    const pipes = (line.match(/(?<!\\)\|/g) || []).length;
    max = Math.max(max, pipes - 1);
  }
  return max;
}

test('POA&M markdown preserves the schema-aligned field set without a wide table', () => {
  const result = generateTemplate(
    {
      templateType: 'poam_starter',
      framework: 'nist-800-53',
      environment: 'Cloud SaaS',
      format: 'markdown',
      sourceRefs: ['nist-oscal'],
      sources: dataset.sources,
    },
    dataset,
  );
  const poamFields = [
    'externalUid', 'status', 'vulnerabilityDescription', 'sourceIdentifyingVulnerability',
    'controlAcronym', 'assessmentProcedure', 'securityChecks', 'severity', 'rawSeverity',
    'relevanceOfThreat', 'likelihood', 'impact', 'impactDescription', 'residualRiskLevel',
    'pocOrganization', 'Point of Contact', 'resources', 'Planned Remediation',
    'Milestones with Completion Dates', 'Original Detection Date', 'scheduledCompletionDate',
    'completionDate', 'recommendations', 'mitigations', 'Evidence Needed for Closure',
    'Risk Acceptance / Deviation Reference', 'comments',
  ];
  for (const field of poamFields) {
    assert.ok(result.content.includes(field), `POA&M field must survive — missing "${field}"`);
  }
  assert.match(result.content, /## Operating Rules/, 'operating guidance must precede the register');
  assert.match(result.content, /Classification: eMASS API v3\.22 schema-aligned preparation aid/);
  const starterRows = (result.content.match(/\[Stable external tracking ID\]/g) || []).length;
  assert.equal(starterRows, 20, 'register must carry exactly 20 starter rows');
  assert.ok(maxMarkdownTableColumns(result.content) <= 6, 'POA&M starter must not emit a wide pipe table');
});

test('ssp markdown renders one plain-language baseline table with guidance stated once', () => {
  const result = generateTemplate(
    {
      templateType: 'security_plan_starter',
      framework: 'fedramp-rev5',
      environment: 'Generic',
      format: 'markdown',
      sourceRefs: ['nist-oscal'],
      sources: fedrampDataset.sources,
    },
    fedrampDataset,
  );
  assert.ok(maxMarkdownTableColumns(result.content) <= 6, 'SSP markdown tables must stay at 6 columns or fewer');
  assert.match(
    result.content,
    /\| Control ID \| Control Title \| Implementation Status \| Implementation Narrative \| Evidence References \| Responsible Role \|/,
    'the control baseline must carry implementation, evidence, and ownership fields',
  );
  assert.match(result.content, /## How to Complete the Control Rows/, 'fill guidance must render as its own section');
  // The old per-control madlib prompt ("How is <Title> (<ID>) implemented…")
  // must never repeat across rows. The fill-in placeholder ("[How is this
  // implemented for this system?]") has no (<ID>) and is exempt.
  const madlibs = (result.content.match(/How is .+ \(.+\) implemented/g) || []).length;
  assert.ok(madlibs <= 1, `madlib prompt sentence appears ${madlibs} times — it must not repeat per control`);
});

// ---------------------------------------------------------------------------
// Content overhaul (spr-20260709): enhancement scoping, honest baseline
// fallback, and real CCI/STIG cross-references.
// ---------------------------------------------------------------------------

const enhancementDataset = {
  nodes: [
    {
      id: 'nist-800-53:AC-2',
      node_type: 'control',
      label: 'AC-2 Account Management',
      lifecycle_status: 'active',
      plain_language_summary: 'Keep track of every account on the system.',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-2',
        title: 'Account Management',
        control_family: 'Access Control',
      },
    },
    {
      id: 'nist-800-53:AC-2.1',
      node_type: 'control_enhancement',
      label: 'AC-2(1) Automated System Account Management',
      lifecycle_status: 'active',
      plain_language_summary: 'Use tooling, not spreadsheets, to manage accounts.',
      metadata: {
        catalog_id: 'nist-800-53',
        item_id: 'AC-2.1',
        title: 'Automated System Account Management',
        control_family: 'Access Control',
      },
    },
    {
      id: 'nist-800-53b:MODERATE',
      node_type: 'baseline',
      label: 'MODERATE Moderate Baseline',
      lifecycle_status: 'active',
      metadata: { catalog_id: 'nist-800-53b', item_id: 'MODERATE', title: 'Moderate Baseline' },
    },
  ],
  edges: [
    {
      id: 'edge:baseline:includes:nist-800-53b:MODERATE:nist-800-53:AC-2',
      source_node_id: 'nist-800-53b:MODERATE',
      target_node_id: 'nist-800-53:AC-2',
      relationship_type: 'includes',
    },
    {
      id: 'edge:baseline:includes:nist-800-53b:MODERATE:nist-800-53:AC-2.1',
      source_node_id: 'nist-800-53b:MODERATE',
      target_node_id: 'nist-800-53:AC-2.1',
      relationship_type: 'includes',
    },
  ],
  sources: dataset.sources,
};

test('no-baseline generation excludes enhancements unless includeEnhancements is set', () => {
  const base = {
    templateType: 'security_plan_starter',
    framework: 'nist-800-53',
    environment: 'Generic',
    format: 'markdown',
    sourceRefs: ['nist-oscal'],
    sources: enhancementDataset.sources,
  };

  const noBaseline = generateTemplate(base, enhancementDataset);
  assert.match(noBaseline.content, /AC-2\b/, 'base control must be present');
  assert.doesNotMatch(noBaseline.content, /AC-2\.1/, 'enhancements must be dropped without a baseline');

  const withEnhancements = generateTemplate({ ...base, includeEnhancements: true }, enhancementDataset);
  assert.match(withEnhancements.content, /AC-2\.1/, 'includeEnhancements must restore enhancement rows');

  const moderate = generateTemplate({ ...base, baseline: 'MODERATE' }, enhancementDataset);
  assert.match(moderate.content, /AC-2\.1/, 'baseline members keep their enhancements');
  assert.doesNotMatch(moderate.content, /## Baseline Notice/, 'a recognized baseline emits no notice');
});

test('unrecognized baseline emits a Baseline Notice instead of silently including everything', () => {
  const result = generateTemplate(
    {
      templateType: 'security_plan_starter',
      framework: 'nist-800-53',
      environment: 'Generic',
      format: 'markdown',
      baseline: 'BOGUS',
      sourceRefs: ['nist-oscal'],
      sources: enhancementDataset.sources,
    },
    enhancementDataset,
  );
  assert.match(result.content, /## Baseline Notice/, 'notice section must be present');
  assert.match(
    result.content,
    /Baseline "BOGUS" was not recognized for nist-800-53 — this template includes the full catalog\. Valid values include LOW, MODERATE, HIGH\./,
  );
  assert.match(result.content, /AC-2\b/, 'fallback still includes the catalog controls');
});

const cciDataset = {
  nodes: [
    enhancementDataset.nodes[0],
    {
      id: 'disa-cci:CCI-000015',
      node_type: 'cci',
      label: 'CCI-000015',
      lifecycle_status: 'active',
      metadata: { catalog_id: 'disa-cci-list', item_id: 'CCI-000015' },
    },
    {
      id: 'disa-srg:SRG-OS-000001-GPOS-00001',
      node_type: 'srg_requirement',
      label: 'SRG-OS-000001-GPOS-00001',
      lifecycle_status: 'active',
      metadata: { catalog_id: 'disa-stig-library', item_id: 'SRG-OS-000001-GPOS-00001' },
    },
  ],
  edges: [
    {
      id: 'edge:cci:maps_to:disa-cci:CCI-000015:nist-800-53:AC-2',
      source_node_id: 'disa-cci:CCI-000015',
      target_node_id: 'nist-800-53:AC-2',
      relationship_type: 'maps_to',
    },
    {
      id: 'edge:srg:references:disa-srg:SRG-OS-000001-GPOS-00001:disa-cci:CCI-000015',
      source_node_id: 'disa-srg:SRG-OS-000001-GPOS-00001',
      target_node_id: 'disa-cci:CCI-000015',
      relationship_type: 'references',
    },
  ],
  sources: dataset.sources,
};

test('evidence matrix cites real CCI and STIG/SRG cross-references for a control', () => {
  const result = generateTemplate(
    {
      templateType: 'evidence_expectation_matrix',
      framework: 'nist-800-53',
      environment: 'Generic',
      format: 'markdown',
      sourceRefs: ['nist-oscal', 'disa-cci-list'],
      sources: cciDataset.sources,
    },
    cciDataset,
  );
  assert.match(result.content, /CCI-\d+/, 'a real CCI number must appear for AC-2');
  assert.match(result.content, /SRG-OS-000001-GPOS-00001/, 'the related SRG requirement must appear');
  for (const field of ['Evidence Owner', 'Collection Cadence', 'Evidence Date / Period', 'Confidence', 'Review Status', 'Assessor Notes']) {
    assert.ok(result.content.includes(field), `matrix must preserve ${field}`);
  }
});

test('framework with zero resolvable controls emits an honest notice and flags the error', () => {
  const emptyDataset = {
    nodes: [
      {
        id: 'fedramp-rev5:LOW',
        node_type: 'baseline',
        label: 'LOW Low Baseline',
        lifecycle_status: 'active',
        metadata: { catalog_id: 'fedramp-rev5', item_id: 'LOW', title: 'Low Baseline' },
      },
    ],
    edges: [],
    sources: dataset.sources,
  };

  const result = generateTemplate(
    {
      templateType: 'security_plan_starter',
      framework: 'fedramp-rev5',
      environment: 'Generic',
      format: 'markdown',
      sourceRefs: ['nist-oscal'],
      sources: emptyDataset.sources,
    },
    emptyDataset,
  );

  assert.match(result.content, /No control data is ingested for fedramp-rev5 yet — generation unavailable\./);
  assert.ok(result.frameworkResolutionError, 'Expected frameworkResolutionError to be set');
  assert.match(result.frameworkResolutionError, /No control data is ingested for fedramp-rev5/);
});
