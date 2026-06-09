#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const coverage = JSON.parse(readFileSync('data/generated/coverage.json', 'utf8'));
if (!coverage.frameworks?.length) throw new Error('coverage report has no frameworks');
if (!coverage.frameworks.some((item) => item.catalog_items > 0)) throw new Error('coverage report has no catalog items');
if (coverage.mappings.published < 1) throw new Error('coverage report has no published mappings');

console.log(`Coverage audit passed: ${coverage.frameworks.length} frameworks, ${coverage.mappings.published} published mappings, ${coverage.mappings.evidence_gaps} with evidence gaps`);
