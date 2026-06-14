#!/usr/bin/env node

/**
 * Generates a lightweight Cursor agent setup guide from `.cursor/agents`.
 *
 * Usage:
 *   npm run setup:agents
 *   npm run setup:agents -- --sync-state
 *   npm run setup:agents -- --no-state
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const configPath = path.join(repoRoot, '.cursor', 'agents-config.json');
const agentsDir = path.join(repoRoot, '.cursor', 'agents');
const outputPath = path.join(repoRoot, 'docs', 'agents', 'CREATE_AGENTS.md');
const statePath = path.join(repoRoot, '.cursor', 'agents-state.json');

const args = process.argv.slice(2);
const skipStateSync = args.includes('--no-state');
const refreshState = args.includes('--sync-state');

function loadConfig() {
  if (!existsSync(configPath)) {
    throw new Error(`Agent config not found: ${configPath}`);
  }
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

function loadPrompt(agentName) {
  const promptPath = path.join(agentsDir, `${agentName}.md`);
  if (!existsSync(promptPath)) {
    throw new Error(`Agent definition not found for ${agentName}: ${promptPath}`);
  }
  return readFileSync(promptPath, 'utf8').trim();
}

function formatModelHint(agent) {
  return agent.modelHint === 'reasoning' ? 'reasoning-focused' : 'code-generation-focused';
}

function formatMcpTools(agent) {
  if (!agent.mcpTools || agent.mcpTools.length === 0) {
    return 'None';
  }
  return agent.mcpTools.map(tool => `\`${tool}\``).join(', ');
}

function generateGuide() {
  const config = loadConfig();
  const agents = [...config.agents].sort((a, b) => a.sequentialOrder - b.sequentialOrder);

  let guide = `# Creating Cursor Agents

This guide is generated from \`.cursor/agents/*.md\`. Cursor is the primary workhorse, but the shared operating model lives in \`.ai/shared/\`.

## Before You Start

- Run \`npm run setup\` or \`npm install\`.
- Open Cursor's Agents panel and create only the agents you actually want pinned.
- Auto-routing through rules and skills still works without pinned agents.
- Keep the roster lean. One lead persona per task is enough.

## Roster Setup
`;

  for (const agent of agents) {
    const prompt = loadPrompt(agent.name);

    guide += `
### ${agent.displayName} (\`${agent.name}\`)

- Role: ${agent.description}
- Path scope: \`${agent.pathScope}\`
- Model hint: ${formatModelHint(agent)}
- Recommended MCP: ${formatMcpTools(agent)}

Paste this definition into the agent instructions if Cursor does not load \`.cursor/agents/${agent.name}.md\` directly:

\`\`\`markdown
${prompt}
\`\`\`
`;
  }

  guide += `
## After Creation

- Update \`.cursor/agents-state.json\` or rerun \`npm run setup:agents -- --sync-state\`.
- Run \`npm run status\`.

Generated from \`.cursor/agents-config.json\` and \`.cursor/agents/*.md\`.
`;

  return { guide: guide.trim() + '\n', agents };
}

function ensureAgentState(agents) {
  if (skipStateSync) {
    return;
  }

  const agentNames = agents.map(agent => agent.name);
  const stateDir = path.dirname(statePath);
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }

  if (!existsSync(statePath)) {
    const template = {
      expectedAgents: agentNames,
      createdAgents: [],
      verifiedAt: null,
    };
    writeFileSync(statePath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
    console.log('Seeded agent state template at .cursor/agents-state.json');
    return;
  }

  if (!refreshState) {
    return;
  }

  try {
    const current = JSON.parse(readFileSync(statePath, 'utf8'));
    const existingCreated = Array.isArray(current.createdAgents) ? current.createdAgents : [];
    const nextState = {
      ...current,
      expectedAgents: agentNames,
      createdAgents: existingCreated.filter(name => agentNames.includes(name)),
    };
    writeFileSync(statePath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
    console.log('Synced agent roster in .cursor/agents-state.json');
  } catch (error) {
    console.warn('[warn] Failed to sync .cursor/agents-state.json:', error instanceof Error ? error.message : error);
  }
}

function main() {
  console.log('Generating Cursor agent guide...\n');

  try {
    const { guide, agents } = generateGuide();
    const outputDir = path.dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(outputPath, guide, 'utf8');
    console.log(`Generated: ${path.relative(repoRoot, outputPath)}`);

    ensureAgentState(agents);
    console.log('\nNext steps:');
    console.log('  1. Review docs/agents/CREATE_AGENTS.md.');
    console.log('  2. Pin only the agents you want in Cursor.');
    console.log('  3. Run npm run status.');
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
