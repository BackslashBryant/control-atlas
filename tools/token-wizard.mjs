#!/usr/bin/env node

/**
 * GitHub token helper.
 *
 * Stores tokens in the user's personal Cursor template config. It does not
 * write secrets to `.env`.
 */

import readline from 'node:readline';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';
const REQUIRED_SCOPES = ['repo', 'repo:status', 'workflow', 'issues'];

function question(rl, prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function validateTokenFormat(token) {
  return token.startsWith('ghp_') || token.startsWith('github_pat_') || token.startsWith('gho_');
}

function applyWindowsUserEnv(token) {
  const ps = `[Environment]::SetEnvironmentVariable('GITHUB_TOKEN','${token.replace(/'/g, "''")}','User')`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', ps], {
    stdio: 'pipe',
    encoding: 'utf8',
  });
  return result.status === 0;
}

async function testToken(token) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'cursor-workspace-setup',
      },
    });
    if (!response.ok) {
      return { valid: false, error: `GitHub API returned ${response.status}` };
    }
    const user = await response.json();
    return { valid: true, user: user.login };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Network error' };
  }
}

async function main() {
  console.log('');
  console.log('GitHub Token Setup');
  console.log('Open this URL and create a token if needed:');
  console.log(TOKEN_URL);
  console.log('');
  console.log('Required scopes: ' + REQUIRED_SCOPES.join(', '));
  console.log('This helper persists the token to the user-level environment.');
  console.log('It does not write the token to repo files or personal config.');
  console.log('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const token = (await question(rl, 'Paste token, or press Enter to leave the current environment unchanged: ')).trim();
  rl.close();

  if (!token) {
    console.log('No token changed.');
    return;
  }

  if (!validateTokenFormat(token)) {
    console.error('Token format did not look like a GitHub token.');
    process.exit(1);
  }

  console.log(`Validating token for ${path.basename(repoRoot)}...`);
  const test = await testToken(token);
  if (!test.valid) {
    console.error('Token validation failed: ' + test.error);
    process.exit(1);
  }
  process.env.GITHUB_TOKEN = token;

  console.log(`Token stored for GitHub user: ${test.user}`);
  if (process.platform === 'win32') {
    if (applyWindowsUserEnv(token)) {
      console.log(`User environment updated for ${os.userInfo().username}.`);
      console.log('Restart Cursor, Codex, and Antigravity to pick up the new inherited GITHUB_TOKEN.');
    } else {
      console.log('User environment update failed. Set GITHUB_TOKEN in the Windows user environment manually and restart Cursor, Codex, and Antigravity.');
    }
  } else {
    console.log('Export GITHUB_TOKEN in your shell profile if you want future sessions to inherit it.');
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
