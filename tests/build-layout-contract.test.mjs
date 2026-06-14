import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const pagesWorkflow = readFileSync('.github/workflows/pages.yml', 'utf8');
const publicSyncTool = readFileSync('tools/sync-public.mjs', 'utf8');
const domSmoke = readFileSync('scripts/dom-smoke.mjs', 'utf8');
const staticSmoke = readFileSync('scripts/static-smoke.mjs', 'utf8');
const runtimeTest = readFileSync('tests/framework-runtime.test.mjs', 'utf8');

test('control atlas source of truth moves into src and builds from a staged output', () => {
  for (const path of [
    'src/index.html',
    'src/app/app.mjs',
    'src/app/runtime.mjs',
    'src/content/pageIntros.mjs',
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
  assert.match(runtimeTest, /\.\.\/src\/app\/runtime\.mjs/);
});
