#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const CHECK_WORKFLOW = 'Public Repo Checks';
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
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const raw = gh([
      'run',
      'list',
      '--commit',
      commitSha,
      '--json',
      'databaseId,name,status,conclusion,url',
      '--limit',
      '20',
    ]);
    const runs = JSON.parse(raw || '[]');
    const checksRun = runs.find((entry) => entry.name === CHECK_WORKFLOW);

    if (checksRun?.status === 'completed') {
      if (checksRun.conclusion === 'success') {
        return checksRun;
      }
      throw new Error(
        `${CHECK_WORKFLOW} failed (${checksRun.conclusion}). See ${checksRun.url}`,
      );
    }

    const elapsed = Math.round((Date.now() - started) / 1000);
    console.log(
      `[wait] ${CHECK_WORKFLOW} still running for ${commitSha.slice(0, 7)} (${elapsed}s)`,
    );
    await sleep(pollMs);
  }

  throw new Error(
    `Timed out waiting for ${CHECK_WORKFLOW} on ${commitSha.slice(0, 7)}`,
  );
}

async function main() {
  const commitSha = resolveCommitSha(process.argv[2] || 'HEAD');
  console.log(`Waiting for ${CHECK_WORKFLOW} on ${commitSha}...`);
  const run = await waitForChecks(commitSha);
  console.log(`[ok] ${CHECK_WORKFLOW} passed: ${run.url}`);
}

main().catch((error) => {
  console.error(`[error] ${error.message}`);
  process.exit(1);
});
