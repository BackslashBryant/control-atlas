#!/usr/bin/env node

/**
 * cursor-extensions
 *
 * Prints workspace extension recommendations with installation instructions
 * and status checking. Uses .vscode/extensions.json as the source of truth.
 *
 * Usage:
 *   npm run setup:extensions
 */

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const extensionsPath = path.join(repoRoot, '.vscode', 'extensions.json');

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadExtensions() {
  if (!existsSync(extensionsPath)) {
    return [];
  }
  try {
    const raw = readFileSync(extensionsPath, 'utf8').replace(/^\uFEFF/, '');
    const json = JSON.parse(raw);
    return Array.isArray(json.recommendations) ? json.recommendations : [];
  } catch (error) {
    console.error('Failed to parse .vscode/extensions.json:', error instanceof Error ? error.message : error);
    return [];
  }
}

function describeExtension(id) {
  switch (id) {
    case 'eamodio.gitlens':
      return 'GitLens - inline Git history and blame.';
    case 'rangav.vscode-thunder-client':
      return 'Thunder Client - REST/GraphQL smoke testing inside Cursor.';
    case 'esbenp.prettier-vscode':
      return 'Prettier - consistent formatting fallback.';
    case 'streetsidesoftware.code-spell-checker':
      return 'Code Spell Checker - light proofreading for docs and UI copy.';
    case 'EditorConfig.EditorConfig':
      return 'EditorConfig - enforces .editorconfig rules in the editor.';
    default:
      return '';
  }
}

function checkCursorCli() {
  try {
    execSync('cursor --version', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    });
    return true;
  } catch {
    return false;
  }
}

function printGuide(extensions) {
  if (extensions.length === 0) {
    log('No workspace extension recommendations found.', 'yellow');
    return;
  }

  log('\n📦 Workspace Extension Recommendations\n', 'cyan');
  log('='.repeat(50), 'cyan');

  extensions.forEach((id, index) => {
    const description = describeExtension(id);
    const niceDescription = description ? ` - ${description}` : '';
    log(`\n${index + 1}. ${id}${niceDescription}`, 'blue');
  });

  log('\n' + '='.repeat(50), 'cyan');
  log('\n📋 Installation Methods\n', 'cyan');

  // Method 1: Command Palette (most reliable)
  log('Method 1: Command Palette (Recommended)', 'green');
  log('  1. Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (macOS)', 'yellow');
  log('  2. Type: "Extensions: Show Recommended Extensions"', 'yellow');
  log('  3. Click "Install All" or install individually', 'yellow');
  log('  4. Restart Cursor if prompted\n', 'yellow');

  // Method 2: Extensions Panel
  log('Method 2: Extensions Panel', 'green');
  log('  1. Open Extensions panel: Ctrl+Shift+X (Windows/Linux) or Cmd+Shift+X (macOS)', 'yellow');
  log('  2. Click "More Actions" (⋯) menu', 'yellow');
  log('  3. Select "Install Workspace Recommended Extensions"', 'yellow');
  log('  4. Restart Cursor if prompted\n', 'yellow');

  // Method 3: CLI (if available)
  const hasCli = checkCursorCli();
  if (hasCli) {
    log('Method 3: Command Line (if Cursor CLI is installed)', 'green');
    log('  Run these commands:\n', 'yellow');
    extensions.forEach(id => {
      log(`    cursor --install-extension ${id}`, 'cyan');
    });
    log('');
  } else {
    log('Method 3: Command Line', 'green');
    log('  Cursor CLI not detected. Install Cursor CLI first:', 'yellow');
    log('  1. Open Command Palette: Ctrl+Shift+P / Cmd+Shift+P', 'yellow');
    log('  2. Type: "Shell Command: Install \'cursor\' command in PATH"', 'yellow');
    log('  3. Then use Method 3 above\n', 'yellow');
  }

  // Method 4: VS Code Import
  log('Method 4: Import from VS Code', 'green');
  log('  If you have VS Code installed with these extensions:', 'yellow');
  log('  1. Open Cursor Settings', 'yellow');
  log('  2. Look for "Import from VS Code" option', 'yellow');
  log('  3. This will sync your existing extensions\n', 'yellow');

  // Status check
  log('\n🔍 Extension Status', 'cyan');
  log('  Note: Extension installation status cannot be automatically detected.', 'yellow');
  log('  Verify manually in Cursor:', 'yellow');
  log('  1. Open Extensions panel (Ctrl+Shift+X / Cmd+Shift+X)', 'yellow');
  log('  2. Check if recommended extensions appear in "Installed" tab', 'yellow');
  log('  3. Look for workspace recommendations badge\n', 'yellow');

  log('\n📚 Documentation', 'cyan');
  log('  Full guide: docs/cursor/extensions.md', 'blue');
  log('  List extensions: npm run cursor:extensions\n', 'blue');
}

function main() {
  const extensions = loadExtensions();
  printGuide(extensions);

  if (extensions.length > 0) {
    log('💡 Quick Tip:', 'cyan');
    log('  After installing extensions, restart Cursor to ensure they activate properly.\n', 'yellow');
  }
}

main();
