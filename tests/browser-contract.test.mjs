import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync('src/index.html', 'utf8');
const css = readFileSync('styles/tokens.css', 'utf8');
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
  assert.match(html, /The public map for federal cyber compliance/);
  assert.match(html, /Search controls, trace framework connections/);
  assert.match(html, /id="root"/);
  assert.ok(existsSync('src/main.tsx'), 'src/main.tsx must exist');
  assert.ok(existsSync('src/ui/App.tsx'), 'src/ui/App.tsx must exist');
  assert.match(mainEntrypoint, /createRoot/);
  assert.match(mainEntrypoint, /StrictMode/);
  assert.match(mainEntrypoint, /from 'react'/);
  assert.match(mainEntrypoint, /from 'react-dom\/client'/);
});

test('shell removes the old mode toggle and uses the translation-first nav order', () => {
  assert.doesNotMatch(html, /btn-toggle-mode/);
  assert.doesNotMatch(html, /Plain labels/);
  assert.doesNotMatch(html, /Technical labels/);
  const navigation = readFileSync('src/ui/lib/navigation.ts', 'utf8');
  assert.match(navigation, /Start/);
  assert.match(navigation, /Compare/);
  assert.match(navigation, /Playbooks/);
  assert.match(navigation, /Starter documents/);
  assert.match(navigation, /Sources/);
  assert.match(navigation, /Search/);
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

test('calm brand entry and bounded diagram graph contracts are present', () => {
  const app = readFileSync('src/ui/App.tsx', 'utf8');
  const brand = readFileSync('src/ui/components/BrandLockup.tsx', 'utf8');
  assert.doesNotMatch(app, /BrandEntranceOverlay/);
  assert.match(brand, /Public reference tool/);
  assert.doesNotMatch(brand, /setInterval|BRAND_WORDS/);
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

test('dark atlas visual system remains active in the shared stylesheet', () => {
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
  assert.doesNotMatch(html, /fonts\.gstatic\.com/);
  assert.match(css, /--ca-bg:\s*#10131A/i);
  assert.match(css, /--ca-surface:\s*#1C212B/i);
  assert.match(css, /--ca-primary:\s*#2563EB/i);
  assert.match(css, /--ca-secondary:\s*#22D3EE/i);
  assert.match(css, /Space Grotesk/);
  assert.match(css, /Public Sans/);
  assert.match(css, /JetBrains Mono/);
});

test('shared shell exposes visible search access and valid intent-card markup', () => {
  const topNav = readFileSync('src/ui/components/TopNav.tsx', 'utf8');
  const intentCard = readFileSync('src/ui/components/QuickIntentCard.tsx', 'utf8');
  assert.match(topNav, /onClick=\{onOpenSearch\}/);
  assert.match(topNav, /aria-label="Open search"/);
  assert.doesNotMatch(intentCard, /<h[1-6]>/);
});

test('landing page states what the product is before asking for action', () => {
  const homePage = readFileSync('src/ui/pages/HomePage.tsx', 'utf8');
  assert.match(homePage, /The public map for federal cyber compliance/);
  assert.match(homePage, /Search controls, trace\s+framework connections/);
  assert.doesNotMatch(homePage, /source-backed/i);
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
