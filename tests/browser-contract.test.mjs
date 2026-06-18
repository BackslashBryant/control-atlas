import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync('src/index.html', 'utf8');
const css = readFileSync('src/styles/app.css', 'utf8');
const app = readFileSync('src/app/app.mjs', 'utf8');

test('shell identifies Control Atlas and preserves core journeys', () => {
  assert.match(html, /Control Atlas/);
  assert.match(html, /Ctrl\+Alt\+Comply/);
  assert.match(html, /The public map for federal cyber compliance/);
  assert.match(html, /Search controls, trace source-backed links/);
  assert.match(html, /Open-source reference workbench for mapping controls, tracing frameworks, and generating blank RMF\/ATO templates/i);
  assert.match(html, /does not make compliance or authorization decisions/i);
  assert.match(html, /Official decisions remain with your Authorizing Official/i);
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
  assert.match(html, /app\/app\.mjs\?v=20260618-1/);
  assert.match(app, /from '\.\/runtime\.mjs'/);
  assert.match(app, /from '\.\.\/content\/pageIntros\.mjs'/);
  assert.match(app, /template-registry\.json/);
  assert.match(app, /Plain labels/);
  assert.doesNotMatch(app, /Open related node/);
  assert.doesNotMatch(app, /Novice Mode/);
  assert.doesNotMatch(app, /outside the active public-map scope/);
  assert.match(app, /How this connects/);
  assert.match(app, /connectedItemButtonLabel/);
  assert.match(app, /from '\.\/display-names\.mjs'/);
  assert.match(app, /displayNameFor/);
  assert.match(app, /templateDisplayName/);
  assert.match(app, /userFacingLoadError/);
  assert.match(app, /Loading public mappings/);
  for (const artifact of ['sources', 'nodes', 'edges', 'evidence', 'graph-health']) {
    assert.match(app, new RegExp(`data/generated/${artifact}\\.json\\?v=20260618-1`));
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
  assert.match(app, /buildRelationshipRows/);
  assert.match(app, /buildStigChain/);
  assert.match(app, /buildBaselineComparison/);
  assert.match(app, /exportRelationshipRows/);
  assert.match(app, /exportStigChain/);
  assert.match(app, /exportBaselineComparison/);
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
  assert.match(app, /setView\('search'\)/);
  assert.match(app, /btn-onboarding-explore/);
  assert.match(app, /See how public security guidance connects/);
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /How this connects/);
  assert.match(app, /aria-label="Relationship list"/);
  assert.match(app, /aria-pressed/);
});

test('hero uses the Ctrl+Alt rotating line with reduced-motion fallback', () => {
  assert.match(html, /hero-rotating-word/);
  assert.match(html, /hero-tagline/);
  assert.match(html, /landing-support-template/);
  assert.match(html, /Ctrl\+Alt\+/);
  assert.match(html, /hero-rotating-line" aria-hidden="true"/);
  assert.match(app, /'Comply', 'Map', 'Trace', 'Compare', 'Navigate', 'Review', 'Plan', 'Export'/);
  assert.match(app, /'Discover', 'Align', 'Prioritize', 'Understand', 'Connect', 'Act'/);
  assert.match(app, /mountLandingSupport/);
  assert.match(app, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
});

test('landing keeps hero visible until search is engaged', () => {
  assert.match(app, /const searchEngaged = Boolean\(query \|\| hasActiveFilters\)/);
  assert.match(app, /workspace\.toggleAttribute\('data-search-active', searchEngaged\)/);
  assert.doesNotMatch(app, /landing \|\| Boolean\(query/);
  assert.match(app, /if \(state\.view !== 'search'\) workspace\.removeAttribute\('data-search-active'\)/);
  assert.match(app, /if \(landing\) \{[\s\S]*mountLandingSupport\(\);[\s\S]*return;/);
  assert.doesNotMatch(app, /landing \? \[\] : runtime\.searchLibrary/);
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

test('crosswalk workbench exposes epic 4 modes, visible-only exports, and inferred gating', () => {
  assert.match(app, /Framework comparison/);
  assert.match(app, /Relationship Table/);
  assert.match(app, /STIG -&gt; CCI -&gt; NIST/);
  assert.match(app, /Baseline Compare/);
  assert.match(app, /Show inferred mappings/);
  assert.match(app, /Source references/);
  assert.match(app, /Export CSV/);
  assert.match(app, /Export Markdown/);
  assert.match(app, /Export JSON/);
  assert.match(app, /Only the currently visible results are exported/);
  assert.match(app, /Shared controls/);
  assert.match(app, /Only in A/);
  assert.match(app, /Only in B/);
  assert.match(app, /Select a STIG or SRG item/);
  assert.match(app, /Inferred link/);
  assert.match(app, /Official link/);
  assert.match(app, /chainRelationshipItem/);
  assert.match(app, /baselineSourceSummary/);
  assert.match(app, /Defining source:/);
});

test('source check view exposes source filters, detail views, and warning metadata', () => {
  assert.match(app, /source-provenance-filter/);
  assert.match(app, /source-eligibility-filter/);
  assert.match(app, /source-lifecycle-filter/);
  assert.match(app, /source-access-filter/);
  assert.match(app, /View source details/);
  assert.match(app, /Use rules/);
  assert.match(app, /Used in map/);
  assert.match(app, /Not used in the public map because/);
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

test('translation principle copy avoids known anti-patterns', () => {
  assert.match(html, /Plain labels/);
  assert.doesNotMatch(app, /keeps meaning, source basis, confidence, and evidence strength separate/);
  assert.doesNotMatch(app, /Official and inferred mappings stay separate\. Published relationships remain primary/);
  assert.match(app, /What this is/);
  assert.match(app, /Why it matters/);
  assert.match(app, /Next step:/);
  assert.match(app, /pageIntros/);
});

test('user-facing shell and runtime contain no encoding corruption', () => {
  assert.doesNotMatch(html, /Ãƒ|Ã‚|Ã¢|Ã°/);
  assert.doesNotMatch(app, /Ãƒ|Ã‚|Ã¢|Ã°/);
});
