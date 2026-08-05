import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROHIBITED_PATH_PATTERNS = [
  /\.gemini\//i,
  /\.claude\//i,
  /\.antigravity\//i,
  /\.cursor\//i,
  /\.codex\//i,
  /brain\//i,
  /walkthrough\.md$/i,
  /completion-report/i,
  /session-notes/i,
  /transcript/i,
  /scratch\//i,
  /debug\.log/i,
  /temp-download/i,
];

// Regexes to inspect file contents
const PROHIBITED_CONTENT_PATTERNS = [
  {
    name: 'Machine-specific absolute path or local file:/// link',
    // Matches file:///C:/ or file:///D:/ or file:///Users/ or file:///home/
    pattern: /file:\/\/\/[A-Za-z]:\/|file:\/\/\/Users\/|file:\/\/\/home\//i,
  },
  {
    name: 'Windows/Mac local user profile path',
    // Matches C:\Users\<username> or /Users/<username> (excluding generic /Users/ or C:\Users\ without username)
    pattern: /[A-Za-z]:\\Users\\[a-zA-Z0-9_-]+|[A-Za-z]:\/Users\/[a-zA-Z0-9_-]+|\/Users\/[a-zA-Z0-9_-]+\b/i,
  },
  {
    name: 'Machine-specific user folder (OrEo2)',
    pattern: /OrEo2/i,
  },
];

// Helper to check if file is text/scannable
const TEXT_EXTENSIONS = ['.md', '.json', '.js', '.ts', '.mjs', '.cjs', '.html', '.css', '.xml', '.yml', '.yaml'];

export function checkFiles({ files, readContent = (f) => fs.readFileSync(f, 'utf8') }) {
  let violations = [];

  for (const file of files) {
    // Normalize path slashes
    const normalizedFile = file.replace(/\\/g, '/');

    // 1. Check prohibited paths (all files)
    for (const pat of PROHIBITED_PATH_PATTERNS) {
      if (pat.test(normalizedFile)) {
        violations.push({
          file,
          type: 'path',
          message: `Tracked path matches prohibited pattern: "${file}" (pattern: ${pat})`,
        });
      }
    }

    // Skip scanning binary files or the hygiene check script itself
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXTENSIONS.includes(ext) || normalizedFile === 'tools/hygiene-check.mjs' || normalizedFile === 'tools/categorize-files.mjs') {
      continue;
    }

    // Exclude data/ directory files from content checks to avoid false positives in official datasets (e.g. macOS `/Users` commands)
    if (normalizedFile.startsWith('data/')) {
      continue;
    }

    // 2. Check file content
    try {
      const content = readContent(file);
      const lines = content.split(/\r?\n/);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip checking lines that are comment exclusions if any, or specific safe documentation lines
        if (line.includes('hygiene-exclude') || line.includes('PROHIBITED_CONTENT_PATTERNS')) {
          continue;
        }

        for (const { name, pattern } of PROHIBITED_CONTENT_PATTERNS) {
          if (pattern.test(line)) {
            // Avoid false positives for documentation discussing these rules
            if (
              normalizedFile === 'AGENTS.md' || 
              normalizedFile === 'CLAUDE.md' || 
              normalizedFile === 'docs/PRD.md' || 
              normalizedFile === 'README.md' ||
              normalizedFile === 'tests/hygiene-check.test.mjs'
            ) {
              continue;
            }
            violations.push({
              file,
              type: 'content',
              line: i + 1,
              rule: name,
              snippet: line.trim(),
              message: `${name} found in "${file}" at line ${i + 1}: ${line.trim()}`,
            });
          }
        }
      }
    } catch (err) {
      // For testing, mock files might not exist on disk
      if (err.code !== 'ENOENT') {
        console.warn(`[HYGIENE WARNING] Could not read file "${file}":`, err.message);
      }
    }
  }

  return violations;
}

function runCheck() {
  console.log('Running repository hygiene verification...');
  let trackedFiles = [];
  try {
    const stdout = execSync('git ls-files', { encoding: 'utf8' });
    trackedFiles = stdout.split(/\r?\n/).map(f => f.trim()).filter(Boolean);
  } catch (err) {
    console.error('Error running git ls-files:', err.message);
    process.exit(1);
  }

  const violations = checkFiles({ files: trackedFiles });

  if (violations.length > 0) {
    for (const v of violations) {
      console.error(`[HYGIENE VIOLATION] ${v.message}`);
    }
    console.error(`\nHygiene check failed with ${violations.length} violation(s). Please remove local/agent clutter from Git.`);
    process.exit(1);
  } else {
    console.log('Hygiene check passed successfully! No agent clutter or machine-specific paths found in Git.');
  }
}

// Check if run directly
const nodePath = process.argv[1] ? fs.realpathSync(process.argv[1]) : '';
const scriptPath = fileURLToPath(import.meta.url);
if (nodePath && (nodePath === scriptPath || nodePath === fs.realpathSync(scriptPath))) {
  runCheck();
}
