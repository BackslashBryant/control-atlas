import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import { parseFedrampBaselineWorkbookSheets } from '../tools/importers/catalog-adapters-ext.mjs';

const rules = JSON.parse(readFileSync('data/fedramp-2026-rules.json', 'utf8'));
const schema = JSON.parse(readFileSync('data/fedramp-2026-rules.schema.json', 'utf8'));
const transitions = JSON.parse(readFileSync('data/fedramp-transition-index.json', 'utf8'));
const artifacts = JSON.parse(readFileSync('data/official-artifact-registry.json', 'utf8'));
const catalog = JSON.parse(readFileSync('data/fedramp-2026-catalog.json', 'utf8'));
const sourceRegistry = JSON.parse(readFileSync('data/source-registry.json', 'utf8'));
const adapterRegistry = JSON.parse(readFileSync('data/profiles/source-adapter-registry.json', 'utf8'));

test('official FedRAMP 2026 rules validate against the official schema', () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  assert.equal(validate(rules), true, JSON.stringify(validate.errors));
  assert.equal(rules.info.version, '2026.07.14.01');
  assert.equal(rules.info.last_updated, '2026-07-14');
});

test('the placeholder label is limited to AGU, not the whole ruleset', () => {
  assert.equal(transitions.process_statuses.length, 17);
  const placeholders = transitions.process_statuses.filter((process) => process.status === 'placeholder');
  assert.deepEqual(
    placeholders.map((process) => process.process_id),
    ['AGU'],
  );
  assert.equal(transitions.process_statuses.filter((process) => process.status === 'stable').length, 16);
});

test('every curated legacy transition resolves to current rules and an action', () => {
  const resolvedRules = new Map(transitions.resolved_rules.map((rule) => [rule.rule_id, rule]));
  assert.equal(transitions.legacy_mappings.length, 10);
  assert.equal(resolvedRules.size, 28);
  for (const mapping of transitions.legacy_mappings) {
    assert.ok(mapping.summary.trim(), `${mapping.legacy_artifact_id} needs a summary`);
    assert.ok(mapping.action.trim(), `${mapping.legacy_artifact_id} needs a next action`);
    assert.ok(mapping.path_scope.includes('20x'), `${mapping.legacy_artifact_id} needs a 20x path`);
    assert.ok(mapping.path_scope.includes('rev5'), `${mapping.legacy_artifact_id} needs a Rev5 path`);
    assert.ok(mapping.current_artifact_ids.length > 0, `${mapping.legacy_artifact_id} needs current artifacts`);
    assert.ok(mapping.rule_ids.length > 0, `${mapping.legacy_artifact_id} needs governing rules`);
    for (const ruleId of mapping.rule_ids) {
      assert.ok(resolvedRules.has(ruleId), `${mapping.legacy_artifact_id} references unresolved ${ruleId}`);
    }
  }
});

test('legacy package semantics are tied to the current FedRAMP model', () => {
  const byLegacyId = new Map(
    transitions.legacy_mappings.map((mapping) => [mapping.legacy_artifact_id, mapping]),
  );
  assert.ok(byLegacyId.get('fedramp-legacy-ssp').rule_ids.includes('CPO-CSO-OVR'));
  assert.match(byLegacyId.get('fedramp-legacy-ssp').summary, /replaces the historical Rev5 SSP/i);
  assert.ok(byLegacyId.get('fedramp-legacy-sap').rule_ids.includes('IVV-IAS-SUM'));
  assert.ok(byLegacyId.get('fedramp-legacy-sar').rule_ids.includes('IVV-IAS-SUM'));
  assert.match(byLegacyId.get('fedramp-legacy-sap').summary, /does not require a separate SAP or SAR/i);
  assert.match(byLegacyId.get('fedramp-legacy-poam').summary, /not automatically an agency POA&M/i);
  assert.ok(byLegacyId.get('fedramp-legacy-integrated-inventory').rule_ids.includes('MAS-CSO-IIR'));
  assert.ok(byLegacyId.get('fedramp-legacy-conmon-deliverables').rule_ids.includes('CCM-OCR-AVL'));
});

test('all official legacy files and current schema rule connections are available', () => {
  assert.equal(transitions.legacy_assets.length, 27);
  assert.equal(new Set(transitions.legacy_assets.map((asset) => asset.url)).size, 27);
  for (const asset of transitions.legacy_assets) {
    assert.match(asset.url, /^https:\/\/www\.fedramp\.gov\/legacy\/assets\//);
    assert.match(asset.url, /\.(?:docx|xlsx|pdf|zip)$/i);
  }
  for (const [artifactId, ruleIds] of Object.entries(transitions.current_artifact_rules)) {
    assert.ok(
      artifacts.artifacts.some((artifact) => artifact.artifact_id === artifactId),
      `missing current artifact ${artifactId}`,
    );
    for (const ruleId of ruleIds) {
      assert.ok(
        transitions.resolved_rules.some((rule) => rule.rule_id === ruleId),
        `${artifactId} references unresolved ${ruleId}`,
      );
    }
  }
});

test('FedRAMP baseline workbook parser preserves program-specific membership', () => {
  const sheets = [
    ['Low Baseline', [null, null, 'AC-1'], [null, null, 'AC-2 (1)']],
    ['Moderate Baseline', [null, null, 'AU-2']],
    ['High Baseline', [null, null, 'SC-7 (3)']],
    ['LI-SaaS Baseline', [null, 'IA-2 (1)']],
  ].map(([sheet, ...data]) => ({ sheet, data }));
  assert.deepEqual(parseFedrampBaselineWorkbookSheets(sheets), {
    LOW: ['AC-1', 'AC-2.1'],
    MODERATE: ['AU-2'],
    HIGH: ['SC-7.3'],
    'LI-SAAS': ['IA-2.1'],
  });
});

test('current FedRAMP rules and historical Rev. 5 remain distinct source families', () => {
  assert.equal(catalog.source_version, rules.info.version);
  assert.equal(catalog.record_count, 444);
  assert.deepEqual(catalog.source_inventory, {
    control_context: 77,
    definitions: 75,
    rules: 246,
    key_security_indicators: 46,
    total: 444,
  });
  assert.deepEqual(
    [...new Set(catalog.records.map((record) => record.type))].sort(),
    ['control_context', 'definition', 'key_security_indicator', 'rule'],
  );
  const current = sourceRegistry.publications.find((entry) => entry.id === 'fedramp-2026-rules');
  const historical = sourceRegistry.publications.find((entry) => entry.id === 'fedramp-rev5');
  assert.equal(current.lifecycle_status, 'active');
  assert.equal(current.graph_eligible, true);
  assert.equal(historical.lifecycle_status, 'historical');
  const currentBundle = sourceRegistry.catalog_source_bundles.find((entry) => entry.catalog_id === 'fedramp-2026');
  const historicalBundle = sourceRegistry.catalog_source_bundles.find((entry) => entry.catalog_id === 'fedramp-rev5');
  assert.deepEqual(currentBundle.primary_artifact_ids, ['artifact-fedramp-2026-rules']);
  assert.ok(!historicalBundle.enrichment_artifact_ids.includes('artifact-fedramp-2026-rules'));
  const currentAdapter = adapterRegistry.adapters.find((entry) => entry.adapter_id === 'fedramp-consolidated-rules-json');
  assert.deepEqual(currentAdapter.catalog_ids, ['fedramp-2026']);
  assert.deepEqual(currentAdapter.produced_profile_ids, [
    'record.control_context',
    'record.definition',
    'record.key_security_indicator',
    'record.rule',
  ]);
});
