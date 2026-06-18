import assert from 'node:assert/strict';
import test from 'node:test';
import { zipSync, strToU8 } from 'fflate';

import {
  parseDisaXccdf,
  parseDisaCompilationArchive,
} from '../tools/importers/disa-stig-adapter.mjs';
import { findOfficialDisaCompilationUrl } from '../scripts/fetch-disa-stigs.mjs';

const sampleStigXml = `<?xml version="1.0" encoding="UTF-8"?>
<Benchmark id="xccdf_mil.disa.stig_benchmark_Windows_11_STIG" xmlns="http://checklists.nist.gov/xccdf/1.2">
  <status date="2026-06-14">accepted</status>
  <title>Windows 11 STIG</title>
  <description>Public DISA Windows 11 STIG benchmark.</description>
  <version>V1R1</version>
  <plain-text id="release-info">Release: 1 Benchmark Date: 2026-06-14</plain-text>
  <reference href="https://public.cyber.mil/stigs/compilations/">Public library</reference>
  <Group id="V-100001">
    <title>WN11-00-000001</title>
    <description>&lt;VulnDiscussion&gt;Accounts must be managed.&lt;/VulnDiscussion&gt;</description>
    <Rule id="SV-100001r1_rule" severity="medium" weight="10.0">
      <title>Configure account management</title>
      <version>WN11-00-000001</version>
      <description>&lt;VulnDiscussion&gt;Accounts must be managed.&lt;/VulnDiscussion&gt;&lt;Mitigations&gt;None&lt;/Mitigations&gt;</description>
      <ident system="http://iase.disa.mil/cci">CCI-000015</ident>
      <ident system="http://iase.disa.mil/cci">CCI-000016</ident>
      <fixtext>Enable the required account management policy.</fixtext>
      <check system="urn:xccdf:check:system:manual">
        <check-content>If the account management policy is disabled, this is a finding.</check-content>
      </check>
      <reference href="https://public.cyber.mil/stigs/compilations/">DISA reference</reference>
    </Rule>
  </Group>
</Benchmark>`;

const sampleSrgXml = `<?xml version="1.0" encoding="UTF-8"?>
<Benchmark id="xccdf_mil.disa.srg_benchmark_Application_SRG" xmlns="http://checklists.nist.gov/xccdf/1.2">
  <status date="2026-06-14">accepted</status>
  <title>Application Security Requirements Guide</title>
  <description>Public DISA Application SRG benchmark.</description>
  <version>V2R3</version>
  <plain-text id="release-info">Release: 3 Benchmark Date: 2026-06-14</plain-text>
  <Group id="V-200001">
    <title>APP-SR-000001</title>
    <Rule id="SV-200001r1_rule" severity="high" weight="10.0">
      <title>Enforce secure application logging</title>
      <version>APP-SR-000001</version>
      <description>&lt;VulnDiscussion&gt;Applications must log privileged events.&lt;/VulnDiscussion&gt;</description>
      <ident system="http://iase.disa.mil/cci">CCI-000213</ident>
      <fixtext>Configure the application to log privileged events.</fixtext>
      <check system="urn:xccdf:check:system:manual">
        <check-content>Review the application logging configuration.</check-content>
      </check>
    </Rule>
  </Group>
</Benchmark>`;

test('DISA XCCDF parser normalizes STIG rules with required Epic 2 fields', () => {
  const result = parseDisaXccdf(sampleStigXml, {
    sourceKey: 'disa-stig-library',
    artifactUrl: 'https://example.test/U_STIG_Library.zip',
    entryPath: 'U_STIG_Library/Windows_11_STIG/Windows_11_STIG_Benchmark.xml',
  });

  assert.equal(result.catalogKind, 'stig');
  assert.equal(result.records.length, 1);
  assert.deepEqual(result.records[0], {
    id: 'V-100001',
    type: 'stig_rule',
    title: 'Configure account management',
    description: 'Accounts must be managed.',
    plain_language_summary: 'STIG Rule: Ensure accounts must be managed.',
    severity: 'medium',
    rule_id: 'SV-100001r1_rule',
    vuln_id: 'V-100001',
    stig_id: 'WN11-00-000001',
    check_text: 'If the account management policy is disabled, this is a finding.',
    fix_text: 'Enable the required account management policy.',
    references: [{
      href: 'https://public.cyber.mil/stigs/compilations/',
      label: 'DISA reference',
    }],
    source: {
      key: 'disa-stig-library',
      snapshot_date: '2026-06-14',
      version: 'V1R1',
      locator: 'U_STIG_Library/Windows_11_STIG/Windows_11_STIG_Benchmark.xml#V-100001',
    },
    metadata: {
      benchmark_id: 'xccdf_mil.disa.stig_benchmark_Windows_11_STIG',
      benchmark_title: 'Windows 11 STIG',
      benchmark_description: 'Public DISA Windows 11 STIG benchmark.',
      relationship_catalog: 'disa-cci',
      relationships: [
        { target_catalog: 'disa-cci', target_id: 'CCI-000015', relationship_type: 'references' },
        { target_catalog: 'disa-cci', target_id: 'CCI-000016', relationship_type: 'references' },
      ],
    },
  });
});

test('DISA XCCDF parser normalizes SRG requirements with CCI relationships', () => {
  const result = parseDisaXccdf(sampleSrgXml, {
    sourceKey: 'disa-srg-library',
    artifactUrl: 'https://example.test/U_STIG_Library.zip',
    entryPath: 'U_STIG_Library/Application_SRG/Application_SRG_Benchmark.xml',
  });

  assert.equal(result.catalogKind, 'srg');
  assert.equal(result.records[0].id, 'V-200001');
  assert.equal(result.records[0].type, 'srg_requirement');
  assert.equal(result.records[0].severity, 'high');
  assert.equal(result.records[0].rule_id, 'SV-200001r1_rule');
  assert.equal(result.records[0].stig_id, 'APP-SR-000001');
  assert.deepEqual(
    result.records[0].metadata.relationships,
    [{ target_catalog: 'disa-cci', target_id: 'CCI-000213', relationship_type: 'references' }],
  );
});

test('DISA XCCDF parser rejects malformed or metadata-poor benchmarks', () => {
  assert.throws(
    () => parseDisaXccdf('<Benchmark></Benchmark>', {
      sourceKey: 'disa-stig-library',
      artifactUrl: 'https://example.test/U_STIG_Library.zip',
      entryPath: 'broken.xml',
    }),
    /missing benchmark metadata/i,
  );
});

test('DISA compilation parser ignores restricted and sunset content', () => {
  const archive = zipSync({
    'U_STIG_Library/Windows_11_STIG/Windows_11_STIG_Benchmark.xml': strToU8(sampleStigXml),
    'U_STIG_Library/Application_SRG/Application_SRG_Benchmark.xml': strToU8(sampleSrgXml),
    'U_STIG_Library/Sunset_Old_STIG/Old_STIG_Benchmark.xml': strToU8(sampleStigXml),
    'CUI_STIG_Library/Restricted_STIG/Restricted_STIG_Benchmark.xml': strToU8(sampleStigXml),
  });

  const result = parseDisaCompilationArchive(archive, {
    artifactUrl: 'https://example.test/U_STIG_Library.zip',
    sourceKeys: {
      stig: 'disa-stig-library',
      srg: 'disa-srg-library',
    },
  });

  assert.equal(result.stig.records.length, 1);
  assert.equal(result.srg.records.length, 1);
  assert.deepEqual(
    result.relationships.relationships.map((entry) => entry.target_id).sort(),
    ['CCI-000015', 'CCI-000016', 'CCI-000213'],
  );
});

test('official DISA compilation discovery prefers the public U_ library ZIP', () => {
  const html = `
    <html>
      <body>
        <a href="https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/CUI_STIG_Library.zip">CUI</a>
        <a href="https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/U_STIG_Library.zip">Public U zip</a>
      </body>
    </html>
  `;

  assert.equal(
    findOfficialDisaCompilationUrl(html),
    'https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/U_STIG_Library.zip',
  );
});
