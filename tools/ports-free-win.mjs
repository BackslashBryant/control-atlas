#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const CANONICAL_PORTS = [4317, 3000, 3001, 3002];
const output = execFileSync(
  'powershell.exe',
  [
    '-NoProfile',
    '-Command',
    `$ports=@(${CANONICAL_PORTS.join(',')}); Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $ports -contains $_.LocalPort } | ForEach-Object { $p=Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $_.OwningProcess); [pscustomobject]@{ pid=$_.OwningProcess; port=$_.LocalPort; commandLine=$p.CommandLine } } | ConvertTo-Json -Compress`,
  ],
  { encoding: 'utf8' },
).trim();

const listeners = output
  ? (Array.isArray(JSON.parse(output)) ? JSON.parse(output) : [JSON.parse(output)])
  : [];

for (const listener of listeners) {
  const commandLine = listener.commandLine || '';
  if (!/tools[\\/]serve-static-site\.mjs/.test(commandLine)) {
    throw new Error(
      `Refusing to stop PID ${listener.pid} on ${listener.port}: ${commandLine || '<unknown>'}`,
    );
  }
  process.kill(listener.pid);
  console.log(`Stopped Control Atlas static server PID ${listener.pid} on ${listener.port}.`);
}

if (listeners.length === 0) {
  console.log('No Control Atlas static server is listening on canonical ports.');
}
