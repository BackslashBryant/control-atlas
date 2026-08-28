#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { classifyNameStatus } from './classify-change-scope.mjs';

const AUTOMATION_TESTS = new Set([
  'tests/build-layout-contract.test.mjs',
  'tests/change-scope.test.mjs',
  'tests/experience-guardian.test.mjs',
  'tests/package-scripts.test.mjs',
  'tests/process-runner.test.mjs',
  'tests/release-evidence.test.mjs',
  'tests/verification-topology.test.mjs',
  'tests/verify-affected.test.mjs',
  'tests/vale-extraction.test.mjs',
  'tests/wait-for-checks.test.mjs',
]);

function addStep(steps, step) {
  if (!steps.some((candidate) => candidate.id === step.id)) steps.push(step);
}

export function createVerificationPlan(paths, changeMap) {
  const steps = [];
  const e2ePaths = paths.filter((path) => path.startsWith('tests/e2e/') && path.endsWith('.mjs'));
  const nodeTests = paths.filter((path) =>
    path.startsWith('tests/') && path.endsWith('.test.mjs') &&
    !AUTOMATION_TESTS.has(path) &&
    !path.startsWith('tests/e2e/') &&
    path !== 'tests/federal-graph-contract.test.mjs' &&
    path !== 'tests/stig-source-observer.test.mjs' &&
    path !== 'tests/strict-conditional-fetch.test.mjs' &&
    path !== 'tests/write-json-atomically.test.mjs');
  const graphTests = paths.filter((path) => path.startsWith('tests/graph/') && path.endsWith('.test.ts'));
  const sourceTrustChanged = paths.some((path) =>
    path === 'src/ui/pages/SourcesPage.tsx' ||
    path === 'src/ui/pages/CatalogDetailPage.tsx' ||
    path === 'src/ui/pages/ObjectDetailPage.tsx' ||
    path === 'src/ui/lib/sourceRegister.ts' ||
    path === 'src/ui/lib/sourcePresentation.ts' ||
    path === 'src/shared/source-text-presentation.mjs' ||
    path.includes('source-truth') ||
    path === 'tests/e2e/source-trust-surfaces.spec.mjs');
  const compareWorkbenchChanged = paths.some((path) =>
    path === 'src/ui/pages/ComparePage.tsx' ||
    path === 'src/ui/lib/comparePagination.ts' ||
    path === 'tests/graph/comparePagination.test.ts' ||
    path === 'tests/e2e/compare-map.spec.mjs' ||
    path === 'tests/e2e/compare-pagination.spec.mjs' ||
    path === 'tests/e2e/compare-cross-route-corruption.spec.mjs');
  const boundedWorkbenchesChanged = paths.some((path) =>
    path === 'src/ui/pages/AtlasMapPage.tsx' ||
    path === 'src/ui/pages/ExplorePage.tsx' ||
    path === 'src/ui/pages/CommonsPage.tsx' ||
    path === 'src/ui/components/LibraryAtlasMap.tsx' ||
    path === 'tests/e2e/atlas-map-focused-control.spec.mjs' ||
    path === 'tests/e2e/epic14-ws3-workspace-template.spec.mjs');
  const phase4SurfacesChanged = paths.some((path) =>
    path === 'data/template-registry.json' ||
    path === 'src/app/learn-content.mjs' ||
    path === 'src/app/template-engine.mjs' ||
    path === 'src/ui/components/LoadStatusPanel.tsx' ||
    path === 'src/ui/components/QuickIntentCard.tsx' ||
    path === 'src/ui/components/SearchOverlay.tsx' ||
    path === 'src/ui/pages/PlaybooksPage.tsx' ||
    path === 'src/ui/pages/TemplatesPage.tsx' ||
    path === 'tests/e2e/phase4-content-coherence.spec.mjs');
  const stigObservationChanged = paths.some((path) =>
    path === 'scripts/fetch-stig-source-observations.mjs' ||
    path === 'tests/stig-source-observer.test.mjs');
  const incrementalDataChanged = paths.some((path) =>
    path === 'scripts/lib/strict-conditional-fetch.mjs' ||
    path === 'scripts/lib/write-json-atomically.mjs' ||
    path === 'tests/strict-conditional-fetch.test.mjs' ||
    path === 'tests/write-json-atomically.test.mjs');
  const operatorEcosystemChanged = paths.some((path) =>
    path === 'scripts/apply-commons-operator-ecosystem.mjs' ||
    path === 'scripts/lib/url-classification.mjs' ||
    path === 'tests/commons-operator-ecosystem.test.mjs');
  const phase4DataChanged = paths.some((path) => path === 'data/template-registry.json');
  const mappedData = stigObservationChanged || incrementalDataChanged || operatorEcosystemChanged || phase4DataChanged;
  const mappedRuntime = changeMap.dependenciesChanged || sourceTrustChanged || compareWorkbenchChanged || boundedWorkbenchesChanged || phase4SurfacesChanged || mappedData || e2ePaths.length > 0;

  if (changeMap.evidenceOnly) {
    addStep(steps, {
      id: 'evidence-contracts',
      command: ['node', '--test', 'tests/change-scope.test.mjs', 'tests/release-evidence.test.mjs'],
      expectedTests: 10,
      workers: 1,
      budgetSeconds: 3,
    });
  }

  if (changeMap.automationChanged) {
    addStep(steps, {
      id: 'automation-lint', command: ['npm', 'run', 'lint:automation'],
      expectedTests: 0, workers: 1, budgetSeconds: 5,
    });
    addStep(steps, {
      id: 'automation-contracts', command: ['npm', 'run', 'test:ci-contracts'],
      expectedTests: 50, workers: 1, budgetSeconds: 5,
    });
  }
  if (changeMap.dependenciesChanged) {
    addStep(steps, {
      id: 'lockfile-integrity', command: ['npm', 'run', 'verify:lockfile'],
      expectedTests: 0, workers: 1, budgetSeconds: 10,
    });
    addStep(steps, {
      id: 'dependency-audit', command: ['npm', 'run', 'audit:deps'],
      expectedTests: 0, workers: 1, budgetSeconds: 20,
    });
    addStep(steps, {
      id: 'dependency-licenses', command: ['npm', 'run', 'license:check'],
      expectedTests: 0, workers: 1, budgetSeconds: 10,
    });
    addStep(steps, {
      id: 'dependency-sbom', command: ['npm', 'run', 'sbom:generate'],
      expectedTests: 0, workers: 1, budgetSeconds: 30,
    });
  }

  if (operatorEcosystemChanged) {
    addStep(steps, {
      id: 'operator-ecosystem-lint', command: ['npm', 'run', 'lint:operator-ecosystem'],
      expectedTests: 0, workers: 1, budgetSeconds: 5,
    });
    addStep(steps, {
      id: 'operator-ecosystem-contracts', command: ['npm', 'run', 'test:operator-ecosystem'],
      expectedTests: 11, workers: 1, budgetSeconds: 5,
    });
  }

  if (changeMap.contentChanged) {
    addStep(steps, {
      id: 'documentation-contracts', command: ['npm', 'run', 'test:documentation-contracts'],
      expectedTests: 3, workers: 1, budgetSeconds: 5,
    });
  }

  if (changeMap.buildRequired) {
    addStep(steps, {
      id: 'typecheck', command: ['npm', 'run', 'typecheck'],
      expectedTests: 0, workers: 1, budgetSeconds: 20,
    });
    const fullBuild = changeMap.buildMode === 'full';
    addStep(steps, {
      id: fullBuild ? 'full-site-build' : 'incremental-site-build',
      command: ['npm', 'run', fullBuild ? 'build:site' : 'build:site:incremental'],
      expectedTests: 0, workers: 1, budgetSeconds: fullBuild ? 120 : 10,
    });
  }

  if (changeMap.dependenciesChanged) {
    addStep(steps, {
      id: 'dependency-runtime-contracts',
      command: ['node', '--test', 'tests/graph-layout.test.mjs', 'tests/browser-contract.test.mjs'],
      expectedTests: 33,
      workers: 1,
      budgetSeconds: 15,
    });
    addStep(steps, {
      id: 'dependency-office-contracts',
      command: ['npm', 'run', 'test:affected:graph', '--',
        'tests/template-office-export.test.mjs',
        'tests/graph/compareExport.test.ts'],
      expectedTests: 14,
      workers: 1,
      budgetSeconds: 30,
    });
    addStep(steps, {
      id: 'dependency-browser-smoke',
      command: ['npm', 'run', 'test:e2e:run', '--',
        'tests/e2e/v1-practitioner-workflows.spec.mjs',
        'tests/e2e/atlas-map-focused-control.spec.mjs',
        '--grep',
        'V1 workflow 01|focused Atlas opens straight'],
      expectedTests: 2,
      workers: 2,
      budgetSeconds: 45,
    });
  }

  if (nodeTests.length > 0) {
    addStep(steps, {
      id: 'changed-node-tests', command: ['node', '--test', ...nodeTests],
      expectedTests: nodeTests.length, workers: 1, budgetSeconds: 10,
    });
  }
  if (graphTests.length > 0) {
    addStep(steps, {
      id: 'changed-graph-tests', command: ['npm', 'run', 'test:affected:graph', '--', ...graphTests],
      expectedTests: graphTests.length, workers: 1, budgetSeconds: 30,
    });
  }
  if (paths.includes('tests/federal-graph-contract.test.mjs')) {
    addStep(steps, {
      id: 'federal-graph-contract',
      command: ['node', '--test', '--test-concurrency=1', 'tests/federal-graph-contract.test.mjs'],
      expectedTests: 36, workers: 1, budgetSeconds: 15,
    });
  }
  if (stigObservationChanged) {
    addStep(steps, {
      id: 'stig-observer-lint', command: ['npm', 'run', 'lint:stig-observer'],
      expectedTests: 0, workers: 1, budgetSeconds: 5,
    });
    addStep(steps, {
      id: 'stig-observer-contracts', command: ['npm', 'run', 'test:stig-observer'],
      expectedTests: 7, workers: 1, budgetSeconds: 5,
    });
  }
  if (incrementalDataChanged) {
    addStep(steps, {
      id: 'incremental-data-lint', command: ['npm', 'run', 'lint:incremental-data'],
      expectedTests: 0, workers: 1, budgetSeconds: 5,
    });
    addStep(steps, {
      id: 'incremental-data-contracts', command: ['npm', 'run', 'test:incremental-data'],
      expectedTests: 3, workers: 1, budgetSeconds: 5,
    });
  }

  if (sourceTrustChanged) {
    addStep(steps, {
      id: 'source-truth-contract', command: ['npm', 'run', 'verify:source-truth'],
      expectedTests: 0, workers: 1, budgetSeconds: 10,
    });
    addStep(steps, {
      id: 'source-trust-browser',
      command: ['npm', 'run', 'test:e2e:run', '--',
        'tests/e2e/sources-inspector-state.spec.mjs',
        'tests/e2e/source-truth-presentation.spec.mjs',
        'tests/e2e/source-trust-surfaces.spec.mjs'],
      expectedTests: 21, workers: 2, budgetSeconds: 60,
    });
    addStep(steps, {
      id: 'source-identity-compatibility-browser',
      command: ['npm', 'run', 'test:e2e:run', '--',
        'tests/e2e/publication-identity.spec.mjs',
        'tests/e2e/epic14-ws2-record-template.spec.mjs',
        '--grep',
        'publication pages use|OSCAL-fed records|WS2 exposes governed'],
      expectedTests: 3, workers: 2, budgetSeconds: 30,
    });
  }
  if (compareWorkbenchChanged) {
    addStep(steps, {
      id: 'compare-workbench-browser',
        command: ['npm', 'run', 'test:e2e:run', '--',
          'tests/e2e/compare-map.spec.mjs',
          'tests/e2e/compare-pagination.spec.mjs',
          'tests/e2e/compare-cross-route-corruption.spec.mjs',
          '--grep',
          'Frameworks reveals|large Compare results|Templates shows cards|evidence section content'],
        expectedTests: 4, workers: 2, budgetSeconds: 45,
      });
  }
  if (boundedWorkbenchesChanged) {
    addStep(steps, {
      id: 'bounded-workbench-browser',
      command: ['npm', 'run', 'test:e2e:run', '--',
        'tests/e2e/atlas-map-focused-control.spec.mjs',
        'tests/e2e/epic14-ws3-workspace-template.spec.mjs',
        '--grep',
        'focused Atlas opens straight|WS3 Library communicates|WS3 Resources shares'],
      expectedTests: 3, workers: 2, budgetSeconds: 45,
    });
  }
  if (phase4SurfacesChanged) {
    addStep(steps, {
      id: 'phase4-surface-browser',
      command: ['npm', 'run', 'test:e2e:run', '--',
        'tests/e2e/phase4-content-coherence.spec.mjs',
        'tests/e2e/load-resilience.spec.mjs',
        'tests/e2e/complete-search-artifact.spec.mjs',
        '--grep',
        'Phase 4|load resilience surfaces retry|a failed complete search artifact'],
      expectedTests: 7,
      workers: 2,
      budgetSeconds: 60,
    });
  }
  if (!sourceTrustChanged && !compareWorkbenchChanged && !boundedWorkbenchesChanged && !phase4SurfacesChanged && e2ePaths.length > 0) {
    addStep(steps, {
      id: 'changed-browser-tests',
      command: ['npm', 'run', 'test:e2e:run', '--', ...e2ePaths],
      expectedTests: e2ePaths.length, workers: 2, budgetSeconds: 60,
    });
  }

  const reasons = [];
  if (changeMap.reason.includes('unknown')) reasons.push('unmapped changed path');
  if (changeMap.dataChanged && !mappedData) {
    reasons.push('data changes require a source-specific refresh plan');
  }
  if (changeMap.browserRequired && !mappedRuntime && e2ePaths.length === 0) {
    reasons.push('runtime browser surface is not mapped to a bounded route-family check');
  }
  for (const step of steps) {
    if (step.expectedTests > 50) reasons.push(`${step.id} exceeds the 50-test iteration limit`);
    if (step.budgetSeconds > 120) reasons.push(`${step.id} exceeds the two-minute iteration limit`);
  }

  return {
    blocked: reasons.length > 0,
    reasons,
    paths,
    changeMap,
    steps,
    totalExpectedTests: steps.reduce((total, step) => total + step.expectedTests, 0),
    totalBudgetSeconds: steps.reduce((total, step) => total + step.budgetSeconds, 0),
  };
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? '' : process.argv[index + 1] ?? '';
}

function resolveBase() {
  const requested = argumentValue('--base');
  if (requested) return requested;
  return execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { encoding: 'utf8' }).trim();
}

function commandLabel(command) {
  return command.map((part) => part.includes(' ') ? JSON.stringify(part) : part).join(' ');
}

function runStep(step) {
  const [command, ...args] = step.command;
  const executable = command === 'npm'
    ? process.execPath
    : command === 'node'
      ? process.execPath
      : command;
  const effectiveArgs = command === 'npm'
    ? [process.env.npm_execpath, ...args]
    : args;
  if (command === 'npm' && !process.env.npm_execpath) {
    throw new Error('Run this verification path through npm so npm_execpath is available.');
  }
  const result = spawnSync(executable, effectiveArgs, { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${step.id} failed with exit ${result.status}`);
}

function runCli() {
  let base;
  try {
    base = resolveBase();
  } catch {
    console.error('Affected verification could not resolve a comparison base.');
    process.exitCode = 2;
    return;
  }
  const trackedDiff = execFileSync('git', ['diff', '--name-status', '-z', base, '--'], {
    encoding: 'utf8',
  });
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], {
    encoding: 'utf8',
  }).split('\0').filter(Boolean);
  const untrackedDiff = untracked.map((path) => `A\0${path}\0`).join('');
  const changeMap = classifyNameStatus(`${trackedDiff}${untrackedDiff}`);
  const plan = createVerificationPlan(changeMap.changedPaths, changeMap);

  console.log(`Affected verification base: ${base}`);
  console.log(`Changed paths (${plan.paths.length}):`);
  for (const path of plan.paths) console.log(`  - ${path}`);
  console.log(`Selected checks (${plan.steps.length}, tests~${plan.totalExpectedTests}, budget ${plan.totalBudgetSeconds}s):`);
  for (const step of plan.steps) {
    console.log(`  - ${step.id}: ${commandLabel(step.command)} [tests~${step.expectedTests}; workers=${step.workers}; budget=${step.budgetSeconds}s]`);
  }

  if (plan.blocked) {
    console.error('Affected verification stopped before execution:');
    for (const reason of plan.reasons) console.error(`  - ${reason}`);
    console.error('Add a bounded mapping or explicitly run the final integration gate.');
    process.exitCode = 2;
    return;
  }
  if (!process.argv.includes('--run')) return;
  for (const step of plan.steps) runStep(step);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) runCli();
