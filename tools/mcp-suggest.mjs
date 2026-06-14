#!/usr/bin/env node

/**
 * mcp-suggest
 *
 * Analyses the repository to recommend MCP servers based on dependencies,
 * config files, and directory structure. Non-blocking helper that prints
 * suggestions in human or JSON format so Cursor users can keep `.cursor/mcp.json`
 * aligned with the active stack.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const wantsJson = args.includes('--json') || args.includes('--ci');
const summaryMode = args.includes('--summary');

function safeReadJson(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function hasDependency(pkg, matcher) {
  if (!pkg) return false;
  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };
  return Object.keys(deps).some(dep => matcher(dep));
}

function hasFile(...segments) {
  return existsSync(path.join(repoRoot, ...segments));
}

function hasAnyFile(candidates) {
  return candidates.some(candidate => Array.isArray(candidate) ? hasFile(...candidate) : hasFile(candidate));
}

function listDir(dir) {
  const abs = path.join(repoRoot, dir);
  if (!existsSync(abs)) return [];
  try {
    return readdirSync(abs);
  } catch {
    return [];
  }
}

const packageJson = safeReadJson(path.join(repoRoot, 'package.json'));
const mcpConfigPath = path.join(repoRoot, '.cursor', 'mcp.json');

const directoryIndex = {
  context7: 'https://context7.com/docs/clients/cursor',
  supabase: 'https://cursor.directory/mcp/supabase',
  'playwright-mcp': 'https://github.com/microsoft/playwright-mcp',
  'spec-workflow-mcp': 'https://github.com/Pimzino/spec-workflow-mcp',
  stripe: 'https://cursor.directory/mcp/stripe',
};

const heuristics = [
  {
    id: 'context7',
    label: 'Context7 MCP',
    detectors: [
      () => 'Core docs lookup server for current library and framework references',
    ],
    requires: [],
    config: {
      command: 'npx',
      args: ['-y', '@upstash/context7-mcp@latest'],
    },
  },
  {
    id: 'supabase',
    label: 'Supabase MCP',
    detectors: [
      ctx => hasDependency(ctx.packageJson, dep => dep.includes('supabase')) && 'Detected Supabase dependency in package.json',
      () => hasAnyFile(['supabase', 'config/supabase']) && 'Detected Supabase project directory',
      () => hasFile('supabase', 'config.toml') && 'Found supabase/config.toml',
    ],
    requires: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
    config: {
      command: 'npx',
      args: ['-y', '@smithery/cli@latest', 'run', 'supabase'],
      env: {
        SUPABASE_URL: '${SUPABASE_URL}',
        SUPABASE_ANON_KEY: '${SUPABASE_ANON_KEY}',
      },
    },
  },
  {
    id: 'playwright-mcp',
    label: 'Playwright MCP',
    detectors: [
      ctx => hasDependency(ctx.packageJson, dep => dep.includes('playwright')) && 'Detected Playwright dependency in package.json',
      () => hasAnyFile(['playwright.config.ts', 'playwright.config.js', 'playwright.config.mjs']) && 'Found playwright.config.* file',
      () => listDir('tests').some(name => name.toLowerCase().includes('playwright')) && 'Playwright tests detected in /tests directory',
    ],
    requires: [],
    config: {
      command: 'npx',
      args: ['-y', '@playwright/mcp@latest'],
    },
  },
  {
    id: 'spec-workflow-mcp',
    label: 'Spec Workflow MCP',
    detectors: [
      ctx => hasDependency(ctx.packageJson, dep => dep.includes('spec-workflow-mcp')) && 'Detected spec-workflow-mcp dependency in package.json',
      () => hasFile('.spec-workflow') && 'Detected .spec-workflow state directory',
    ],
    requires: [],
    config: {
      command: 'npx',
      args: ['-y', 'spec-workflow-mcp@latest'],
    },
  },
  {
    id: 'stripe',
    label: 'Stripe MCP',
    detectors: [
      ctx => hasDependency(ctx.packageJson, dep => dep.startsWith('stripe')) && 'Detected Stripe dependency in package.json',
      () => hasFile('stripe.yaml') && 'Found stripe.yaml configuration',
    ],
    requires: ['STRIPE_API_KEY'],
    config: {
      command: 'npx',
      args: ['-y', '@smithery/cli@latest', 'run', 'stripe'],
      env: {
        STRIPE_API_KEY: '${STRIPE_API_KEY}',
      },
    },
  },
];

const heuristicMap = new Map(heuristics.map(h => [h.id, h]));

function loadMcpConfig() {
  return safeReadJson(mcpConfigPath) || {};
}

function loadConfiguredServers() {
  const config = loadMcpConfig();
  return new Set(Object.keys(config.mcpServers || {}));
}

function encodeConfig(config) {
  const json = JSON.stringify(config);
  return Buffer.from(json).toString('base64');
}

function evaluateHeuristic(heuristic, configuredServers) {
  const context = { packageJson };
  let trigger = null;
  for (const detector of heuristic.detectors) {
    try {
      const outcome = detector(context);
      if (outcome) {
        trigger = outcome;
        break;
      }
    } catch {
      // ignore detector errors – treat as no trigger
    }
  }

  const present = configuredServers.has(heuristic.id);

  if (trigger && !present) {
    return { action: 'add', trigger };
  }

  if (trigger && present) {
    return { action: 'keep', trigger };
  }

  if (!trigger && present) {
    return { action: 'review', trigger: 'Configured but no project signals detected' };
  }

  return { action: 'ignore', trigger: null };
}

function buildReport() {
  const configuredServers = loadConfiguredServers();
  const entries = heuristics.map(heuristic => {
    const evaluation = evaluateHeuristic(heuristic, configuredServers);
    const installLink = heuristic.config
      ? `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(heuristic.id)}&config=${encodeURIComponent(encodeConfig(heuristic.config))}`
      : null;
    return {
      id: heuristic.id,
      label: heuristic.label,
      action: evaluation.action,
      reason: evaluation.trigger,
      documentation: directoryIndex[heuristic.id] || 'https://cursor.com/docs/context/mcp/directory',
      requiredEnv: heuristic.requires,
      installLink,
    };
  });

  return entries.filter(entry => entry.action !== 'ignore');
}

function printHuman(report) {
  console.log('MCP Suggestion Report');
  console.log('=====================');

  const add = report.filter(entry => entry.action === 'add');
  const keep = report.filter(entry => entry.action === 'keep');
  const review = report.filter(entry => entry.action === 'review');

  if (add.length === 0 && keep.length === 0 && review.length === 0) {
    console.log('No MCP suggestions at this time.');
    return;
  }

  if (add.length > 0) {
    console.log('\nAdd the following MCP servers:');
    add.forEach(entry => {
      console.log(`- ${entry.label} (${entry.id}) → ${entry.reason}`);
      console.log(`  Directory: ${entry.documentation}`);
      console.log(`  Required env: ${entry.requiredEnv.join(', ')}`);
      if (entry.installLink) {
        console.log(`  Install link: ${entry.installLink}`);
      }
      console.log(`  CLI: npm run mcp:suggest -- --install ${entry.id}`);
    });
  }

  if (keep.length > 0 && !summaryMode) {
    console.log('\nAlready configured (keep):');
    keep.forEach(entry => {
      console.log(`- ${entry.label} → ${entry.reason}`);
    });
  }

  if (review.length > 0) {
    console.log('\nReview configured MCPs:');
    review.forEach(entry => {
      console.log(`- ${entry.label} (${entry.id}) → ${entry.reason}`);
      console.log(`  Directory: ${entry.documentation}`);
    });
  }
}

function printSummary(report) {
  const add = report.filter(entry => entry.action === 'add');
  if (add.length === 0) {
    console.log('No new MCP suggestions.');
    return;
  }
  console.log('MCP suggestions detected:');
  add.forEach(entry => {
    console.log(`- ${entry.label} (${entry.id}) → ${entry.reason}`);
    console.log(`  CLI: npm run mcp:suggest -- --install ${entry.id}`);
  });
}

function parseInstallTargets(rawArgs) {
  const targets = new Set();
  for (const arg of rawArgs) {
    if (arg.startsWith('--install=')) {
      const value = arg.slice('--install='.length);
      value.split(',').filter(Boolean).forEach(v => targets.add(v));
    }
  }
  const index = rawArgs.indexOf('--install');
  if (index !== -1) {
    const value = rawArgs[index + 1];
    if (!value) {
      console.error('Error: --install flag requires a comma-separated list or "all".');
      process.exit(1);
    }
    value.split(',').filter(Boolean).forEach(v => targets.add(v));
  }
  return Array.from(targets);
}

function applyInstall(targetIds) {
  if (targetIds.length === 0) {
    return false;
  }

  const config = loadMcpConfig();
  const currentServers = { ...(config.mcpServers || {}) };
  let changed = false;

  const addIds = targetIds.includes('all')
    ? heuristics.map(h => h.id)
    : targetIds;

  for (const id of addIds) {
    const heuristic = heuristicMap.get(id);
    if (!heuristic) {
      console.error(`Warning: Unknown MCP id "${id}". Skipping.`);
      continue;
    }
    if (!heuristic.config) {
      console.error(`Warning: No install config available for "${id}". Skipping.`);
      continue;
    }
    const existing = currentServers[id];
    const desired = heuristic.config;
    if (!existing || JSON.stringify(existing) !== JSON.stringify(desired)) {
      currentServers[id] = desired;
      changed = true;
      console.log(`Added/updated MCP server "${id}" in .cursor/mcp.json.`);
    } else {
      console.log(`MCP server "${id}" already matches desired configuration.`);
    }
  }

  if (changed) {
    const nextConfig = {
      ...config,
      mcpServers: currentServers,
    };
    writeFileSync(mcpConfigPath, `${JSON.stringify(nextConfig, null, 2)}\n`, 'utf8');
  }

  return changed;
}

function main() {
  const installTargets = parseInstallTargets(args);
  const report = buildReport();

  if (installTargets.length > 0) {
    const changed = applyInstall(installTargets);
    if (changed) {
      console.log('Recalculating MCP suggestions after installation...');
    }
    const refreshedReport = changed ? buildReport() : report;
    if (wantsJson) {
      console.log(JSON.stringify({ suggestions: refreshedReport }, null, 2));
      return;
    }
    if (summaryMode) {
      printSummary(refreshedReport);
      return;
    }
    printHuman(refreshedReport);
    return;
  }

  if (wantsJson) {
    console.log(JSON.stringify({ suggestions: report }, null, 2));
    return;
  }

  if (summaryMode) {
    printSummary(report);
    return;
  }

  printHuman(report);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
}
