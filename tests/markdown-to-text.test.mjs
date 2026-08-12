import assert from 'node:assert/strict';
import test from 'node:test';

import { markdownToPlainText } from '../scripts/lib/markdown-to-text.mjs';

test('README presentation removes complete HTML comments and tags', () => {
  assert.equal(
    markdownToPlainText('Before <!-- private <script>alert(1)</script> --> **after** <img src="x">'),
    'Before after',
  );
});

test('README presentation fails closed on an unterminated HTML comment', () => {
  assert.equal(markdownToPlainText('Visible <!-- hidden <script>alert(1)</script>'), 'Visible');
});

test('README presentation cannot re-form a comment delimiter after cleaning', () => {
  const text = markdownToPlainText('Start <!-- outer <!-- nested --> tail --> [Docs](https://example.test)');
  assert.equal(text.includes('<!--'), false);
  assert.equal(text.includes('<script'), false);
  assert.match(text, /Docs$/);
});
