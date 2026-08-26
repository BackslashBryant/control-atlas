import { existsSync, mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

export function writeJsonAtomically(destination, document, { attempts = 5 } = {}) {
  mkdirSync(dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      renameSync(temporary, destination);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) sleep(attempt * 1_000);
    }
  }

  if (existsSync(temporary)) unlinkSync(temporary);
  throw lastError;
}
