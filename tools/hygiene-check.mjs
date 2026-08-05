import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

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

function runCheck() {
  console.log('Running repository hygiene verification...');
  let violations = 0;

  let trackedFiles = [];
  try {
    const stdout = execSync('git ls-files', { encoding: 'utf8' });
    trackedFiles = stdout.split(/\r?\n/).map(f => f.trim()).filter(Boolean);
  } catch (err) {
    console.error('Error running git ls-files:', err.message);
    process.exit(1);
  }

  for (const file of trackedFiles) {
    // 1. Check prohibited paths (all files)
    for (const pat of PROHIBITED_PATH_PATTERNS) {
      if (pat.test(file)) {
        console.error(`[HYGIENE VIOLATION] Tracked path matches prohibited pattern: "${file}" (pattern: ${pat})`);
        violations++;
      }
    }

    // Skip scanning binary files or the hygiene check script itself
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXTENSIONS.includes(ext) || file === 'tools/hygiene-check.mjs' || file === 'tools/categorize-files.mjs') {
      continue;
    }

    // Exclude data/ directory files from content checks to avoid false positives in official datasets (e.g. macOS `/Users` commands)
    if (file.startsWith('data/')) {
      continue;
    }

    // 2. Check file content
    try {
      const content = fs.readFileSync(file, 'utf8');
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
            if (file === 'AGENTS.md' || file === 'docs/PRD.md' || file === 'README.md') {
              continue;
            }
            console.error(`[HYGIENE VIOLATION] ${name} found in "${file}" at line ${i + 1}:`);
            console.error(`  > ${line.trim().slice(0, 120)}`);
            violations++;
          }
        }
      }
    } catch (err) {
      console.warn(`[HYGIENE WARNING] Could not read file "${file}":`, err.message);
    }
  }

  if (violations > 0) {
    console.error(`\nHygiene check failed with ${violations} violation(s). Please remove local/agent clutter from Git.`);
    process.exit(1);
  } else {
    console.log('Hygiene check passed successfully! No agent clutter or machine-specific paths found in Git.');
  }
}

runCheck();
