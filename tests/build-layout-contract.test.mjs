import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const pagesWorkflow = readFileSync('.github/workflows/pages.yml', 'utf8');
const publicSyncTool = readFileSync('tools/sync-public.mjs', 'utf8');
const domSmoke = readFileSync('scripts/dom-smoke.mjs', 'utf8');
const staticSmoke = readFileSync('scripts/static-smoke.mjs', 'utf8');
const playwrightConfig = readFileSync('playwright.config.mjs', 'utf8');

const siteBuilder = existsSync('tools/build-static-site.mjs')
  ? readFileSync('tools/build-static-site.mjs', 'utf8')
  : '';

test('control atlas source of truth builds through Vite into the staged static output', () => {
  for (const path of [
    'src/index.html',
    'src/main.tsx',
    'src/ui/App.tsx',
    'src/ui/lib/viewState.ts',
    'src/styles/app.css',
    'vite.config.ts',
    'tools/build-static-site.mjs',
  ]) {
    assert.ok(existsSync(path), `${path} must exist`);
  }

  assert.equal(packageJson.scripts['build:site'], 'node ./tools/build-static-site.mjs');
  assert.match(siteBuilder, /vite build/);
  assert.match(siteBuilder, /dist\/site/);
  assert.match(packageJson.scripts.precommit, /npm run build:site/);
  assert.match(pagesWorkflow, /npm run build:site/);
  assert.match(pagesWorkflow, /path:\s*'dist\/site'/);
  assert.match(publicSyncTool, /dist-public/);
  assert.match(publicSyncTool, /dist\/site/);
});

test('static smoke checks validate the Vite output instead of the legacy app bundle', () => {
  assert.match(domSmoke, /src\/main\.tsx/);
  assert.match(domSmoke, /src\/ui\/App\.tsx/);
  assert.match(domSmoke, /src\/index\.html/);
  assert.match(staticSmoke, /dist\/site\/index\.html/);
  assert.match(staticSmoke, /dist\/site\/assets\//);
  assert.doesNotMatch(staticSmoke, /dist\/site\/app\/app\.mjs/);
});

test('playwright e2e server stays on loopback for deterministic local browser access', () => {
  assert.match(playwrightConfig, /baseURL:\s*'http:\/\/localhost:4317'/);
  assert.match(playwrightConfig, /url:\s*'http:\/\/localhost:4317'/);
  assert.doesNotMatch(playwrightConfig, /networkInterfaces/);
  assert.match(readFileSync('tools/serve-static-site.mjs', 'utf8'), /listen\(PORT,\s*'localhost'/);
});
