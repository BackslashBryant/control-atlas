import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync('src/index.html', 'utf8');
const css = readFileSync('src/styles/app.css', 'utf8');
const app = readFileSync('src/app/app.mjs', 'utf8');

test('shell identifies Control Atlas and preserves core journeys', () => {
  assert.match(html, /Control Atlas/);
  assert.match(html, /Ctrl\+Alt\+Comply/);
  assert.match(html, /The public map for federal cyber compliance\./);
  assert.match(html, /Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF\/ATO templates/i);
  assert.match(html, /does not make authorization, compliance, assessment, or risk acceptance decisions/i);
  assert.match(html, /Official decisions remain with the applicable Authorizing Official, agency, or program office/i);
  assert.match(html, /data-view="search"/);
  assert.match(html, /data-view="matrix"/);
  assert.match(html, /data-view="patterns"/);
  assert.match(html, /data-view="templates"/);
  assert.match(html, /data-view="sources"/);
  assert.match(html, /data-view="start-here"/);
  assert.match(html, /Skip to workspace/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, />Sources</);
  assert.match(html, />Library</);
  assert.match(html, />Crosswalks</);
  assert.match(html, />Patterns</);
  assert.match(html, />Templates</);
  assert.match(html, />Start Here</);
});

test('application loads only the five federal graph artifacts', () => {
  assert.match(html, /app\/app\.mjs\?v=20260614-1/);
  assert.match(app, /from '\.\/runtime\.mjs'/);
  for (const artifact of ['sources', 'nodes', 'edges', 'evidence', 'graph-health']) {
    assert.match(app, new RegExp(`data/generated/${artifact}\\.json\\?v=20260614-1`));
  }
  assert.doesNotMatch(app, /bootstrap\.json|catalog\.json|coverage\.json|mappings\.json|paths\.json|candidates\.json|source-health\.json/);
  assert.doesNotMatch(app, /build-manifest\.json|source-manifests\.json|graph-diff-summary\.json/);
  assert.match(app, /createFederalGraphRuntime/);
});

test('search, browse, detail, provenance, and comparison use graph runtime APIs', () => {
  assert.match(app, /searchNodes/);
  assert.match(app, /searchLibrary/);
  assert.match(app, /getEdgesForNode/);
  assert.match(app, /getEvidenceForEdge/);
  assert.match(app, /getFederalContext/);
  assert.match(app, /getSources/);
  assert.match(app, /getSource/);
  assert.match(app, /getLibraryFacets/);
  assert.match(app, /getGraphHealth/);
  assert.match(app, /buildRelationshipMatrix/);
  assert.match(app, /buildRelationshipCsv/);
  assert.match(app, /Control-Atlas-\$\{source\}-to-\$\{target\}\.csv/);
  assert.match(app, /view === 'sources'/);
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
  assert.match(app, /Source basis/);
  assert.match(app, /Relationship type/);
  assert.match(app, /Confidence/);
  assert.match(app, /Evidence strength/);
  assert.match(app, /Use status/);
  assert.doesNotMatch(app, /Federal provenance/);
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

test('hero uses the Ctrl+Alt rotating line with reduced-motion fallback', () => {
  assert.match(html, /hero-rotating-word/);
  assert.match(app, /Comply', 'Map', 'Assess', 'Crosswalk', 'Navigate', 'Inherit', 'Audit', 'Authorize/);
  assert.match(app, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(app, /Ctrl\+Alt\+/);
});

test('shell applies the PRD dark-atlas token system and CSP', () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /rel="icon"/);
  assert.match(html, /href="\.\/favicon\.ico"/);
  assert.match(html, /href="\.\/favicon\.svg"/);
  assert.match(html, /fonts\.googleapis\.com/);
  assert.match(html, /fonts\.gstatic\.com/);
  assert.doesNotMatch(html, /frame-ancestors/);
  assert.match(css, /--ca-bg:\s*#0B1020/i);
  assert.match(css, /--ca-surface:\s*#111827/i);
  assert.match(css, /--ca-primary:\s*#2563EB/i);
  assert.match(css, /--ca-secondary:\s*#22D3EE/i);
  assert.match(css, /Space Grotesk/);
  assert.match(css, /Public Sans/);
  assert.match(css, /JetBrains Mono/);
});

test('runtime exposes provenance-aware relationship filters in the source shell', () => {
  assert.match(app, /filterRelationshipEntries/);
  assert.match(app, /relationship-type-filter/);
  assert.match(app, /provenance-filter/);
  assert.match(app, /confidence-filter/);
  assert.match(app, /Table view/);
});

test('source check view exposes source filters, detail views, and warning metadata', () => {
  assert.match(app, /source-provenance-filter/);
  assert.match(app, /source-eligibility-filter/);
  assert.match(app, /source-lifecycle-filter/);
  assert.match(app, /source-access-filter/);
  assert.match(app, /View source details/);
  assert.match(app, /Use rules/);
  assert.match(app, /Used in map/);
  assert.match(app, /Not used in the public map/);
  assert.match(app, /Old or draft content\. Check it carefully\./);
  assert.match(app, /data-open-source=/);
});

test('node detail links defining sources back to provenance details', () => {
  assert.match(app, /Main source/);
  assert.match(app, /Open source info/);
  assert.match(app, /Heads up/);
});

test('library browser exposes epic 3 filter controls, result metadata, and deep-link detail actions', () => {
  assert.match(app, /library-object-type-filter/);
  assert.match(app, /library-source-class-filter/);
  assert.match(app, /library-family-filter/);
  assert.match(app, /library-severity-filter/);
  assert.match(app, /Defining source/);
  assert.match(app, /Object type/);
  assert.match(app, /library-results/);
  assert.match(app, /view === 'library-detail'/);
  assert.match(app, /Copy link/);
});

test('responsive contract explicitly prevents horizontal overflow', () => {
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /min-width:\s*0/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('staged build publishes the favicon asset', () => {
  const buildScript = readFileSync('tools/build-static-site.mjs', 'utf8');
  assert.match(buildScript, /src\/favicon\.ico/);
  assert.match(buildScript, /favicon\.ico/);
  assert.match(buildScript, /src\/favicon\.svg/);
  assert.match(buildScript, /favicon\.svg/);
});

test('user-facing shell and runtime contain no encoding corruption', () => {
  assert.doesNotMatch(html, /Ãƒ|Ã‚|Ã¢|Ã°/);
  assert.doesNotMatch(app, /Ãƒ|Ã‚|Ã¢|Ã°/);
});
