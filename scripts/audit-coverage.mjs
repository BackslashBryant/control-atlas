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
  if (framework.status === 'limited-public-scope' && framework.catalog_items === 0) {
    warnings.push(`limited-public-scope framework ${framework.framework_id} has zero catalog items`);
  }
}

for (const source of registry.sources) {
  if (source.tier === 'gold') {
    if (!source.authority_type) {
      errors.push(`gold source ${source.id} missing authority_type`);
    }
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
  if (source.tier === 'gold') {
    if (!source.checksum) {
      errors.push(`gold source ${source.id} missing checksum`);
    }
    if (!source.snapshot_date) {
      errors.push(`gold source ${source.id} missing snapshot date`);
    }
  }
  if (source.stale) {
    warnings.push(`source ${source.id} snapshot is stale (${source.snapshot_date})`);
  }
}

if (candidates.some((item) => item.status !== 'candidate')) {
  errors.push('candidates.json contains non-candidate assertions');
}

const ownerMappingAuthorities = registry.sources.filter((source) => source.authority_type === 'owner_authority_mapping');
if (ownerMappingAuthorities.length !== 6) {
  errors.push(`expected 6 owner_authority_mapping sources, found ${ownerMappingAuthorities.length}`);
}

if (errors.length) {
  throw new Error(`Coverage audit failed:\n- ${errors.join('\n- ')}`);
}

console.log('=== GovFrame Coverage Audit Report ===');
console.log('\n--- Catalog Item Count by Framework ---');
for (const fw of coverage.frameworks || []) {
  console.log(`- ${fw.framework_id}: ${fw.catalog_items} items (${fw.status})`);
}

console.log('\n--- Direct Mapping Count by Framework Pair ---');
for (const [pair, count] of Object.entries(coverage.mappings.by_pair || {})) {
  console.log(`- ${pair}: ${count} mappings`);
}

console.log('\n--- Calculated Path Count by Framework Pair ---');
for (const [pair, count] of Object.entries(coverage.paths.by_pair || {})) {
  console.log(`- ${pair}: ${count} paths`);
}

console.log('\n--- Blocked Assertion Count by Reason ---');
for (const [reason, count] of Object.entries(coverage.blocked_by_reason || {})) {
  console.log(`- ${reason}: ${count} blocked`);
}

console.log('\n--- Candidate Assertion Count by Source ---');
for (const [src, count] of Object.entries(coverage.candidates_by_source || {})) {
  console.log(`- ${src}: ${count} candidates`);
}

const staleCount = (sourceHealth.sources || []).filter((s) => s.stale).length;
console.log(`\nStale source count: ${staleCount}`);

console.log(`\nCoverage audit passed: ${coverage.frameworks.length} frameworks, ${coverage.mappings.published} published mappings, ${coverage.mappings.blocked} blocked, ${coverage.mappings.candidates || candidates.length} candidates`);
if (warnings.length) {
  console.log(`Warnings:\n- ${warnings.join('\n- ')}`);
}
