#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const rockyDir = join(repoRoot, '.rocky');

const DEFAULT_CONFIG = {
  version: 1,
  style: { enabled: true, verbosity: 'compact', rockyFlavor: 'medium' },
  context: { enabled: true, maxContextLines: 120 },
  pet: { enabled: true, alwaysOnTop: true, startMinimized: false, speechBubble: true },
  voice: { enabled: false, provider: 'silent', voiceId: '', speed: 1.0, pitch: 1.0 },
};

const DEFAULT_STATE = {
  version: 1,
  name: 'Rocky Pet',
  mood: 'idle',
  currentObjective: '',
  lastDecision: '',
  nextAction: '',
  lastUpdated: '',
};

const CONTEXT_TEMPLATE = `# Rocky Context

## Objective
(not set)

## Current State
(not set)

## Decisions
(none yet)

## Active Files
(none)

## Commands Run
(none)

## Bugs / Risks
(none)

## Next Action
(not set)
`;

function initFile(filePath, content) {
  if (existsSync(filePath)) {
    return false;
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(
    filePath,
    typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`,
    'utf8',
  );
  return true;
}

export function runRockySetup({ verbose = true } = {}) {
  mkdirSync(rockyDir, { recursive: true });

  const scaffoldFiles = [
    [join(rockyDir, 'config.json'), DEFAULT_CONFIG],
    [join(rockyDir, 'state.json'), DEFAULT_STATE],
    [join(rockyDir, 'events.jsonl'), ''],
    [join(rockyDir, 'context.md'), CONTEXT_TEMPLATE],
  ];

  const results = scaffoldFiles.map(([filePath, content]) => ({
    action: initFile(filePath, content) ? 'created' : 'exists',
    label: filePath.replace(repoRoot, '.'),
  }));

  if (verbose) {
    console.log('Rocky runtime:');
    for (const result of results) {
      console.log(`  - ${result.action} ${result.label}`);
    }
  }

  return results;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  runRockySetup({ verbose: true });
}
