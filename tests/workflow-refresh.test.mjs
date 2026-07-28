import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/nightly-refresh.yml', 'utf8');
const refreshScript = readFileSync('scripts/refresh-data.mjs', 'utf8');
const lighthouseAb = readFileSync('.github/workflows/lighthouse-ab.yml', 'utf8');

test('source refresh runs weekly and remains manually dispatchable', () => {
  assert.match(workflow, /cron: '17 7 \* \* 3'/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /concurrency:[\s\S]*group: source-refresh/);
});

test('source refresh opens one human-reviewed draft PR after the full gate', () => {
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /pull-requests: write/);
  assert.match(workflow, /npm run refresh:data/);
  assert.match(workflow, /npm run audit:deps/);
  assert.match(workflow, /npx playwright install chromium/);
  assert.match(workflow, /npm run precommit/);
  assert.match(workflow, /npm run sbom:generate/);
  assert.match(workflow, /peter-evans\/create-pull-request@v8/);
  assert.match(workflow, /branch: automation\/source-refresh/);
  assert.match(workflow, /draft: always-true/);
  assert.match(workflow, /data\/\*\*/);
  assert.match(workflow, /maps\/\*\*/);
  assert.doesNotMatch(workflow, /git push|\[skip ci\]|auto-merge/i);
});

test('obsolete Tenable refresh cannot run outside the current registry pipeline', () => {
  assert.equal(existsSync('.github/workflows/weekly-tenable.yml'), false);
});

test('source refresh ingests the current structured FedRAMP rules before rebuilding', () => {
  assert.match(refreshScript, /fetch-fedramp-2026-rules\.mjs/);
});

test('Lighthouse A/B gates a candidate against v1.0.0 on the same mobile runner', () => {
  assert.match(lighthouseAb, /default: "v1\.0\.0"/);
  assert.match(lighthouseAb, /AFTER_REF: \$\{\{ github\.event\.inputs\.after_ref \|\| github\.sha \}\}/);
  assert.match(lighthouseAb, /MAX_MEDIAN_DROP: "3"/);
  assert.match(lighthouseAb, /const median/);
  assert.match(lighthouseAb, /process\.exit\(1\)/);
  assert.match(lighthouseAb, /npm ci/);
  assert.doesNotMatch(lighthouseAb, /npm ci\s*\|\|\s*npm install/);
});
