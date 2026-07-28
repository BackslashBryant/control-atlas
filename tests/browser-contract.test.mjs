import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync('src/index.html', 'utf8');
const css = readFileSync('styles/tokens.css', 'utf8');
const orbitalCss = readFileSync('styles/orbital.css', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const mainEntrypoint = existsSync('src/main.tsx') ? readFileSync('src/main.tsx', 'utf8') : '';
const reactApp = existsSync('src/ui/App.tsx') ? readFileSync('src/ui/App.tsx', 'utf8') : '';
const router = existsSync('src/ui/lib/hashRoutes.ts')
  ? readFileSync('src/ui/lib/hashRoutes.ts', 'utf8')
  : existsSync('src/ui/lib/viewState.ts')
    ? readFileSync('src/ui/lib/viewState.ts', 'utf8')
    : '';
const runtimeLoader = existsSync('src/ui/lib/runtimeLoader.ts')
  ? readFileSync('src/ui/lib/runtimeLoader.ts', 'utf8')
  : '';
const relationshipExplorer = existsSync('src/ui/components/RelationshipExplorer.tsx')
  ? readFileSync('src/ui/components/RelationshipExplorer.tsx', 'utf8')
  : '';
const relationshipGraph = existsSync('src/ui/components/RelationshipGraph.tsx')
  ? readFileSync('src/ui/components/RelationshipGraph.tsx', 'utf8')
  : '';
const graphLayout = existsSync('src/ui/lib/graphLayout.ts')
  ? readFileSync('src/ui/lib/graphLayout.ts', 'utf8')
  : '';

test('shell identifies Control Atlas and boots a React root', () => {
  assert.match(html, /Control Atlas/);
  assert.match(html, /Ctrl\+Alt\+Comply/);
  assert.match(html, /Public reference for federal cyber requirements/);
  assert.match(html, /Find published federal cyber requirements/);
  assert.match(html, /id="root"/);
  assert.ok(existsSync('src/main.tsx'), 'src/main.tsx must exist');
  assert.ok(existsSync('src/ui/App.tsx'), 'src/ui/App.tsx must exist');
  assert.match(mainEntrypoint, /createRoot/);
  assert.match(mainEntrypoint, /StrictMode/);
  assert.match(mainEntrypoint, /from 'react'/);
  assert.match(mainEntrypoint, /from 'react-dom\/client'/);
});

test('shell removes the old mode toggle and uses the current translation-first nav order', () => {
  assert.doesNotMatch(html, /btn-toggle-mode/);
  assert.doesNotMatch(html, /Plain labels/);
  assert.doesNotMatch(html, /Technical labels/);
  const navigation = readFileSync('src/ui/lib/navigation.ts', 'utf8');
  const routeIdentity = readFileSync('src/ui/lib/routeIdentity.ts', 'utf8');
  assert.match(navigation, /PRIMARY_NAV_ITEMS/);
  assert.match(navigation, /routeIdentityFor/);
  assert.match(routeIdentity, /Explore/);
  assert.match(routeIdentity, /Catalog/);
  assert.match(routeIdentity, /Compare/);
  assert.match(routeIdentity, /Learn/);
  assert.match(routeIdentity, /Build/);
  assert.match(routeIdentity, /Start here/);
  assert.match(routeIdentity, /Sources/);
  assert.doesNotMatch(navigation, /NAV_GROUPS/);
  assert.doesNotMatch(navigation, /Crosswalks/);
});

test('frontend foundation uses React, Vite, TypeScript, and Radix primitives', () => {
  assert.equal(typeof packageJson.dependencies.react, 'string');
  assert.equal(typeof packageJson.dependencies['react-dom'], 'string');
  assert.equal(typeof packageJson.devDependencies.vite, 'string');
  assert.equal(typeof packageJson.devDependencies['@vitejs/plugin-react'], 'string');
  assert.equal(typeof packageJson.dependencies['@radix-ui/react-accordion'], 'string');
  assert.ok(existsSync('vite.config.ts'), 'vite.config.ts must exist');
  assert.ok(existsSync('src/ui/lib/viewState.ts'), 'src/ui/lib/viewState.ts must exist');
});

test('brand identity is immediate, animated, and does not use an entrance gate', () => {
  const app = readFileSync('src/ui/App.tsx', 'utf8');
  const brand = readFileSync('src/ui/components/BrandLockup.tsx', 'utf8');
  assert.doesNotMatch(app, /BrandEntranceOverlay/);
  assert.match(brand, /BRAND_WORDS/);
  assert.match(brand, /"Comply"/);
  assert.match(brand, /brand-key">Ctrl/);
  assert.match(brand, /prefers-reduced-motion/);
  assert.match(brand, /setInterval/);
  assert.equal(typeof packageJson.dependencies['@xyflow/react'], 'string');
  assert.equal(typeof packageJson.dependencies.elkjs, 'string');
  assert.equal(packageJson.dependencies.cytoscape, undefined);
  assert.equal(packageJson.dependencies['react-force-graph-2d'], undefined);
  assert.match(relationshipExplorer, /lazy\(\(\) => import\(/);
  assert.match(relationshipExplorer, /useClusteredGraph/);
  assert.match(relationshipGraph, /from "@xyflow\/react"/);
  assert.match(relationshipGraph, /from "elkjs\/lib\/elk\.bundled\.js"/);
  assert.match(relationshipGraph, /<ReactFlow/);
  assert.match(relationshipGraph, /<MiniMap/);
  assert.match(relationshipGraph, /<Controls/);
  assert.match(relationshipGraph, /elk\s*\.\s*layout/);
});

test('map foundation uses the approved React Flow and ELK stack', () => {
  for (const dependency of [
    '@xyflow/react',
    'elkjs',
  ]) {
    assert.equal(
      typeof packageJson.dependencies[dependency],
      'string',
      `${dependency} must be installed`,
    );
  }

  for (const prohibited of [
    'cytoscape',
    'cytoscape-fcose',
    'cytoscape-dagre',
    'cytoscape-popper',
    'yfiles',
    'react-force-graph-2d',
    '@popperjs/core',
    'tippy.js',
    'cytoscape-navigator',
    'cytoscape-expand-collapse',
    'cytoscape-cola',
    'cytoscape-cose-bilkent',
    'cytoscape-elk',
    'cytoscape-automove',
    'cytoscape-cxtmenu',
  ]) {
    assert.equal(packageJson.dependencies[prohibited], undefined);
    assert.equal(packageJson.devDependencies[prohibited], undefined);
  }
});

test('graph implementation references are documented', () => {
  assert.ok(existsSync('src/ui/graph/GRAPH_REFERENCES.md'));
  const references = readFileSync('src/ui/graph/GRAPH_REFERENCES.md', 'utf8');
  for (const link of [
    'https://reactflow.dev/',
    'https://reactflow.dev/learn',
    'https://github.com/xyflow/xyflow',
    'https://github.com/kieler/elkjs',
    'https://attack.mitre.org/',
    'https://github.com/mitre-attack/attack-stix-data',
    'https://d3fend.mitre.org/',
    'https://d3fend.mitre.org/resources/',
    'https://github.com/usnistgov/oscal-content',
    'https://www.nist.gov/cyberframework',
    'https://csrc.nist.gov/projects/olir',
  ]) {
    assert.match(references, new RegExp(link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('static artifact loading caches requests in memory', () => {
  assert.match(runtimeLoader, /new Map<.*Promise/);
  assert.match(runtimeLoader, /artifactCache\.get/);
  assert.match(runtimeLoader, /artifactCache\.set/);
  assert.match(runtimeLoader, /includeFullGraph/);
  assert.match(reactApp, /requiresFullGraph\(viewState\.view\)/);
});

test('secondary route pages are lazy loaded behind a suspense fallback', () => {
  assert.match(reactApp, /lazy\(\(\) =>\s*import\("\.\/pages\/AtlasMapPage"\)/);
  assert.match(reactApp, /lazy\(\(\) =>\s*import\("\.\/pages\/ComparePage"\)/);
  assert.match(reactApp, /lazy\(\(\) =>\s*import\("\.\/pages\/ObjectDetailPage"\)/);
  assert.match(reactApp, /<Suspense/);
  assert.match(reactApp, /fallback=\{<LoadingStatusPanel/);
});

test('persistent footer uses the approved short disclaimer', () => {
  const footer = readFileSync('src/ui/components/SiteFooter.tsx', 'utf8');
  assert.match(
    footer,
    /Control Atlas is an open-source reference tool\. It does not replace official guidance\./,
  );
});

test('query-string deep link compatibility moves into typed React adapters', () => {
  assert.ok(existsSync('src/ui/lib/hashRoutes.ts'), 'src/ui/lib/hashRoutes.ts must exist');
  assert.match(router, /parseViewState/);
  assert.match(router, /serializeHashLocation/);
  assert.match(router, /serializeHashUrl/);
  assert.match(router, /applyLegacyQueryRedirect/);
});

test('Orbital Archive visual system remains active in the shared stylesheet', () => {
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
  assert.doesNotMatch(html, /fonts\.gstatic\.com/);
  assert.match(css, /--lsm-orbit:\s*#11181e/i);
  assert.match(css, /--lsm-graphite:\s*#253139/i);
  assert.match(css, /--lsm-slate:\s*#2d3a42/i);
  assert.match(css, /--lsm-relay:\s*#54bcd9/i);
  assert.match(css, /--lsm-gold:\s*#cbae67/i);
  assert.match(css, /--lsm-orange:\s*#e66a2c/i);
  assert.match(css, /--lsm-signal:\s*#7eb79e/i);
  assert.match(css, /--lsm-rust:\s*#c97a60/i);
  assert.match(css, /--lsm-fault:\s*#ea7468/i);
  assert.match(css, /Barlow Condensed/);
  assert.match(css, /Inter/);
  assert.match(css, /IBM Plex Mono/);
  assert.doesNotMatch(css, /#[a-f\d]{0,2}(?:7c3aed|d8b4fe|6366f1)/i);
  assert.match(mainEntrypoint, /styles\/orbital\.css/);
  assert.match(orbitalCss, /\.orbital-context/);
  assert.match(orbitalCss, /\.landing-signal-grid/);
});

test('all route contexts and user-facing styles stay inside the Orbital system', () => {
  const contextBar = readFileSync(
    'src/ui/components/OrbitalContextBar.tsx',
    'utf8',
  );
  for (const view of [
    'home',
    'menu',
    'start-here',
    'atlas-map',
    'search',
    'catalog-detail',
    'library-detail',
    'matrix',
    'patterns',
    'templates',
    'sources',
    'commons',
    'commons-detail',
    'about',
    'retired',
    'browse',
    'not-found',
  ]) {
    assert.match(contextBar, new RegExp(`case "${view}"`));
  }

  const implementationFiles = [
    ...readdirSync('src/ui', { recursive: true })
      .map((path) => String(path))
      .filter((path) => /\.(?:css|ts|tsx)$/.test(path))
      .map((path) => readFileSync(`src/ui/${path}`, 'utf8')),
    ...readdirSync('styles')
      .filter((path) => path.endsWith('.css'))
      .map((path) => readFileSync(`styles/${path}`, 'utf8')),
  ].join('\n');
  assert.doesNotMatch(
    implementationFiles,
    /(?:purple|violet|pink|magenta|#(?:7c3aed|d8b4fe|6366f1|4f46e5|a5b4fc))/i,
  );
});

test('shared shell exposes visible search access and valid intent-card markup', () => {
  const topNav = readFileSync('src/ui/components/TopNav.tsx', 'utf8');
  const templatesPage = readFileSync('src/ui/pages/TemplatesPage.tsx', 'utf8');
  const intentCard = readFileSync('src/ui/components/QuickIntentCard.tsx', 'utf8');
  assert.match(topNav, /onClick=\{onOpenSearch\}/);
  assert.match(topNav, /aria-label="Open search"/);
  assert.equal((topNav.match(/<Tabs/g) || []).length, 1);
  assert.match(topNav, /tabs=\{PRIMARY_NAV_ITEMS\.map/);
  assert.match(templatesPage, /className="build-start-layout"/);
  assert.match(templatesPage, /className="build-resource-rail"/);
  assert.doesNotMatch(intentCard, /<h[1-6]>/);
});

test('landing page states what the product is before asking for action', () => {
  const homePage = readFileSync('src/ui/pages/HomePage.tsx', 'utf8');
  assert.match(homePage, /Public reference for federal cyber requirements/);
  assert.match(homePage, /Find published controls, source material, and starter documents/);
  assert.doesNotMatch(homePage, /source-backed/i);
});

test('record detail explains the record before exposing position and relationship counts', () => {
  const detailPage = readFileSync('src/ui/pages/ObjectDetailPage.tsx', 'utf8');
  const meaning = detailPage.indexOf('title="What this is"');
  const why = detailPage.indexOf('Why it matters:');
  const position = detailPage.indexOf('<WhereThisSitsRail');
  const connections = detailPage.indexOf('aria-label="Relationship classes"');
  assert.ok(meaning >= 0 && why > meaning && position > why && connections > position);
});

test('Build local navigation stays subordinate and identifies the current Build branch', () => {
  const localNav = readFileSync('src/ui/components/BuildLocalNav.tsx', 'utf8');
  const buildPage = readFileSync('src/ui/pages/TemplatesPage.tsx', 'utf8');
  const resourcesPage = readFileSync('src/ui/pages/CommonsPage.tsx', 'utf8');
  const resourceDetail = readFileSync('src/ui/pages/CommonsDetailPage.tsx', 'utf8');
  assert.match(localNav, /aria-label="Build sections"/);
  assert.match(localNav, /aria-current/);
  assert.match(localNav, /Tasks/);
  assert.match(localNav, /Starter documents/);
  assert.match(localNav, /Resources/);
  assert.match(buildPage, /<BuildLocalNav/);
  assert.match(resourcesPage, /<BuildLocalNav active="resources"/);
  assert.match(resourceDetail, /<BuildLocalNav active="resources"/);
});

test('route interactions keep canonical context and synchronize visible state', () => {
  const searchOverlay = readFileSync('src/ui/components/SearchOverlay.tsx', 'utf8');
  const atlasMap = readFileSync('src/ui/pages/AtlasMapPage.tsx', 'utf8');
  const explore = readFileSync('src/ui/pages/ExplorePage.tsx', 'utf8');
  assert.match(searchOverlay, /onOpenNode\(nodeId,\s*"search"\)/);
  assert.match(atlasMap, /loadAtlasNeighborhood\(nodeId\)/);
  assert.match(atlasMap, /buildAtlasGroups\(record, filters\)/);
  assert.match(atlasMap, /buildAtlasRows\(record, filters\)/);
  assert.match(atlasMap, /relationshipView: viewId/);
  assert.match(atlasMap, /relationshipGroup/);
  assert.doesNotMatch(atlasMap, /RelationshipExplorer/);
  assert.match(explore, /visibleDocumentRows\.length > 0/);
  assert.match(explore, /searchExploreResources/);
  assert.match(explore, /Official resources/);
  assert.match(explore, /No matching connected records found/);
});

test('template options use collapsed progressive disclosure and associated hints', () => {
  const templatesPage = readFileSync('src/ui/pages/TemplatesPage.tsx', 'utf8');
  assert.doesNotMatch(templatesPage, /defaultValue="options"/);
  assert.match(templatesPage, /<h2>\{selectedTemplate\.display_name\}<\/h2>/);
  assert.match(templatesPage, /hint="Which control catalog/);
  assert.match(templatesPage, /hint="Where the system runs/);
  // CATL-09: Format help is per-template/per-format, not a single generic
  // "Markdown, CSV, or JSON" string.
  assert.match(templatesPage, /FORMAT_HELP\[activeFormat\]/);
  assert.doesNotMatch(templatesPage, /Markdown, CSV, or JSON/);
  assert.match(templatesPage, /return "Starter document"/);
  assert.doesNotMatch(templatesPage, /Search companions by name or purpose/);
});

test('playbooks use task-first guidance instead of generic feature copy', () => {
  const playbooksPage = readFileSync('src/ui/pages/PlaybooksPage.tsx', 'utf8');
  assert.doesNotMatch(playbooksPage, /Use task-focused guidance/);
  assert.match(playbooksPage, /summary=\{selectedPattern\.summary\}/);
  assert.match(playbooksPage, /title="Use this when"/);
  assert.match(playbooksPage, /title="What to do"/);
  assert.match(playbooksPage, /title="What to avoid"/);
  assert.match(playbooksPage, /title="Limits of this guide"/);
  assert.match(playbooksPage, /No playbooks match this search and category/);
  assert.match(playbooksPage, /Clear filters/);
  assert.match(playbooksPage, /displayNameFor\("template_type", templateId\)/);
});
