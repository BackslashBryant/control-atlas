#!/usr/bin/env node

/**
 * Optional personal bootstrap.
 *
 * Stores local preferences outside the repo. This is never run automatically by
 * postinstall because setup should not create hidden junk by surprise.
 */

import readline from 'node:readline';
import os from 'node:os';
import path from 'node:path';
import { loadPersonalConfig, savePersonalConfig } from './lib/personal-config.mjs';

function question(rl, prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  const existing = loadPersonalConfig();
  if (existing) {
    console.log('Personal config already exists:', path.basename(os.homedir()) + '/.cursor-personal/config.json');
    return;
  }

  console.log('');
  console.log('Cursor Personal Bootstrap');
  console.log('Stores local non-secret preferences in ~/.cursor-personal/. Nothing is committed.');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const autoSetupAnswer = (await question(rl, 'Auto-run setup after npm install? (y/N): ')).trim().toLowerCase();

  const config = {
    preferredPreset: null,
    autoSetupOnInstall: autoSetupAnswer === 'y',
    autoOpenDocs: false,
    machine: {
      host: os.hostname(),
      platform: process.platform,
      user: os.userInfo().username,
    },
    createdAt: new Date().toISOString(),
  };

  savePersonalConfig(config);
  console.log('Personal defaults saved to ~/.cursor-personal/config.json');
  console.log('GitHub tokens should live in the inherited user-level GITHUB_TOKEN environment variable instead.');

  rl.close();
}

try {
  await main();
} catch (error) {
  console.error('Personal bootstrap failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
