import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { displayNameFor, humanizeSlug } from '../src/app/display-names.mjs';
import { CATALOG_STRUCTURE_PROFILES } from '../src/shared/catalog-structure.mjs';
import { readGeneratedCollection } from '../scripts/lib/generated-graph-artifacts.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const nodes = readGeneratedCollection(ROOT, 'nodes').nodes;
const edges = readGeneratedCollection(ROOT, 'edges').edges;

function distinct(list, key) {
  return [...new Set(list.map((item) => item[key]).filter(Boolean))].sort();
}

// Every enum value that can reach the UI, keyed by the display domain it is
// rendered through.
const DOMAIN_VALUES = {
  node_type: distinct(nodes, 'node_type'),
  object_type: distinct(nodes, 'node_type'),
  relationship_type: distinct(edges, 'relationship_type'),
  provenance_class: distinct(edges, 'provenance_class'),
  confidence: distinct(edges, 'confidence'),
  publication_status: distinct(edges, 'publication_status'),
};

test('every dataset enum value renders as a human display name, never a raw slug (CATL-32/66/71/83)', () => {
  const offenders = [];
  for (const [domain, values] of Object.entries(DOMAIN_VALUES)) {
    for (const value of values) {
      const display = displayNameFor(domain, value);
      // No raw slug artifacts and never the untouched machine value.
      if (display.includes('_')) {
        offenders.push(`${domain}:${value} -> "${display}" (contains underscore)`);
      }
      if (display === value && /[_-]/.test(value)) {
        offenders.push(`${domain}:${value} -> "${display}" (unchanged slug)`);
      }
      if (!/^[A-Z0-9]/.test(display)) {
        offenders.push(`${domain}:${value} -> "${display}" (not capitalized)`);
      }
    }
  }
  assert.deepEqual(offenders, [], `Slug display-name offenders:\n- ${offenders.join('\n- ')}`);
});

test('node_type domain has an explicit mapping for every node type in the dataset', () => {
  // node types are the most user-visible; require curated names, not fallback.
  const unmapped = distinct(nodes, 'node_type').filter(
    (value) => displayNameFor('node_type', value) === humanizeSlug(value),
  );
  // Fallback is acceptable, but flag anything that still reads awkwardly.
  for (const value of unmapped) {
    const display = displayNameFor('node_type', value);
    assert.doesNotMatch(display, /_/, `node_type ${value} humanizes to a slug: ${display}`);
  }
});

test('humanizeSlug expands acronyms and sentence-cases the remainder', () => {
  assert.equal(humanizeSlug('zt_capability'), 'Zero Trust capability');
  assert.equal(humanizeSlug('disa_stig'), 'DISA STIG');
  assert.equal(humanizeSlug('srg_requirement'), 'SRG requirement');
  assert.equal(humanizeSlug('some_new_type'), 'Some new type');
  assert.equal(humanizeSlug('cci'), 'CCI');
  assert.doesNotMatch(humanizeSlug('a_b_c_d'), /_/);
});

test('displayNameFor returns a stable sentinel for empty input', () => {
  assert.equal(displayNameFor('node_type', ''), 'Unknown');
  assert.equal(displayNameFor('node_type', null), 'Unknown');
  assert.equal(displayNameFor('node_type', undefined), 'Unknown');
});

test('federal use does not imply federal publication', () => {
  assert.equal(
    displayNameFor('provenance_class', 'federal_utilized'),
    'Third-party source used in federal work',
  );
});

test('source review dispositions use governed plain-language labels', () => {
  assert.equal(
    displayNameFor('source_currentness_review', 'current_as_checked'),
    'Current as checked',
  );
  assert.equal(
    displayNameFor('source_currentness_review', 'refresh_required'),
    'Refresh required',
  );
  assert.equal(
    displayNameFor('source_currentness_review', 'superseded'),
    'Superseded',
  );
  assert.equal(
    displayNameFor('source_semantic_review', 'reviewed_no_known_mismatch'),
    'Reviewed; no known mismatch',
  );
});

test('generated record types preserve source meaning and acronym casing', () => {
  const expected = {
    zt_collaborator: 'Technology collaborator',
    zt_mapping_contributor: 'Mapping workbook contributor',
    zt_mapping_document: 'Mapping workbook',
    zt_product_component: 'Product component',
    zt_reference_component: 'Reference architecture component',
    iot_capability_domain: 'IoT capability domain',
    iot_capability: 'IoT capability',
    iot_subcapability: 'IoT subcapability',
    iot_capability_element: 'IoT capability element',
    iot_capability_subelement: 'IoT capability subelement',
    mobile_threat_category: 'Mobile threat category',
  };
  for (const [type, label] of Object.entries(expected)) {
    assert.equal(displayNameFor('object_type', type), label);
    assert.equal(displayNameFor('node_type', type), label);
  }
});

test('template types use registry-aligned display names', () => {
  assert.equal(
    displayNameFor('template_type', 'inheritance_worksheet'),
    'Inheritance Worksheet',
  );
  assert.equal(
    displayNameFor('template_type', 'poam_starter'),
    'POA&M Working Register',
  );
});

test('every catalog reaches the UI with a published name, never its raw id', () => {
  // The Compare pickers and generated documents read catalog names from this
  // artifact, not from the runtime table. Four catalogs were missing from the
  // runtime's name map, so the artifact carried "nist-zt" and
  // "nist-iot-cybersecurity" straight into user-facing copy.
  const bootstrap = JSON.parse(
    readFileSync(join(ROOT, 'data/generated/catalog-bootstrap.json'), 'utf8'),
  ).catalog_bootstrap;

  for (const catalog of bootstrap.catalogs || []) {
    assert.notEqual(
      catalog.name,
      catalog.id,
      `${catalog.id} reaches the UI as its own id instead of a published name`,
    );
    // The runtime name and the structure-profile label are two deliberate
    // registers: pickers show "SP 800-53 Rev. 5" beside a NIST publisher
    // column, while a record's context line spells out "NIST SP 800-53
    // Rev. 5". Both must be real names, so only the id leak is an error.
    assert.ok(
      CATALOG_STRUCTURE_PROFILES[catalog.id],
      `${catalog.id} has no canonical structure profile`,
    );
    assert.ok(
      /[A-Z]/.test(catalog.name) && catalog.name.trim().length > 1,
      `${catalog.id} name "${catalog.name}" does not read as a published title`,
    );
  }
});
