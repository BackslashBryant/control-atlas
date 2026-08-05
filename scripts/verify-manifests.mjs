#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function verifyManifests() {
  console.log('Verifying manifest integrity...');
  let hasError = false;

  const disaPath = join(ROOT, 'data/disa-artifact-manifest.json');
  if (existsSync(disaPath)) {
    const data = JSON.parse(readFileSync(disaPath, 'utf8'));
    
    // Check top-level manifest checksum
    if (!data.checksum || !data.checksum.startsWith('sha256:')) {
      console.error(`ERROR: DISA manifest missing valid sha256 checksum.`);
      hasError = true;
    }
    
    const artifacts = data.reconciliation?.inventory_details || data.artifacts || [];
    for (const artifact of artifacts) {
      if (!artifact.entryPath && !artifact.filename) {
        console.error(`ERROR: DISA artifact missing entryPath or filename.`);
        hasError = true;
      }
      if (!artifact.status) {
        console.error(`ERROR: DISA artifact missing status.`);
        hasError = true;
      }
    }
  }

  const olirPath = join(ROOT, 'data/olir-catalog-manifest.json');
  if (existsSync(olirPath)) {
    const data = JSON.parse(readFileSync(olirPath, 'utf8'));
    for (const item of data.processed_items || []) {
      if (item.checksum && !item.checksum.startsWith('sha256:')) {
        console.error(`ERROR: OLIR item ${item.name} missing valid sha256 hash.`);
        hasError = true;
      }
      if (!item.source_url || (!item.source_url.startsWith('https://') && !item.source_url.startsWith('//'))) {
        console.error(`ERROR: OLIR item ${item.name} missing valid source URL.`);
        hasError = true;
      }
    }
  }

  if (hasError) {
    process.exit(1);
  }
  
  console.log('PASS: Manifests passed integrity verification.');
}

verifyManifests();
