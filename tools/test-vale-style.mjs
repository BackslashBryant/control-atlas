#!/usr/bin/env node

import { spawn } from 'node:child_process';

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['./tools/run-vale.mjs', ...args], {
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

const good = await run(['vale/fixtures/good.md']);
if (good !== 0) throw new Error('Approved Vale fixture must pass');

const bad = await run(['vale/fixtures/bad.md']);
if (bad === 0) throw new Error('Known-bad Vale fixture must fail');

console.log('Vale fixtures passed: approved copy accepted; known debt rejected.');
