#!/usr/bin/env node
// Phase 2 (T2.1/T2.2/T2.3) backfill: every publications[] row must carry an
// explicit metadata.identity_kind so classifySourceLayer() never silently
// defaults an unclassified row into the "publication" bucket. This assigns
// the missing value on the 59 rows that predate the field, without renaming,
// merging, or deleting any row (source IDs are preserved as-is; conceptual
// duplicates get canonical_publication_id instead of being discarded).
// Idempotent: rows that already carry identity_kind are left untouched.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = join(ROOT, 'data/source-registry.json');

// Canonical catalog anchors: already the publication_source_id of a
// catalog_source_bundles entry. Making identity_kind explicit changes no
// routing behavior (classifySourceLayer already defaulted these to
// "publication"); it only removes the silent-default path.
const ANCHOR_IDS = [
  'disa-cci-list', 'disa-srg-library', 'disa-stig-library', 'dod-cmmc-rule',
  'dod-rai-toolkit', 'dod-zt-reference-architecture-v2', 'fedramp-rev5',
  'isoo-cui-regulation', 'microsoft-zero-trust-maturity-questionnaire-v1-1',
  'mitre-attack-enterprise', 'mitre-attack-ics', 'mitre-d3fend-ontology',
  'nist-800-171-rev2', 'nist-800-172-rev3', 'nist-800-37-rev2',
  'nist-800-53a-assessment-procedures', 'nist-800-53b-baselines',
  'nist-ai-rmf-playbook', 'nist-fips-199', 'nist-fips-200',
  'nist-iot-device-cybersecurity-requirement-catalogs',
  'nist-mobile-threat-catalogue', 'nist-sp-800-207',
];

// Standalone canonical identities that exist in the registry but are not
// (and need not be) any catalog's ingestion anchor.
const STANDALONE_PUBLICATION_IDS = ['nist-sp-1800-35', 'nist-sp-800-207a'];

// Real publisher-issued supplemental material: genuine content from the same
// publisher as a canonical identity, but not itself the landmark. Routes to
// the "source material" (ingestion) UI layer via INGESTION_ROLES.
const SUPPLEMENTAL = {
  'dod-zt-capabilities': 'dod-zt-reference-architecture-v2',
  'dod-zt-execution-roadmap': 'dod-zt-reference-architecture-v2',
  'dod-zt-newsletter-2024-11': 'dod-zt-reference-architecture-v2',
  'dod-zt-operational-technology': 'dod-zt-reference-architecture-v2',
  'dod-zt-overlays-2024': 'dod-zt-reference-architecture-v2',
  'dod-zt-strategy': 'dod-zt-reference-architecture-v2',
  'dod-zt-strategy-placemats': 'dod-zt-reference-architecture-v2',
  'fedramp-2026-rules': 'fedramp-rev5',
  'nara-cui-registry': 'isoo-cui-regulation',
  'disa-cci-nist-references': 'disa-cci-list',
  'disa-stig-srg-cci-references': 'disa-stig-library',
  'nist-800-171-oscal-mappings': 'nist-800-171',
  'nist-mobile-threat-catalogue-cve-list': 'nist-mobile-threat-catalogue',
  'cyber-mil-stig-compilations': 'disa-stig-library',
  'cyber-mil-stig-downloads': 'disa-stig-library',
  'cyber-mil-stig-gpo': 'disa-stig-library',
};

// Pre-schema-5.0 mapping/crosswalk workbook identities. Each has a live
// artifact-* counterpart with source_role "mapping" actually cited by a
// catalog_source_bundles.mapping_source_ids entry; these bare rows are the
// leftover publication-layer identity for the same real document. Routes to
// the "connection" UI layer (CONNECTION_ROLES already contains "mapping").
const MAPPING = {
  'mitre-cis-cci-mappings': 'disa-cci-list',
  'mitre-d3fend-mappings': 'mitre-d3fend-ontology',
  'nist-800-53-rev4-rev5-crosswalk': 'disa-cci-list',
  'nist-csf-53-supplemental': 'nist-800-53',
  'nist-csf11-csf20-crosswalk': 'nist-csf-2',
  'nist-iot-requirements-80053-mapping-draft': 'nist-iot-device-cybersecurity-requirement-catalogs',
  'nist-iot-requirements-csf11-mapping-draft': 'nist-iot-device-cybersecurity-requirement-catalogs',
  'nist-olir-csf2-to-sp800-171': 'nist-csf-2',
  'nist-olir-csf2-to-sp800-53': 'nist-csf-2',
  'nist-sp-1800-35-critical-software-mappings': 'nist-sp-1800-35',
  'nist-sp-1800-35-csf11-mappings': 'nist-sp-1800-35',
  'nist-sp-1800-35-csf2-mappings': 'nist-sp-1800-35',
  'nist-sp-1800-35-sp80053-mappings': 'nist-sp-1800-35',
};

// Third-party/community observation and mirror sources used by the STIG
// freshness-tier fallback chain (see metadata.source_authority on
// disa-stig-library etc.) or otherwise unsubstantiated. Real, but not the
// publisher and not a landmark — same "reference" treatment already applied
// to the artifact-* community-tool rows by reclassify-reference-sources.mjs.
const REFERENCE_IDS = [
  'nuwcdivnpt-github-org', 'nuwcdivnpt-stig-manager',
  'stigviewer-catalog', 'stigviewer-clkb-api',
  'community-cci-research',
];

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
const byId = new Map(registry.publications.map((p) => [p.id, p]));

let stamped = 0;
const missing = [];

function setKind(id, kind, canonicalId) {
  const pub = byId.get(id);
  if (!pub) { missing.push(id); return; }
  if (pub.metadata?.identity_kind) return; // idempotent
  pub.metadata = pub.metadata || {};
  pub.metadata.identity_kind = kind;
  if (canonicalId) pub.metadata.canonical_publication_id = canonicalId;
  stamped += 1;
}

for (const id of ANCHOR_IDS) setKind(id, 'publication');
for (const id of STANDALONE_PUBLICATION_IDS) setKind(id, 'publication');
for (const [id, parent] of Object.entries(SUPPLEMENTAL)) setKind(id, 'supplemental', parent);
for (const [id, parent] of Object.entries(MAPPING)) setKind(id, 'mapping', parent);
for (const id of REFERENCE_IDS) setKind(id, 'reference');

if (missing.length) {
  console.error(`backfill-publication-identity-kind: unknown publication id(s): ${missing.join(', ')}`);
  process.exit(1);
}

const stillUndefined = registry.publications.filter((p) => !p.metadata?.identity_kind);
if (stillUndefined.length) {
  console.error(`backfill-publication-identity-kind: ${stillUndefined.length} publication(s) still missing identity_kind: ${stillUndefined.map((p) => p.id).join(', ')}`);
  process.exit(1);
}

// Fix the SP 800-171 anchor mismatch: the bundle pointed at the OSCAL
// ingestion artifact instead of the real canonical publication identity that
// per-node resolution (OSCAL_PUBLICATION_SOURCE_BY_CATALOG in
// catalog-publication-identity.mjs) already uses.
const bundle171 = registry.catalog_source_bundles.find((b) => b.catalog_id === 'nist-800-171');
if (bundle171 && bundle171.publication_source_id !== 'nist-800-171') {
  console.log(`nist-800-171 bundle anchor: ${bundle171.publication_source_id} -> nist-800-171`);
  bundle171.publication_source_id = 'nist-800-171';
  stamped += 1;
}

writeFileSync(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
console.log(`backfill-publication-identity-kind: stamped ${stamped} field(s); 0 publications remain without identity_kind.`);
