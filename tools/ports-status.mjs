#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const ports = [
  process.env.HTTP_PORT || '3000',
  process.env.API_PORT || '3001',
  process.env.WS_PORT || '3002',
];

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  return result.stdout || '';
}

function listPorts() {
  const platform = process.platform;
  if (platform === 'win32') {
    const out = run('netstat', ['-ano']);
    return out.split(/\r?\n/).filter(Boolean);
  }
  if (spawnSync('lsof', ['-v'], { stdio: 'ignore' }).status === 0) {
    const out = run('lsof', ['-iTCP', '-sTCP:LISTEN', '-Pn']);
    return out.split(/\r?\n/).filter(Boolean);
  }
  const out = run('netstat', ['-lntp']);
  return out.split(/\r?\n/).filter(Boolean);
}

function main() {
  let lines;
  try {
    lines = listPorts();
  } catch (error) {
    console.error('Unable to list ports:', error.message);
    process.exit(1);
  }

  let found = false;
  for (const line of lines) {
    for (const port of ports) {
      if (line.includes(`:${port}`)) {
        console.log(line.trim());
        found = true;
      }
    }
  }
  if (!found) {
    console.log(`No listeners on canonical ports ${ports.join(', ')}.`);
  }
}

main();
