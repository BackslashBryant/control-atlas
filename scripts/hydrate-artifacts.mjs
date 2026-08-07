#!/usr/bin/env node
// hydrate-artifacts — download every directly retrievable source artifact,
// compute REAL sha256 + byte length + record count from the actual bytes, and
// write those values back into data/source-registry.json. Emits
// data/generated/artifact-hydration.json as the from-execution evidence log.
//
// Determinism: retrieved_at is preserved when the content hash is unchanged, so
// a second run produces no diff unless upstream bytes actually changed.
//
// Nothing here is fabricated: an artifact is hydrated only if its exact URL
// returns bytes we hash ourselves. Anything that cannot be retrieved is left
// untouched and reported so the caller can quarantine it with a reason.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import readXlsxFile from 'read-excel-file/node';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = join(ROOT, 'data/source-registry.json');
const OUT = join(ROOT, 'data/artifact-hydration-manifest.json');

// ---- Deterministic record counters keyed by counting method. ----
function countOscalControls(json) {
  // Count controls + nested enhancements across all groups (OSCAL catalog).
  let n = 0;
  const walkControls = (controls) => {
    for (const c of controls || []) {
      n += 1;
      if (c.controls) walkControls(c.controls);
    }
  };
  const walkGroups = (groups) => {
    for (const g of groups || []) {
      if (g.controls) walkControls(g.controls);
      if (g.groups) walkGroups(g.groups);
    }
  };
  const cat = json.catalog || json;
  walkGroups(cat.groups);
  walkControls(cat.controls);
  return n;
}
function countOscalProfileImports(json) {
  const prof = json.profile || json;
  let n = 0;
  for (const imp of prof.imports || []) {
    if (imp['include-controls']) {
      for (const inc of imp['include-controls']) n += (inc['with-ids'] || []).length;
    }
    if (imp['include-all']) n += 1;
  }
  return n;
}
function countStixTechniques(json) {
  return (json.objects || []).filter(
    (o) => o.type === 'attack-pattern' && !o.revoked && !o.x_mitre_deprecated,
  ).length;
}
function countJsonLdEntries(json) {
  if (Array.isArray(json)) return json.length;
  if (json['@graph']) return json['@graph'].length;
  if (json.results && json.results.bindings) return json.results.bindings.length;
  return Object.keys(json).length;
}
function countCsvRows(text) {
  return text.split(/\r?\n/).filter((l) => l.trim().length > 0).length - 1; // minus header
}
function countCciItems(buf) {
  const files = unzipSync(new Uint8Array(buf));
  const xmlName = Object.keys(files).find((f) => /\.xml$/i.test(f));
  if (!xmlName) throw new Error('no XML in CCI zip');
  const xml = Buffer.from(files[xmlName]).toString('utf8');
  const m = xml.match(/<cci_item\b/g);
  return m ? m.length : 0;
}

// NIST OSCAL content is pinned to release tag v1.5.0 (published 2026-05-13) so
// re-runs are deterministic against a fixed tree rather than the moving `main`.
const OSCAL = 'https://raw.githubusercontent.com/usnistgov/oscal-content/v1.5.0/nist.gov';

// Each resolution: exact file URL + parser label + counting method.
// Only artifacts whose URL is a real downloadable FILE belong here.
// `local` resolutions hash a file already in the repo (Control Atlas's own
// editorial spine) rather than fetching over the network.
const RESOLUTIONS = [
  { id: 'artifact-nist-800-171-rev2', url: 'https://csrc.nist.gov/files/pubs/sp/800/171/r2/upd1/final/docs/sp800-171r2-security-reqs.csv', format: 'csv', parser: 'csv', parser_version: '1.0.0', count: 'csv' },
  { id: 'artifact-nist-ai-rmf-playbook', url: 'https://airc.nist.gov/docs/playbook.json', format: 'json', parser: 'ai-rmf-playbook-json', parser_version: '1.0.0', count: 'jsonld' },
  { id: 'artifact-fedramp-2026-rules', url: 'https://raw.githubusercontent.com/FedRAMP/rules/main/fedramp-consolidated-rules.json', format: 'json', parser: 'fedramp-consolidated-rules-json', parser_version: '1.0.0', count: 'jsonld' },
  { id: 'artifact-mitre-attack-enterprise', url: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json', format: 'stix', parser: 'stix-json', parser_version: '1.0.0', count: 'stix' },
  { id: 'artifact-mitre-attack-ics', url: 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/ics-attack/ics-attack.json', format: 'stix', parser: 'stix-json', parser_version: '1.0.0', count: 'stix' },
  { id: 'artifact-mitre-d3fend-ontology', url: 'https://d3fend.mitre.org/api/technique/all.json', format: 'json_ld', parser: 'd3fend-json-ld', parser_version: '1.0.0', count: 'jsonld' },
  { id: 'artifact-mitre-d3fend-mappings', url: 'https://d3fend.mitre.org/api/ontology/inference/d3fend-full-mappings.json', format: 'json_ld', parser: 'd3fend-json-ld', parser_version: '1.0.0', count: 'jsonld' },
  { id: 'artifact-disa-cci-list', url: 'https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/U_CCI_List.zip', format: 'oscal_xml', parser: 'cci-xml', parser_version: '1.0.0', count: 'cci' },
  // NIST OSCAL catalog family (pinned v1.5.0). These target the graph-cited
  // artifact ids (artifact-<catalogId>) so node/edge provenance resolves to
  // real evidence; the fabricated `-oscal`/`-oscal-mappings` twins are removed.
  { id: 'artifact-nist-800-53', url: `${OSCAL}/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json`, format: 'oscal_json', parser: 'oscal-json', parser_version: '1.5.0', count: 'oscal_catalog' },
  { id: 'artifact-nist-800-172-rev3', url: `${OSCAL}/SP800-172/rev3/json/NIST_SP800-172_rev3_catalog.json`, format: 'oscal_json', parser: 'oscal-json', parser_version: '1.5.0', count: 'oscal_catalog' },
  { id: 'artifact-nist-ssdf', url: `${OSCAL}/SP800-218/ver1/json/NIST_SP800-218_ver1_catalog.json`, format: 'oscal_json', parser: 'oscal-json', parser_version: '1.5.0', count: 'oscal_catalog' },
  { id: 'artifact-nist-800-171-oscal-mappings', url: `${OSCAL}/SP800-171/rev3/json/NIST_SP800-171_rev3_catalog.json`, format: 'oscal_json', parser: 'oscal-json', parser_version: '1.5.0', count: 'oscal_catalog' },
  // Direct-download spreadsheets (real bytes + first-sheet row counts).
  { id: 'artifact-fedramp-rev5', url: 'https://www.fedramp.gov/legacy/assets/LEGACY%20FedRAMP_Security_Controls_Baseline.xlsx', format: 'spreadsheet', parser: 'fedramp-legacy-baseline-workbook', parser_version: '1.0.0', count: 'xlsx' },
  { id: 'artifact-nist-800-53-rev4-rev5-crosswalk', url: 'https://csrc.nist.gov/files/pubs/sp/800/53/r5/upd1/final/docs/sp800-53r4-to-r5-comparison-workbook.xlsx', format: 'spreadsheet', parser: 'rev4-rev5-crosswalk-xlsx', parser_version: '1.0.0', count: 'xlsx' },
  { id: 'artifact-nist-csf-53-supplemental', url: 'https://csrc.nist.gov/files/pubs/sp/800/53/r5/upd1/final/docs/csf-pf-to-sp800-53r5-mappings.xlsx', format: 'spreadsheet', parser: 'olir-xlsx', parser_version: '1.0.0', count: 'xlsx' },
  // NIST OLIR crosswalk submissions (byte-stable Final files; refIds 186/179).
  { id: 'artifact-nist-csf11-csf20-crosswalk', url: 'https://csrc.nist.gov/csrc/media/Projects/olir/documents/submissions/CSFv1.1_to_CSFv2.0_CROSSWALK_20240220.xlsx', format: 'spreadsheet', parser: 'olir-xlsx', parser_version: '1.0.0', count: 'xlsx' },
  { id: 'artifact-nist-olir-csf2-to-sp800-53', url: 'https://csrc.nist.gov/csrc/media/projects/olir/documents/submissions/Cybersecurity_Framework_v2-0_Concept_Crosswalk_800-53_5_2_0_draft.xlsx', format: 'spreadsheet', parser: 'olir-xlsx', parser_version: '1.0.0', count: 'xlsx' },
  { id: 'artifact-nist-olir-csf2-to-sp800-171', url: 'https://csrc.nist.gov/csrc/media/Projects/olir/documents/submissions/CSFv2.0_Concept_Crosswalk_SP171r3_OLIR.xlsx', format: 'spreadsheet', parser: 'olir-xlsx', parser_version: '1.0.0', count: 'xlsx' },
  // DoD Zero Trust source PDFs (real bytes/hash; record counts come from the
  // graph reconciler — the reference architecture is the node source, the
  // others are retained supplemental documents).
  { id: 'artifact-dod-zt-reference-architecture-v2', url: 'https://dodcio.defense.gov/Portals/0/Documents/Library/(U)ZT_RA_v2.0(U)_Sep22.pdf', format: 'pdf', parser: 'pdf-extract', parser_version: '1.0.0' },
  { id: 'artifact-dod-zt-strategy', url: 'https://dodcio.defense.gov/Portals/0/Documents/Library/DoD-ZTStrategy.pdf', format: 'pdf', parser: 'pdf-extract', parser_version: '1.0.0' },
  { id: 'artifact-dod-zt-overlays-2024', url: 'https://dodcio.defense.gov/Portals/0/Documents/Library/ZeroTrustOverlays-2024Feb.pdf', format: 'pdf', parser: 'pdf-extract', parser_version: '1.0.0' },
  { id: 'artifact-dod-zt-capabilities', url: 'https://dodcio.defense.gov/Portals/0/Documents/Library/ZTCapabilitiesActivities.pdf', format: 'pdf', parser: 'pdf-extract', parser_version: '1.0.0' },
  { id: 'artifact-dod-zt-execution-roadmap', url: 'https://dodcio.defense.gov/Portals/0/Documents/Library/ZT-ExecutionRoadmap-v1.1.pdf', format: 'pdf', parser: 'pdf-extract', parser_version: '1.0.0' },
  // CUI: 32 CFR Part 2002 from the eCFR versioner API (date-pinned = byte-stable).
  { id: 'artifact-isoo-cui-regulation', url: 'https://www.ecfr.gov/api/versioner/v1/full/2026-08-01/title-32.xml?part=2002', format: 'xml', parser: 'ecfr-xml', parser_version: '1.0.0' },
  // Control Atlas's own editorial structure spine (hashed from the repo file).
  { id: 'artifact-control-atlas-structure', local: 'data/curated/tree-spine.json', url: 'https://github.com/BackslashBryant/control-atlas/blob/main/data/curated/tree-spine.json', format: 'json', parser: 'control-atlas-spine', parser_version: '1.0.0', count: 'jsonld' },
];

const COUNTERS = {
  oscal_catalog: (bytes) => countOscalControls(JSON.parse(Buffer.from(bytes).toString('utf8'))),
  oscal_profile: (bytes) => countOscalProfileImports(JSON.parse(Buffer.from(bytes).toString('utf8'))),
  stix: (bytes) => countStixTechniques(JSON.parse(Buffer.from(bytes).toString('utf8'))),
  jsonld: (bytes) => countJsonLdEntries(JSON.parse(Buffer.from(bytes).toString('utf8'))),
  csv: (bytes) => countCsvRows(Buffer.from(bytes).toString('utf8')),
  cci: (bytes) => countCciItems(bytes),
};

// XLSX row count is async (read-excel-file/node reads a file/stream).
async function countXlsxRows(buf) {
  const tmp = join(tmpdir(), `ca-hydrate-${createHash('sha1').update(buf).digest('hex').slice(0, 12)}.xlsx`);
  writeFileSync(tmp, buf);
  const rows = await readXlsxFile(tmp);
  return Math.max(0, rows.length - 1); // minus header row
}

async function countRecords(method, buf) {
  if (method === 'xlsx') return countXlsxRows(buf);
  if (method && COUNTERS[method]) return COUNTERS[method](buf);
  return null;
}

async function fetchBytes(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'ControlAtlas-ingestion/1.0 (+https://github.com/BackslashBryant/control-atlas)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, status: res.status };
}

async function main() {
  const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
  const byId = new Map(registry.artifacts.map((a) => [a.id, a]));
  const today = new Date().toISOString().slice(0, 10);
  const log = [];
  let changed = 0;

  for (const r of RESOLUTIONS) {
    const art = byId.get(r.id);
    if (!art) { log.push({ id: r.id, status: 'ERROR', reason: 'artifact id not in registry' }); continue; }
    try {
      const { buf, status } = r.local
        ? { buf: readFileSync(join(ROOT, r.local)), status: 'local' }
        : await fetchBytes(r.url);
      const sha256 = 'sha256:' + createHash('sha256').update(buf).digest('hex');
      const byteLength = buf.length;
      const recordCount = await countRecords(r.count, buf);
      const contentChanged = art.sha256 !== sha256;
      // Preserve retrieved_at when bytes are unchanged (stable re-runs).
      const retrievedAt = contentChanged ? today : (art.retrieved_at && !/placeholder/i.test(art.retrieved_at) ? art.retrieved_at : today);

      art.artifact_url = r.url;
      art.format = r.format;
      art.parser = r.parser;
      art.parser_version = r.parser_version;
      art.sha256 = sha256;
      art.byte_length = byteLength;
      art.retrieved_at = retrievedAt;
      if (recordCount !== null) art.record_count = recordCount;
      if (typeof art.relationship_count !== 'number') art.relationship_count = 0;

      changed += 1;
      log.push({ id: r.id, status: 'OK', http: status, url: r.url, sha256, byte_length: byteLength, record_count: recordCount, retrieved_at: retrievedAt });
      console.log(`OK  ${r.id}  ${byteLength}B  records=${recordCount}  ${sha256.slice(0, 22)}…`);
    } catch (e) {
      log.push({ id: r.id, status: 'FAILED', url: r.url, reason: String(e.message || e) });
      console.error(`FAIL ${r.id}  ${r.url}  ${e.message || e}`);
    }
  }

  // Remove fabricated orphan twins whose real evidence now lives under the
  // graph-cited artifact id. Only ids proven un-cited by the graph belong here.
  const REMOVE_ORPHANS = [
    { id: 'artifact-nist-oscal', reason: 'duplicate of artifact-nist-800-53 (same OSCAL rev5 catalog); not graph-cited' },
    { id: 'artifact-nist-ssdf-oscal', reason: 'duplicate of artifact-nist-ssdf (same SSDF OSCAL catalog); not graph-cited' },
  ];
  const removed = [];
  for (const { id, reason } of REMOVE_ORPHANS) {
    const idx = registry.artifacts.findIndex((a) => a.id === id);
    if (idx !== -1) { registry.artifacts.splice(idx, 1); removed.push({ id, reason }); }
    for (const b of registry.catalog_source_bundles || []) {
      for (const key of ['primary_artifact_ids', 'enrichment_artifact_ids', 'mapping_source_ids',
        'assessment_source_ids', 'automation_source_ids', 'reconciliation_source_ids']) {
        if (Array.isArray(b[key])) b[key] = b[key].filter((x) => x !== id);
      }
    }
  }
  if (removed.length) console.log(`Removed ${removed.length} fabricated orphan twin(s): ${removed.map((r) => r.id).join(', ')}`);

  if (!existsSync(dirname(OUT))) mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ generated_at: new Date().toISOString(), hydrated: changed, removed_orphans: removed, results: log }, null, 2) + '\n', 'utf8');
  writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n', 'utf8');
  console.log(`\nHydrated ${changed}/${RESOLUTIONS.length} artifacts. Execution log: data/artifact-hydration-manifest.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
