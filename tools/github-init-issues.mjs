#!/usr/bin/env node

/**
 * Seeds a small starter issue set for projects that want GitHub tracking.
 *
 * This is optional. The template's default ship path does not require PRs.
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function getToken() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error('Set GITHUB_TOKEN or GH_TOKEN with repo scope before running this script.');
  }
  return token;
}

function parseRepoFromRemote(remote) {
  if (!remote) {
    throw new Error('Unable to determine GitHub repository. Set GITHUB_REPO=owner/name.');
  }
  const sshMatch = remote.match(/^git@github\.com:(.+?)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `${sshMatch[1]}/${sshMatch[2]}`;
  }
  const httpsMatch = remote.match(/^https:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return `${httpsMatch[1]}/${httpsMatch[2]}`;
  }
  throw new Error(`Unrecognised GitHub remote format: ${remote}`);
}

function getRepo() {
  if (process.env.GITHUB_REPO) {
    return process.env.GITHUB_REPO;
  }
  const remote = execSync('git config --get remote.origin.url', {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'ignore'],
    encoding: 'utf8',
  }).trim();
  return parseRepoFromRemote(remote);
}

async function fetchJson(url, { token, method = 'GET', body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cursor-template-init',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${text}`);
  }
  return response.json();
}

async function listExistingIssueTitles({ repo, token }) {
  const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';
  const endpoint = `${apiBase}/repos/${repo}/issues?state=open&per_page=100`;
  const data = await fetchJson(endpoint, { token });
  return new Set(data.map(issue => issue.title));
}

async function createIssue({ repo, token, title, body, labels }) {
  const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';
  const endpoint = `${apiBase}/repos/${repo}/issues`;
  return fetchJson(endpoint, {
    token,
    method: 'POST',
    body: { title, body, labels },
  });
}

const DEFAULT_ISSUES = [
  {
    title: '[Spec] Capture project vision and v1.0 scope',
    labels: ['status:plan', 'agent:vector'],
    body: `## Goal
- Document vision in docs/vision.md
- Align docs/roadmap.md and docs/PRD.md for full v1.0
- Seed Feature DoD in .notes/features/<slug>/spec.md or per-issue plan under docs/plans/

## Checklist
- [ ] Vision drafted
- [ ] Roadmap phases 1-6 acknowledged as required for v1.0
- [ ] Feature DoD or issue plan agreed
- [ ] Status summary logged`,
  },
  {
    title: '[Plan] Break work into checkpoints',
    labels: ['status:plan', 'agent:vector'],
    body: `## Goal
- Vector creates 3-5 numbered steps
- Map each Feature DoD / roadmap exit criterion to a step and owner
- Log acceptance checks for Pixel

## Checklist
- [ ] Plan stored in docs/Plan.md
- [ ] Checkpoints mapped to owners
- [ ] Pixel test strategy confirmed
- [ ] Status summary appended`,
  },
  {
    title: '[Build] Implement planned checkpoints',
    labels: ['status:build', 'agent:forge'],
    body: `## Goal
- Work checkpoint-by-checkpoint
- Run targeted tests after each change
- Update docs/ConnectionGuide.md when services change

## Checklist
- [ ] Checkpoint 1 complete
- [ ] Checks GREEN
- [ ] Current Issues logged as needed`,
  },
  {
    title: '[Ship] Verify and merge to main',
    labels: ['status:verify', 'agent:pixel', 'agent:nexus'],
    body: `## Goal
- Pixel reports verification evidence
- Muse reviews user-facing UX/copy/brand when applicable
- Nexus ships through git and CI

## Checklist
- [ ] Tests GREEN
- [ ] docs/context.md updated when useful
- [ ] docs/ConnectionGuide.md reflects final state
- [ ] Branch pushed and merged to main when ready`,
  },
];

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const token = getToken();
  const repo = getRepo();

  console.log(`Seeding starter issues for ${repo}...`);

  const existingTitles = force ? new Set() : await listExistingIssueTitles({ repo, token });

  const created = [];
  for (const issue of DEFAULT_ISSUES) {
    if (!force && existingTitles.has(issue.title)) {
      console.log(`- Skipping (already exists): ${issue.title}`);
      continue;
    }
    const response = await createIssue({ repo, token, ...issue });
    created.push(response.html_url);
    console.log(`- Created: ${response.html_url}`);
  }

  if (created.length === 0) {
    console.log('No new issues created. Use --force to recreate.');
    return;
  }

  console.log('\nStarter issues ready.');
  console.log('Next steps:');
  console.log(' 1. Open the Spec issue and fill in the docs referenced.');
  console.log(' 2. Keep docs/context.md current when a handoff needs it.');
  console.log(' 3. Progress issues as checkpoints turn GREEN.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
