#!/usr/bin/env node

/**
 * Verifies GitHub issue numbers before creating new issues.
 * - Prints the highest existing issue number
 * - Returns the next available number
 * - Optionally checks that a requested number does not already exist
 *
 * Usage:
 *   npm run github:verify-issue           # prints next available number
 *   npm run github:verify-issue -- 42     # verifies Issue #42 does not exist
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function loadEnvFile() {
  const envPath = path.join(repoRoot, '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

function requireToken() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error('Set GITHUB_TOKEN (or GH_TOKEN) with repo scope before running this script.');
  }
  return token;
}

function parseRemoteUrl(remote) {
  const sshMatch = remote.match(/^git@github\.com:(.+?)\/(.+?)(?:\.git)?$/);
  if (sshMatch) return `${sshMatch[1]}/${sshMatch[2]}`;
  const httpsMatch = remote.match(/^https:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) return `${httpsMatch[1]}/${httpsMatch[2]}`;
  throw new Error(`Unsupported GitHub remote: ${remote}`);
}

function resolveRepo() {
  if (process.env.GITHUB_REPO) return process.env.GITHUB_REPO;
  const remote = execSync('git config --get remote.origin.url', {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'ignore'],
    encoding: 'utf8',
  }).trim();
  return parseRemoteUrl(remote);
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function getHighestIssueNumber(repo, token) {
  const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';
  const endpoint = `${apiBase}/repos/${repo}/issues?state=all&per_page=1&sort=number&direction=desc`;
  const data = await fetchJson(endpoint, token);
  return data.length === 0 ? 0 : data[0].number;
}

async function checkIssueExists(repo, token, issueNumber) {
  const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';
  const endpoint = `${apiBase}/repos/${repo}/issues/${issueNumber}`;
  try {
    await fetchJson(endpoint, token);
    return true;
  } catch (error) {
    if (error.message.includes('404')) return false;
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const requestedNumber = args[0] ? Number.parseInt(args[0], 10) : null;

  if (Number.isNaN(requestedNumber)) {
    console.error('If you pass a number, it must be an integer (e.g., npm run github:verify-issue -- 42).');
    process.exit(1);
  }

  const token = requireToken();
  const repo = resolveRepo();
  const highest = await getHighestIssueNumber(repo, token);
  const nextAvailable = highest + 1;

  if (requestedNumber) {
    const exists = await checkIssueExists(repo, token, requestedNumber);
    if (exists) {
      console.error(`Issue #${requestedNumber} already exists on GitHub.`);
      process.exit(1);
    }
    if (requestedNumber < nextAvailable) {
      console.warn(
        `Warning: Issue #${requestedNumber} < current highest issue (#${highest}). Ensure this is intentional.`,
      );
    }
    console.log(`Issue #${requestedNumber} is available.`);
    console.log(`Next automatic issue number would be #${nextAvailable}.`);
  } else {
    console.log(`Highest issue: #${highest}`);
    console.log(`Next available issue number: #${nextAvailable}`);
  }
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
