#!/usr/bin/env node
/**
 * Validates `.cursor/mcp.json`, highlights malformed entries, and optionally reorders keys.
 * Usage:
 *   npm run mcp:heal           # report issues only
 *   npm run mcp:heal -- --write   # rewrite file with sorted keys
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const mcpPath = path.join(repoRoot, '.cursor', 'mcp.json');

if (!existsSync(mcpPath)) {
  console.warn('No .cursor/mcp.json found. Nothing to heal.');
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

const servers = config.mcpServers;
if (!servers || typeof servers !== 'object') {
  console.error('Missing `mcpServers` object in .cursor/mcp.json.');
  process.exit(1);
}

const findings = [];

for (const [name, definition] of Object.entries(servers)) {
  if (!definition || typeof definition !== 'object') {
    findings.push(`Server "${name}" is not an object.`);
    continue;
  }

  const hasCommand = typeof definition.command === 'string';
  const hasArgs = Array.isArray(definition.args);
  const hasUrl = typeof definition.url === 'string';

  if (!hasCommand && !hasUrl) {
    findings.push(`Server "${name}" must define either command+args or url.`);
  }
  if (hasCommand && !hasArgs) {
    findings.push(`Server "${name}" missing args array for command "${definition.command}".`);
  }

  if (definition.env) {
    for (const [envName, envValue] of Object.entries(definition.env)) {
      if (typeof envValue !== 'string') {
        findings.push(`Server "${name}" env "${envName}" must be a string placeholder.`);
        continue;
      }
      if (!envValue.includes('${')) {
        findings.push(
          `Server "${name}" env "${envName}" should reference a placeholder (e.g., \${env:GITHUB_TOKEN} or \${GITHUB_TOKEN}) instead of hard-coding secrets.`,
        );
      }
    }
  }
}

if (findings.length === 0) {
  console.log('mcp-self-heal: no structural issues detected.');
} else {
  for (const finding of findings) {
    console.log(`WARN: ${finding}`);
  }
}

const wantsWrite = process.argv.includes('--write');
if (wantsWrite) {
  const ordered = Object.keys(servers)
    .sort()
    .reduce((acc, key) => {
      acc[key] = servers[key];
      return acc;
    }, {});
  const next = { ...config, mcpServers: ordered };
  writeFileSync(mcpPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log('mcp-self-heal: rewrote .cursor/mcp.json with sorted keys.');
}

if (findings.length > 0 && !wantsWrite) {
  process.exitCode = 1;
}
