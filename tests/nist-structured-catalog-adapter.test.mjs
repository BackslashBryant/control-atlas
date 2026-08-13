import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { parseNistMobileThreatCatalogue } from '../tools/importers/nist-structured-catalog-adapter.mjs';

const manifest = JSON.parse(readFileSync('data/curated/nist-structured-catalogs/source-manifest.json', 'utf8'));
const iot = JSON.parse(readFileSync('data/curated/nist-structured-catalogs/iot-requirements.json', 'utf8'));
const mobile = JSON.parse(readFileSync('data/curated/nist-structured-catalogs/mobile-threats.json', 'utf8'));

test('NIST IoT workbooks reconcile every publisher row without synthetic records', () => {
  const reconciliation = manifest.reconciliation.iot;
  assert.equal(reconciliation.workbooks_discovered, 2);
  assert.equal(reconciliation.workbooks_ingested, 2);
  assert.equal(reconciliation.workbooks_failed, 0);
  assert.equal(reconciliation.primary_worksheets.reduce((sum, sheet) => sum + sheet.source_rows, 0), 374);
  assert.equal(reconciliation.primary_worksheets.reduce((sum, sheet) => sum + sheet.parsed_rows, 0), 374);
  assert.equal(reconciliation.supplemental_worksheets.reduce((sum, sheet) => sum + sheet.source_rows, 0), 374);
  assert.equal(reconciliation.supplemental_worksheets.reduce((sum, sheet) => sum + sheet.parsed_rows, 0), 374);
  assert.equal(reconciliation.records, 489);
  assert.equal(reconciliation.mapped_records, 341);
  assert.equal(reconciliation.published_mapping_assertions, 986);
  assert.equal(reconciliation.graph_eligible_80053_relationships, 450);
  assert.equal(reconciliation.synthetic_records, 0);
  assert.equal(iot.records.length, 489);
  assert.ok(iot.records.every((record) => record.parent_id && record.source_fragments.length > 0));
  assert.ok(iot.records.every((record) => record.source_fragments.every((fragment) => fragment.sheet && fragment.cell)));
});

test('NIST Mobile Threat JSON and CSV reconcile threats, categories, blanks, and CVEs', () => {
  const reconciliation = manifest.reconciliation.mobile_threats;
  assert.equal(reconciliation.json_rows_discovered, 243);
  assert.equal(reconciliation.blank_rows_excluded, 7);
  assert.equal(reconciliation.threats_ingested, 236);
  assert.equal(reconciliation.categories_ingested, 32);
  assert.equal(reconciliation.total_records, 268);
  assert.equal(reconciliation.expected_records, 275);
  assert.equal(reconciliation.csv_rows_discovered, 249);
  assert.equal(reconciliation.unique_cves_reconciled, 249);
  assert.equal(reconciliation.synthetic_records, 0);
  assert.equal(mobile.records.length, 268);
  assert.ok(mobile.records.every((record) => record.parent_id));
  assert.ok(mobile.records.filter((record) => record.type === 'mobile_threat').every((record) => record.source_fragments.length > 0));
});

test('NIST Mobile threats do not turn an absent publisher origin into synthetic prose', () => {
  const source = {
    json: { source_key: 'mobile-json', url: 'https://example.invalid/mobile.json' },
  };
  const result = parseNistMobileThreatCatalogue(
    Buffer.from(JSON.stringify([{
      ThreatID: 'APP-0',
      Threat: 'Eavesdropping on Unencrypted App Traffic',
      ThreatCategory: 'Vulnerable Applications',
      ThreatOrigin: '',
      ExploitExample: [],
      CVEExample: [],
      PossibleCountermeasures: [],
    }])),
    Buffer.from('CVE\n'),
    source,
  );
  const threat = result.records.find((record) => record.id === 'APP-0');
  assert.equal(threat.description, '');
  assert.equal(threat.title, 'Eavesdropping on Unencrypted App Traffic');
});

test('every discovered NIST structured asset has an explicit ingestion disposition', () => {
  const triage = JSON.parse(readFileSync('data/nist-structured-asset-triage.json', 'utf8'));
  assert.equal(triage.reconciliation.assets_discovered, 28);
  assert.equal(triage.reconciliation.assets_classified, 28);
  assert.equal(triage.reconciliation.unclassified_assets, 0);
  assert.equal(triage.reconciliation.ingested_catalog, 8);
  assert.equal(triage.reconciliation.redundant_representation, 1);
  assert.equal(triage.reconciliation.queued_resource, 7);
  assert.equal(triage.reconciliation.out_of_scope, 12);
  assert.ok(triage.assets.every((asset) => asset.reason && Object.hasOwn(asset, 'target')));
});
