#!/usr/bin/env node

/**
 * brains-refresh
 *
 * Convenience script that keeps Cursor's generated docs and state in sync
 * whenever the stack evolves. It runs detection, syncs the agent state
 * template, and regenerates the Cursor settings guide in one shot.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const checkMode = args.includes('--check');
const nodeCmd = process.execPath;

function runStep(label, command, args) {
  console.log(`[brains] ${label}...`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Step "${label}" failed (exit code ${result.status}).`);
  }
}

function main() {
  runStep('Detecting stack and MCP needs', nodeCmd, ['tools/detection.mjs']);
  const agentArgs = ['tools/agent-helper.mjs', '--sync-state'].concat(checkMode ? ['--no-state'] : []);
  runStep('Syncing agent state template', nodeCmd, agentArgs);
  runStep('Regenerating Cursor settings guide', nodeCmd, ['tools/cursor-settings-gen.mjs']);

  if (checkMode) {
    const diff = spawnSync('git', ['diff', '--quiet'], {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
    });

    if (diff.status !== 0) {
      throw new Error('Generated files are out of date. Run `npm run brains:refresh` locally.');
    }

    console.log('[brains] Check passed (no changes required).');
    return;
  }

  console.log('[brains] Refresh complete.');
}

try {
  main();
} catch (error) {
  console.error(
    '[brains] Refresh failed:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
