#!/usr/bin/env node
// reclassify-reference-sources — reference/supplemental sources that are NOT
// downloadable single-file data artifacts (tool repos, catalog/observation
// pages) must not masquerade as checksummed artifacts. Move them from
// artifacts[] to publications[] as publication identities (spec: a publication
// identity may have no checksum), with REAL metadata (verified repos, licenses,
// releases). Remove sources that cannot be substantiated at all.
//
// Safe because none of these ids are cited by generated nodes/edges (verified
// against data/generated). Idempotent.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = join(ROOT, 'data/source-registry.json');

// Verified reference/supplemental sources (owner, real repo/page URL, SPDX
// license, latest release, role). No sha256 — these are identities/references.
const RECLASSIFY = [
  { id: 'artifact-mitre-saf', name: 'MITRE Security Automation Framework (SAF)', owner: 'MITRE', url: 'https://github.com/mitre/saf', license_or_use: 'Apache-2.0', authority_class: 'validated_third_party', lifecycle_status: 'active', role: 'automation', version: '1.6.0', note: 'STIG result conversion/validation tooling (XCCDF/CKL/OHDF)' },
  { id: 'artifact-heimdall-tools', name: 'MITRE Heimdall2', owner: 'MITRE', url: 'https://github.com/mitre/heimdall2', license_or_use: 'Apache-2.0', authority_class: 'validated_third_party', lifecycle_status: 'active', role: 'automation', version: 'v2.13.1', note: 'Security results viewer/comparison (HDF/OHDF)' },
  { id: 'artifact-vulcan-framework', name: 'MITRE Vulcan', owner: 'MITRE', url: 'https://github.com/mitre/vulcan', license_or_use: 'Apache-2.0', authority_class: 'validated_third_party', lifecycle_status: 'active', role: 'assessment', version: 'v2.3.7', note: 'STIG authoring workflow from SRGs' },
  { id: 'artifact-complianceascode-content', name: 'ComplianceAsCode/content', owner: 'ComplianceAsCode', url: 'https://github.com/ComplianceAsCode/content', license_or_use: 'BSD-3-Clause', authority_class: 'validated_third_party', lifecycle_status: 'active', role: 'automation', version: 'v0.1.81', note: 'Open XCCDF/SCAP/OVAL + STIG profiles' },
  { id: 'artifact-microsoft-powerstig', name: 'Microsoft PowerSTIG', owner: 'Microsoft', url: 'https://github.com/microsoft/PowerStig', license_or_use: 'MIT', authority_class: 'validated_third_party', lifecycle_status: 'active', role: 'automation', version: '4.30.0', note: 'PowerShell DSC STIG automation + parsed StigData XML' },
  { id: 'artifact-cybersecdef-stig', name: 'CyberSecDef/STIG', owner: 'CyberSecDef', url: 'https://github.com/CyberSecDef/STIG', license_or_use: 'GPL-3.0', authority_class: 'historical', lifecycle_status: 'historical', role: 'historical', version: '2017-06-28', note: 'Historical XSLT STIG transforms; unmaintained since 2017' },
  { id: 'artifact-mitre-cis-cci-mappings', name: 'MITRE cis-cci-mappings', owner: 'MITRE', url: 'https://github.com/mitre/cis-cci-mappings', license_or_use: 'Apache-2.0', authority_class: 'validated_third_party', lifecycle_status: 'draft', role: 'mapping', version: '2026-02-12', note: 'CIS<->CCI<->800-53 JSON mappings; new/immature' },
  { id: 'artifact-nuwcdivnpt-stig-manager', name: 'NUWCDIVNPT STIG Manager', owner: 'NUWC Division Newport', url: 'https://github.com/nuwcdivnpt/stig-manager', license_or_use: 'MIT', authority_class: 'validated_third_party', lifecycle_status: 'active', role: 'automation', version: '1.6.15', note: 'STIG assessment management API/client' },
  { id: 'artifact-nuwcdivnpt-github-org', name: 'NUWCDIVNPT GitHub organization', owner: 'NUWC Division Newport', url: 'https://github.com/NUWCDIVNPT', license_or_use: 'See individual repositories', authority_class: 'validated_third_party', lifecycle_status: 'active', role: 'reference_only', version: '2026', note: 'Publisher org for STIG Manager' },
  { id: 'artifact-stigviewer-catalog', name: 'STIG Viewer online catalog', owner: 'STIGViewer.com', url: 'https://www.stigviewer.com/stigs', license_or_use: 'Public web reference', authority_class: 'community', lifecycle_status: 'active', role: 'reference_only', version: '2026', note: 'Third-party STIG browse/reconciliation feed' },
  { id: 'artifact-stigviewer-clkb-api', name: 'STIG Viewer CKLB reference', owner: 'STIGViewer.com', url: 'https://www.stigviewer.com/', license_or_use: 'Public web reference', authority_class: 'community', lifecycle_status: 'active', role: 'reference_only', version: '2026', note: 'CKLB checklist format reference' },
  { id: 'artifact-cyber-mil-stig-compilations', name: 'DISA STIG Compilations page', owner: 'DISA', url: 'https://www.cyber.mil/stigs/compilations/', license_or_use: 'U.S. Government public domain', authority_class: 'publisher', lifecycle_status: 'active', role: 'reference_only', version: '2026', note: 'Official quarterly compilation index (observation page)' },
  { id: 'artifact-cyber-mil-stig-downloads', name: 'DISA STIG Downloads page', owner: 'DISA', url: 'https://www.cyber.mil/stigs/downloads', license_or_use: 'U.S. Government public domain', authority_class: 'publisher', lifecycle_status: 'active', role: 'reference_only', version: '2026', note: 'Official individual STIG downloads index (observation page)' },
  { id: 'artifact-cyber-mil-stig-gpo', name: 'DISA STIG GPO page', owner: 'DISA', url: 'https://www.cyber.mil/stigs/gpo/', license_or_use: 'U.S. Government public domain', authority_class: 'publisher', lifecycle_status: 'active', role: 'reference_only', version: '2026', note: 'Official Group Policy Object packages index (observation page)' },
];

// Sources that cannot be substantiated as authoritative artifacts at all.
const REMOVE = [
  { id: 'artifact-community-cci-research', reason: 'Reddit thread is not an authoritative source; its 5137 record_count was copied from the real CCI list' },
];

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
const pubIds = new Set((registry.publications || []).map((p) => p.id));
const reclassified = [];
const removed = [];

function scrubBundles(id) {
  // reference/supplemental sources may remain referenced by bundles as
  // publication ids; only scrub REMOVED ids.
  for (const b of registry.catalog_source_bundles || []) {
    for (const key of ['primary_artifact_ids', 'enrichment_artifact_ids', 'mapping_source_ids',
      'assessment_source_ids', 'automation_source_ids', 'reconciliation_source_ids']) {
      if (Array.isArray(b[key])) b[key] = b[key].filter((x) => x !== id);
    }
  }
}

for (const r of RECLASSIFY) {
  const idx = registry.artifacts.findIndex((a) => a.id === r.id);
  if (idx === -1) continue; // already reclassified
  registry.artifacts.splice(idx, 1);
  if (!pubIds.has(r.id)) {
    registry.publications.push({
      id: r.id,
      name: r.name,
      display_name: r.name,
      owner: r.owner,
      authority_class: r.authority_class,
      provenance_class: r.authority_class === 'publisher' ? 'federal_published' : (r.authority_class === 'historical' ? 'federal_referenced' : 'federal_utilized'),
      license_or_use: r.license_or_use,
      lifecycle_status: r.lifecycle_status,
      eligibility_status: 'limited',
      access_status: 'public',
      version: r.version,
      retrieved_at: new Date().toISOString().slice(0, 10),
      artifact_url: r.url,
      catalog_browse_url: r.url,
      graph_eligible: false,
      metadata: { identity_kind: 'reference', supplemental_role: r.role, note: r.note },
    });
    pubIds.add(r.id);
  }
  reclassified.push(r.id);
}

for (const r of REMOVE) {
  const idx = registry.artifacts.findIndex((a) => a.id === r.id);
  if (idx !== -1) { registry.artifacts.splice(idx, 1); removed.push(r); }
  scrubBundles(r.id);
}

writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n', 'utf8');
console.log(`reclassified ${reclassified.length} reference sources to publications[]; removed ${removed.length} unsubstantiated source(s).`);
for (const id of reclassified) console.log(`  ref -> publication: ${id}`);
for (const r of removed) console.log(`  removed: ${r.id} (${r.reason})`);
