import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAttackCatalogLookup,
  buildAttackToD3fendRelationships,
  buildD3fendToNistRelationships,
  buildSlugToD3fendIdMap,
  parseD3fendTechniques,
  resolveD3fendTactics,
} from '../tools/importers/mitre-d3fend-adapter.mjs';

test('parseD3fendTechniques extracts d3fend-id records', () => {
  const records = parseD3fendTechniques({
    '@graph': [
      {
        '@id': 'd3f:TokenBinding',
        'd3f:d3fend-id': 'D3-TB',
        'rdfs:label': 'Token Binding',
        'd3f:definition': 'Bind tokens to a device or endpoint.',
      },
    ],
  });

  assert.equal(records.length, 1);
  assert.equal(records[0].id, 'D3-TB');
  assert.equal(records[0].type, 'defend_countermeasure');
  assert.equal(records[0].metadata.technique_slug, 'TokenBinding');
});

test('buildAttackToD3fendRelationships maps attack ids to d3fend ids', () => {
  const slugToD3fendId = buildSlugToD3fendIdMap([
    {
      id: 'D3-TB',
      metadata: { technique_slug: 'TokenBinding' },
    },
  ]);
  const attackCatalogLookup = buildAttackCatalogLookup(
    [{ id: 'T1550.001' }],
    [],
  );
  const relationships = buildAttackToD3fendRelationships(
    [
      {
        off_tech_id: { value: 'T1550.001' },
        def_tech: {
          value: 'http://d3fend.mitre.org/ontologies/d3fend.owl#TokenBinding',
        },
        def_tech_label: { value: 'Token Binding' },
      },
    ],
    slugToD3fendId,
    attackCatalogLookup,
    {},
  );

  assert.equal(relationships.length, 1);
  assert.equal(relationships[0].source_id, 'T1550.001');
  assert.equal(relationships[0].target_id, 'D3-TB');
  assert.equal(relationships[0].relationship_type, 'mitigates');
});

test('resolveD3fendTactics walks subClassOf + d3f:enables to the top-level tactic', () => {
  const ontology = {
    '@graph': [
      {
        '@id': 'd3f:Harden',
        'rdfs:label': 'Harden',
      },
      {
        '@id': 'd3f:CredentialHardening',
        'd3f:d3fend-id': 'D3-CH',
        'rdfs:label': 'Credential Hardening',
        'd3f:enables': { '@id': 'd3f:Harden' },
        'rdfs:subClassOf': [{ '@id': 'd3f:DefensiveTechnique' }],
      },
      {
        '@id': 'd3f:TokenBinding',
        'd3f:d3fend-id': 'D3-TB',
        'rdfs:label': 'Token Binding',
        'rdfs:subClassOf': [
          { '@id': 'd3f:CredentialHardening' },
          { '@id': '_:blankNodeRestriction' },
        ],
      },
      {
        '@id': 'd3f:Orphan',
        'd3f:d3fend-id': 'D3-ORPHAN',
        'rdfs:label': 'No Path To A Tactic',
      },
    ],
  };

  const tactics = resolveD3fendTactics(ontology);
  assert.deepEqual(tactics.get('D3-CH'), { id: 'Harden', title: 'Harden' });
  assert.deepEqual(
    tactics.get('D3-TB'),
    { id: 'Harden', title: 'Harden' },
    'multi-level subClassOf chain resolves through its mid-level enables',
  );
  assert.equal(tactics.has('D3-ORPHAN'), false, 'no fabricated tactic when no path exists');
});

test('buildD3fendToNistRelationships normalizes NIST control ids', () => {
  const slugToD3fendId = buildSlugToD3fendIdMap([
    {
      id: 'D3-NTA',
      metadata: { technique_slug: 'NetworkTrafficAnalysis' },
    },
  ]);
  const relationships = buildD3fendToNistRelationships(
    {
      '@graph': [
        {
          '@type': ['d3f:NISTControl'],
          'rdfs:label': 'RA-5(2)',
          'd3f:narrower': { '@id': 'd3f:NetworkTrafficAnalysis' },
        },
      ],
    },
    slugToD3fendId,
    {},
  );

  assert.equal(relationships.length, 1);
  assert.equal(relationships[0].source_id, 'D3-NTA');
  assert.equal(relationships[0].target_id, 'RA-5.2');
  assert.equal(relationships[0].target_catalog, 'nist-800-53');
});
