#!/usr/bin/env node

/**
 * Agent-led bootstrap doctor.
 *
 * Intended for AI agents to run at the start of work in a fresh template clone.
 * It detects missing setup and applies only low-risk repo-local initialization.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRockySetup } from './rocky-auto-setup.mjs';
import { detectRepoMode } from './lib/repo-mode.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const cursorDir = path.join(repoRoot, '.cursor');
const setupStatePath = path.join(cursorDir, 'setup-state.json');
const agentsConfigPath = path.join(cursorDir, 'agents-config.json');
const agentsStatePath = path.join(cursorDir, 'agents-state.json');
const featuresDir = path.join(repoRoot, '.notes', 'features');
const currentFeaturePath = path.join(featuresDir, 'current.json');
const packageJsonPath = path.join(repoRoot, 'package.json');
const appsDir = path.join(repoRoot, 'apps');

const args = process.argv.slice(2);
const wantsJson = args.includes('--json');
const apply = args.includes('--apply');

function run(command, commandArgs, { capture = false } = {}) {
  return spawnSync(command, commandArgs, {
    cwd: repoRoot,
    encoding: capture ? 'utf8' : undefined,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    env: process.env,
    shell: process.platform === 'win32' && command === 'npm',
  });
}

function readJson(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readOriginRemote() {
  const result = run('git', ['config', '--get', 'remote.origin.url'], { capture: true });
  return result.status === 0 ? result.stdout.trim() : null;
}

function isCanonicalTemplateRemote(remote) {
  if (!remote) {
    return false;
  }
  return /cursor-template-project(?:\.git)?$/i.test(remote) || /BackslashBryant\/cursor-template-project/i.test(remote);
}

function detectState() {
  const packageJson = readJson(packageJsonPath);
  const mcpJson = readJson(path.join(repoRoot, '.cursor', 'mcp.json'));
  const currentFeature = readJson(currentFeaturePath);

  return {
    repoMode: detectRepoMode(),
    packageName: packageJson?.name || null,
    packageDescription: packageJson?.description || null,
    remote: readOriginRemote(),
    setupStateExists: existsSync(setupStatePath),
    agentConfigExists: existsSync(path.join(repoRoot, '.cursor', 'agents-config.json')),
    agentsDirExists: existsSync(path.join(repoRoot, '.cursor', 'agents')),
    mcpServers: Object.keys(mcpJson?.mcpServers || {}),
    hasCurrentFeature: !!currentFeature?.slug,
    hasGitHubToken: !!process.env.GITHUB_TOKEN,
    hasAppsWorkspace: existsSync(appsDir),
    rockyReady: existsSync(path.join(repoRoot, '.rocky', 'config.json')),
  };
}

function shouldAutoConvertToApp(state) {
  if (state.repoMode === 'app') {
    return false;
  }

  if (state.remote && !isCanonicalTemplateRemote(state.remote)) {
    return true;
  }

  const packageName = (state.packageName || '').toLowerCase();
  const description = (state.packageDescription || '').toLowerCase();
  return !(packageName.includes('template') || description.includes('template'));
}

function plannedActions(state) {
  const actions = [];

  if (!state.setupStateExists) {
    actions.push('write setup-state marker');
  }
  actions.push('verify committed repo defaults');
  actions.push('sync ignored Cursor agent state');
  actions.push('verify Rocky runtime state');
  actions.push('review MCP suggestions');
  if (shouldAutoConvertToApp(state)) {
    actions.push('auto-convert repo into app mode');
  }
  actions.push('run preflight');

  if (!state.hasCurrentFeature) {
    actions.push('wait for product direction before creating a feature spec');
  }

  if (!state.hasGitHubToken) {
    actions.push('surface missing inherited GITHUB_TOKEN before GitHub-backed operations');
  }

  return actions;
}

function syncAgentState() {
  const config = readJson(agentsConfigPath);
  const agentNames = (config?.agents || []).map(agent => agent.name).filter(Boolean);
  if (agentNames.length === 0) {
    return false;
  }

  let existing = {};
  if (existsSync(agentsStatePath)) {
    existing = readJson(agentsStatePath) || {};
  }

  writeFileSync(
    agentsStatePath,
    `${JSON.stringify({
      ...existing,
      expectedAgents: agentNames,
      createdAgents: Array.isArray(existing.createdAgents)
        ? existing.createdAgents.filter(name => agentNames.includes(name))
        : [],
      verifiedAt: new Date().toISOString(),
    }, null, 2)}\n`,
    'utf8',
  );

  return true;
}

function applySafeBootstrap(state) {
  if (!existsSync(cursorDir)) {
    mkdirSync(cursorDir, { recursive: true });
  }

  const agentStateSynced = syncAgentState();
  try {
    runRockySetup({ verbose: false });
  } catch {
    // Rocky repair is best-effort.
  }

  let convertedToApp = false;
  if (shouldAutoConvertToApp(state)) {
    const convertResult = run(process.execPath, ['tools/convert-to-app.mjs'], { capture: true });
    if (convertResult.status !== 0) {
      return {
        agentStateSynced,
        rockyReady: existsSync(path.join(repoRoot, '.rocky', 'config.json')),
        convertedToApp,
        preflightOk: false,
        preflightOutput: `${convertResult.stdout || ''}${convertResult.stderr || ''}`.trim(),
      };
    }
    convertedToApp = true;
  }

  run(process.execPath, ['tools/mcp-suggest.mjs', '--summary']);

  const preflight = run('npm', ['run', 'preflight'], { capture: true });

  if (!state.setupStateExists && preflight.status === 0) {
    writeFileSync(
      setupStatePath,
      `${JSON.stringify({
        completedAt: new Date().toISOString(),
        mode: 'agent-led',
        note: 'Verified committed defaults, repaired runtime state, and applied app-mode transition when needed.',
      }, null, 2)}\n`,
      'utf8',
    );
  }

  return {
    agentStateSynced,
    rockyReady: existsSync(path.join(repoRoot, '.rocky', 'config.json')),
    convertedToApp,
    preflightOk: preflight.status === 0,
    preflightOutput: `${preflight.stdout || ''}${preflight.stderr || ''}`.trim(),
  };
}

function main() {
  const state = detectState();
  const actions = plannedActions(state);
  const result = {
    freshProjectLikely: !state.setupStateExists,
    state,
    plannedActions: actions,
    applied: false,
    applyResult: null,
  };

  if (apply) {
    result.applied = true;
    result.applyResult = applySafeBootstrap(state);
  }

  if (wantsJson) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.applyResult?.preflightOk === false ? 1 : 0);
  }

  console.log('Agent bootstrap report');
  console.log('Fresh project likely:', result.freshProjectLikely ? 'yes' : 'no');
  console.log('Repo mode:', state.repoMode);
  console.log('MCP servers:', state.mcpServers.length ? state.mcpServers.join(', ') : 'none');
  console.log('Rocky:', state.rockyReady ? 'ready' : 'repair needed');
  console.log('Current feature:', state.hasCurrentFeature ? 'present' : 'missing');
  console.log('GitHub token:', state.hasGitHubToken ? 'present' : 'missing');
  if (!state.hasGitHubToken && process.platform === 'win32') {
    console.log('GitHub auth note:', 'refresh the inherited GITHUB_TOKEN, then restart Cursor, Codex, and Antigravity.');
  }
  console.log('');
  console.log('Actions:');
  for (const action of actions) {
    console.log('- ' + action);
  }

  if (result.applied) {
    console.log('');
    console.log('Applied bootstrap. Preflight:', result.applyResult.preflightOk ? 'pass' : 'failed');
    console.log('Agent state:', result.applyResult.agentStateSynced ? 'synced' : 'skipped');
    console.log('Rocky runtime:', result.applyResult.rockyReady ? 'ready' : 'repair needed');
    console.log('App conversion:', result.applyResult.convertedToApp ? 'performed' : 'not needed');
    if (!result.applyResult.preflightOk && result.applyResult.preflightOutput) {
      console.log('');
      console.log(result.applyResult.preflightOutput);
    }
  } else {
    console.log('');
    console.log('Agents should rerun this with --apply when repo verification or repair is needed.');
  }

  process.exit(result.applyResult?.preflightOk === false ? 1 : 0);
}

main();
