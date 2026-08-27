#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const CHECK_WORKFLOW_FILE = 'ci.yml';
export const CHECK_WORKFLOW_NAME = 'Control Atlas CI';
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;
const DEFAULT_POLL_MS = 15 * 1000;

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function gh(args, options = {}) {
  const env = { ...process.env };
  delete env.GITHUB_TOKEN;
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
    ...options,
  }).trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resolveCommitSha(commitish = 'HEAD') {
  return git(['rev-parse', commitish]);
}

export async function waitForChecks(commitSha, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const pollMs = options.pollMs ?? DEFAULT_POLL_MS;
  const runGh = options.runGh ?? gh;
  const wait = options.sleep ?? sleep;
  const now = options.now ?? Date.now;
  const log = options.log ?? console.log;
  const started = now();

  while (now() - started < timeoutMs) {
    const raw = runGh([
      'run',
      'list',
      '--workflow',
      CHECK_WORKFLOW_FILE,
      '--commit',
      commitSha,
      '--json',
      'databaseId,name,status,conclusion,url',
      '--limit',
      '20',
    ]);
    const runs = JSON.parse(raw || '[]');
    const checksRun = runs[0];

    if (checksRun?.status === 'completed') {
      if (checksRun.conclusion === 'success') {
        return checksRun;
      }
      throw new Error(
        `${CHECK_WORKFLOW_NAME} failed (${checksRun.conclusion}). See ${checksRun.url}`,
      );
    }

    const elapsed = Math.round((now() - started) / 1000);
    log(
      `[wait] ${CHECK_WORKFLOW_NAME} still running for ${commitSha.slice(0, 7)} (${elapsed}s)`,
    );
    await wait(pollMs);
  }

  throw new Error(
    `Timed out waiting for ${CHECK_WORKFLOW_NAME} on ${commitSha.slice(0, 7)}`,
  );
}

async function main() {
  const commitSha = resolveCommitSha(process.argv[2] || 'HEAD');
  console.log(`Waiting for ${CHECK_WORKFLOW_NAME} on ${commitSha}...`);
  const run = await waitForChecks(commitSha);
  console.log(`[ok] ${CHECK_WORKFLOW_NAME} passed: ${run.url}`);
}

const isCli = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  main().catch((error) => {
    console.error(`[error] ${error.message}`);
    process.exit(1);
  });
}
