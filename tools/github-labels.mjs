#!/usr/bin/env node

/**
 * Syncs GitHub labels with docs/github/labels.json.
 * Requires a personal access token with repo scope.
 *
 * Usage:
 *   GITHUB_TOKEN=... npm run github:labels
 * Optional: set GITHUB_REPO="owner/name"
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const labelsPath = path.join(repoRoot, 'docs', 'github', 'labels.json');

function readLabels() {
  return JSON.parse(readFileSync(labelsPath, 'utf8'));
}

function getToken() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error('Set GITHUB_TOKEN (or GH_TOKEN) with repo scope before running this script.');
  }
  return token;
}

function parseRepoFromRemote(remote) {
  if (!remote) {
    throw new Error('Unable to determine GitHub repository. Set GITHUB_REPO=owner/name.');
  }

  // git@github.com:owner/repo.git
  const sshMatch = remote.match(/^git@github\.com:(.+?)\/(.+?)(\.git)?$/);
  if (sshMatch) {
    return `${sshMatch[1]}/${sshMatch[2]}`;
  }

  // https://github.com/owner/repo.git
  const httpsMatch = remote.match(/^https:\/\/github\.com\/(.+?)\/(.+?)(\.git)?$/);
  if (httpsMatch) {
    return `${httpsMatch[1]}/${httpsMatch[2]}`;
  }

  throw new Error(`Unrecognised GitHub remote format: ${remote}`);
}

function getRepo() {
  if (process.env.GITHUB_REPO) {
    return process.env.GITHUB_REPO;
  }
  try {
    const remote = execSync('git config --get remote.origin.url', {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
    return parseRepoFromRemote(remote);
  } catch (error) {
    throw new Error('Failed to read remote.origin.url. Set GITHUB_REPO=owner/name and retry.');
  }
}

async function fetchAllLabels(baseUrl, token) {
  const all = [];
  let page = 1;
  while (true) {
    const response = await fetch(`${baseUrl}?per_page=100&page=${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'cursor-agent-template',
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API error (${response.status}): ${await response.text()}`);
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }
    all.push(...data);
    if (data.length < 100) {
      break;
    }
    page += 1;
  }
  return all;
}

async function main() {
  const token = getToken();
  const repo = getRepo();
  const [owner, name] = repo.split('/');
  if (!owner || !name) {
    throw new Error(`Invalid GITHUB_REPO value: ${repo}`);
  }

  const desiredLabels = readLabels();
  const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';
  const labelsEndpoint = `${apiBase}/repos/${owner}/${name}/labels`;

  const existing = await fetchAllLabels(labelsEndpoint, token);
  const existingMap = new Map(existing.map(label => [label.name.toLowerCase(), label]));

  for (const label of desiredLabels) {
    const payload = {
      name: label.name,
      color: label.color.replace(/^#/, ''),
      description: label.description ?? '',
    };
    const key = label.name.toLowerCase();
    const url = `${labelsEndpoint}/${encodeURIComponent(label.name)}`;

    if (existingMap.has(key)) {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'cursor-agent-template',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Failed to update label "${label.name}": ${response.status} ${await response.text()}`);
      }
      console.log(`Updated label ${label.name}`);
    } else {
      const response = await fetch(labelsEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'cursor-agent-template',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Failed to create label "${label.name}": ${response.status} ${await response.text()}`);
      }
      console.log(`Created label ${label.name}`);
    }
  }

  console.log('Label sync complete.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
