#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { createConnection } from 'node:net';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const PORT = parseInt(process.env.HTTP_PORT || '3000', 10);

function hasStaticServerScript() {
  const pkgPath = path.join(repoRoot, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  return pkg.scripts && pkg.scripts['serve:static'];
}

function checkPort(port) {
  return new Promise(resolve => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => {
      resolve(false);
    });
  });
}

const isPortBusy = await checkPort(PORT);
if (isPortBusy) {
  console.log(`Port ${PORT} is already in use. Assuming dev server is running.`);
  process.exit(0);
}

if (!hasStaticServerScript()) {
  console.log('No "serve:static" script defined in package.json. Add one before running dev:guarded.');
  process.exit(0);
}

const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'serve:static'], {
  cwd: repoRoot,
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('exit', code => {
  process.exit(code ?? 0);
});
