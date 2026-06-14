import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

test('data test runner limits concurrency to avoid worker memory exhaustion', () => {
  assert.match(packageJson.scripts['test:data'], /--test-concurrency=1/);
});
