import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync('src/index.html', 'utf8');
const css = readFileSync('src/styles/app.css', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const mainEntrypoint = existsSync('src/main.tsx') ? readFileSync('src/main.tsx', 'utf8') : '';
const reactApp = existsSync('src/ui/App.tsx') ? readFileSync('src/ui/App.tsx', 'utf8') : '';
const router = existsSync('src/ui/lib/viewState.ts') ? readFileSync('src/ui/lib/viewState.ts', 'utf8') : '';
const runtimeLoader = existsSync('src/ui/lib/runtimeLoader.ts')
  ? readFileSync('src/ui/lib/runtimeLoader.ts', 'utf8')
  : '';
const relationshipExplorer = existsSync('src/ui/components/RelationshipExplorer.tsx')
  ? readFileSync('src/ui/components/RelationshipExplorer.tsx', 'utf8')
  : '';
const relationshipGraph = existsSync('src/ui/components/RelationshipGraph.tsx')
  ? readFileSync('src/ui/components/RelationshipGraph.tsx', 'utf8')
  : '';

test('shell identifies Control Atlas and boots a React root', () => {
  assert.match(html, /Control Atlas/);
  assert.match(html, /Ctrl\+Alt\+Comply/);
  assert.match(html, /The public map for federal cyber compliance/);
  assert.match(html, /Search controls, trace source-backed links/);
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
  assert.ok(existsSync('src/ui/App.tsx'), 'src/ui/App.tsx must exist');
  assert.match(reactApp, /Start/);
  assert.match(reactApp, /Explore/);
  assert.match(reactApp, /Compare/);
  assert.match(reactApp, /Playbooks/);
  assert.match(reactApp, /Templates/);
  assert.match(reactApp, /Sources/);
  assert.doesNotMatch(reactApp, /Crosswalks/);
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

test('approved v2.2 brand entrance and fCoSE graph contracts are present', () => {
  assert.ok(
    existsSync('src/ui/components/BrandEntrance.tsx'),
    'BrandEntrance component must exist',
  );
  const entrance = readFileSync('src/ui/components/BrandEntrance.tsx', 'utf8');
  assert.match(entrance, /ca_intro_seen/);
  assert.match(entrance, /prefers-reduced-motion/);
  assert.match(entrance, /Ctrl \+ Alt \+ Comply/);
  assert.equal(typeof packageJson.dependencies.cytoscape, 'string');
  assert.equal(typeof packageJson.dependencies['cytoscape-fcose'], 'string');
  assert.equal(packageJson.dependencies['react-force-graph-2d'], undefined);
  assert.match(relationshipGraph, /nodeDimensionsIncludeLabels:\s*true/);
  assert.match(relationshipGraph, /quality:\s*["']default["']/);
  assert.match(relationshipGraph, /packComponents:\s*true/);
  assert.match(relationshipGraph, /animationDuration:\s*400/);
  assert.match(relationshipExplorer, /lazy\(\(\) => import\(/);
});

test('static artifact loading caches requests in memory', () => {
  assert.match(runtimeLoader, /new Map<.*Promise/);
  assert.match(runtimeLoader, /artifactCache\.get/);
  assert.match(runtimeLoader, /artifactCache\.set/);
  assert.match(runtimeLoader, /includeFullGraph/);
  assert.match(reactApp, /requiresFullGraph\(viewState\.view\)/);
});

test('persistent footer uses the approved short disclaimer', () => {
  assert.match(
    reactApp,
    /Control Atlas is an open-source reference tool\. It does not replace official guidance\./,
  );
});

test('query-string deep link compatibility moves into typed React adapters', () => {
  assert.ok(existsSync('src/ui/lib/viewState.ts'), 'src/ui/lib/viewState.ts must exist');
  assert.match(router, /parseViewState/);
  assert.match(router, /serializeViewState/);
  assert.match(router, /normalizeViewState/);
  assert.doesNotMatch(router, /mode/);
});

test('dark atlas visual system remains active in the shared stylesheet', () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(css, /--ca-bg:\s*#0B1020/i);
  assert.match(css, /--ca-surface:\s*#111827/i);
  assert.match(css, /--ca-primary:\s*#2563EB/i);
  assert.match(css, /--ca-secondary:\s*#22D3EE/i);
  assert.match(css, /Space Grotesk/);
  assert.match(css, /Public Sans/);
  assert.match(css, /JetBrains Mono/);
});
