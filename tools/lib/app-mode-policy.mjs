import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const packageJsonPath = path.join(repoRoot, 'package.json');

const DEFAULT_BLOCKED_PREFIXES = [
  '.ai/',
  '.notes/',
  '.specify/',
  '.claude/',
  '.gemini/',
  'examples/',
  'rocky-pet/',
];

const DEFAULT_BLOCKED_EXACT = new Set([
  '.repo-mode',
  'CLAUDE.md',
  'GEMINI.md',
  'QUICKSTART.md',
]);

const DEFAULT_ALLOWED_ROOT_FILES = new Set([
  '.cursorignore',
  '.editorconfig',
  '.gitignore',
  '.npmrc',
  '.nvmrc',
  '.prettierignore',
  '.env.example',
  'README.md',
  'env.example',
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'tsconfig.json',
  'tsconfig.base.json',
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.mjs',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
  'vite.config.js',
  'vite.config.mjs',
  'vite.config.ts',
]);

function readPackageJson() {
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8').replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }
}

function normalizeRootName(value) {
  return value.replace(/[\\/]+$/g, '');
}

export function normalizeRepoPath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function normalizePathEntry(entry) {
  if (typeof entry === 'string') {
    return {
      filePath: normalizeRepoPath(entry),
      status: '',
    };
  }

  if (!entry || typeof entry.filePath !== 'string') {
    return {
      filePath: '',
      status: '',
    };
  }

  return {
    filePath: normalizeRepoPath(entry.filePath),
    status: String(entry.status || '').trim(),
  };
}

function isDeletionStatus(status) {
  return status === 'D' || status.endsWith('D') || status.startsWith('D');
}

export function hasUncheckedMvpItems(text) {
  return /- \[ \]/.test(text);
}

export function getAppModePolicy() {
  const packageJson = readPackageJson() || {};
  const appRoots = new Set(
    (packageJson.codexAppRoots || ['apps']).map(normalizeRootName),
  );
  const shellRoots = new Set(
    (packageJson.codexAppShellRoots || []).map(normalizeRootName),
  );
  const blockedPrefixes = packageJson.codexBlockedTemplatePrefixes || DEFAULT_BLOCKED_PREFIXES;
  const blockedExact = packageJson.codexBlockedTemplateExact || [...DEFAULT_BLOCKED_EXACT];
  const allowedRootFiles = new Set([
    ...DEFAULT_ALLOWED_ROOT_FILES,
    ...((packageJson.codexAllowedRootFiles || []).map(String)),
  ]);

  return {
    appRoots,
    shellRoots,
    blockedPrefixes: [...blockedPrefixes],
    blockedExact: new Set(blockedExact),
    allowedRootFiles,
  };
}

export function getAppModeViolation(entry) {
  const normalizedEntry = normalizePathEntry(entry);
  const normalized = normalizedEntry.filePath;
  if (!normalized) {
    return null;
  }

  if (isDeletionStatus(normalizedEntry.status)) {
    return null;
  }

  const policy = getAppModePolicy();
  if (
    policy.blockedExact.has(normalized) ||
    policy.blockedPrefixes.some(prefix => normalized.startsWith(prefix))
  ) {
    return 'template-only infrastructure must stay out of downstream app commits';
  }

  if (!normalized.includes('/')) {
    return policy.allowedRootFiles.has(normalized)
      ? null
      : 'root files must stay within the approved app shell';
  }

  const [topLevel] = normalized.split('/');
  if (policy.appRoots.has(topLevel) || policy.shellRoots.has(topLevel) || topLevel.startsWith('.')) {
    return null;
  }

  return `top-level changes must stay within app roots (${[...policy.appRoots].join(', ')}) or shell roots (${[...policy.shellRoots].join(', ')})`;
}

export function summarizeAppModeViolations(filePaths) {
  return filePaths
    .map(entry => {
      const normalizedEntry = normalizePathEntry(entry);
      return {
        filePath: normalizedEntry.filePath,
        reason: getAppModeViolation(normalizedEntry),
      };
    })
    .filter(entry => entry.reason);
}
