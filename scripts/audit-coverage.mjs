#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { loadSourceRegistry } from './lib/source-registry.mjs';

const coverage = JSON.parse(readFileSync('data/generated/coverage.json', 'utf8'));
const sourceHealth = JSON.parse(readFileSync('data/generated/source-health.json', 'utf8'));
const candidates = JSON.parse(readFileSync('data/generated/candidates.json', 'utf8'));
const registry = loadSourceRegistry(JSON.parse(readFileSync('data/source-registry.json', 'utf8')));

const errors = [];
const warnings = [];

if (!coverage.frameworks?.length) errors.push('coverage report has no frameworks');
if (!coverage.frameworks.some((item) => item.catalog_items > 0)) errors.push('coverage report has no catalog items');
if (coverage.mappings.published < 1) errors.push('coverage report has no published mappings');

for (const framework of coverage.frameworks || []) {
  if (framework.status === 'active' && framework.catalog_items === 0) {
    errors.push(`active framework ${framework.framework_id} has zero catalog items`);
  }
}

for (const source of registry.sources) {
  if (source.tier === 'gold' && !source.authority_type) {
    errors.push(`gold source ${source.id} missing authority_type`);
  }
}

const manualSeedMaps = ['maps/800-53-to-csf.json', 'maps/800-53-to-800-171.json'];
for (const path of manualSeedMaps) {
  if (!existsSync(path)) continue;
  const document = JSON.parse(readFileSync(path, 'utf8'));
  if (document.schema_version === '1.0' && !document.checksum) {
    errors.push(`manual seed map still present without provenance: ${path}`);
  }
}

for (const source of sourceHealth.sources || []) {
  if (source.used_in_publish_path && source.authority_type === 'mapping_authority' && !source.checksum) {
    errors.push(`mapping authority ${source.id} used in publish path without checksum`);
  }
  if (source.stale) {
    warnings.push(`source ${source.id} snapshot is stale (${source.snapshot_date})`);
  }
}

if (candidates.some((item) => item.status !== 'candidate')) {
  errors.push('candidates.json contains non-candidate assertions');
}

const mappingAuthorities = registry.sources.filter((source) => source.authority_type === 'mapping_authority');
if (mappingAuthorities.length !== 5) {
  errors.push(`expected 5 mapping_authority sources, found ${mappingAuthorities.length}`);
}

if (errors.length) {
  throw new Error(`Coverage audit failed:\n- ${errors.join('\n- ')}`);
}

console.log(`Coverage audit passed: ${coverage.frameworks.length} frameworks, ${coverage.mappings.published} published mappings, ${coverage.mappings.blocked} blocked, ${coverage.mappings.candidates || candidates.length} candidates`);
if (warnings.length) {
  console.log(`Warnings:\n- ${warnings.join('\n- ')}`);
}
