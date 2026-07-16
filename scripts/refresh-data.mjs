#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(label, script) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(process.execPath, [join(ROOT, 'scripts', script)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, CONTROL_ATLAS_REQUIRE_FRESH_FETCH: '1' },
  });
  if (result.status !== 0) {
    throw new Error(`${script} failed with exit ${result.status}`);
  }
}

async function main() {
  await import('./fetch-framework-catalogs.mjs').then((m) => m.fetchFrameworkCatalogs());
  run('fetch-olir-mappings', 'fetch-olir-mappings.mjs');
  run('fetch-ccis', 'fetch-ccis.mjs');
  run('fetch-stig-source-observations', 'fetch-stig-source-observations.mjs');
  run('fetch-disa-stigs', 'fetch-disa-stigs.mjs');
  run('fetch-mitre-data', 'fetch-mitre-data.mjs');
  run('reconcile-source-freshness', 'reconcile-source-freshness.mjs');
  run('build-framework-data', 'build-framework-data.mjs');
  run('check-data-size', 'check-data-size.mjs');
  run('audit-coverage', 'audit-coverage.mjs');
  console.log('\nrefresh:data complete');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
