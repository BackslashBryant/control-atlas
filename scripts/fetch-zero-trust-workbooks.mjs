#!/usr/bin/env node
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import { writeJsonAtomically } from './lib/write-json-atomically.mjs';
import { strictConditionalFetch } from './lib/strict-conditional-fetch.mjs';
import {
  parseMicrosoftZeroTrustQuestionnaire,
  parseNistZeroTrustMappingWorkbook,
  workbookSha256,
} from '../tools/importers/zero-trust-workbook-adapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'data', 'curated', 'nist-zt');
const MANIFEST_PATH = join(OUTPUT, 'structured-source-manifest.json');
const SOURCES = [
  { source_key: 'nist-sp-1800-35-csf2-mappings', mapping_kind: 'csf_2', url: 'https://pages.nist.gov/zero-trust-architecture/_downloads/01dfaff2b25f0a61f127f06906bc37cc/CSF2.0Mapping.xlsx' },
  { source_key: 'nist-sp-1800-35-critical-software-mappings', mapping_kind: 'critical_software', url: 'https://pages.nist.gov/zero-trust-architecture/_downloads/641f02c11e6f71752bb8bc96d96c5f38/NISTCSSMMapping.xlsx' },
  { source_key: 'nist-sp-1800-35-csf11-mappings', mapping_kind: 'csf_1_1', url: 'https://pages.nist.gov/zero-trust-architecture/_downloads/993f56b28d4d113836cb1f1a34146cb3/CSF1.1Mapping.xlsx' },
  { source_key: 'nist-sp-1800-35-sp80053-mappings', mapping_kind: 'sp_800_53', url: 'https://pages.nist.gov/zero-trust-architecture/_downloads/eba81c1a0ca458474b0e9bbdfc888eb5/SP800-53Mapping.xlsx' },
];
const MICROSOFT = {
  source_key: 'microsoft-zero-trust-maturity-questionnaire-v1-1',
  url: 'https://download.microsoft.com/download/c/d/3/cd3e0d84-6fdd-4949-b529-73c9c0127b0d/Zero%20Trust%20Maturity%20Questionnaire%20v1.1.xlsx',
};

async function fetchWorkbook(source) {
  const response = await strictConditionalFetch(source.url, {
    headers: { 'User-Agent': 'Control-Atlas-source-integrity' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`${source.source_key} fetch failed: ${response.status} ${source.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(0, 2).toString('utf8') !== 'PK') throw new Error(`${source.source_key} did not return an XLSX package`);
  return bytes;
}

function priorRetrievedAt(sourceKey, sha256) {
  try {
    const prior = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    const match = prior.sources.find((entry) => entry.source_key === sourceKey && entry.sha256 === sha256);
    return match?.retrieved_at || null;
  } catch {
    return null;
  }
}

async function main() {
  mkdirSync(OUTPUT, { recursive: true });
  const mappings = [];
  const sources = [];
  for (const source of SOURCES) {
    const bytes = await fetchWorkbook(source);
    const parsed = await parseNistZeroTrustMappingWorkbook(bytes, source);
    const sha256 = workbookSha256(bytes);
    mappings.push(...parsed.mappings);
    sources.push({
      ...source,
      sha256,
      byte_length: bytes.length,
      retrieved_at: priorRetrievedAt(source.source_key, sha256) || new Date().toISOString(),
      worksheets: parsed.sheets,
      parsed_records: parsed.mappings.length,
    });
  }
  const microsoftBytes = await fetchWorkbook(MICROSOFT);
  const questionnaire = await parseMicrosoftZeroTrustQuestionnaire(microsoftBytes, MICROSOFT);
  const microsoftSha = workbookSha256(microsoftBytes);
  sources.push({
    ...MICROSOFT,
    sha256: microsoftSha,
    byte_length: microsoftBytes.length,
    retrieved_at: priorRetrievedAt(MICROSOFT.source_key, microsoftSha) || new Date().toISOString(),
    worksheets: questionnaire.sheets,
    parsed_records: questionnaire.questions.length,
  });

  writeJsonAtomically(join(OUTPUT, 'mappings.json'), { schema_version: '1.0', records: mappings });
  writeJsonAtomically(join(OUTPUT, 'microsoft-questionnaire.json'), { schema_version: '1.0', records: questionnaire.questions });
  writeJsonAtomically(MANIFEST_PATH, {
    schema_version: '1.0',
    sources,
    reconciliation: {
      workbooks_discovered: SOURCES.length + 1,
      workbooks_ingested: sources.length,
      workbooks_failed: 0,
      mapping_records: mappings.length,
      questionnaire_records: questionnaire.questions.length,
      synthetic_records: 0,
    },
  });
  console.log(JSON.stringify({ mappings: mappings.length, questions: questionnaire.questions.length, workbooks: sources.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
