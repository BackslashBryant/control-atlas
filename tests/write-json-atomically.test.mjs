import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { writeJsonAtomically } from '../scripts/lib/write-json-atomically.mjs';

test('atomic JSON writes preserve unchanged files and their mtimes', () => {
  const directory = mkdtempSync(join(tmpdir(), 'control-atlas-json-write-'));
  const destination = join(directory, 'generated.json');
  try {
    assert.equal(writeJsonAtomically(destination, { value: 1 }), true);
    const firstMtime = statSync(destination).mtimeMs;
    assert.equal(writeJsonAtomically(destination, { value: 1 }), false);
    assert.equal(statSync(destination).mtimeMs, firstMtime);
    assert.equal(writeJsonAtomically(destination, { value: 2 }), true);
    assert.equal(JSON.parse(readFileSync(destination, 'utf8')).value, 2);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
