import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles/app.css', 'utf8');
const app = readFileSync('app/app.mjs', 'utf8');

test('shell identifies Control Atlas and preserves core journeys', () => {
  assert.match(html, /Control Atlas/);
  assert.match(html, /Public maps and templates for federal cyber compliance/);
  assert.match(html, /open-source reference and template-generation tool based on public sources/i);
  assert.match(html, /does not make authorization, compliance, assessment, or risk acceptance decisions/i);
  assert.match(html, /Official decisions remain with the applicable Authorizing Official, agency, assessor, program office, or governing authority/i);
  assert.match(html, /data-view="search"/);
  assert.match(html, /data-view="matrix"/);
  assert.match(html, /data-view="browse"/);
  assert.match(html, /data-view="sources"/);
  assert.match(html, /Skip to workspace/);
  assert.match(html, /aria-live="polite"/);
});

test('application loads only the five federal graph artifacts', () => {
  assert.match(html, /app\/app\.mjs\?v=20260614-1/);
  assert.match(app, /from '\.\/runtime\.mjs\?v=20260614-1'/);
  for (const artifact of ['sources', 'nodes', 'edges', 'evidence', 'graph-health']) {
    assert.match(app, new RegExp(`data/generated/${artifact}\\.json\\?v=20260614-1`));
  }
  assert.doesNotMatch(app, /bootstrap\.json|catalog\.json|coverage\.json|mappings\.json|paths\.json|candidates\.json|source-health\.json/);
  assert.doesNotMatch(app, /build-manifest\.json|source-manifests\.json|graph-diff-summary\.json/);
  assert.match(app, /createFederalGraphRuntime/);
});

test('search, browse, detail, sources, and comparison use graph runtime APIs', () => {
  assert.match(app, /searchNodes/);
  assert.match(app, /getEdgesForNode/);
  assert.match(app, /getEvidenceForEdge/);
  assert.match(app, /getFederalContext/);
  assert.match(app, /getSources/);
  assert.match(app, /getGraphHealth/);
  assert.match(app, /buildRelationshipMatrix/);
  assert.match(app, /buildRelationshipCsv/);
  assert.match(app, /Control-Atlas-\$\{source\}-to-\$\{target\}\.csv/);
});

test('federal trust dimensions remain visibly separate', () => {
  assert.match(app, /Baseline membership/);
  assert.match(app, /FedRAMP baseline context/);
  assert.match(app, /Categorization context/);
  assert.match(app, /Minimum security requirements/);
  assert.match(app, /RMF lifecycle/);
  assert.match(app, /Assessment procedures/);
  assert.match(app, /Program requirement context/);
  assert.match(app, /CMMC program context/);
  assert.match(app, /CUI policy context/);
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
