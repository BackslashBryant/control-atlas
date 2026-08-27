import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyChangedPaths } from '../tools/classify-change-scope.mjs';
import { createVerificationPlan } from '../tools/verify-affected.mjs';

test('automation-only changes stay on the automation contract path', () => {
  const paths = [
    '.gitignore',
    'config/experience-guardian/route-matrix.json',
    'package.json',
    'tools/wait-for-checks.mjs',
    'tests/wait-for-checks.test.mjs',
  ];
  const plan = createVerificationPlan(paths, classifyChangedPaths(paths));
  assert.equal(plan.blocked, false);
  assert.deepEqual(plan.steps.map((step) => step.id), [
    'automation-lint',
    'automation-contracts',
  ]);
  assert.equal(plan.steps.some((step) => step.id === 'incremental-site-build'), false);
  assert.equal(plan.steps.some((step) => step.id === 'source-trust-browser'), false);
});

test('Sources changes select one bounded route family and the incremental build', () => {
  const paths = ['src/ui/pages/SourcesPage.tsx'];
  const plan = createVerificationPlan(paths, classifyChangedPaths(paths));
  assert.equal(plan.blocked, false);
  assert.deepEqual(plan.steps.map((step) => step.id), [
    'typecheck',
    'incremental-site-build',
    'source-truth-contract',
    'source-trust-browser',
    'source-identity-compatibility-browser',
  ]);
  assert.equal(plan.steps.find((step) => step.id === 'source-trust-browser').expectedTests, 21);
  assert.equal(plan.steps.find((step) => step.id === 'source-trust-browser').workers, 2);
  const sharedPaths = [
    'src/ui/lib/sourcePresentation.ts',
    'src/ui/pages/CatalogDetailPage.tsx',
    'src/ui/pages/ObjectDetailPage.tsx',
  ];
  const sharedPlan = createVerificationPlan(sharedPaths, classifyChangedPaths(sharedPaths));
  assert.equal(sharedPlan.blocked, false);
  assert.equal(sharedPlan.steps.some((step) => step.id === 'source-trust-browser'), true);
  assert.deepEqual(
    sharedPlan.steps.find((step) => step.id === 'source-trust-browser')?.command.slice(-3),
    [
      'tests/e2e/sources-inspector-state.spec.mjs',
      'tests/e2e/source-truth-presentation.spec.mjs',
      'tests/e2e/source-trust-surfaces.spec.mjs',
    ],
  );
  assert.deepEqual(
    sharedPlan.steps.find((step) => step.id === 'source-identity-compatibility-browser')?.command.slice(-4),
    [
      'tests/e2e/publication-identity.spec.mjs',
      'tests/e2e/epic14-ws2-record-template.spec.mjs',
      '--grep',
      'publication pages use|OSCAL-fed records|WS2 exposes governed',
    ],
  );
});

test('dependency changes validate npm ci compatibility before product gates', () => {
  const paths = ['package-lock.json'];
  const plan = createVerificationPlan(paths, classifyChangedPaths(paths));
  assert.equal(plan.blocked, true, 'dependency browser proof remains explicitly unmapped');
  assert.equal(plan.steps.some((step) => step.id === 'lockfile-integrity'), true);
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
