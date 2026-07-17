#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const VERSION = '1.0.3';
const ARCHIVE = `cli-core-${VERSION}-oscal-cli.zip`;
const URL = `https://repo1.maven.org/maven2/gov/nist/secauto/oscal/tools/oscal-cli/cli-core/${VERSION}/${ARCHIVE}`;
const SHA1 = 'b42290e444f79fdcf5a055c6da058b135a8a7997';
const installDir = join(
  process.cwd(),
  'node_modules',
  '.cache',
  'nist-oscal-cli',
  VERSION,
);
const libraryDir = join(installDir, 'lib');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: false, ...options });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

if (!(await exists(libraryDir))) {
  await mkdir(installDir, { recursive: true });
  const response = await fetch(URL);
  if (!response.ok) {
    throw new Error(`OSCAL CLI download failed: ${response.status} ${response.statusText}`);
  }
  const archivePath = join(installDir, ARCHIVE);
  await writeFile(archivePath, Buffer.from(await response.arrayBuffer()));
  const actualHash = createHash('sha1')
    .update(await readFile(archivePath))
    .digest('hex');
  if (actualHash !== SHA1) {
    throw new Error(`OSCAL CLI checksum mismatch: expected ${SHA1}, got ${actualHash}`);
  }
  const extractCode = process.platform === 'win32'
    ? await run('tar', ['-xf', archivePath, '-C', installDir])
    : await run('unzip', ['-q', archivePath, '-d', installDir]);
  if (extractCode !== 0 || !(await exists(libraryDir))) {
    throw new Error(`OSCAL CLI archive extraction failed with exit code ${extractCode}`);
  }
}

process.exitCode = await run('java', [
  '-Dsun.stdout.encoding=UTF-8',
  '-Dsun.stderr.encoding=UTF-8',
  '-classpath',
  join(libraryDir, '*'),
  'gov.nist.secauto.oscal.tools.cli.core.CLI',
  ...process.argv.slice(2),
]);
