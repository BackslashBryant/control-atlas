import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyChangedPaths,
  classifyNameStatus,
} from '../tools/classify-change-scope.mjs';

test('audit evidence uses the narrow integrity path', () => {
  const result = classifyChangedPaths(['artifacts/audits/control-atlas/results.md']);
  assert.equal(result.scope, 'evidence-only');
  assert.equal(result.evidenceOnly, true);
  assert.equal(result.buildRequired, false);
  assert.equal(result.browserRequired, false);
  assert.equal(result.securityRequired, false);
});

test('styles trigger build, browser, accessibility, and Lighthouse without unit tests', () => {
  const result = classifyChangedPaths(['src/styles/orbital.css']);
  assert.equal(result.stylesChanged, true);
  assert.equal(result.buildMode, 'incremental');
  assert.equal(result.buildRequired, true);
  assert.equal(result.browserRequired, true);
  assert.equal(result.accessibilityRequired, true);
  assert.equal(result.lighthouseRequired, true);
  assert.equal(result.unitRequired, false);
});

test('data and dependency changes select the conservative build and relevant gates', () => {
  for (const path of ['data/source-registry.json', 'scripts/build-framework-data.mjs', 'package-lock.json']) {
    const result = classifyChangedPaths([path]);
    assert.equal(result.buildMode, 'full', path);
    assert.equal(result.buildRequired, true, path);
    assert.equal(result.unitRequired, true, path);
    assert.equal(result.browserRequired, true, path);
  }
  assert.equal(classifyChangedPaths(['data/source-registry.json']).dataRequired, true);
  assert.equal(classifyChangedPaths(['package-lock.json']).securityRequired, true);
});

test('workflow-only changes run fast, security, and actionlint gates without a site build', () => {
  const result = classifyChangedPaths(['.github/workflows/ci.yml']);
  assert.equal(result.workflowsChanged, true);
  assert.equal(result.workflowLintRequired, true);
  assert.equal(result.securityRequired, true);
  assert.equal(result.buildRequired, false);
  assert.equal(result.browserRequired, false);
});

test('browser-test changes build a fixture artifact but do not run unrelated unit tests', () => {
  const result = classifyChangedPaths(['tests/e2e/navigation-fidelity.spec.mjs']);
  assert.equal(result.testsChanged, true);
  assert.equal(result.buildRequired, true);
  assert.equal(result.browserRequired, true);
  assert.equal(result.unitRequired, false);
});

test('deletes and renames are classified instead of forcing complete history', () => {
  const deleted = classifyNameStatus('D\0src/retired.ts\0');
  assert.equal(deleted.codeChanged, true);
  assert.equal(deleted.buildRequired, true);

  const renamed = classifyNameStatus('R100\0src/old.css\0src/new.css\0');
  assert.equal(renamed.stylesChanged, true);
  assert.deepEqual(renamed.changedPaths, ['src/old.css', 'src/new.css']);
});

test('empty and malformed diffs fail closed', () => {
  for (const diff of ['', 'X-invalid\0src/app.ts\0', 'M\0']) {
    const result = classifyNameStatus(diff);
    assert.equal(result.scope, 'full');
    assert.equal(result.buildMode, 'full');
    assert.equal(result.buildRequired, true);
    assert.equal(result.securityRequired, true);
  }
});
