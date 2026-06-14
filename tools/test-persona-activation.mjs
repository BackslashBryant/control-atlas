#!/usr/bin/env node

/**
 * Smoke test for lean persona auto-routing globs.
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const rulesDir = path.join(repoRoot, '.cursor', 'rules');

const testCases = [
  ['docs/Plan.md', 'vector'],
  ['.notes/features/demo/spec.md', 'vector'],
  ['README.md', 'vector'],
  ['src/api/users.ts', 'forge'],
  ['apps/web/app/page.tsx', 'forge'],
  ['packages/core/src/index.ts', 'forge'],
  ['tests/unit/button.test.ts', 'pixel'],
  ['playwright.config.ts', 'pixel'],
  ['components/Button.tsx', 'muse'],
  ['styles/main.css', 'muse'],
  ['public/logo.svg', 'muse'],
  ['docs/research/frameworks.md', 'scout'],
  ['docs/security/auth.md', 'sentinel'],
  ['package.json', 'sentinel'],
  ['.github/workflows/ci.yml', 'nexus'],
  ['tools/setup.mjs', 'nexus'],
  ['Dockerfile', 'nexus'],
];

function loadPersonaRules() {
  const personaFiles = readdirSync(rulesDir)
    .filter(file => file.startsWith('persona-') && file.endsWith('.mdc'));

  const rules = {};
  for (const file of personaFiles) {
    const filePath = path.join(rulesDir, file);
    const content = readFileSync(filePath, 'utf8');
    const personaName = file.replace('persona-', '').replace('.mdc', '');
    const frontmatterMatch = content.match(/^globs:\s*\[(.*?)\]/ms);
    if (!frontmatterMatch) {
      rules[personaName] = [];
      continue;
    }
    rules[personaName] = frontmatterMatch[1]
      .split(',')
      .map(glob => glob.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
  }
  return rules;
}

function matchGlob(filePath, glob) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedGlob = glob.replace(/\\/g, '/');
  if (normalizedPath === normalizedGlob) {
    return true;
  }

  let regexStr = normalizedGlob
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '___DOUBLE_STAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/___DOUBLE_STAR___/g, '.*');

  regexStr = '^' + regexStr + '$';
  return new RegExp(regexStr).test(normalizedPath);
}

function findMatchingPersonas(filePath, rules) {
  return Object.entries(rules)
    .filter(([, globs]) => globs.some(glob => matchGlob(filePath, glob)))
    .map(([persona]) => persona);
}

function main() {
  console.log('Testing persona activation globs...\n');
  const rules = loadPersonaRules();
  console.log(`Found ${Object.keys(rules).length} persona rules\n`);

  let failed = 0;
  for (const [filePath, expectedPersona] of testCases) {
    const matches = findMatchingPersonas(filePath, rules);
    if (matches.includes(expectedPersona)) {
      console.log(`[OK] ${filePath} -> ${expectedPersona}`);
    } else {
      failed++;
      const actual = matches.length ? matches.join(', ') : 'none';
      console.log(`[FAIL] ${filePath} -> expected ${expectedPersona}, got ${actual}`);
    }
  }

  if (failed > 0) {
    process.exit(1);
  }
  console.log('\nAll persona routing checks passed.');
}

main();
