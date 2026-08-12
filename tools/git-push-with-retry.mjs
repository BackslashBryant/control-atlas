#!/usr/bin/env node

/**
 * Git push with automatic retry and DNS error handling
 *
 * Handles common git push failures:
 * - DNS threading errors (Windows bug) - retries with DNS flush
 * - Network timeouts - exponential backoff retry
 * - Authentication issues - clear error message
 *
 * Usage:
 *   node tools/git-push-with-retry.mjs [branch-name]
 *   node tools/git-push-with-retry.mjs agent/pixel/23-run-persona-testing-suite
 */

import { execSync } from 'node:child_process';
import { platform } from 'node:os';

if (process.env.GITHUB_TOKEN) {
  console.log(
    '[warn] GITHUB_TOKEN is set. Unset it so gh uses keyring credentials (see docs/OPERATIONS.md).',
  );
}

const branch = process.argv[2] || execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
const maxRetries = 3;
const retryDelays = [2000, 5000, 10000]; // ms

function execGit(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    });
  } catch (error) {
    return { error: error.message, output: error.stdout || error.stderr };
  }
}

function flushDNS() {
  if (platform() === 'win32') {
    try {
      execSync('ipconfig /flushdns', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRemoteUrl() {
  try {
    return execSync('git config --get remote.origin.url', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function convertToSSH(httpsUrl) {
  const match = httpsUrl.match(/^https:\/\/(?:.*@)?github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
  if (match) {
    return `git@github.com:${match[1]}/${match[2]}.git`;
  }
  return null;
}

async function pushWithRetry() {
  console.log(`Pushing branch: ${branch}`);

  // First, verify branch exists and we're on it
  const currentBranch = execGit('git rev-parse --abbrev-ref HEAD').trim();
  if (currentBranch !== branch) {
    console.error(`Error: Current branch is ${currentBranch}, but trying to push ${branch}`);
    console.error(`Switch to branch first: git checkout ${branch}`);
    process.exit(1);
  }

  // Verify we're in project root
  try {
    execSync('git rev-parse --show-toplevel', { stdio: 'ignore' });
  } catch {
    console.error('Error: Not in a git repository. Navigate to project root first.');
    process.exit(1);
  }

  // Check if remote is HTTPS and convert to SSH if needed (Icebreaker method - avoids DNS issues)
  const remoteUrl = getRemoteUrl();
  if (remoteUrl && remoteUrl.startsWith('https://')) {
    const sshUrl = convertToSSH(remoteUrl);
    if (sshUrl) {
      console.log('[warn] Remote is using HTTPS. Converting to SSH for better reliability (Icebreaker method)...');
      try {
        execSync(`git remote set-url origin ${sshUrl}`, {
          stdio: 'ignore',
          encoding: 'utf8'
        });
        console.log(`[ok] Converted remote to SSH: ${sshUrl}`);
        console.log('   SSH avoids DNS threading errors and authentication problems on Windows.');
        // Verify conversion worked
        const newRemote = getRemoteUrl();
        if (!newRemote || !newRemote.startsWith('git@')) {
          throw new Error('Remote conversion failed');
        }
      } catch (error) {
        console.error('[error] Failed to convert remote to SSH:', error.message);
        console.error('   For better reliability, manually run:');
        console.error(`   git remote set-url origin ${sshUrl}`);
        process.exit(1);
      }
    }
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = execGit(`git push -u origin ${branch}`);

    if (!result.error) {
      console.log('[ok] Push successful!');
      return 0;
    }

    const errorMsg = result.error || result.output || '';
    const isDNSError = errorMsg.includes('getaddrinfo') || errorMsg.includes('DNS');
    const isAuthError = errorMsg.includes('Authentication failed') || errorMsg.includes('401') || errorMsg.includes('403');
    const isNetworkError = errorMsg.includes('timeout') || errorMsg.includes('connection') || errorMsg.includes('refused');

    if (isAuthError) {
      console.error('[error] Authentication failed');
      console.error('Fix: Run "gh auth login" to authenticate GitHub CLI');
      process.exit(1);
    }

    if (isDNSError && attempt < maxRetries - 1) {
      console.log(`[warn] DNS error detected (attempt ${attempt + 1}/${maxRetries})`);
      console.log('   Flushing DNS cache and retrying...');
      flushDNS();
      await sleep(retryDelays[attempt]);
      continue;
    }

    if (isNetworkError && attempt < maxRetries - 1) {
      console.log(`[warn] Network error (attempt ${attempt + 1}/${maxRetries})`);
      console.log(`   Retrying in ${retryDelays[attempt] / 1000}s...`);
      await sleep(retryDelays[attempt]);
      continue;
    }

    // Last attempt or non-retryable error
    console.error('[error] Push failed:', errorMsg);
    if (isDNSError) {
      console.error('\nDNS error troubleshooting:');
      console.error('   1. Restart PC (Windows DNS threading bug)');
      console.error('   2. Use system Git from terminal instead of Cursor\'s bundled Git');
      console.error('   3. Check for third-party firewalls blocking Git');
    }
    process.exit(1);
  }
}

pushWithRetry().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
