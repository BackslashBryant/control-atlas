import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHECK_WORKFLOW_FILE,
  CHECK_WORKFLOW_NAME,
  waitForChecks,
} from '../tools/wait-for-checks.mjs';

const commitSha = '89fc3d55c3a850e89fe184d026fd542b1854b017';

test('checks waiter selects the canonical CI workflow file instead of a display-name lookup', async () => {
  let receivedArgs;
  const expected = {
    conclusion: 'success',
    name: CHECK_WORKFLOW_NAME,
    status: 'completed',
    url: 'https://github.example/runs/1',
  };

  const result = await waitForChecks(commitSha, {
    runGh(args) {
      receivedArgs = args;
      return JSON.stringify([expected]);
    },
  });

  assert.deepEqual(result, expected);
  assert.deepEqual(receivedArgs.slice(0, 6), [
    'run',
    'list',
    '--workflow',
    CHECK_WORKFLOW_FILE,
    '--commit',
    commitSha,
  ]);
  assert.equal(CHECK_WORKFLOW_FILE, 'ci.yml');
  assert.equal(CHECK_WORKFLOW_NAME, 'Control Atlas CI');
});

test('checks waiter fails closed when the canonical CI workflow fails', async () => {
  await assert.rejects(
    waitForChecks(commitSha, {
      runGh: () => JSON.stringify([{
        conclusion: 'failure',
        name: CHECK_WORKFLOW_NAME,
        status: 'completed',
        url: 'https://github.example/runs/2',
      }]),
    }),
    /Control Atlas CI failed \(failure\)/,
  );
});

test('checks waiter polls an in-progress canonical workflow before returning success', async () => {
  let calls = 0;
  let clock = 0;
  const messages = [];

  const result = await waitForChecks(commitSha, {
    log: (message) => messages.push(message),
    now: () => clock,
    pollMs: 5,
    runGh: () => JSON.stringify([calls++ === 0
      ? { conclusion: '', name: CHECK_WORKFLOW_NAME, status: 'in_progress', url: 'https://github.example/runs/3' }
      : { conclusion: 'success', name: CHECK_WORKFLOW_NAME, status: 'completed', url: 'https://github.example/runs/3' }]),
    sleep: async (milliseconds) => { clock += milliseconds; },
    timeoutMs: 20,
  });

  assert.equal(result.conclusion, 'success');
  assert.equal(calls, 2);
  assert.equal(messages.length, 1);
});

test('checks waiter times out when no canonical CI run appears', async () => {
  let clock = 0;

  await assert.rejects(
    waitForChecks(commitSha, {
      log: () => {},
      now: () => clock,
      pollMs: 5,
      runGh: () => '[]',
      sleep: async (milliseconds) => { clock += milliseconds; },
      timeoutMs: 10,
    }),
    /Timed out waiting for Control Atlas CI/,
  );
});
