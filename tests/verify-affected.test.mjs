import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyChangedPaths } from '../tools/classify-change-scope.mjs';
import { createVerificationPlan } from '../tools/verify-affected.mjs';

test('automation-only changes stay on the automation contract path', () => {
  const paths = ['package.json', 'tools/wait-for-checks.mjs', 'tests/wait-for-checks.test.mjs'];
  const plan = createVerificationPlan(paths, classifyChangedPaths(paths));
  assert.equal(plan.blocked, false);
  assert.deepEqual(plan.steps.map((step) => step.id), [
    'automation-lint',
    'automation-contracts',
  ]);
  assert.equal(plan.steps.some((step) => step.id === 'incremental-site-build'), false);
  assert.equal(plan.steps.some((step) => step.id === 'sources-browser'), false);
});

test('Sources changes select one bounded route family and the incremental build', () => {
  const paths = ['src/ui/pages/SourcesPage.tsx'];
  const plan = createVerificationPlan(paths, classifyChangedPaths(paths));
  assert.equal(plan.blocked, false);
  assert.deepEqual(plan.steps.map((step) => step.id), [
    'typecheck',
    'incremental-site-build',
    'sources-browser',
  ]);
  assert.equal(plan.steps.at(-1).expectedTests, 14);
  assert.equal(plan.steps.at(-1).workers, 2);
});

test('unmapped runtime and data changes fail before an expensive fallback', () => {
  for (const paths of [['src/ui/pages/UnknownPage.tsx'], ['data/source-registry.json']]) {
    const plan = createVerificationPlan(paths, classifyChangedPaths(paths));
    assert.equal(plan.blocked, true, paths[0]);
    assert.ok(plan.reasons.length > 0, paths[0]);
  }
});

test('known STIG observation changes use the source-specific refresh contract', () => {
  const paths = [
    'scripts/fetch-stig-source-observations.mjs',
    'tests/stig-source-observer.test.mjs',
  ];
  const plan = createVerificationPlan(paths, classifyChangedPaths(paths));
  assert.equal(plan.blocked, false);
  assert.deepEqual(
    plan.steps.filter((step) => step.id.startsWith('stig-observer')).map((step) => step.id),
    ['stig-observer-lint', 'stig-observer-contracts'],
  );
  assert.equal(plan.reasons.includes('data changes require a source-specific refresh plan'), false);
});

test('incremental fetch and writer changes use their focused data contracts', () => {
  const paths = [
    'scripts/lib/strict-conditional-fetch.mjs',
    'scripts/lib/write-json-atomically.mjs',
    'tests/strict-conditional-fetch.test.mjs',
    'tests/write-json-atomically.test.mjs',
  ];
  const plan = createVerificationPlan(paths, classifyChangedPaths(paths));
  assert.equal(plan.blocked, false);
  assert.deepEqual(
    plan.steps.filter((step) => step.id.startsWith('incremental-data')).map((step) => step.id),
    ['incremental-data-lint', 'incremental-data-contracts'],
  );
});
