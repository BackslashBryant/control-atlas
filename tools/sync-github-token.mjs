#!/usr/bin/env node

/**
 * Synchronises GITHUB_TOKEN with a valid inherited or GitHub CLI token.
 * - Prefers an inherited user-level GITHUB_TOKEN when it validates
 * - Falls back to `gh auth token`
 * - Persists to the Windows user environment when applicable
 * - Avoids writing secrets into tracked or repo-local files
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function buildGhEnv(overrides = {}) {
  return {
    ...process.env,
    ...overrides,
    GH_TOKEN: '',
  };
}

function getInheritedToken() {
  return process.env.GITHUB_TOKEN?.trim() || null;
}

function runGhAuthToken() {
  const result = spawnSync('gh', ['auth', 'token'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
    env: buildGhEnv({ GITHUB_TOKEN: '' }),
  });

  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() ||
        'Failed to read GitHub token. Run `gh auth login` first or ensure GitHub CLI is installed.',
    );
  }

  const token = result.stdout.trim();
  if (!token) {
    throw new Error('GitHub CLI returned an empty token. Re-run `gh auth login` and try again.');
  }
  return token;
}

function validateToken(token) {
  const result = spawnSync('gh', ['api', 'user', '--jq', '.login'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
    env: buildGhEnv({ GITHUB_TOKEN: token }),
  });

  if (result.status !== 0) {
    return null;
  }

  const login = result.stdout.trim();
  return login || null;
}

function resolveToken() {
  const candidates = [
    {
      source: 'inherited user-level GITHUB_TOKEN',
      token: getInheritedToken(),
    },
  ];

  try {
    candidates.push({
      source: 'GitHub CLI keyring token',
      token: runGhAuthToken(),
    });
  } catch {
    // Ignore CLI fallback failures until all candidates are checked.
  }

  for (const candidate of candidates) {
    if (!candidate.token) {
      continue;
    }
    const login = validateToken(candidate.token);
    if (login) {
      return { ...candidate, login };
    }
  }

  throw new Error(
    'No valid GitHub token source found. Restore a valid user-level GITHUB_TOKEN or run `gh auth login` with a token that can pass `gh api user`.',
  );
}

function applyWindowsUserEnv(token) {
  const command = `[Environment]::SetEnvironmentVariable('GITHUB_TOKEN','${token.replace(/'/g, "''")}','User')`;
  const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', command], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'Failed to persist GITHUB_TOKEN in the Windows user environment.');
  }
}

async function main() {
  console.log('Syncing GitHub token into the inherited environment...');
  const resolved = resolveToken();
  process.env.GITHUB_TOKEN = resolved.token;

  if (process.platform === 'win32') {
    applyWindowsUserEnv(resolved.token);
    console.log(`Updated the Windows user-level GITHUB_TOKEN using ${resolved.source}.`);
    console.log('Restart Cursor, Codex, and Antigravity so new sessions inherit the refreshed token.');
  } else {
    console.log('Set GITHUB_TOKEN in your shell profile if you want future sessions to inherit the refreshed token.');
  }

  console.log(`Validated token for GitHub user: ${resolved.login}`);
  console.log('');
  console.log('Next steps:');
  console.log('- Keep GitHub auth in the user-level environment by default.');
  console.log('- Use ignored `.env.local` only if a repo-local tool explicitly requires it.');
  console.log('- Re-run `npm run mcp:test-connectivity` to confirm MCP servers see the new token.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
