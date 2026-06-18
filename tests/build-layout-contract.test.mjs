import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const pagesWorkflow = readFileSync('.github/workflows/pages.yml', 'utf8');
const publicSyncTool = readFileSync('tools/sync-public.mjs', 'utf8');
const domSmoke = readFileSync('scripts/dom-smoke.mjs', 'utf8');
const staticSmoke = readFileSync('scripts/static-smoke.mjs', 'utf8');
const runtimeTest = readFileSync('tests/framework-runtime.test.mjs', 'utf8');
const playwrightConfig = readFileSync('playwright.config.mjs', 'utf8');

test('control atlas source of truth moves into src and builds from a staged output', () => {
  for (const path of [
    'src/index.html',
    'src/app/app.mjs',
    'src/app/runtime.mjs',
    'src/content/pageIntros.mjs',
    'src/lib/minisearch.js',
    'src/styles/app.css',
    'tools/build-static-site.mjs',
  ]) {
    assert.ok(existsSync(path), `${path} must exist`);
  }

  assert.equal(packageJson.scripts['build:site'], 'node ./tools/build-static-site.mjs');
  assert.match(packageJson.scripts.precommit, /npm run build:site/);
  assert.match(pagesWorkflow, /npm run build:site/);
  assert.match(pagesWorkflow, /path:\s*'dist\/site'/);
  assert.match(publicSyncTool, /dist-public/);
  assert.match(publicSyncTool, /dist\/site/);
  assert.match(domSmoke, /src\/app\/app\.mjs/);
  assert.match(domSmoke, /src\/index\.html/);
  assert.match(staticSmoke, /dist\/site\/index\.html/);
  assert.match(staticSmoke, /dist\/site\/app\/app\.mjs/);
  assert.match(staticSmoke, /dist\/site\/lib\/minisearch\.js/);
  assert.match(staticSmoke, /dist\/site\/lib\/d3\.min\.js/);
  assert.match(runtimeTest, /\.\.\/src\/app\/runtime\.mjs/);
});

test('staged build publishes the generated library search artifact', () => {
  const siteBuilder = readFileSync('tools/build-static-site.mjs', 'utf8');
  assert.match(siteBuilder, /library-search\.json/);
  assert.match(siteBuilder, /src\/lib/);
  assert.match(siteBuilder, /lib\/d3\.min\.js/);
});

test('playwright e2e server stays on loopback for deterministic local browser access', () => {
  assert.match(playwrightConfig, /baseURL:\s*'http:\/\/localhost:4317'/);
  assert.match(playwrightConfig, /url:\s*'http:\/\/localhost:4317'/);
  assert.doesNotMatch(playwrightConfig, /networkInterfaces/);
  assert.match(readFileSync('tools/serve-static-site.mjs', 'utf8'), /listen\(PORT,\s*'localhost'/);
});
