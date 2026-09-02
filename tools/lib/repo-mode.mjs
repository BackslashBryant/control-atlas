#!/usr/bin/env node

/**
 * Repo mode detection utility
 * Determines if repository is in "template" mode (allows Cursor files) or "app" mode (blocks them)
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

const REPO_MODE_FILE = path.join(repoRoot, '.repo-mode');
const PACKAGE_JSON_PATH = path.join(repoRoot, 'package.json');

function readPackageJson() {
  if (!existsSync(PACKAGE_JSON_PATH)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Detects the repository mode (template or app)
 * @returns {'template'|'app'} The detected mode
 */
export function detectRepoMode() {
  if (existsSync(REPO_MODE_FILE)) {
    try {
      const mode = readFileSync(REPO_MODE_FILE, 'utf8').trim().toLowerCase();
      if (mode === 'template' || mode === 'app') {
        return mode;
      }
    } catch {
      // Fall through.
    }
  }

  const packageJson = readPackageJson();
  const committedMode = packageJson?.codexTemplateMode?.toLowerCase();
  if (committedMode === 'template' || committedMode === 'app') {
    return committedMode;
  }

  if (packageJson) {
    const name = (packageJson.name || '').toLowerCase();
    const description = (packageJson.description || '').toLowerCase();
    if (name.includes('template') || description.includes('template')) {
      return 'template';
    }
  }

  return 'app';
}

/**
 * Sets the repository mode explicitly
 * @param {'template'|'app'} mode - The mode to set
 */
export async function setRepoMode(mode) {
  if (mode !== 'template' && mode !== 'app') {
    throw new Error(`Invalid mode: ${mode}. Must be 'template' or 'app'`);
  }

  const fs = await import('node:fs/promises');
  const packageJson = readPackageJson();
  if (!packageJson) {
    throw new Error('package.json is required to set the committed repo mode.');
  }

  packageJson.codexTemplateMode = mode;
  await fs.writeFile(PACKAGE_JSON_PATH, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
  return mode;
}
