#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const EXPECTED_MANIFESTS = [
  'data/disa-artifact-manifest.json',
  'data/olir-catalog-manifest.json'
];

function verifyDiscovery() {
  console.log('Verifying discovery outputs...');
  
  let hasError = false;
  
  for (const relPath of EXPECTED_MANIFESTS) {
    const fullPath = join(ROOT, relPath);
    if (!existsSync(fullPath)) {
      console.warn(`WARNING: Missing discovery manifest: ${relPath}`);
      continue;
    }
    
    try {
      const data = JSON.parse(readFileSync(fullPath, 'utf8'));
      let count = 0;
      
      if (data.artifacts) {
        count = data.artifacts.length;
      } else if (data.processed_items) {
        count = data.processed_items.length;
      } else if (data.reconciliation && data.reconciliation.inventory_details) {
        count = data.reconciliation.inventory_details.length;
      }
      
      console.log(`PASS: ${relPath} contains ${count} items.`);
      if (count === 0) {
        console.error(`ERROR: ${relPath} is empty.`);
        hasError = true;
      }
    } catch (e) {
      console.error(`ERROR: Invalid JSON in ${relPath}`);
      hasError = true;
    }
  }

  if (hasError) {
    process.exit(1);
  }
}

verifyDiscovery();
