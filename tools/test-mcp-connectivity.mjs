#!/usr/bin/env node
/**
 * Parses `.cursor/mcp.json` and verifies required environment variables exist locally.
 * This does not call the remote services; it guards against obvious misconfiguration.
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const mcpPath = path.join(repoRoot, '.cursor', 'mcp.json');

if (!existsSync(mcpPath)) {
  console.warn('No .cursor/mcp.json found. Skipping MCP connectivity check.');
  process.exit(0);
}

const raw = readFileSync(mcpPath, 'utf8');
let config;
try {
  config = JSON.parse(raw);
} catch (error) {
  console.error('Invalid JSON in .cursor/mcp.json:', error.message);
  process.exit(1);
}

const placeholderRegex = /\$\{([^}]+)\}/g;
const missingVars = new Set();
const referencedVars = new Set();

for (const server of Object.values(config.mcpServers || {})) {
  if (!server || typeof server !== 'object' || !server.env) {
    continue;
  }
  for (const value of Object.values(server.env)) {
    if (typeof value !== 'string') {
      continue;
    }
    let match;
    while ((match = placeholderRegex.exec(value)) !== null) {
      const rawName = match[1];
      if (rawName === 'workspaceFolder') {
        continue;
      }
      const name = rawName.includes(':') ? rawName.split(':').pop() : rawName;
      referencedVars.add(name);
      if (!process.env[name] || process.env[name] === '') {
        missingVars.add(name);
      }
    }
  }
}

if (referencedVars.size === 0) {
  console.log('No environment placeholders detected in .cursor/mcp.json.');
  process.exit(0);
}

if (missingVars.size === 0) {
  console.log('MCP connectivity check: all referenced env vars are set locally.');
  process.exit(0);
}

console.log('MCP connectivity check: missing environment variables detected:');
for (const name of missingVars) {
  console.log(`- ${name}`);
}

const strict = process.argv.includes('--strict') || process.env.MCP_TEST_STRICT === '1';
if (strict) {
  process.exit(1);
}
