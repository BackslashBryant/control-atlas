#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonAtomically } from './lib/write-json-atomically.mjs';
import {
  INGESTION_STAGES,
  INGESTION_TASKS,
  validateIngestionPipelineDefinition,
} from './lib/ingestion-pipeline.mjs';
import {
  loadSourceRefreshContract,
  validateSourceRefreshContract,
} from './lib/source-refresh-contract.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(ROOT, 'data', 'ingestion-pipeline-manifest.json');
const startedAt = new Date().toISOString();
const results = [];

function saveManifest(status, failedTask = null) {
  writeJsonAtomically(MANIFEST, {
    schema_version: '1.0',
    pipeline: 'Control Atlas public-source ingestion',
    stages: INGESTION_STAGES,
    started_at: startedAt,
    completed_at: status === 'running' ? null : new Date().toISOString(),
    status,
    failed_task: failedTask,
    results,
  });
}

function run(task) {
  console.log(`\n==> [${task.stages.join(' + ')}] ${task.id}`);
  const taskArguments = task.args || [];
  const nodeArguments = task.script === 'fetch-disa-stigs.mjs' && process.platform === 'win32'
    ? ['--max-old-space-size=1024', '--expose-gc', join(ROOT, 'scripts', task.script), ...taskArguments]
    : [join(ROOT, 'scripts', task.script), ...taskArguments];
  const taskStarted = Date.now();
  let lastStatus = null;
  for (let attempt = 1; attempt <= task.retries; attempt += 1) {
    const result = spawnSync(process.execPath, nodeArguments, {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, CONTROL_ATLAS_REQUIRE_FRESH_FETCH: '1' },
    });
    lastStatus = result.status;
    if (result.status === 0) {
      results.push({
        task_id: task.id,
        script: task.script,
        args: taskArguments,
        stages: task.stages,
        scope: task.scope,
        status: 'complete',
        attempts: attempt,
        duration_ms: Date.now() - taskStarted,
      });
      saveManifest('running');
      return;
    }
    if (attempt < task.retries) {
      console.warn(`${task.script} failed on attempt ${attempt}; retrying the same fresh publisher operation.`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 2_000);
    }
  }
  results.push({
    task_id: task.id,
    script: task.script,
    args: taskArguments,
    stages: task.stages,
    scope: task.scope,
    status: 'failed',
    attempts: task.retries,
    duration_ms: Date.now() - taskStarted,
    exit_status: lastStatus,
  });
  saveManifest('failed', task.id);
  throw new Error(`${task.script} failed with exit ${lastStatus} after ${task.retries} attempt(s)`);
}

async function main() {
  const definitionErrors = validateIngestionPipelineDefinition();
  if (definitionErrors.length) throw new Error(`Invalid ingestion pipeline:\n- ${definitionErrors.join('\n- ')}`);
  const refreshContractErrors = validateSourceRefreshContract(
    loadSourceRefreshContract(),
    INGESTION_TASKS,
    readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8'),
    JSON.parse(readFileSync(join(ROOT, 'data', 'source-registry.json'), 'utf8')),
  );
  if (refreshContractErrors.length) {
    throw new Error(`Invalid source refresh contract:\n- ${refreshContractErrors.join('\n- ')}`);
  }
  saveManifest('running');
  for (const task of INGESTION_TASKS) run(task);
  saveManifest('complete');
  console.log('\nrefresh:data complete — every ingestion stage is recorded in data/ingestion-pipeline-manifest.json');
}

main().catch((error) => {
  if (!results.some((result) => result.status === 'failed')) saveManifest('failed', 'pipeline-definition');
  console.error(error.message);
  process.exit(1);
});
