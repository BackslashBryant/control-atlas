import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const projectRoot = process.cwd();

test('check:oscal script executes cleanly against valid OSCAL catalogs', () => {
  const result = spawnSync(process.execPath, [join(projectRoot, 'scripts', 'check-oscal.mjs')], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `check-oscal.mjs failed with output:\n${result.stderr || result.stdout}`);
  assert.match(result.stdout, /OSCAL Verification Summary/i);
});

test('check:oscal fails when target file is missing or invalid', () => {
  const result = spawnSync(process.execPath, [
    join(projectRoot, 'tools', 'run-oscal-cli.mjs'),
    'catalog',
    'validate',
    'non-existent-oscal-file.json',
  ], {
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0, 'OSCAL CLI must fail when target file does not exist');
});
