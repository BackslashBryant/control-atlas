#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

async function main() {
  console.log('--- Control Atlas OSCAL Compliance & Schema Validator ---');

  // 1. Run the official NIST OSCAL CLI cross-check runner
  const runnerPath = join(ROOT, 'tools', 'oscal-cross-check.mjs');
  if (!existsSync(runnerPath)) {
    throw new Error(`Missing OSCAL cross-check runner: ${runnerPath}`);
  }

  console.log(`Executing OSCAL CLI cross-check runner: ${runnerPath}`);
  const result = spawnSync(process.execPath, [runnerPath], { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`OSCAL CLI cross-check failed with exit code ${result.status}`);
  }

  // 2. Validate structural OSCAL catalog files
  const oscalFiles = [
    join(ROOT, 'data', 'controls-800-53.json'),
    join(ROOT, 'data', 'csf-subcategories.json'),
    join(ROOT, 'data', '800-53b-baselines.json'),
  ];

  let totalChecked = 0;
  for (const filePath of oscalFiles) {
    if (!existsSync(filePath)) {
      throw new Error(`Required OSCAL artifact missing: ${filePath}`);
    }
    const content = JSON.parse(readFileSync(filePath, 'utf8'));
    totalChecked++;
    if (!content.catalog && !content.profile && !Array.isArray(content.records) && !content.groups && !content.controls) {
      throw new Error(`Invalid OSCAL structure in ${filePath}`);
    }
  }

  console.log(`\nOSCAL Verification Summary: Cross-check passed & ${totalChecked} catalog artifacts validated.`);
}

if (process.argv[1]?.includes('check-oscal.mjs')) {
  main().catch((err) => {
    console.error('Fatal error in OSCAL check:', err.message);
    process.exit(1);
  });
}
