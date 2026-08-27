#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { valeExtractionCommand } from './lib/vale-extraction.mjs';

const VERSION = '3.15.1';
const RELEASE_ROOT = `https://github.com/vale-cli/vale/releases/download/v${VERSION}`;
const ASSETS = {
  'linux-x64': {
    archive: `vale_${VERSION}_Linux_64-bit.tar.gz`,
    sha256: 'c024d9c157874fb043d4f24a055d60050d1bb18755251f590593eed5bace1857',
    binary: 'vale',
  },
  'win32-x64': {
    archive: `vale_${VERSION}_Windows_64-bit.zip`,
    sha256: '3395fca0ddfb10a9b6caa28e091d5df709b1d6b6579afb7dece852cad89b94f3',
    binary: 'vale.exe',
  },
};

const platformKey = `${process.platform}-${process.arch}`;
const asset = ASSETS[platformKey];
if (!asset) {
  throw new Error(`Vale ${VERSION} is not configured for ${platformKey}`);
}

const installDir = join(
  process.cwd(),
  'node_modules',
  '.cache',
  'control-atlas-vale',
  VERSION,
);
const binaryPath = join(installDir, asset.binary);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

if (!(await exists(binaryPath))) {
  await mkdir(installDir, { recursive: true });
  const response = await fetch(`${RELEASE_ROOT}/${asset.archive}`);
  if (!response.ok) {
    throw new Error(`Vale download failed: ${response.status} ${response.statusText}`);
  }
  const archivePath = join(installDir, asset.archive);
  await writeFile(archivePath, Buffer.from(await response.arrayBuffer()));
  const actualHash = createHash('sha256')
    .update(await readFile(archivePath))
    .digest('hex');
  if (actualHash !== asset.sha256) {
    throw new Error(`Vale checksum mismatch: expected ${asset.sha256}, got ${actualHash}`);
  }
  // Windows' bundled bsdtar both misparses an absolute drive-letter path as
  // a remote host:path spec ("Cannot connect to D:") and lacks zip-format
  // support, so extract the Windows zip asset with PowerShell's native
  // Expand-Archive instead of tar.
  const extraction = valeExtractionCommand(process.platform, archivePath, installDir);
  const extractCode = await run(extraction.command, extraction.args);
  if (extractCode !== 0 || !(await exists(binaryPath))) {
    throw new Error(`Vale archive extraction failed with exit code ${extractCode}`);
  }
}

process.exitCode = await run(binaryPath, process.argv.slice(2));
