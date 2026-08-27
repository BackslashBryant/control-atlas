import assert from 'node:assert/strict';
import test from 'node:test';

import { valeExtractionCommand } from '../tools/lib/vale-extraction.mjs';

test('Linux Vale extraction keeps the archive bound to the tar file option', () => {
  assert.deepEqual(
    valeExtractionCommand('linux', '/tmp/vale.tar.gz', '/tmp/vale'),
    {
      command: 'tar',
      args: [
        '--extract',
        '--gzip',
        '--file',
        '/tmp/vale.tar.gz',
        '--no-same-owner',
        '--directory',
        '/tmp/vale',
      ],
    },
  );
});

test('Windows Vale extraction remains on native Expand-Archive', () => {
  const extraction = valeExtractionCommand('win32', 'C:\\tmp\\vale.zip', 'C:\\tmp\\vale');
  assert.equal(extraction.command, 'powershell.exe');
  assert.match(extraction.args.at(-1), /Expand-Archive -LiteralPath/);
  assert.match(extraction.args.at(-1), /-DestinationPath/);
});
