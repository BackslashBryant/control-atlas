import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles/app.css', 'utf8');
const app = readFileSync('app/app.mjs', 'utf8');

test('shell identifies the federal integration directory and preserves core journeys', () => {
  assert.match(html, /Federal Security Control Integration Directory/);
  assert.match(html, /data-view="search"/);
  assert.match(html, /data-view="matrix"/);
  assert.match(html, /data-view="browse"/);
  assert.match(html, /data-view="sources"/);
  assert.match(html, /Skip to workspace/);
  assert.match(html, /aria-live="polite"/);
});

test('application loads only the five federal graph artifacts', () => {
  assert.match(html, /app\/app\.mjs\?v=20260613-2/);
  assert.match(app, /from '\.\/runtime\.mjs\?v=20260613-2'/);
  for (const artifact of ['sources', 'nodes', 'edges', 'evidence', 'graph-health']) {
    assert.match(app, new RegExp(`data/generated/${artifact}\\.json\\?v=20260613-2`));
  }
  assert.doesNotMatch(app, /bootstrap\.json|catalog\.json|coverage\.json|mappings\.json|paths\.json|candidates\.json|source-health\.json/);
  assert.match(app, /createFederalGraphRuntime/);
});

test('search, browse, detail, sources, and comparison use graph runtime APIs', () => {
  assert.match(app, /searchNodes/);
  assert.match(app, /getEdgesForNode/);
  assert.match(app, /getEvidenceForEdge/);
  assert.match(app, /getSources/);
  assert.match(app, /getGraphHealth/);
  assert.match(app, /buildRelationshipMatrix/);
  assert.match(app, /buildRelationshipCsv/);
});

test('federal trust dimensions remain visibly separate', () => {
  assert.match(app, /Federal provenance/);
  assert.match(app, /Relationship type/);
  assert.match(app, /Confidence/);
  assert.match(app, /Evidence quality/);
  assert.match(app, /Eligibility/);
  assert.doesNotMatch(app, /gold|silver|bronze/i);
});

test('onboarding and accessible relationship alternatives remain available', () => {
  assert.match(app, /onboarding-overlay/);
  assert.match(app, /btn-onboarding-skip/);
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /Relationship list/);
  assert.match(app, /aria-label="Relationship list"/);
  assert.match(app, /aria-pressed/);
});

test('responsive contract explicitly prevents horizontal overflow', () => {
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /min-width:\s*0/);
});

test('user-facing shell and runtime contain no encoding corruption', () => {
  assert.doesNotMatch(html, /Ãƒ|Ã‚|Ã¢|Ã°/);
  assert.doesNotMatch(app, /Ãƒ|Ã‚|Ã¢|Ã°/);
});
