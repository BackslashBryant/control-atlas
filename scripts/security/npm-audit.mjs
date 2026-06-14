#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const config = JSON.parse(readFileSync(new URL('../../security/npm-audit-exceptions.json', import.meta.url), 'utf8'));
assert.equal(config.version, 1, 'unsupported audit exception schema version');

const threshold = config.threshold || 'high';
const severityRank = new Map([
  ['info', 0],
  ['low', 1],
  ['moderate', 2],
  ['high', 3],
  ['critical', 4],
]);
const audit = spawnSync('npm', ['audit', '--json', '--audit-level', threshold], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (audit.error) throw audit.error;

let report;
try {
  report = JSON.parse(audit.stdout || audit.stderr || '{}');
} catch (error) {
  console.error('Failed to parse npm audit output.');
  console.error(audit.stdout || audit.stderr);
  throw error;
}

const exceptions = new Map((config.exceptions || []).map((entry) => [`${entry.package}:${entry.id}`, entry]));
const remaining = [];

for (const vulnerability of Object.values(report.vulnerabilities || {})) {
  for (const advisory of vulnerability.via || []) {
    if (typeof advisory === 'string') continue;
    if ((severityRank.get(advisory.severity) || 0) < (severityRank.get(threshold) || 0)) continue;
    const key = `${vulnerability.name}:${advisory.source}`;
    const exception = exceptions.get(key);
    if (!exception) {
      remaining.push({
        package: vulnerability.name,
        id: advisory.source,
        severity: advisory.severity,
        title: advisory.title,
        url: advisory.url,
      });
      continue;
    }
  }
}

if (remaining.length) {
  console.error('Unapproved dependency vulnerabilities found:');
  for (const advisory of remaining) {
    console.error(`- ${advisory.package} ${advisory.id} [${advisory.severity}] ${advisory.title}`);
    if (advisory.url) console.error(`  ${advisory.url}`);
  }
  process.exit(1);
}

if ((config.exceptions || []).length) {
  console.log(`npm audit passed with ${config.exceptions.length} documented exception(s).`);
} else {
  console.log('npm audit passed with no exceptions.');
}
