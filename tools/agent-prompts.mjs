#!/usr/bin/env node

/**
 * Prints Cursor agent definitions for quick inspection or manual setup.
 *
 * Usage:
 *   npm run agents:prompt -- list
 *   npm run agents:prompt -- vector pixel
 *   npm run agents:prompt -- all
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const agentsDir = path.join(repoRoot, '.cursor', 'agents');

function availableAgents() {
  if (!existsSync(agentsDir)) {
    return [];
  }
  return readdirSync(agentsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => file.replace(/\.md$/, ''))
    .sort();
}

function listAgents(agents) {
  console.log('Available agents:');
  for (const agent of agents) {
    console.log(`- ${agent}`);
  }
}

function printPrompt(agent) {
  const filePath = path.join(agentsDir, `${agent}.md`);
  if (!existsSync(filePath)) {
    console.error(`Agent not found: ${agent}`);
    process.exitCode = 1;
    return;
  }

  const heading = `===== ${agent.toUpperCase()} =====`;
  console.log(heading);
  console.log(readFileSync(filePath, 'utf8').trim());
  console.log(''.padEnd(heading.length, '='));
  console.log();
}

function main() {
  const agents = availableAgents();
  if (agents.length === 0) {
    console.error('.cursor/agents directory is missing or empty.');
    process.exit(1);
  }

  const args = process.argv.slice(2).map(arg => arg.toLowerCase());
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: npm run agents:prompt -- <agent...>|all|list');
    console.log('Example: npm run agents:prompt -- vector pixel');
    return;
  }

  if (args.includes('list')) {
    listAgents(agents);
    if (args.length === 1) {
      return;
    }
  }

  const targets = args.includes('all') ? agents : args.filter(arg => arg !== 'list');
  for (const agent of targets) {
    if (!agents.includes(agent)) {
      console.error(`Unknown agent "${agent}". Run with "list" to see options.`);
      process.exitCode = 1;
      continue;
    }
    printPrompt(agent);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
}
