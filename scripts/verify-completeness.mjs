#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('data/source-coverage-manifest.json', 'utf8'));
const incomplete = (manifest.catalogs || [])
  .filter((catalog) => catalog.completeness_status !== 'reconciled')
  .map((catalog) => `${catalog.catalog_id}:${catalog.completeness_status}`);

if (manifest.integrity_status !== 'PASSED') {
  console.error(`FAIL: source coverage integrity is ${manifest.integrity_status || 'UNKNOWN'}.`);
  process.exit(1);
}
if (manifest.completeness_status !== 'COMPLETE' || incomplete.length > 0) {
  console.error(`FAIL: source completeness is INCOMPLETE (${incomplete.join(', ')}).`);
  process.exit(1);
}
console.log(`PASS: all ${manifest.catalogs.length} catalog source inventories are reconciled.`);
