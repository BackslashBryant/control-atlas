#!/usr/bin/env node

/**
 * Direct ship to main without PRs.
 *
 * Branch protection requires the "checks" job (Public Repo Checks) to pass on
 * the commit before origin/main accepts a push. This script:
 * 1. Runs local precommit (optional)
 * 2. Requires and pushes the task branch so GitHub Actions runs checks on HEAD
 * 3. Waits for Public Repo Checks to succeed on that commit SHA
 * 4. Fast-forwards local main and pushes origin main
 *
 * Usage:
 *   node tools/ship-to-main.mjs [--skip-local] [--no-wait]
 */

import { execFileSync, spawnSync } from 'node:child_process';

import { resolveCommitSha, waitForChecks } from './wait-for-checks.mjs';

const args = new Set(process.argv.slice(2));
const skipLocal = args.has('--skip-local');
const noWait = args.has('--no-wait');

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureCleanTree() {
  const status = git(['status', '--porcelain']);
  if (status) {
    console.error('[error] Working tree is not clean. Commit or stash changes first.');
    process.exit(1);
  }
}

function classifyShipScope() {
  try {
    const output = execFileSync(
      process.execPath,
      [
        'tools/classify-change-scope.mjs',
        '--base',
        'origin/main',
        '--head',
        'HEAD',
      ],
      { encoding: 'utf8' },
    );
    return /^scope=evidence-only$/m.test(output) ? 'evidence-only' : 'full';
  } catch {
    return 'full';
  }
}

async function main() {
  if (process.env.GITHUB_TOKEN) {
    console.log(
      '[warn] GITHUB_TOKEN is set and may break gh auth. Unset it for ship tooling.',
    );
  }

  ensureCleanTree();

  const taskBranch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (taskBranch === 'main') {
    console.error('[error] Direct ship must start from a verified task branch, not main.');
    process.exit(1);
  }
  const commitSha = resolveCommitSha('HEAD');

  if (!skipLocal) {
    console.log('[ship] Running local precommit gate...');
    run('npm', ['run', 'precommit']);
  } else {
    console.log('[ship] Skipping local precommit (--skip-local).');
  }

  const scope = classifyShipScope();
  if (scope === 'evidence-only') {
    console.log('[ship] Running the focused release-evidence gate...');
    run('node', [
      '--test',
      'tests/change-scope.test.mjs',
      'tests/release-evidence.test.mjs',
    ]);
  } else {
    console.log('[ship] Running the protected brand, copy, and disclaimer audit...');
    run('npm', ['run', 'prepush:audit']);
  }

  console.log(`[ship] Pushing ${taskBranch} to trigger remote checks...`);
  run('node', ['tools/git-push-with-retry.mjs', taskBranch]);

  if (!noWait) {
    console.log(`[ship] Waiting for Public Repo Checks on ${commitSha.slice(0, 7)}...`);
    const checksRun = await waitForChecks(commitSha);
    console.log(`[ok] Remote checks passed: ${checksRun.url}`);
  } else {
    console.log('[ship] Skipping remote wait (--no-wait). Push main manually after checks pass.');
    return;
  }

  console.log(`[ship] Fast-forwarding main to ${taskBranch}...`);
  git(['checkout', 'main']);
  try {
    git(['merge', '--ff-only', taskBranch]);
  } catch {
    console.error(
      `[error] Could not fast-forward main to ${taskBranch}. Resolve locally, then rerun ship.`,
    );
    process.exit(1);
  }

  console.log('[ship] Pushing origin main...');
  run('node', ['tools/git-push-with-retry.mjs', 'main']);

  console.log('[ok] Direct ship complete.');
  console.log(`     Branch: ${taskBranch}`);
  console.log(`     Commit: ${commitSha.slice(0, 7)}`);
}

main().catch((error) => {
  console.error(`[error] ${error.message}`);
  process.exit(1);
});
