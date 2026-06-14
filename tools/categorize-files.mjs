#!/usr/bin/env node

/**
 * Categorize files for commit separation
 * 
 * Helps ensure issue-specific files go to feature branches
 * and general improvements go to main branch.
 * 
 * Usage:
 *   node tools/categorize-files.mjs [file1] [file2] ...
 *   node tools/categorize-files.mjs --all
 *   node tools/categorize-files.mjs --status
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
const showAll = process.argv.includes('--all');
const showStatus = process.argv.includes('--status');

// Non-app logic files (go to main branch)
const NON_APP_PATTERNS = [
  /^\.cursor\/rules\//,
  /^\.cursor\/templates\//,
  /^\.cursor\/mcp\.json$/,
  /^\.cursor\/config\.json$/,
  /^tools\//,
  /^\.notes\/features\/README\.md$/,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^pnpm-lock\.yaml$/,
  /^yarn\.lock$/,
];

// App logic files (go to feature branches)
const APP_PATTERNS = [
  /^frontend\//,
  /^backend\//,
  /^src\//,
  /^docs\/Plan\.md$/,
  /^docs\/plans\/Issue-\d+-plan-status-.*\.md$/,
  /^docs\/research\/Issue-\d+-research\.md$/,
  /^\.notes\/features\/[^/]+\//,
  /^\.notes\/features\/current\.json$/,
  /^docs\/testing\//,
  /^docs\/security\//,
  /^artifacts\//,
];

// Issue-specific patterns (definitely app logic)
const ISSUE_SPECIFIC_PATTERNS = [
  /Issue-\d+/,
  /Issue-\d+/,
];

function categorizeFile(filePath) {
  // Check if it's issue-specific first
  if (ISSUE_SPECIFIC_PATTERNS.some(pattern => pattern.test(filePath))) {
    return { category: 'issue', reason: 'Issue-specific file' };
  }
  
  // Check non-app patterns
  if (NON_APP_PATTERNS.some(pattern => pattern.test(filePath))) {
    return { category: 'general', reason: 'Non-app logic (workflow/tools)' };
  }
  
  // Check app patterns
  if (APP_PATTERNS.some(pattern => pattern.test(filePath))) {
    return { category: 'issue', reason: 'App logic (feature-specific)' };
  }
  
  // Default: assume app logic (safer to ask)
  return { category: 'unknown', reason: 'Unknown - review manually' };
}

function getGitStatus() {
  try {
    const status = execSync('git status --short', { encoding: 'utf8' });
    return status.trim().split('\n').filter(line => line.trim());
  } catch {
    return [];
  }
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function analyzeFiles(fileList) {
  const categorized = {
    general: [],
    issue: [],
    unknown: [],
  };
  
  for (const line of fileList) {
    if (!line.trim()) continue;
    
    // Parse git status line (M, A, ??, etc.)
    const match = line.match(/^(\S+)\s+(.+)$/);
    if (!match) continue;
    
    const [, status, filePath] = match;
    const { category, reason } = categorizeFile(filePath);
    
    categorized[category].push({
      file: filePath,
      status: status,
      reason,
    });
  }
  
  return categorized;
}

function main() {
  const branch = getCurrentBranch();
  const isMain = branch === 'main';
  
  if (showStatus) {
    const statusLines = getGitStatus();
    if (statusLines.length === 0) {
      console.log('No uncommitted changes');
      return;
    }
    
    const categorized = analyzeFiles(statusLines);
    
    console.log(`\n📊 File Categorization (Branch: ${branch})\n`);
    
    if (categorized.general.length > 0) {
      console.log('🔧 GENERAL IMPROVEMENTS (should go to main):');
      categorized.general.forEach(({ file, status, reason }) => {
        console.log(`   ${status} ${file}`);
        console.log(`      → ${reason}`);
      });
      console.log();
    }
    
    if (categorized.issue.length > 0) {
      console.log('🎯 ISSUE-SPECIFIC (should go to feature branch):');
      categorized.issue.forEach(({ file, status, reason }) => {
        console.log(`   ${status} ${file}`);
        console.log(`      → ${reason}`);
      });
      console.log();
    }
    
    if (categorized.unknown.length > 0) {
      console.log('❓ UNKNOWN (review manually):');
      categorized.unknown.forEach(({ file, status, reason }) => {
        console.log(`   ${status} ${file}`);
        console.log(`      → ${reason}`);
      });
      console.log();
    }
    
    // Warnings
    if (!isMain && categorized.general.length > 0) {
      console.log('⚠️  WARNING: General improvements detected on feature branch!');
      console.log('   These should be committed to main first, then merged into this branch.\n');
    }
    
    if (isMain && categorized.issue.length > 0) {
      console.log('⚠️  WARNING: Issue-specific files detected on main branch!');
      console.log('   These should be committed to a feature branch instead.\n');
    }
    
    if (categorized.general.length > 0 && categorized.issue.length > 0) {
      console.log('⚠️  WARNING: Mixed commit detected!');
      console.log('   Separate general improvements from issue-specific changes.\n');
    }
    
    return;
  }
  
  // Categorize specific files
  const fileList = files.length > 0 ? files : getGitStatus().map(line => {
    const match = line.match(/^\S+\s+(.+)$/);
    return match ? match[1] : line;
  });
  
  if (fileList.length === 0) {
    console.log('No files to categorize');
    return;
  }
  
  const categorized = analyzeFiles(fileList.map(f => `?? ${f}`));
  
  console.log('\n📊 File Categorization\n');
  
  if (categorized.general.length > 0) {
    console.log('🔧 GENERAL IMPROVEMENTS:');
    categorized.general.forEach(({ file, reason }) => {
      console.log(`   ${file} → ${reason}`);
    });
    console.log();
  }
  
  if (categorized.issue.length > 0) {
    console.log('🎯 ISSUE-SPECIFIC:');
    categorized.issue.forEach(({ file, reason }) => {
      console.log(`   ${file} → ${reason}`);
    });
    console.log();
  }
  
  if (categorized.unknown.length > 0) {
    console.log('❓ UNKNOWN (review manually):');
    categorized.unknown.forEach(({ file, reason }) => {
      console.log(`   ${file} → ${reason}`);
    });
    console.log();
  }
}

main();


