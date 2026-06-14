#!/usr/bin/env node
/**
 * Audits plan/research files for per-issue parity and stale artifacts.
 * - Ensures docs/plans + docs/research directories exist
 * - Warns when a plan lacks a matching research log (and vice versa)
 * - Highlights archived files that still claim "active" status
 */

import { readdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const planDir = path.join(repoRoot, 'docs', 'plans');
const researchDir = path.join(repoRoot, 'docs', 'research');
const archiveDir = path.join(planDir, 'archive');

function listIssueFiles(dir, kind) {
  if (!existsSync(dir)) {
    return { files: [], missingDir: true, kind };
  }
  const entries = readdirSync(dir).filter((file) => file.toLowerCase().endsWith('.md'));
  const map = new Map();
  const regex = /^issue-(\d+)[-\w]*\.md$/i;
  for (const entry of entries) {
    const match = entry.match(regex);
    if (!match) {
      continue;
    }
    const issue = match[1];
    map.set(issue, path.join(dir, entry));
  }
  return { files: entries, map, kind };
}

const planInfo = listIssueFiles(planDir, 'plan');
const researchInfo = listIssueFiles(researchDir, 'research');

const missingResearch = [];
const missingPlan = [];

if (!planInfo.missingDir && !researchInfo.missingDir) {
  for (const [issue, fullPath] of planInfo.map.entries()) {
    if (!researchInfo.map.has(issue)) {
      missingResearch.push({ issue, plan: path.relative(repoRoot, fullPath) });
    }
  }
  for (const [issue, fullPath] of researchInfo.map.entries()) {
    if (!planInfo.map.has(issue)) {
      missingPlan.push({ issue, research: path.relative(repoRoot, fullPath) });
    }
  }
}

const archiveWarnings = [];
if (existsSync(archiveDir)) {
  for (const file of readdirSync(archiveDir).filter((name) => name.toLowerCase().endsWith('.md'))) {
    const full = path.join(archiveDir, file);
    const text = readFileSync(full, 'utf8');
    if (/Status:\s*(planning|building|verifying)/i.test(text)) {
      archiveWarnings.push(path.relative(repoRoot, full));
    }
  }
}

const summary = {
  missingPlanDir: planInfo.missingDir,
  missingResearchDir: researchInfo.missingDir,
  missingResearch,
  missingPlan,
  archiveWarnings,
};

const strict = process.argv.includes('--strict') || process.env.DOCS_AUDIT_STRICT === '1';
const hasFindings =
  summary.missingPlanDir ||
  summary.missingResearchDir ||
  summary.missingPlan.length > 0 ||
  summary.missingResearch.length > 0 ||
  summary.archiveWarnings.length > 0;

if (!hasFindings) {
  console.log('Docs audit: clean');
} else {
  if (summary.missingPlanDir) {
    console.log('ERROR: docs/plans directory missing');
  }
  if (summary.missingResearchDir) {
    console.log('ERROR: docs/research directory missing');
  }
  for (const entry of summary.missingResearch) {
    console.log(`WARN: Plan ${entry.plan} has no matching research log`);
  }
  for (const entry of summary.missingPlan) {
    console.log(`WARN: Research ${entry.research} has no matching plan file`);
  }
  for (const file of summary.archiveWarnings) {
    console.log(`WARN: Archived plan still marked active -> ${file}`);
  }
}

if (strict && hasFindings) {
  process.exit(1);
}
