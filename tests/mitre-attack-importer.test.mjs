import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseEnterpriseAttackStix,
  parseIcsAttackStix,
  tacticLookupFromStixBundle,
} from '../tools/importers/mitre-attack-adapter.mjs';

const sampleStix = {
  objects: [
    {
      type: 'attack-pattern',
      id: 'attack-pattern--sample',
      name: 'Command and Scripting Interpreter',
      description: 'Adversaries may abuse command and script interpreters.',
      kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'execution' }],
      x_mitre_platforms: ['Windows', 'Linux'],
      external_references: [
        {
          source_name: 'mitre-attack',
          external_id: 'T1059',
          url: 'https://attack.mitre.org/techniques/T1059',
        },
      ],
    },
  ],
};

test('parseEnterpriseAttackStix normalizes attack techniques with metadata', () => {
  const document = parseEnterpriseAttackStix(sampleStix, {
    artifactUrl: 'https://example.test/enterprise-attack.json',
    version: '2026-06-19',
    snapshotDate: '2026-06-19',
    checksum: 'sha256:sample',
  });

  assert.equal(document.records.length, 1);
  assert.equal(document.records[0].id, 'T1059');
  assert.equal(document.records[0].type, 'attack_technique');
  assert.equal(document.records[0].metadata.attack_domain, 'enterprise');
  assert.equal(document.records[0].metadata.tactics[0], 'execution');
  assert.match(document.records[0].description, /command and script interpreters/i);
});

test('parseIcsAttackStix uses enterprise external reference ids for ICS bundle', () => {
  const document = parseIcsAttackStix(sampleStix, {
    artifactUrl: 'https://example.test/ics-attack.json',
    version: '2026-06-19',
    snapshotDate: '2026-06-19',
    checksum: 'sha256:sample',
  });

  assert.equal(document.records.length, 1);
  assert.equal(document.records[0].metadata.attack_domain, 'ics');
  assert.equal(document.source_key, 'mitre-attack-ics');
});

const sampleStixWithTacticsAndSubtechnique = {
  objects: [
    {
      type: 'x-mitre-tactic',
      name: 'Execution',
      x_mitre_shortname: 'execution',
      external_references: [
        { source_name: 'mitre-attack', external_id: 'TA0002' },
      ],
    },
    {
      type: 'attack-pattern',
      id: 'attack-pattern--parent',
      name: 'Command and Scripting Interpreter',
      description: 'Adversaries may abuse command and script interpreters.',
      kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'execution' }],
      external_references: [
        { source_name: 'mitre-attack', external_id: 'T1059', url: 'https://attack.mitre.org/techniques/T1059' },
      ],
    },
    {
      type: 'attack-pattern',
      id: 'attack-pattern--sub',
      name: 'PowerShell',
      description: 'Adversaries may abuse PowerShell.',
      kill_chain_phases: [{ kill_chain_name: 'mitre-attack', phase_name: 'execution' }],
      x_mitre_is_subtechnique: true,
      external_references: [
        { source_name: 'mitre-attack', external_id: 'T1059.001', url: 'https://attack.mitre.org/techniques/T1059/001' },
      ],
    },
  ],
};

test('tacticLookupFromStixBundle resolves tactic shortname to display name and TA-code', () => {
  const lookup = tacticLookupFromStixBundle(sampleStixWithTacticsAndSubtechnique, 'mitre-attack');
  assert.deepEqual(lookup.get('execution'), { id: 'TA0002', title: 'Execution' });
});

test('parseEnterpriseAttackStix attaches the resolved tactic title and parent technique id', () => {
  const document = parseEnterpriseAttackStix(sampleStixWithTacticsAndSubtechnique, {
    artifactUrl: 'https://example.test/enterprise-attack.json',
    version: '2026-06-19',
    snapshotDate: '2026-06-19',
    checksum: 'sha256:sample',
  });

  const parent = document.records.find((record) => record.id === 'T1059');
  assert.equal(parent.metadata.tactic_id, 'TA0002');
  assert.equal(parent.metadata.tactic_title, 'Execution');
  assert.equal(parent.metadata.is_subtechnique, false);
  assert.equal(parent.metadata.parent_technique_id, null);

  const sub = document.records.find((record) => record.id === 'T1059.001');
  assert.equal(sub.metadata.is_subtechnique, true);
  assert.equal(sub.metadata.parent_technique_id, 'T1059');
});

test('parseEnterpriseAttackStix preserves every publisher tactic membership', () => {
  const sample = structuredClone(sampleStixWithTacticsAndSubtechnique);
  sample.objects.unshift({
    type: 'x-mitre-tactic',
    name: 'Defense Evasion',
    x_mitre_shortname: 'defense-evasion',
    external_references: [{ source_name: 'mitre-attack', external_id: 'TA0005' }],
  });
  sample.objects.find((entry) => entry.id === 'attack-pattern--parent').kill_chain_phases.push(
    { kill_chain_name: 'mitre-attack', phase_name: 'defense-evasion' },
  );
  const document = parseEnterpriseAttackStix(sample, {
    artifactUrl: 'https://example.test/enterprise-attack.json',
    version: 'test', snapshotDate: '2026-08-12', checksum: 'sha256:sample',
  });
  assert.deepEqual(
    document.records.find((record) => record.id === 'T1059').metadata.tactic_memberships,
    [
      { id: 'TA0002', title: 'Execution', shortname: 'execution' },
      { id: 'TA0005', title: 'Defense Evasion', shortname: 'defense-evasion' },
    ],
  );
});

test('parseEnterpriseAttackStix converts publisher HTML and retains lifecycle history', () => {
  const sample = {
    objects: [
      {
        type: 'attack-pattern',
        id: 'attack-pattern--retired',
        name: '<strong>Retired</strong> technique',
        description: '<p>Publisher &amp; history<br>remains useful.</p>',
        revoked: true,
        external_references: [{ source_name: 'mitre-attack', external_id: 'T0001' }],
      },
      {
        type: 'attack-pattern',
        id: 'attack-pattern--deprecated',
        name: 'Deprecated technique',
        description: 'Historical publisher text.',
        x_mitre_deprecated: true,
        external_references: [{ source_name: 'mitre-attack', external_id: 'T0002' }],
      },
    ],
  };
  const document = parseEnterpriseAttackStix(sample, {
    artifactUrl: 'https://example.test/enterprise-attack-19.2.json',
    version: '19.2', snapshotDate: '2026-08-25', checksum: 'sha256:sample',
  });
  assert.equal(document.records.length, 2);
  assert.equal(document.records[0].status, 'withdrawn');
  assert.equal(document.records[0].title, 'T0001 Retired technique');
  assert.equal(document.records[0].description, 'Publisher & history remains useful.');
  assert.equal(document.records[1].status, 'deprecated');
});
