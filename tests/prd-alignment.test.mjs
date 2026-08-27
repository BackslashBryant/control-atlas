import assert from 'node:assert/strict';
import test from 'node:test';
import { glossaryData } from '../src/app/glossary-data.mjs';
import { learnArticles } from '../src/app/learn-content.mjs';
import { generateTemplate } from '../src/app/template-engine.mjs';

test('glossary contains 26 required federal terms with source citations', () => {
  const requiredTerms = [
    'ato', 'atc', 'fedramp-authorization', 'rmf', 'stig', 'srg', 'cci', 'sar', 'sap', 'ssp',
    'poam', 'boe', 'reciprocity', 'inheritance', 'common-control', 'shared-responsibility',
    'isso', 'issm', 'sca', 'ao', 'aodr', 'boundary', 'overlay', 'baseline', 'profile', 'continuous-monitoring'
  ];

  assert.equal(glossaryData.length >= 26, true);
  for (const id of requiredTerms) {
    const term = glossaryData.find(t => t.id === id);
    assert.ok(term, `Glossary is missing term with ID: ${id}`);
    assert.ok(term.term, `Term details missing term name for ID: ${id}`);
    assert.ok(term.definition, `Term details missing definition for ID: ${id}`);
    assert.ok(term.source, `Term details missing source citation for ID: ${id}`);
    assert.ok(Array.isArray(term.related_patterns), `Term details missing related_patterns array for ID: ${id}`);
    assert.ok(Array.isArray(term.related_controls), `Term details missing related_controls array for ID: ${id}`);
  }
});

test('Learn contains the six launch-contract explanation topics', () => {
  assert.deepEqual(
    learnArticles.map((article) => article.id),
    [
      'hierarchy-and-relationships',
      'source-truth-and-notes',
      'search-eligibility-and-ranking',
      'read-a-record',
      'published-mappings-in-compare',
      'starter-documents-and-judgment',
    ],
  );
});

test('template factory resolves framework context and keeps the SSP core compact', () => {
  const dataset = {
    nodes: [
      { id: 'nist-800-53:AC-2', node_type: 'control', label: 'AC-2 Account Management', plain_language_summary: 'Keep track of every account on the system: who gets one, who approves it, and when it gets disabled.', metadata: { catalog_id: 'nist-800-53', item_id: 'AC-2', title: 'Account Management', control_family: 'Access Control' } }
    ]
  };

  // Test when framework is selected (bug fix check)
  const optionsWithFramework = {
    templateType: 'security_plan_starter',
    framework: 'nist-800-53',
    environment: 'Cloud SaaS',
    format: 'markdown',
    includePlaceholders: true,
  };

  const resultFramework = generateTemplate(optionsWithFramework, dataset);
  assert.match(resultFramework.content, /AC-2/);
  assert.match(resultFramework.content, /## Control Family Index/);
  assert.match(resultFramework.content, /Access Control/);
  assert.match(resultFramework.content, /Implementation Statement Worksheet/);
  assert.doesNotMatch(resultFramework.content, /Implementation Narrative/);

  // Test optional flags - exclude placeholders
  const optionsNoPlaceholders = {
    templateType: 'security_plan_starter',
    framework: 'nist-800-53',
    environment: 'Cloud SaaS',
    format: 'markdown',
    includePlaceholders: false,
  };

  const resultNoPlaceholders = generateTemplate(optionsNoPlaceholders, dataset);
  assert.doesNotMatch(resultNoPlaceholders.content, /\[Control ID\]/);
  assert.doesNotMatch(resultNoPlaceholders.content, /\[Provider\]/);

  // The narrative starter gives control-level drafting one stable handoff
  // instead of repeating a prompt for every selected control.
  const optionsWithPrompts = {
    templateType: 'security_plan_starter',
    framework: 'nist-800-53',
    environment: 'Cloud SaaS',
    format: 'markdown',
    includeImplementationPrompts: true,
    includePlaceholders: true,
  };

  const resultWithPrompts = generateTemplate(optionsWithPrompts, dataset);
  const handoffMatches = resultWithPrompts.content.match(/## Control Narrative Handoff/g) || [];
  assert.equal(handoffMatches.length, 1, 'control drafting handoff must render exactly once');
  assert.match(resultWithPrompts.content, /role, mechanism, location, trigger or cadence, and result/);
  assert.doesNotMatch(resultWithPrompts.content, /Account Management \| \[Planned/);

  // Test including source footnotes
  const optionsWithFootnotes = {
    templateType: 'security_plan_starter',
    framework: 'nist-800-53',
    environment: 'Cloud SaaS',
    format: 'markdown',
    includeSourceFootnotes: true,
    includePlaceholders: true,
  };

  const resultWithFootnotes = generateTemplate(optionsWithFootnotes, dataset);
  assert.match(resultWithFootnotes.content, /Source Metadata/);
  assert.match(
    resultWithFootnotes.content,
    /Catalog or program context: SP 800-53 Rev\. 5/,
  );
  assert.match(resultWithFootnotes.content, /Environment archetype: Cloud SaaS/);
});
