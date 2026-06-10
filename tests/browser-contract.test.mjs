import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles/app.css', 'utf8');
const app = readFileSync('app/app.mjs', 'utf8');

test('shell is modular, accessible, and starts without mass results', () => {
  assert.match(html, /<h1[^>]*>GovFrame/);
  assert.match(html, /<script type="module" src="\.\/app\/app\.mjs\?v=[^"]+"/);
  assert.match(html, /<link rel="stylesheet" href="\.\/styles\/app\.css\?v=[^"]+"/);
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

test('interface teaches framework mapping concepts at the point of use', () => {
  assert.match(app, /new to mapping/i);
  assert.match(app, /how mapping works/i);
  assert.match(app, /Official match/);
  assert.match(app, /Possible connection/);
  assert.match(app, /incoming/i);
  assert.match(app, /Needs supporting source/);
  assert.match(app, /limited-public-scope/i);
});

test('search supports a framework filter and item mappings are progressively disclosed', () => {
  assert.match(app, /id="search-framework"/);
  assert.match(app, /const filters = \{\s*framework_id/);
  assert.match(app, /framework_id: state\.filter/);
  assert.match(app, /Show all .* direct mappings/);
});

test('copy reuse modules and D3 visualizations are integrated', () => {
  assert.match(app, /import\s+\{\s*terms\s*\}\s+from\s+'\.\/content\/terms\.mjs'/);
  assert.match(app, /import\s+\{\s*glossary\s*\}\s+from\s+'\.\/content\/glossary\.mjs'/);
  assert.match(app, /drawNodeLink/);
  assert.match(app, /drawAdjacencyMatrix/);
  assert.match(app, /toggleGlossaryDrawer/);
  assert.match(app, /startWalkthrough/);
});

test('routing state and interactive repair contracts are present', () => {
  assert.match(app, /let viewState\s*=/);
  assert.match(app, /TOUR_EXAMPLE_KEY\s*=\s*'nist-800-53:AC-2'/);
  assert.match(app, /btn-onboarding-skip/);
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /requestSubmit\(\)/);
  assert.match(app, /input\.value\.trim\(\)/);
  assert.match(app, /externalAnchor/);
  assert.match(app, /Open GitHub issue in a new tab/);
  assert.match(html, /Loading GovFrame/);
  assert.doesNotMatch(html, /id="btn-toggle-glossary"[^>]*target="_blank"/);
});

test('mode toggle preserves detail pages and onboarding is resilient', () => {
  assert.match(app, /async function setNoviceMode/);
  assert.match(app, /if \(currentActiveState\.key\)/);
  assert.match(app, /console\.error\('Failed to set/);
  assert.match(app, /finally\s*\{[\s\S]*overlay\.remove\(\)/);
  assert.match(app, /Shows calculated multi-hop paths/);
});
