#!/usr/bin/env node

/**
 * Get Project Root
 *
 * Reliably gets the project root directory, ensuring we're always working
 * from the correct location. Uses multiple fallback methods to handle edge cases.
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toolsDir = path.resolve(__dirname);

/**
 * Get project root using multiple fallback methods
 */
export function getProjectRoot() {
  // Method 1: Try git rev-parse (most reliable if in git repo)
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd(),
    }).trim();

    // Validate: git root should contain our project markers
    if (gitRoot && existsSync(path.join(gitRoot, 'package.json'))) {
      // Additional validation: check for project-specific files
      const projectMarkers = [
        'docs/vision.md',
        'tools/preflight.mjs',
        '.cursor/rules',
      ];

      const hasMarkers = projectMarkers.some(marker =>
        existsSync(path.join(gitRoot, marker))
      );

      if (hasMarkers) {
        return gitRoot;
      }
    }
  } catch (error) {
    // Git command failed or not in git repo - continue to fallback
  }

  // Method 2: Use tools directory location (tools/ is always in project root)
  const projectRoot = path.resolve(toolsDir, '..');

  // Validate: check for project markers
  const projectMarkers = [
    'package.json',
    'docs/vision.md',
    'tools/preflight.mjs',
  ];

  const hasMarkers = projectMarkers.every(marker =>
    existsSync(path.join(projectRoot, marker))
  );

  if (hasMarkers) {
    return projectRoot;
  }

  // Method 3: Fallback to current working directory
  return process.cwd();
}

/**
 * Main execution (for CLI usage)
 */
// Check if this file is being run directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.includes('get-project-root.mjs')) {
  console.log(getProjectRoot());
}
