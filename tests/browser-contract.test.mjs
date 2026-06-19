import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync('src/index.html', 'utf8');
const css = readFileSync('src/styles/app.css', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const mainEntrypoint = existsSync('src/main.tsx') ? readFileSync('src/main.tsx', 'utf8') : '';
const reactApp = existsSync('src/ui/App.tsx') ? readFileSync('src/ui/App.tsx', 'utf8') : '';
const router = existsSync('src/ui/lib/viewState.ts') ? readFileSync('src/ui/lib/viewState.ts', 'utf8') : '';

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
  assert.match(reactApp, /Start Here/);
  assert.match(reactApp, /Library/);
  assert.match(reactApp, /Compare/);
  assert.match(reactApp, /Patterns/);
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
