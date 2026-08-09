#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(label, script) {
  console.log(`\n==> ${label}`);
  const nodeArguments = script === 'fetch-disa-stigs.mjs' && process.platform === 'win32'
    ? ['--max-old-space-size=1024', '--expose-gc', join(ROOT, 'scripts', script)]
    : [join(ROOT, 'scripts', script)];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = spawnSync(process.execPath, nodeArguments, {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, CONTROL_ATLAS_REQUIRE_FRESH_FETCH: '1' },
    });
    if (result.status === 0) return;
    if (attempt === 3) {
      throw new Error(`${script} failed with exit ${result.status} after ${attempt} attempts`);
    }
    console.warn(`${script} failed on attempt ${attempt}; retrying the same fresh publisher fetch.`);
    // Defender/indexing can briefly retain a just-replaced JSON file on this
    // Windows host. Wait before retrying the exact stage; no cached input or
    // stale output is accepted as a substitute for the fresh fetch.
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 2_000);
  }
}

async function main() {
  // Keep every refresh stage in its own process. On Windows the in-process
  // framework fetch can retain a file handle long enough to make the next
  // NARA manifest rewrite fail with an opaque `open` error, despite the same
  // strict NARA fetch succeeding independently.
  run('fetch-framework-catalogs', 'fetch-framework-catalogs.mjs');
  run('fetch-fedramp-2026-rules', 'fetch-fedramp-2026-rules.mjs');
  run('fetch-nara-cui-registry', 'fetch-nara-cui-registry.mjs');
  run('fetch-olir-catalog', 'fetch-olir-catalog.mjs');
  run('fetch-olir-mappings', 'fetch-olir-mappings.mjs');
  run('fetch-ccis', 'fetch-ccis.mjs');
  run('fetch-stig-source-observations', 'fetch-stig-source-observations.mjs');
  run('fetch-disa-stigs', 'fetch-disa-stigs.mjs');
  run('fetch-mitre-data', 'fetch-mitre-data.mjs');
  run('sync-catalog-source-bundles', 'sync-catalog-source-bundles.mjs');
  run('hydrate-artifacts', 'hydrate-artifacts.mjs');
  run('reconcile-source-freshness', 'reconcile-source-freshness.mjs');
  run('build-framework-data', 'build-framework-data.mjs');
  run('reconcile-artifact-counts', 'reconcile-artifact-counts.mjs');
  run('check-data-size', 'check-data-size.mjs');
  run('audit-coverage', 'audit-coverage.mjs');
  run('verify-discovery', 'verify-discovery.mjs');
  run('verify-manifests', 'verify-manifests.mjs');
  console.log('\nrefresh:data complete');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
