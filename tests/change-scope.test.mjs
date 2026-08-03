import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyNameStatus } from '../tools/classify-change-scope.mjs';

test('audit evidence additions and modifications use the evidence-only path', () => {
  const result = classifyNameStatus(
    [
      'M',
      'docs/audits/control-atlas-v1-evidence.md',
      'A',
      'artifacts/audits/control-atlas/evidence/results.md',
      '',
    ].join('\0'),
  );

  assert.deepEqual(result, {
    scope: 'evidence-only',
    reason: 'audits-only',
    buildMode: 'none',
  });
});

test('runtime changes require full verification and select the conservative build mode', () => {
  for (const path of [
    'src/App.tsx',
    '.github/workflows/ci.yml',
    'tests/browser-contract.test.mjs',
    'docs/planning/launch.md',
  ]) {
    assert.deepEqual(classifyNameStatus(`M\0${path}\0`), {
      scope: 'full',
      reason: 'runtime-incremental',
      buildMode: 'incremental',
    }, path);
  }

  for (const path of [
    'data/source-registry.json',
    'maps/800-53-to-csf.json',
    'scripts/build-framework-data.mjs',
    'src/shared/federalGraph.mjs',
    'tools/importers/framework-adapters.mjs',
    'package-lock.json',
  ]) {
    assert.deepEqual(classifyNameStatus(`M\0${path}\0`), {
      scope: 'full',
      reason: 'runtime-full',
      buildMode: 'full',
    }, path);
  }
});

test('empty, deleted, renamed, copied, or malformed diffs fail closed', () => {
  for (const diff of [
    '',
    'D\0docs/audits/old.md\0',
    'R100\0docs/audits/old.md\0docs/audits/new.md\0',
    'C100\0docs/audits/old.md\0docs/audits/new.md\0',
    'X\0docs/audits/evidence.md\0',
    'M\0',
  ]) {
    assert.deepEqual(
      classifyNameStatus(diff),
      expectFullResult(diff),
      JSON.stringify(diff),
    );
  }
});

function expectFullResult(diff) {
  if (!diff) return { scope: 'full', reason: 'empty-diff', buildMode: 'full' };
  const status = diff.split('\0')[0];
  if (!/^[AM]\d*$/.test(status)) {
    return { scope: 'full', reason: `unsupported-status-${status}`, buildMode: 'full' };
  }
  return { scope: 'full', reason: 'runtime-or-unknown-path-missing', buildMode: 'full' };
}
