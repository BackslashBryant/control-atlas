#!/usr/bin/env -S node --loader tsx
import { Octokit } from '@octokit/rest';

type RepoRef = { owner: string; repo: string };

function parseRepoArg(argv: string[]): RepoRef | null {
  const idx = argv.indexOf('--repo');
  if (idx >= 0 && argv[idx + 1]) {
    const [owner, repo] = argv[idx + 1].split('/');
    if (owner && repo) return { owner, repo };
  }
  return null;
}

function repoFromGitRemote(): RepoRef | null {
  try {
    const url = require('child_process').execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const match = url.match(/github\.com[:\/]([^\/]+)\/([^\.]+)(?:\.git)?$/i);
    if (match) return { owner: match[1], repo: match[2] };
  } catch {}
  return null;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const dryRun = process.argv.includes('--dry-run');
  if (!token && !dryRun) {
    console.error('GITHUB_TOKEN is required (set env or run with --dry-run).');
    process.exit(1);
  }
  const ref = parseRepoArg(process.argv) ?? repoFromGitRemote();
  if (!ref) {
    console.error('Unable to resolve repo. Pass --repo <owner/name> or set git remote origin.');
    process.exit(1);
  }
  const octokit = token ? new Octokit({ auth: token }) : new Octokit();

  const desired = [
    { name: 'ticket', color: '5c6ac4', description: 'Local ticket file' },
    { name: 'status:in-progress', color: 'f59e0b', description: 'Ticket in progress' },
    { name: 'priority:high', color: 'ef4444', description: 'High priority ticket' },
    { name: 'priority:medium', color: 'f59e0b', description: 'Medium priority ticket' },
    { name: 'priority:low', color: '22c55e', description: 'Low priority ticket' },
  ];

  const set = new Set<string>();
  if (!dryRun) {
    const { data: existing } = await octokit.rest.issues.listLabelsForRepo({ owner: ref.owner, repo: ref.repo, per_page: 100 });
    for (const l of existing) set.add(l.name);
  }

  for (const lbl of desired) {
    if (!set.has(lbl.name)) {
      if (dryRun) {
        console.log(`[dry-run] would create label: ${lbl.name} (${lbl.color})`);
      } else {
        await octokit.rest.issues.createLabel({ owner: ref.owner, repo: ref.repo, name: lbl.name, color: lbl.color, description: lbl.description });
        console.log(`Created label: ${lbl.name}`);
      }
    } else {
      console.log(`Label exists: ${lbl.name}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


