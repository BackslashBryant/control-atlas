import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const ciWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const pagesWorkflow = readFileSync('.github/workflows/pages.yml', 'utf8');
const nightlyWorkflow = readFileSync('.github/workflows/nightly-refresh.yml', 'utf8');

test('data test runner limits concurrency to avoid worker memory exhaustion', () => {
  assert.match(packageJson.scripts['test:data'], /--test-concurrency=1/);
});

test('security scripts exist for dependency audit and sbom generation', () => {
  assert.equal(typeof packageJson.scripts['audit:deps'], 'string');
  assert.equal(typeof packageJson.scripts['sbom:generate'], 'string');
  assert.ok(existsSync('scripts/security/npm-audit.mjs'));
  assert.ok(existsSync('security/npm-audit-exceptions.json'));
});

test('ci workflows include dependency audit and sbom generation', () => {
  assert.match(ciWorkflow, /npm run audit:deps/);
  assert.match(ciWorkflow, /npm run sbom:generate/);
  assert.match(pagesWorkflow, /npm run audit:deps/);
  assert.match(nightlyWorkflow, /npm run audit:deps/);
});

test('security workflows exist for CodeQL and secret scanning', () => {
  assert.ok(existsSync('.github/workflows/codeql.yml'));
  assert.ok(existsSync('.github/workflows/secret-scan.yml'));
  const codeql = readFileSync('.github/workflows/codeql.yml', 'utf8');
  const secrets = readFileSync('.github/workflows/secret-scan.yml', 'utf8');
  assert.match(codeql, /github\/codeql-action\/init@v3/);
  assert.match(codeql, /github\/codeql-action\/analyze@v3/);
  assert.match(secrets, /gitleaks/gim);
});
