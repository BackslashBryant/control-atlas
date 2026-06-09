import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles/app.css', 'utf8');
const app = readFileSync('app/app.mjs', 'utf8');

test('shell is modular, accessible, and starts without mass results', () => {
  assert.match(html, /<h1[^>]*>GovFrame/);
  assert.match(html, /<script type="module" src="\.\/app\/app\.mjs"/);
  assert.match(html, /<link rel="stylesheet" href="\.\/styles\/app\.css"/);
  assert.match(html, /data-view="search"/);
  assert.match(html, /data-view="matrix"/);
  assert.match(html, /data-view="browse"/);
  assert.match(html, /data-view="sources"/);
  assert.doesNotMatch(html, /<article/);
  assert.match(app, /fetch\('\.\/data\/generated\/bootstrap\.json'\)/);
  assert.match(app, /async function ensureDataset/);
});

test('responsive contract explicitly prevents horizontal overflow', () => {
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /min-width:\s*0/);
});

test('matrix supports pasted source IDs and exports the complete scoped result', () => {
  assert.match(app, /id="matrix-items"/);
  assert.match(app, /parseSelectedItemKeys/);
  assert.match(app, /item_keys/);
  assert.match(app, /CSV export includes the complete matrix/);
});

test('user-facing shell and runtime contain no encoding corruption', () => {
  assert.doesNotMatch(html, /Ã|Â|â€¦|â†|â€|ðŸ/);
  assert.doesNotMatch(app, /Ã|Â|â€¦|â†|â€|ðŸ/);
});
