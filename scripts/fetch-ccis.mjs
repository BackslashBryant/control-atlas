#!/usr/bin/env node
/**
 * Generate Bronze-tier CCI metadata for GovFrame Navigator.
 * Maps CCIs directly to NIST 800-53 controls (seed records for AC-2, AC-3, AC-6).
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CCIS = [
  {
    id: 'CCI-000015',
    nist_control: 'AC-2',
    title: 'Account Management',
    description: 'The organization manages information system accounts, including establishing, activating, modifying, reviewing, disabling, and removing accounts.',
  },
  {
    id: 'CCI-000213',
    nist_control: 'AC-3',
    title: 'Access Enforcement',
    description: 'The organization enforces approved authorizations for logical access to information and system resources in accordance with applicable access control policies.',
  },
  {
    id: 'CCI-000225',
    nist_control: 'AC-6',
    title: 'Least Privilege',
    description: 'The organization employs the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) which are necessary to accomplish assigned tasks in accordance with organizational missions and business functions.',
  }
];

function generateCciRecords(snapshotDate) {
  return CCIS.map((entry) => ({
    id: entry.id,
    type: 'cci-item',
    framework: 'cci',
    title: `CCI ${entry.id} (${entry.nist_control})`,
    description: entry.description,
    nist_control: entry.nist_control,
    source: {
      key: 'cci-curated',
      snapshot_date: snapshotDate,
    },
  }));
}

export async function fetchCcis(options = {}) {
  const snapshotDate = options.snapshotDate || new Date().toISOString();
  const records = generateCciRecords(snapshotDate);

  return {
    schema_version: "1.0",
    source_key: "cci-curated",
    records
  };
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const outPath = join(root, 'data', 'ccis.json');
  const seed = await fetchCcis();
  writeFileSync(outPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${seed.records.length} CCI records to data/ccis.json`);
}

if (process.argv[1]?.includes('fetch-ccis.mjs')) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
