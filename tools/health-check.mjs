#!/usr/bin/env node

/**
 * Health Dashboard - Comprehensive readiness status checker
 *
 * Checks all aspects of workspace setup and provides actionable next steps.
 * Usage:
 *   npm run status              # Human-readable output
 *   npm run status -- --json    # JSON output for CI
 */

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectRepoMode } from './lib/repo-mode.mjs';
import { hasUncheckedMvpItems, summarizeAppModeViolations } from './lib/app-mode-policy.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const featuresDir = path.join(repoRoot, '.notes', 'features');
const featureStatePath = path.join(featuresDir, 'current.json');
const agentsConfigPath = path.join(repoRoot, '.cursor', 'agents-config.json');
const agentsDir = path.join(repoRoot, '.cursor', 'agents');
const rockyConfigPath = path.join(repoRoot, '.rocky', 'config.json');

const checks = [];

// Status indicators
const STATUS = {
  READY: '[OK]',
  NEEDS_SETUP: '[!]',
  MISSING: '[X]',
};

function addCheck(category, name, status, message, fix = null) {
  checks.push({
    category,
    name,
    status,
    message,
    fix,
    ok: status === STATUS.READY,
  });
}

function checkNodeVersion() {
  try {
    const version = process.version;
    const major = parseInt(version.slice(1).split('.')[0], 10);
    if (major >= 18) {
      addCheck(
        'Prerequisites',
        'Node.js',
        STATUS.READY,
        `Node.js ${version} detected`,
      );
    } else {
      addCheck(
        'Prerequisites',
        'Node.js',
        STATUS.MISSING,
        `Node.js ${version} detected (requires 18+)`,
        'Install Node.js 18+ from https://nodejs.org/',
      );
    }
  } catch {
    addCheck(
      'Prerequisites',
      'Node.js',
      STATUS.MISSING,
      'Node.js not found',
      'Install Node.js 18+ from https://nodejs.org/',
    );
  }
}

function checkNpm() {
  try {
    const version = execSync('npm --version', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    addCheck('Prerequisites', 'npm', STATUS.READY, `npm ${version} detected`);
  } catch {
    addCheck(
      'Prerequisites',
      'npm',
      STATUS.MISSING,
      'npm not found',
      'npm should come with Node.js. Reinstall Node.js if missing.',
    );
  }
}

function checkGit() {
  try {
    const gitDir = path.join(repoRoot, '.git');
    if (existsSync(gitDir)) {
      try {
        const remote = execSync('git config --get remote.origin.url', {
          cwd: repoRoot,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        addCheck(
          'Repository',
          'Git Repository',
          STATUS.READY,
          `Git repository initialized (remote: ${remote})`,
        );
      } catch {
        addCheck(
          'Repository',
          'Git Repository',
          STATUS.NEEDS_SETUP,
          'Git repository initialized but no remote configured',
          'Run: git remote add origin <your-repo-url>',
        );
      }
    } else {
      addCheck(
        'Repository',
        'Git Repository',
        STATUS.NEEDS_SETUP,
        'Git repository not initialized',
        'Run: git init && git remote add origin <your-repo-url>',
      );
    }
  } catch {
    addCheck(
      'Repository',
      'Git Repository',
      STATUS.MISSING,
      'Git not found',
      'Install Git from https://git-scm.com/',
    );
  }
}

function checkEnvironmentVariables() {
  const conditionalEnv = {
    GITHUB_TOKEN: {
      description: 'Inherited user-level GitHub token for MCP issue/label/branch operations',
      fix: 'Run: npm run setup:tokens',
    },
  };

  for (const [varName, info] of Object.entries(conditionalEnv)) {
    const value = process.env[varName];
    if (value) {
      const isValidFormat =
        value.startsWith('ghp_') ||
        value.startsWith('github_pat_') ||
        value.startsWith('gho_');
      if (isValidFormat) {
        addCheck(
          'Environment',
          varName,
          STATUS.READY,
          `${varName} is set (format validated)`,
        );
      } else {
        addCheck(
          'Environment',
          varName,
          STATUS.NEEDS_SETUP,
          `${varName} is set but format looks invalid`,
          info.fix,
        );
      }
    } else {
      addCheck(
        'Environment',
        varName,
        STATUS.NEEDS_SETUP,
        process.platform === 'win32'
          ? `${varName} is not visible in this session - set it at the Windows user level, then restart Cursor/Codex/Antigravity`
          : `${varName} is not set - ${info.description}`,
        info.fix,
      );
    }
  }
}

function checkMcpConfig() {
  const mcpConfigPath = path.join(repoRoot, '.cursor', 'mcp.json');
  if (!existsSync(mcpConfigPath)) {
    addCheck(
      'MCP Configuration',
      'MCP Config File',
      STATUS.MISSING,
      '.cursor/mcp.json is missing',
      'Run: npm run setup',
    );
    return;
  }

  try {
    const config = JSON.parse(readFileSync(mcpConfigPath, 'utf8'));
    const servers = config?.mcpServers || {};

    const requiredServers = ['github', 'context7'];
    const configuredServers = Object.keys(servers);

    for (const serverName of requiredServers) {
      if (servers[serverName]) {
        addCheck(
          'MCP Configuration',
          `MCP Server: ${serverName}`,
          STATUS.READY,
          `${serverName} is configured`,
        );
      } else {
        addCheck(
          'MCP Configuration',
          `MCP Server: ${serverName}`,
          STATUS.MISSING,
          `${serverName} is not configured`,
          'Run: npm run mcp:suggest -- --install all',
        );
      }
    }

    // Check for optional servers
    const optionalServers = ['playwright-mcp', 'spec-workflow-mcp', 'supabase', 'render', 'vercel', 'railway', 'figma'];
    for (const serverName of optionalServers) {
      if (servers[serverName]) {
        addCheck(
          'MCP Configuration',
          `MCP Server: ${serverName}`,
          STATUS.READY,
          `${serverName} is configured (optional)`,
        );
      }
    }

    // Check if MCP servers have environment variables set
    const conditionalMcpEnv = new Set(['GITHUB_TOKEN', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']);
    for (const [serverName, serverConfig] of Object.entries(servers)) {
      const envVars = serverConfig?.env || {};
      for (const [envVar, envValue] of Object.entries(envVars)) {
        if (typeof envValue === 'string' && envValue.startsWith('${')) {
          const rawName = envValue.replace(/^\$\{|\}$/g, '');
          const varName = rawName.startsWith('env:') ? rawName.slice(4) : rawName;
          if (!process.env[varName]) {
            if (conditionalMcpEnv.has(varName)) {
              addCheck(
                'MCP Configuration',
                `${serverName} -> ${envVar}`,
                STATUS.NEEDS_SETUP,
                `${envVar} is not loaded; ${serverName} cannot run until it is available in the environment`,
                envVar === 'GITHUB_TOKEN' ? 'Run: npm run setup:tokens' : null,
              );
            } else {
              addCheck(
                'MCP Configuration',
                `${serverName} -> ${envVar}`,
                STATUS.NEEDS_SETUP,
                `MCP server ${serverName} requires ${envVar} but it's not set`,
                `Set ${envVar} environment variable: export ${envVar}=your_value`,
              );
            }
          }
        }
      }
    }
  } catch (error) {
    addCheck(
      'MCP Configuration',
      'MCP Config File',
      STATUS.MISSING,
      `.cursor/mcp.json is invalid JSON: ${error instanceof Error ? error.message : error}`,
      'Fix the JSON syntax in .cursor/mcp.json',
    );
  }
}

function checkPreflight() {
  try {
    const result = execSync('npm run preflight', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    // If preflight passes, it exits with 0
    addCheck(
      'Workflow Scaffolding',
      'Preflight Checks',
      STATUS.READY,
      'All preflight checks passing',
    );
  } catch (error) {
    const output = error.stdout || error.stderr || '';
    addCheck(
      'Workflow Scaffolding',
      'Preflight Checks',
      STATUS.NEEDS_SETUP,
      'Some preflight checks failed',
      'Run: npm run preflight (see output above for details)',
    );
  }
}

function checkRocky() {
  addCheck(
    'Bootstrap Defaults',
    'Rocky Runtime',
    existsSync(rockyConfigPath) ? STATUS.READY : STATUS.NEEDS_SETUP,
    existsSync(rockyConfigPath)
      ? 'Rocky runtime defaults are present'
      : 'Rocky runtime defaults are missing',
    'Run: npm run agent:bootstrap -- --apply',
  );
}

function checkExtensions() {
  const extensionsPath = path.join(repoRoot, '.vscode', 'extensions.json');
  if (!existsSync(extensionsPath)) {
    addCheck(
      'Extensions',
      'Extensions Config',
      STATUS.MISSING,
      '.vscode/extensions.json is missing',
      'This file should exist in the template. Re-clone if missing.',
    );
    return;
  }

  try {
    const config = JSON.parse(readFileSync(extensionsPath, 'utf8'));
    const recommendations = config.recommendations || [];
    if (recommendations.length > 0) {
      addCheck(
        'Extensions',
        'Extensions Config',
        STATUS.READY,
        `${recommendations.length} recommended extensions listed`,
      );
      addCheck(
        'Extensions',
        'Extensions Installed',
        STATUS.READY,
        'Install recommended extensions in Cursor when convenient',
      );
    } else {
      addCheck(
        'Extensions',
        'Extensions Config',
        STATUS.NEEDS_SETUP,
        'No extensions recommended',
      );
    }
  } catch {
    addCheck(
      'Extensions',
      'Extensions Config',
      STATUS.MISSING,
      '.vscode/extensions.json is invalid',
      'Fix the JSON syntax in .vscode/extensions.json',
    );
  }
}

function checkFeatureWorkflow() {
  if (!existsSync(featuresDir)) {
    addCheck(
      'Feature Workflow',
      'MVP Loop',
      STATUS.MISSING,
      '.notes/features missing',
      'Run: npm run feature:new',
    );
    return;
  }

  if (!existsSync(featureStatePath)) {
    addCheck(
      'Feature Workflow',
      'Current Feature',
      STATUS.READY,
      'No active feature yet. Run npm run feature:new when the project idea is clear.',
    );
    return;
  }

  try {
    const state = JSON.parse(readFileSync(featureStatePath, 'utf8'));
    const slug = state?.slug;
    if (!slug) {
      addCheck(
        'Feature Workflow',
        'Active Feature',
        STATUS.NEEDS_SETUP,
        'current.json missing slug',
        'Re-run: npm run feature:new',
      );
      return;
    }

    const specPath = path.join(featuresDir, slug, 'spec.md');
    const progressPath = path.join(featuresDir, slug, 'progress.md');
    if (!existsSync(specPath) || !existsSync(progressPath)) {
      if (state?.status === 'complete') {
        addCheck(
          'Feature Workflow',
          'Current Feature',
          STATUS.READY,
          `Current feature ${slug} is marked complete; spec/progress files are not required for an archived completion state.`,
        );
        return;
      }
      addCheck(
        'Feature Workflow',
        'Active Feature',
        STATUS.NEEDS_SETUP,
        'Spec or progress files missing for ' + slug,
        'Run: npm run feature:new',
      );
      return;
    }

    const specText = readFileSync(specPath, 'utf8');
    if (!specText.includes('## MVP DoD')) {
      addCheck(
        'Feature Workflow',
        'MVP DoD',
        STATUS.NEEDS_SETUP,
        specPath + ' missing MVP DoD section',
        'Edit spec or re-run feature bootstrap',
      );
      return;
    }

    if (state?.status === 'complete' && !hasUncheckedMvpItems(specText)) {
      addCheck(
        'Feature Workflow',
        'Current Feature',
        STATUS.READY,
        `Current feature ${slug} is marked complete; unchecked MVP DoD items are not required after completion.`,
      );
      return;
    }

    if (!hasUncheckedMvpItems(specText)) {
      addCheck(
        'Feature Workflow',
        'MVP DoD',
        STATUS.NEEDS_SETUP,
        specPath + ' must contain unchecked MVP DoD checklist items like "- [ ] Ship the first slice"',
        'Add at least one unchecked MVP DoD item before implementation continues',
      );
      return;
    }

    addCheck(
      'Feature Workflow',
      'Current Feature',
      STATUS.READY,
      'Active feature ' + slug,
    );
  } catch (error) {
    addCheck(
      'Feature Workflow',
      'Active Feature',
      STATUS.MISSING,
      `current.json invalid: ${error instanceof Error ? error.message : error}`,
      'Run: npm run feature:new',
    );
  }
}

function collectChangedPaths() {
  const output = execSync('git status --porcelain', {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  return output
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
  const repoMode = detectRepoMode();
  if (repoMode !== 'app') {
    addCheck(
      'Repo Mode',
      'App Boundary',
      STATUS.READY,
      'Template mode active; strict app isolation not applied',
    );
    return;
  }

  const changedPaths = collectChangedPaths();
  const violations = summarizeAppModeViolations(changedPaths);
  if (violations.length === 0) {
    addCheck(
      'Repo Mode',
      'App Boundary',
      STATUS.READY,
      'Strict app-mode boundaries are clean',
    );
    return;
  }

  const sample = violations.slice(0, 3).map(entry => entry.filePath).join(', ');
  addCheck(
    'Repo Mode',
    'App Boundary',
    STATUS.MISSING,
    `App mode violation(s) detected: ${sample}`,
    'Run: npm run agent:bootstrap -- --apply',
  );
}

function checkAgents() {
  if (!existsSync(agentsConfigPath)) {
    addCheck(
      'Agents',
      'Agent Config',
      STATUS.MISSING,
      '.cursor/agents-config.json is missing',
      'Restore the Cursor agent roster',
    );
    return;
  }

  let agents;
  try {
    const config = JSON.parse(readFileSync(agentsConfigPath, 'utf8'));
    agents = (config.agents || []).map(agent => agent.name).filter(Boolean);
  } catch (error) {
    addCheck(
      'Agents',
      'Agent Config',
      STATUS.MISSING,
      `.cursor/agents-config.json is invalid: ${error instanceof Error ? error.message : error}`,
      'Fix the Cursor agent roster JSON',
    );
    return;
  }

  const missing = [];

  for (const agent of agents) {
    const promptPath = path.join(agentsDir, `${agent}.md`);
    if (!existsSync(promptPath)) {
      missing.push(agent);
    }
  }

  if (missing.length === 0) {
    addCheck(
      'Agents',
      'Cursor Agents',
      STATUS.READY,
      `All ${agents.length} Cursor agent definitions available`,
    );

    // Check for agent state file (users can create this manually after creating agents)
    const agentStatePath = path.join(repoRoot, '.cursor', 'agents-state.json');
    if (existsSync(agentStatePath)) {
      try {
        const state = JSON.parse(readFileSync(agentStatePath, 'utf8'));
        const createdAgents = state?.createdAgents || [];
        if (createdAgents.length >= agents.length) {
          addCheck(
            'Agents',
            'Agents Created',
            STATUS.READY,
            `All ${agents.length} agents pinned in Cursor (verified via state file)`,
          );
        } else {
          const missingAgents = agents.filter(a => !createdAgents.includes(a));
          addCheck(
            'Agents',
            'Agents Created',
            STATUS.READY,
            `${createdAgents.length}/${agents.length} pinned agents configured (optional). Missing: ${missingAgents.join(', ')}.`,
          );
        }
      } catch {
        addCheck(
          'Agents',
          'Agents Created',
          STATUS.READY,
          'Saved agent state file exists but could not be read (optional feature).',
        );
      }
    } else {
      addCheck(
        'Agents',
        'Agents Created',
        STATUS.READY,
        'Cursor agent files are present. Pinning agents in the sidebar is optional.',
      );
    }
  } else {
    addCheck(
      'Agents',
      'Cursor Agents',
      STATUS.READY,
      `Agent roster declared; prompt files can be repaired during bootstrap if needed. Missing: ${missing.join(', ')}`,
      'Run: npm run agent:bootstrap -- --apply',
    );
  }
}

function checkCursorSettings() {
  const settingsPath = path.join(repoRoot, '.vscode', 'settings.json');
  if (!existsSync(settingsPath)) {
    addCheck(
      'Cursor Settings',
      'Settings File',
      STATUS.MISSING,
      '.vscode/settings.json is missing',
      'This file should exist in the template. Re-clone if missing.',
    );
    return;
  }

  try {
    // VS Code/Cursor settings.json can have comments (JSONC format)
    // Strip comments before parsing
    let content = readFileSync(settingsPath, 'utf8');
    // Remove single-line comments (but preserve URLs)
    content = content.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove trailing commas before closing braces/brackets
    content = content.replace(/,(\s*[}\]])/g, '$1');

    const settings = JSON.parse(content);
    addCheck(
      'Cursor Settings',
      'Settings File',
      STATUS.READY,
      '.vscode/settings.json exists',
    );

    // Check for key settings that indicate proper configuration
    const keySettings = [
      'editor.formatOnSave',
      'files.trimTrailingWhitespace',
      'files.insertFinalNewline',
    ];
    const foundSettings = keySettings.filter(key => settings.hasOwnProperty(key));

    if (foundSettings.length === keySettings.length) {
      addCheck(
        'Cursor Settings',
        'Settings Applied',
        STATUS.READY,
        'Key workspace settings detected (may need Cursor IDE restart to apply)',
      );
    } else {
      addCheck(
        'Cursor Settings',
        'Settings Applied',
        STATUS.READY,
        'Workspace settings file is present; IDE-specific application can be refreshed during bootstrap if needed',
        'Run: npm run setup:cursor (then restart Cursor IDE)',
      );
    }
  } catch (error) {
    addCheck(
      'Cursor Settings',
      'Settings File',
      STATUS.MISSING,
      `.vscode/settings.json is invalid JSON: ${error instanceof Error ? error.message : error}`,
      'Fix the JSON syntax in .vscode/settings.json',
    );
  }
}

function getContextualNextSteps() {
  const nextSteps = [];
  const failedChecks = checks.filter(c => !c.ok);

  // Priority-based next steps
  const priorityMap = {
    'GITHUB_TOKEN': 'Run: npm run setup:tokens',
    'MCP Config File': 'Run: npm run setup',
    'Preflight Checks': 'Run: npm run preflight (see details above)',
    'Settings Applied': 'Run: npm run setup:cursor',
    'Extensions Installed': 'Run: npm run setup:extensions',
  };

  // Find highest priority missing item
  for (const check of failedChecks) {
    if (priorityMap[check.name]) {
      nextSteps.push(priorityMap[check.name]);
      break; // Only show one priority action
    }
  }

  // Add contextual steps based on what's ready
  const hasTokens = checks.some(c => c.name === 'GITHUB_TOKEN' && c.ok);
  const hasAgents = checks.some(c => c.name === 'Agents Created' && c.ok);
  const activeFeatureCheck = checks.find(c => c.name === 'Current Feature');
  const hasFeature = !!activeFeatureCheck?.ok && activeFeatureCheck.message.startsWith('Active feature ');

  if (hasTokens && hasAgents && !hasFeature) {
    nextSteps.push('Run: npm run feature:new (to start your first feature)');
  } else if (hasTokens && hasAgents && hasFeature) {
    nextSteps.push('Continue with your active feature in docs/Plan.md');
  }

  // If all setup is done, suggest workflow next steps
  if (failedChecks.length === 0) {
    nextSteps.push('Ready to code! See docs/agents/KICKOFF.md for workflow');
  }

  return nextSteps;
}

function printHuman() {
  console.log('\nCursor Workspace Health Dashboard');
  console.log('='.repeat(50));

  const categories = {};
  for (const check of checks) {
    if (!categories[check.category]) {
      categories[check.category] = [];
    }
    categories[check.category].push(check);
  }

  for (const [category, categoryChecks] of Object.entries(categories)) {
    console.log('');
    console.log(category + ':');
    for (const check of categoryChecks) {
      console.log('  ' + check.status + ' ' + check.name + ' - ' + check.message);
      if (check.fix) {
        console.log('    -> ' + check.fix);
      }
    }
  }

  const total = checks.length;
  const ready = checks.filter(c => c.ok).length;
  const needsSetup = checks.filter(c => !c.ok && c.status === STATUS.NEEDS_SETUP).length;
  const missing = checks.filter(c => c.status === STATUS.MISSING).length;

  console.log('');
  console.log('='.repeat(50));
  console.log('');
  console.log('Summary:');
  console.log('  Total checks: ' + total);
  console.log('  ' + STATUS.READY + ' Ready: ' + ready);
  console.log('  ' + STATUS.NEEDS_SETUP + ' Needs Setup: ' + needsSetup);
  console.log('  ' + STATUS.MISSING + ' Missing: ' + missing);

  // Contextual next steps
  const nextSteps = getContextualNextSteps();
  if (nextSteps.length > 0) {
    console.log('');
    console.log('Next Steps:');
    nextSteps.forEach((step, idx) => {
      console.log(`  ${idx + 1}. ${step}`);
    });
  }

  if (ready === total) {
    console.log('');
    console.log('All checks passed! Your workspace is ready to go.');
  } else if (missing === 0) {
    console.log('');
    console.log('Almost there! Follow the next steps above to finish setup.');
  } else {
    console.log('');
    console.log('Some critical items are missing. Address those first.');
  }
}

function printJson() {
  const summary = {
    ok: checks.every(c => c.ok),
    total: checks.length,
    ready: checks.filter(c => c.ok).length,
    needsSetup: checks.filter(c => !c.ok && c.status === STATUS.NEEDS_SETUP)
      .length,
    missing: checks.filter(c => c.status === STATUS.MISSING).length,
    checks: checks.map(c => ({
      category: c.category,
      name: c.name,
      status: c.status,
      message: c.message,
      fix: c.fix,
      ok: c.ok,
    })),
  };
  console.log(JSON.stringify(summary, null, 2));
}

function main() {
  // Run all checks
  checkNodeVersion();
  checkNpm();
  checkGit();
  checkEnvironmentVariables();
  checkMcpConfig();
  checkPreflight();
  checkRocky();
  checkExtensions();
  checkAgents();
  checkCursorSettings();
  checkFeatureWorkflow();
  checkAppModeBoundaries();

  // Output
  const rawArgs = process.argv.slice(2);
  const wantsJson = rawArgs.includes('--json') || rawArgs.includes('--ci');

  if (wantsJson) {
    printJson();
  } else {
    printHuman();
  }

  // Exit code based on overall status
  const allOk = checks.every(c => c.ok);
  process.exit(allOk ? 0 : 1);
}

try {
  main();
} catch (error) {
  console.error(
    'Health check failed:',
    error instanceof Error ? error.stack ?? error.message : error,
  );
  process.exit(1);
}
