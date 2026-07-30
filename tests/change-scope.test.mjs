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

  assert.deepEqual(result, { scope: 'evidence-only', reason: 'audits-only' });
});

test('runtime, workflow, test, and planning changes require full verification', () => {
  for (const path of [
    'src/App.tsx',
    '.github/workflows/ci.yml',
    'tests/browser-contract.test.mjs',
    'docs/planning/launch.md',
    'package-lock.json',
  ]) {
    assert.equal(
      classifyNameStatus(`M\0${path}\0`).scope,
      'full',
      path,
    );
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
    assert.equal(classifyNameStatus(diff).scope, 'full', JSON.stringify(diff));
  }
});
