import assert from 'node:assert/strict';
import test from 'node:test';
import { glossaryData } from '../src/app/glossary-data.mjs';
import { patternsData } from '../src/app/patterns-data.mjs';
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

test('pattern library contains 15 required authorization and risk patterns', () => {
  const requiredPatterns = [
    'rmf-lifecycle', 'ato-vs-atc', 'ato-vs-fedramp', 'reciprocity-basics', 'reciprocity-failures',
    'control-inheritance', 'common-control-provider', 'shared-responsibility', 'csp-inheritance',
    'enterprise-inheritance', 'boundary-patterns', 'boe-reuse', 'poam-concepts', 'conmon-cadence', 'evidence-patterns'
  ];

  assert.equal(patternsData.length >= 15, true);
  for (const id of requiredPatterns) {
    const pattern = patternsData.find(p => p.id === id);
    assert.ok(pattern, `Patterns library is missing pattern with ID: ${id}`);
    assert.ok(pattern.title, `Pattern details missing title for ID: ${id}`);
    assert.ok(pattern.summary, `Pattern details missing summary for ID: ${id}`);
    assert.ok(pattern.explanation, `Pattern details missing explanation for ID: ${id}`);
    assert.ok(pattern.friction, `Pattern details missing friction for ID: ${id}`);
    assert.ok(Array.isArray(pattern.sources), `Pattern details missing sources array for ID: ${id}`);
    assert.ok(Array.isArray(pattern.controls), `Pattern details missing controls array for ID: ${id}`);
    assert.ok(Array.isArray(pattern.templates), `Pattern details missing templates array for ID: ${id}`);
    assert.ok(Array.isArray(pattern.dos), `Pattern details missing dos array for ID: ${id}`);
    assert.ok(Array.isArray(pattern.donts), `Pattern details missing donts array for ID: ${id}`);
    assert.ok(pattern.limitations, `Pattern details missing limitations for ID: ${id}`);
  }
});

test('template factory implements all conditional include flags and bug fixes', () => {
  const dataset = {
    nodes: [
      { id: 'nist-800-53:AC-2', node_type: 'control', label: 'AC-2 Account Management', metadata: { catalog_id: 'nist-800-53', item_id: 'AC-2', title: 'Account Management', control_family: 'Access Control' } }
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
  assert.match(resultFramework.content, /Account Management/);
  assert.match(resultFramework.content, /\[Status\]/);

  // Test optional flags - exclude placeholders
  const optionsNoPlaceholders = {
    templateType: 'security_plan_starter',
    framework: 'nist-800-53',
    environment: 'Cloud SaaS',
    format: 'markdown',
    includePlaceholders: false,
  };
  
  const resultNoPlaceholders = generateTemplate(optionsNoPlaceholders, dataset);
  assert.doesNotMatch(resultNoPlaceholders.content, /\[Status\]/);
  assert.doesNotMatch(resultNoPlaceholders.content, /\[Role\]/);

  // Test including implementation prompts
  const optionsWithPrompts = {
    templateType: 'security_plan_starter',
    framework: 'nist-800-53',
    environment: 'Cloud SaaS',
    format: 'markdown',
    includeImplementationPrompts: true,
    includePlaceholders: true,
  };
  
  const resultWithPrompts = generateTemplate(optionsWithPrompts, dataset);
  assert.match(resultWithPrompts.content, /How is AC-2 implemented/);

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
  assert.match(resultWithFootnotes.content, /Source Information and Footnotes/);
  assert.match(resultWithFootnotes.content, /Framework Context: nist-800-53/);
});
