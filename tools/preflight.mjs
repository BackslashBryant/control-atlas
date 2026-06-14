#!/usr/bin/env node

/**
 * Lightweight preflight that validates the Agent-first workflow scaffolding.
 * It keeps the repo stack-agnostic while ensuring the docs, agents,
 * and optional guardrails are present and well formed.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { detectRepoMode } from './lib/repo-mode.mjs';
import { hasUncheckedMvpItems, summarizeAppModeViolations } from './lib/app-mode-policy.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const planPath = path.join(repoRoot, 'docs', 'Plan.md');
const planDir = path.join(repoRoot, 'docs', 'plans');
const researchIndexPath = path.join(repoRoot, 'docs', 'research.md');
const researchDir = path.join(repoRoot, 'docs', 'research');
const kickoffPath = path.join(repoRoot, 'docs', 'agents', 'KICKOFF.md');
const hookSamplePath = path.join(repoRoot, 'scripts', 'hooks', 'pre-commit.sample');
const labelsPath = path.join(repoRoot, 'docs', 'github', 'labels.json');
const issueTemplateDir = path.join(repoRoot, '.github', 'ISSUE_TEMPLATE');
const mcpConfigPath = path.join(repoRoot, '.cursor', 'mcp.json');
const featuresDir = path.join(repoRoot, '.notes', 'features');
const featureStatePath = path.join(featuresDir, 'current.json');
const mvpGuidePath = path.join(repoRoot, 'docs', 'process', 'MVP_LOOP.md');
const agentsConfigPath = path.join(repoRoot, '.cursor', 'agents-config.json');
const agentsDir = path.join(repoRoot, '.cursor', 'agents');
const rockyConfigPath = path.join(repoRoot, '.rocky', 'config.json');

const results = [];

function addResult(name, ok, message) {
  results.push({ name, ok, message });
}

function readLines(filePath) {
  return readFileSync(filePath, 'utf8').split(/\r?\n/);
}

function checkPlanScaffold() {
  if (!existsSync(planPath)) {
    addResult('Plan index', false, 'docs/Plan.md is missing');
    return;
  }

  const text = readFileSync(planPath, 'utf8');
  if (!text.includes('# Plan Index')) {
    addResult('Plan index', false, 'docs/Plan.md should describe the plan index.');
    return;
  }

  addResult('Plan index', true, 'docs/Plan.md found with index instructions');
}

function checkResearchLog() {
  if (!existsSync(researchIndexPath)) {
    addResult('Research landing', false, 'docs/research.md is missing');
    return;
  }

  const text = readFileSync(researchIndexPath, 'utf8');
  if (!text.includes('per-issue files')) {
    addResult('Research landing', false, 'docs/research.md must point to docs/research/<Issue>.');
    return;
  }

  addResult('Research landing', true, 'docs/research.md references per-issue files');
}

function checkPerIssueDirectories() {
  if (!existsSync(planDir)) {
    addResult('Plan directory', false, 'docs/plans/ directory missing');
    return;
  }
  if (!existsSync(path.join(planDir, 'README.md'))) {
    addResult('Plan directory', false, 'docs/plans/README.md missing (naming contract).');
    return;
  }
  if (!existsSync(researchDir)) {
    addResult('Research directory', false, 'docs/research/ directory missing');
    return;
  }
  if (!existsSync(path.join(researchDir, 'README.md'))) {
    addResult('Research directory', false, 'docs/research/README.md missing.');
    return;
  }
  addResult('Plan/Research directories', true, 'Per-issue directories ready');
}

function loadAgentNames() {
  if (!existsSync(agentsConfigPath)) {
    return null;
  }
  try {
    const config = JSON.parse(readFileSync(agentsConfigPath, 'utf8'));
    return (config.agents || []).map(agent => agent.name).filter(Boolean);
  } catch {
    return null;
  }
}

function checkAgentPrompts() {
  const agents = loadAgentNames();
  if (!agents) {
    addResult('Cursor agents', false, '.cursor/agents-config.json missing or invalid');
    return;
  }

  const missing = agents.filter(agent => {
    const promptPath = path.join(agentsDir, `${agent}.md`);
    return !existsSync(promptPath);
  });

  if (missing.length > 0) {
    addResult('Cursor agents', true, `Agent roster declared; prompt files can be repaired during bootstrap if needed. Missing: ${missing.join(', ')}`);
    return;
  }

  addResult('Cursor agents', true, 'Lean Cursor agent roster present');
}

function checkKickoff() {
  if (!existsSync(kickoffPath)) {
    addResult('Kickoff', false, 'docs/agents/KICKOFF.md is missing');
    return;
  }
  addResult('Kickoff', true, 'Kickoff + sanity test available');
}

function checkHookSample() {
  if (!existsSync(hookSamplePath)) {
    addResult('Path-scope hook', false, 'scripts/hooks/pre-commit.sample is missing');
    return;
  }
  addResult('Path-scope hook', true, 'Optional pre-commit hook found');
}

function checkGitHubLabels() {
  if (!existsSync(labelsPath)) {
    addResult('GitHub labels', false, 'docs/github/labels.json is missing');
    return;
  }
  try {
    const parsed = JSON.parse(readFileSync(labelsPath, 'utf8'));
    if (!Array.isArray(parsed) || parsed.length === 0) {
      addResult('GitHub labels', false, 'docs/github/labels.json must be a non-empty array');
      return;
    }
    addResult('GitHub labels', true, 'Label catalog ready');
  } catch (error) {
    addResult('GitHub labels', false, `docs/github/labels.json is invalid JSON (${error instanceof Error ? error.message : error})`);
  }
}

function checkIssueTemplates() {
  const required = [
    '0-spec.md',
    '1-plan.md',
    '2-build.md',
    'kickoff.md',
    'bug_report.md',
    'research.md',
    'sentinel.md',
    'maintenance.md',
    'config.yml',
  ];
  if (!existsSync(issueTemplateDir)) {
    addResult('Issue templates', false, '.github/ISSUE_TEMPLATE directory is missing');
    return;
  }
  const missing = required.filter(file => !existsSync(path.join(issueTemplateDir, file)));
  if (missing.length > 0) {
    addResult('Issue templates', false, `Missing files: ${missing.join(', ')}`);
    return;
  }
  addResult('Issue templates', true, 'Spec/Plan/Build workflow templates available');
}

function checkMcpConfig() {
  if (!existsSync(mcpConfigPath)) {
    addResult('MCP config', false, '.cursor/mcp.json is missing');
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(mcpConfigPath, 'utf8'));
  } catch (error) {
    addResult('MCP config', false, `.cursor/mcp.json is invalid JSON (${error instanceof Error ? error.message : error})`);
    return;
  }

  const servers = parsed?.mcpServers;
  if (!servers || typeof servers !== 'object') {
    addResult('MCP config', false, '.cursor/mcp.json must export an object with "mcpServers"');
    return;
  }

  const requiredServers = ['github', 'context7'];
  const missing = requiredServers.filter(name => !servers[name]);
  if (missing.length > 0) {
    // Auto-heal: try to fix missing servers
    const healResult = spawnSync(process.execPath, [path.join(repoRoot, 'tools', 'mcp-self-heal.mjs')], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    if (healResult.status === 0) {
      addResult('MCP config', true, 'Auto-healed: missing servers fixed');
      return;
    }
    addResult('MCP config', false, `Missing required MCP servers: ${missing.join(', ')}. Run: npm run mcp:heal`);
    return;
  }

  // Check for missing env fields and auto-heal
  let needsHealing = false;
  for (const [name, config] of Object.entries(servers)) {
    if (name.includes('github') && (!config.env || (!config.env.GITHUB_TOKEN && !config.env['GITHUB_TOKEN']))) {
      needsHealing = true;
      break;
    }
    // Also check if env value is missing ${} placeholder
    if (name.includes('github') && config.env && config.env.GITHUB_TOKEN && !config.env.GITHUB_TOKEN.includes('${')) {
      needsHealing = true;
      break;
    }
  }

  if (needsHealing) {
    const healResult = spawnSync(process.execPath, [path.join(repoRoot, 'tools', 'mcp-self-heal.mjs')], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    if (healResult.status === 0) {
      addResult('MCP config', true, 'Auto-healed: missing env fields fixed');
      return;
    }
    addResult('MCP config', false, 'Some servers missing env fields. Run: npm run mcp:heal');
    return;
  }

  addResult('MCP config', true, 'Core MCP servers configured');
}

function checkCursorDocs() {
  const requiredDocs = [
    path.join(repoRoot, 'docs', 'cursor', 'extensions.md'),
    path.join(repoRoot, 'docs', 'cursor', 'symbols.md'),
    path.join(repoRoot, 'docs', 'cursor', 'agent-tools.md'),
    path.join(repoRoot, 'docs', 'cursor', 'agent-browser.md'),
    path.join(repoRoot, 'docs', 'cursor', 'agent-hooks.md'),
    path.join(repoRoot, 'docs', 'cursor', 'models.md'),
  ];

  const missing = requiredDocs.filter(docPath => !existsSync(docPath));
  if (missing.length > 0) {
    const friendly = missing.map(p => path.relative(repoRoot, p)).join(', ');
    addResult('Cursor docs', false, `Missing documentation: ${friendly}`);
    return;
  }

  addResult('Cursor docs', true, 'Cursor-specific guides available');
}

function checkRockyDefaults() {
  addResult(
    'Rocky defaults',
    existsSync(rockyConfigPath),
    existsSync(rockyConfigPath)
      ? 'Committed Rocky defaults present'
      : '.rocky/config.json missing (run npm run agent:bootstrap -- --apply)',
  );
}

function checkFeatureWorkflow() {
  if (!existsSync(featuresDir)) {
    addResult('Feature workflow', false, '.notes/features directory missing (run npm run feature:new)');
    return;
  }

  if (!existsSync(featureStatePath)) {
    addResult('Feature workflow', true, 'No active feature yet');
    return;
  }

  let state;
  try {
    state = JSON.parse(readFileSync(featureStatePath, 'utf8'));
  } catch (error) {
    addResult('Feature workflow', false, `current.json invalid JSON (${error instanceof Error ? error.message : error})`);
    return;
  }

  const slug = state?.slug;
  if (!slug) {
    addResult('Feature workflow', false, 'current.json missing slug property');
    return;
  }

  const specPath = path.join(featuresDir, slug, 'spec.md');
  const progressPath = path.join(featuresDir, slug, 'progress.md');
  if (!existsSync(specPath) || !existsSync(progressPath)) {
    if (state?.status === 'complete') {
      addResult('Feature workflow', true, `Current feature ${slug} is marked complete; spec/progress files are not required for an archived completion state.`);
      return;
    }
    addResult('Feature workflow', false, `Spec/progress files missing for slug ${slug} (run npm run feature:new)`);
    return;
  }

  const specText = readFileSync(specPath, 'utf8');
  if (!specText.includes('## MVP DoD')) {
    addResult('Feature workflow', false, `Spec ${specPath} missing "## MVP DoD" section`);
    return;
  }

  if (state?.status === 'complete' && !hasUncheckedMvpItems(specText)) {
    addResult('Feature workflow', true, `Current feature ${slug} is marked complete; unchecked MVP DoD items are not required after completion.`);
    return;
  }

  if (!hasUncheckedMvpItems(specText)) {
    addResult('Feature workflow', false, `Spec ${specPath} must contain unchecked MVP DoD checklist items like "- [ ] Ship the first slice"`);
    return;
  }

  addResult('Feature workflow', true, `Active feature detected (${slug})`);
}

function checkMvpGuide() {
  if (!existsSync(mvpGuidePath)) {
    addResult('MVP loop guide', false, 'docs/process/MVP_LOOP.md missing');
    return;
  }
  addResult('MVP loop guide', true, 'Solo-dev loop documented');
}

function checkRepoMode() {
  const mode = detectRepoMode();
  const cursorDir = path.join(repoRoot, '.cursor');
  const cursorIgnorePath = path.join(repoRoot, '.cursorignore');

  if (mode === 'app') {
    // In app mode, check if .cursor/ is being tracked
    if (existsSync(cursorDir)) {
      // Check if .cursorignore exists (should be allowed)
      if (!existsSync(cursorIgnorePath)) {
        addResult('Repo mode', false, 'App mode: .cursorignore should exist (app-specific Cursor config)');
        return;
      }
      // Warn if .cursor/ has tracked files (other than what should be ignored)
      addResult('Repo mode', true, `App mode: Cursor files should be ignored (except .cursorignore)`);
      return;
    }
    addResult('Repo mode', true, 'App mode: No .cursor/ directory (correct)');
    return;
  }

  // Template mode: .cursor/ should exist
  if (!existsSync(cursorDir)) {
    addResult('Repo mode', false, 'Template mode: .cursor/ directory missing');
    return;
  }
  addResult('Repo mode', true, `Template mode: Cursor files tracked`);
}

function collectChangedPaths() {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  return result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => ({
      status: line.slice(0, 2).trim(),
      filePath: line.slice(3).trim(),
    }))
    .map(entry => ({
      ...entry,
      filePath: entry.filePath.includes(' -> ') ? entry.filePath.split(' -> ').pop() : entry.filePath,
    }))
    .filter(entry => entry.filePath)
    .filter(Boolean);
}

function checkAppModeBoundaries() {
  const mode = detectRepoMode();
  if (mode !== 'app') {
    addResult('App boundary', true, 'Template mode active; strict app boundary not applied');
    return;
  }

  const violations = summarizeAppModeViolations(collectChangedPaths());
  if (violations.length === 0) {
    addResult('App boundary', true, 'Strict app-mode boundaries are clean');
    return;
  }

  const summary = violations.slice(0, 3).map(entry => entry.filePath).join(', ');
  addResult('App boundary', false, `App mode violation(s): ${summary}`);
}

function runHelperScript(name, relativePath, extraArgs = []) {
  const scriptPath = path.join(repoRoot, relativePath);
  if (!existsSync(scriptPath)) {
    addResult(name, false, `${relativePath} missing`);
    return;
  }
  const result = spawnSync(process.execPath, [scriptPath, ...extraArgs], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const output = (result.stdout || result.stderr || '').trim();
  const message = output.split(/\r?\n/).slice(-1)[0] || 'ok';
  addResult(name, result.status === 0, message);
}

function checkGitState() {
  const branchResult = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' });
  if (branchResult.status !== 0) {
    addResult('Git branch', false, 'Unable to determine git branch.');
    return;
  }

  const branch = branchResult.stdout.trim();
  if (branch === 'main' || branch === 'master') {
    addResult('Git branch', true, `On "${branch}". Create a feature branch before edits.`);
    return;
  }

  const statusResult = spawnSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  if (statusResult.status !== 0) {
    addResult('Git status', false, 'Unable to read git status.');
    return;
  }

  const dirty = statusResult.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(line => !line.match(/^\?\?\.notes/));

  if (dirty.length > 0) {
    addResult('Git status', true, `Working tree has ${dirty.length} tracked change(s). Make sure they belong to this task.`);
  } else {
    addResult('Git status', true, 'Working tree clean');
  }
}

function main() {
  const repoMode = detectRepoMode();
  const templateMode = repoMode === 'template';

  checkPlanScaffold();
  if (templateMode) {
    checkResearchLog();
    checkPerIssueDirectories();
  }
  checkAgentPrompts();
  if (templateMode) {
    checkKickoff();
    checkGitHubLabels();
    checkIssueTemplates();
    checkCursorDocs();
    checkMvpGuide();
  }
  checkHookSample();
  checkMcpConfig();
  checkRockyDefaults();
  checkFeatureWorkflow();
  checkRepoMode();
  checkAppModeBoundaries();
  checkGitState();
  runHelperScript('Port guard', path.join('tools', 'ports-status.mjs'));
  runHelperScript('Docs audit', path.join('tools', 'docs-audit.mjs'));
  runHelperScript('Dependency policy', path.join('tools', 'check-dependencies.mjs'));
  runHelperScript('MCP env vars', path.join('tools', 'test-mcp-connectivity.mjs'));

  const rawArgs = process.argv.slice(2);
  const wantsJson = rawArgs.includes('--json') || rawArgs.includes('--ci');

  if (wantsJson) {
    const payload = results.map(result => ({
      check: result.name,
      ok: result.ok,
      message: result.message,
    }));
    console.log(JSON.stringify({ ok: results.every(r => r.ok), results: payload }, null, 2));
  } else {
    for (const result of results) {
      const status = result.ok ? 'PASS' : 'FAIL';
      console.log(`${status}  ${result.name} - ${result.message}`);
    }
  }

  const ok = results.every(result => result.ok);
  process.exit(ok ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
}
