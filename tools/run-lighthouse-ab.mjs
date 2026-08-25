#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

const output = 'artifacts/lighthouse-ab';
const route = process.env.ROUTE ?? '/';
const maximumDrop = Number(process.env.MAX_MEDIAN_DROP ?? '3');
mkdirSync(output, { recursive: true });

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

function capture(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function fetchRef(ref) {
  run('git', ['fetch', '--no-tags', '--depth=1', 'origin', ref]);
  return capture('git', ['rev-parse', 'FETCH_HEAD']);
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The bounded retry below is the readiness control.
    }
    await delay(2000);
  }
  throw new Error(`Static server did not become ready at ${url}`);
}

async function measure(label, sha) {
  run('git', ['checkout', '--force', sha]);
  run('npm', ['ci']);
  run('npm', ['run', 'build:site']);

  const server = spawn('npm', ['run', 'serve:static'], {
    env: { ...process.env, PORT: '4317' },
    stdio: 'ignore',
  });
  try {
    await waitForServer('http://localhost:4317/');
    for (let pass = 1; pass <= 3; pass += 1) {
      run('npx', [
        '--no-install',
        'lighthouse',
        `http://localhost:4317${route}`,
        '--quiet',
        '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
        '--form-factor=mobile',
        '--screenEmulation.mobile',
        '--only-categories=performance',
        '--max-wait-for-load=90000',
        '--output=json',
        `--output-path=${output}/${label}-${pass}.json`,
      ]);
    }
  } finally {
    server.kill('SIGTERM');
  }
}

function scores(label) {
  return [1, 2, 3].map((pass) => {
    const report = JSON.parse(readFileSync(`${output}/${label}-${pass}.json`, 'utf8'));
    return Math.round(report.categories.performance.score * 100);
  });
}

function median(values) {
  return [...values].sort((left, right) => left - right)[1];
}

const beforeRef = process.env.BEFORE_REF ?? 'v1.0.0';
const afterRef = process.env.AFTER_REF ?? 'HEAD';
const beforeSha = fetchRef(beforeRef);
const afterSha = fetchRef(afterRef);

await measure('before', beforeSha);
await measure('after', afterSha);

const before = scores('before');
const after = scores('after');
const beforeMedian = median(before);
const afterMedian = median(after);
const allowedMinimum = beforeMedian - maximumDrop;
writeFileSync(
  `${output}/summary.json`,
  `${JSON.stringify({ beforeRef, afterRef, beforeSha, afterSha, before, after, beforeMedian, afterMedian, allowedMinimum }, null, 2)}\n`,
);

console.table({ before, after, beforeMedian, afterMedian, allowedMinimum });
if (afterMedian < allowedMinimum) {
  throw new Error(`Candidate median ${afterMedian} is below the allowed minimum ${allowedMinimum}.`);
}
