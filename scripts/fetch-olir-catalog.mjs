#!/usr/bin/env node
// spec §5 — full OLIR discovery: retrieve every catalog entry from NIST's
// live OLIR API and record real per-entry metadata (no stub
// "discovered_but_not_ingested" placeholders). Entries whose focal document
// is a Control Atlas catalog AND that already have a real, structured,
// machine-parseable relationship artifact are marked ingested (see
// tools/relationship-builders/olir-adapter.mjs + maps/*.json). Everything
// else is quarantined with an explicit, entry-specific reason: NIST's public
// OLIR catalog list API exposes only a pointer to the REFERENCED publication
// per entry (verified: /details/{id} and /reference-detail/{id} both 404
// from this environment) — there is no generic per-entry submission-artifact
// download endpoint to ingest relationship rows from.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_URL =
  'https://csrc.nist.gov/extensions/nudp/services/json/olir/informative-reference-catalog';
const OLIR_API_ROOT = 'https://csrc.nist.gov/extensions/nudp/services/json/olir';

// focusDocName (exact, as returned by the live API) -> Control Atlas catalog_id.
// Only current/2.0-era publication titles resolve; legacy titles (e.g. CSF 1.1's
// "Framework for Improving Critical Infrastructure Cybersecurity", or 800-53
// Rev 3/4's "...for Federal Information Systems and Organizations") are
// intentionally excluded — spec §4 rejects CSF-1.1-only identifiers from the
// active CSF 2.0 catalog, and the same "current publication only" rule applies
// to every other framework here.
const FOCAL_CATALOG_MAP = new Map([
  ['NIST Cybersecurity Framework', 'csf-2'],
  ['Security and Privacy Controls for Information Systems and Organizations', 'nist-800-53'],
  ['Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations', 'nist-800-171'],
  ['Artificial Intelligence Risk Management Framework (AI RMF 1.0)', 'nist-ai-rmf'],
  ['Secure Software Development Framework (SSDF): Recommendations for Mitigating the Risk of Software Vulnerabilities', 'nist-ssdf'],
]);

// A submitted OLIR record is matched to a downloaded mapping only through its
// published focal/reference identity and official reference URL. Catalog row
// IDs are mutable inventory positions, not an ingestion allowlist.
function ingestedMapping(entry) {
  if (entry.statusDescription !== 'Final' || entry.focusDocName !== 'NIST Cybersecurity Framework') {
    return null;
  }
  const referenceUrl = String(entry.referenceUrl || '').toLowerCase();
  if (/800[-/]53.*rev[-/]5/.test(referenceUrl)) {
    return { map_file: 'maps/800-53-to-csf.json', artifact_id: 'artifact-nist-olir-csf2-to-sp800-53', mapping_model: 'Concept Crosswalk' };
  }
  if (/sp\/800\/171\/r3/.test(referenceUrl)) {
    return { map_file: 'maps/800-171-to-csf.json', artifact_id: 'artifact-nist-olir-csf2-to-sp800-171', mapping_model: 'Concept Crosswalk' };
  }
  return null;
}

// NIST's stated preference order (spec §5 / CSRC OLIR program guidance).
function authorityTier(entry) {
  const owner = entry.authorityDescription === 'Owner';
  const nist = /national institute of standards and technology|^nist\b/i.test(entry.developer || '');
  const govAdjacent = /nist|dod|cisa|omb|nara|gsa|department|agency|administration/i.test(entry.developer || '')
    && entry.submissionCategoryDescription === 'Public Sector';
  if (entry.statusDescription === 'Final') {
    if (owner && nist) return { tier: 1, label: 'NIST owner-authority Final' };
    if (owner && govAdjacent) return { tier: 2, label: 'Other government owner-authority Final' };
    if (govAdjacent) return { tier: 3, label: 'Other government Final' };
    if (owner) return { tier: 4, label: 'Validated third-party Final' };
    return { tier: 7, label: 'Community candidate Final' };
  }
  if (entry.statusDescription === 'Draft') return { tier: 5, label: 'Draft' };
  if (entry.statusDescription === 'Work-in-progress Draft') return { tier: 6, label: 'Derived non-authoritative (work-in-progress)' };
  return { tier: 7, label: `Community candidate (${entry.statusDescription || 'unknown status'})` };
}

function quarantineReason(entry, catalogId) {
  if (!catalogId) {
    return `focal document "${entry.focusDocName}" is not a Control Atlas catalog (current-publication scope only)`;
  }
  if (entry.statusDescription !== 'Final') {
    return `OLIR status is "${entry.statusDescription}", not Final — held out of the published graph pending NIST finalization`;
  }
  return 'no downloadable structured relationship artifact at this submission — the OLIR catalog list API exposes only a pointer to the referenced publication (referenceUrl), not a machine-parseable crosswalk file; NIST\'s per-entry submission-artifact endpoint (/details/{id}, /reference-detail/{id}) returns 404 from this environment for every id tried';
}

async function probe(url, kind) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    });
    return {
      kind,
      url,
      status: response.status,
      final_url: response.url,
      content_type: response.headers.get('content-type'),
      content_length: response.headers.get('content-length'),
    };
  } catch (error) {
    return { kind, url, error: error instanceof Error ? error.message : String(error) };
  }
}

async function mapWithConcurrency(items, limit, work) {
  const output = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        output[index] = await work(items[index]);
      }
    }),
  );
  return output;
}

async function retrieveDetail(id) {
  const url = `${OLIR_API_ROOT}/informative-reference-catalog/details/${id}`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const body = response.ok ? await response.json() : null;
    const detail = body?.response?.[0] || null;
    return {
      kind: 'NIST catalog detail endpoint',
      url,
      status: response.status,
      final_url: response.url,
      json_file_url: detail?.jsonFileUrl || null,
      publisher_sha256: detail?.jsonSha256 ? `sha256:${String(detail.jsonSha256).toLowerCase()}` : null,
      submission_url: detail?.webSite || null,
      reference_url: detail?.referenceUrl || null,
      mapping_summary: detail?.summary || null,
      mapping_comment: detail?.comment || null,
    };
  } catch (error) {
    return { kind: 'NIST catalog detail endpoint', url, error: error instanceof Error ? error.message : String(error) };
  }
}

async function retrieveEntryEvidence(entry) {
  const id = entry.informativeReferenceFrameworkVersionId;
  const detail = await retrieveDetail(id);
  const candidates = [
    ...(detail.json_file_url ? [probe(detail.json_file_url, 'NIST detail JSON resource')] : []),
    ...(detail.submission_url ? [probe(detail.submission_url, 'NIST detail submission URL')] : []),
    ...(detail.reference_url ? [probe(detail.reference_url, 'NIST detail reference URL')] : []),
    ...(entry.referenceUrl ? [probe(entry.referenceUrl, 'catalog listed reference URL')] : []),
  ];
  return [detail, ...(await Promise.all(candidates))];
}

export async function fetchOlirCatalog() {
  const response = await fetch(CATALOG_URL);
  if (!response.ok) throw new Error(`OLIR catalog fetch failed (${response.status})`);
  const body = await response.json();
  const entries = body?.response?.searchResults;
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('OLIR catalog API returned no entries');
  }

  const applicableFinalEntries = entries.filter(
    (entry) =>
      entry.statusDescription === 'Final' &&
      FOCAL_CATALOG_MAP.has(entry.focusDocName),
  );
  const evidenceById = new Map(
    (await mapWithConcurrency(applicableFinalEntries, 6, async (entry) => [
      entry.informativeReferenceFrameworkVersionId,
      await retrieveEntryEvidence(entry),
    ])).map(([id, attempts]) => [id, attempts]),
  );

  const processed_items = entries.map((entry) => {
    const id = entry.informativeReferenceFrameworkVersionId;
    const catalogId = FOCAL_CATALOG_MAP.get(entry.focusDocName) || null;
    const authority = authorityTier(entry);
    const ingested = ingestedMapping(entry);
    const retrieval_attempts = evidenceById.get(id) || [];
    const attemptSummary = retrieval_attempts
      .map((attempt) => `${attempt.kind} ${attempt.status ?? attempt.error ?? 'not reached'}`)
      .join('; ');

    return {
      id,
      framework_version_identifier: entry.frameworkVersionIdentifier,
      name: entry.referenceName,
      focal_document: entry.focusDocName,
      resolved_catalog_id: catalogId,
      reference_document_version: entry.shortName,
      version: entry.version,
      status: entry.statusDescription,
      authority_description: entry.authorityDescription,
      submission_category: entry.submissionCategoryDescription,
      developer: entry.developer,
      posted_date: entry.posted_date,
      reference_date: entry.referenceDate,
      submission_artifact_url: entry.referenceUrl,
      authority_tier: authority.tier,
      authority_tier_label: authority.label,
      mapping_model: ingested?.mapping_model || null,
      ingested: Boolean(ingested),
      map_file: ingested?.map_file || null,
      artifact_id: ingested?.artifact_id || null,
      quarantine_reason: ingested
        ? null
        : attemptSummary
          ? `no downloadable structured relationship artifact was exposed after live retrieval: ${attemptSummary}`
          : quarantineReason(entry, catalogId),
      retrieval_attempts,
    };
  });

  const manifest = {
    generated_at: new Date().toISOString(),
    source: 'https://csrc.nist.gov/projects/olir/informative-reference-catalog',
    api_endpoint: CATALOG_URL,
    total_entries: entries.length,
    final_count: processed_items.filter((item) => item.status === 'Final').length,
    applicable_final_count: processed_items.filter(
      (item) => item.status === 'Final' && item.resolved_catalog_id,
    ).length,
    ingested_count: processed_items.filter((item) => item.ingested).length,
    quarantined_count: processed_items.filter((item) => !item.ingested).length,
    unresolved_count: processed_items.filter(
      (item) => item.status === 'Final' && item.resolved_catalog_id && !item.ingested,
    ).length,
    processed_items,
  };

  writeFileSync(
    join(ROOT, 'data', 'olir-catalog-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  return manifest;
}

if (process.argv[1]?.includes('fetch-olir-catalog.mjs')) {
  fetchOlirCatalog()
    .then((manifest) =>
      console.log(
        `Wrote ${manifest.total_entries} OLIR catalog entries (${manifest.ingested_count} ingested, ${manifest.quarantined_count} quarantined) to data/olir-catalog-manifest.json`,
      ),
    )
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
