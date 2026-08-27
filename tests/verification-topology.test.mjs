import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveWorkerCount } from '../playwright.config.mjs';
import { createGeneratedFixtureReader } from './helpers/generated-fixture-cache.mjs';

test('local browser verification uses a bounded parallel worker pool', () => {
  assert.equal(resolveWorkerCount({}), 2);
  assert.equal(resolveWorkerCount({ CI: 'true' }), 1);
  assert.equal(resolveWorkerCount({ PLAYWRIGHT_WORKERS: '3' }), 3);
  assert.equal(resolveWorkerCount({ PLAYWRIGHT_WORKERS: '0' }), 2);
});

test('large immutable generated fixtures are parsed once per test process', () => {
  const calls = [];
  const generated = createGeneratedFixtureReader({
    root: 'fixture-root',
    read(root, name) {
      calls.push([root, name]);
      return { name };
    },
  });

  assert.strictEqual(generated('nodes'), generated('nodes'));
  assert.strictEqual(generated('edges'), generated('edges'));
  assert.deepEqual(calls, [
    ['fixture-root', 'nodes'],
    ['fixture-root', 'edges'],
  ]);
});
