export const INGESTION_STAGES = Object.freeze([
  'discover',
  'acquire',
  'attest',
  'parse',
  'normalize',
  'structure',
  'relationships',
  'presentation',
  'reconcile',
  'publish',
]);

// Source-specific scripts are adapters inside one shared lifecycle. A task can
// satisfy more than one stage when the publisher exposes a combined download
// and parse operation, but no stage may disappear from the execution ledger.
export const INGESTION_TASKS = Object.freeze([
  { id: 'discover-nist-pages', script: 'discover-nist-pages.mjs', stages: ['discover'], scope: ['nist-pages'], retries: 2 },
  { id: 'discover-nist-structured-assets', script: 'discover-nist-structured-assets.mjs', stages: ['discover'], scope: ['nist-pages'], retries: 2 },
  { id: 'triage-nist-structured-assets', script: 'triage-nist-structured-assets.mjs', stages: ['discover'], scope: ['nist-pages'], retries: 1 },
  { id: 'observe-disa-sources', script: 'fetch-stig-source-observations.mjs', stages: ['discover'], scope: ['disa-stig', 'disa-srg'], retries: 2 },
  { id: 'fetch-framework-catalogs', script: 'fetch-framework-catalogs.mjs', stages: ['acquire', 'parse'], scope: ['framework-catalogs'], retries: 2 },
  { id: 'fetch-fedramp-rules', script: 'fetch-fedramp-2026-rules.mjs', stages: ['acquire', 'parse'], scope: ['fedramp-20x'], retries: 2 },
  { id: 'fetch-nara-cui', script: 'fetch-nara-cui-registry.mjs', stages: ['discover', 'acquire', 'parse'], scope: ['cui-policy'], retries: 2 },
  { id: 'fetch-olir-catalog', script: 'fetch-olir-catalog.mjs', stages: ['discover', 'acquire', 'parse'], scope: ['olir'], retries: 2 },
  { id: 'fetch-olir-mappings', script: 'fetch-olir-mappings.mjs', stages: ['acquire', 'parse', 'relationships'], scope: ['olir'], retries: 2 },
  { id: 'fetch-ccis', script: 'fetch-ccis.mjs', stages: ['acquire', 'parse', 'relationships'], scope: ['disa-cci'], retries: 2 },
  { id: 'fetch-disa-library', script: 'fetch-disa-stigs.mjs', stages: ['discover', 'acquire', 'parse'], scope: ['disa-stig', 'disa-srg'], retries: 1 },
  { id: 'fetch-mitre', script: 'fetch-mitre-data.mjs', stages: ['acquire', 'parse', 'relationships'], scope: ['mitre-attack', 'mitre-d3fend'], retries: 2 },
  { id: 'fetch-zero-trust-workbooks', script: 'fetch-zero-trust-workbooks.mjs', stages: ['acquire', 'parse', 'relationships'], scope: ['nist-zt', 'microsoft-zt-maturity'], retries: 2 },
  { id: 'fetch-nist-zero-trust', script: 'fetch-nist-zero-trust-pages.mjs', stages: ['acquire', 'parse'], scope: ['nist-zt'], retries: 2 },
  { id: 'fetch-nist-structured-catalogs', script: 'fetch-nist-structured-catalogs.mjs', stages: ['acquire', 'parse', 'relationships'], scope: ['nist-iot-cybersecurity', 'nist-mobile-threats'], retries: 2 },
  { id: 'extract-dod-zero-trust', script: 'extract-dod-zt.mjs', stages: ['parse'], scope: ['dod-zt'], retries: 1 },
  { id: 'sync-zero-trust-registry', script: 'sync-zero-trust-source-registry.mjs', stages: ['attest'], scope: ['dod-zt', 'nist-zt', 'microsoft-zt-maturity', 'nist-iot-cybersecurity', 'nist-mobile-threats'], retries: 1 },
  { id: 'sync-source-bundles', script: 'sync-catalog-source-bundles.mjs', stages: ['attest'], scope: ['all-catalogs'], retries: 1 },
  { id: 'build-source-inventory', script: 'build-catalog-source-inventory.mjs', stages: ['discover', 'normalize', 'reconcile'], scope: ['all-catalogs'], retries: 1 },
  { id: 'sync-inventory-contracts', script: 'sync-catalog-inventory-contracts.mjs', stages: ['attest', 'reconcile'], scope: ['all-catalogs'], retries: 1 },
  { id: 'hydrate-artifacts', script: 'hydrate-artifacts.mjs', stages: ['acquire', 'attest'], scope: ['all-artifacts'], retries: 2 },
  { id: 'reconcile-freshness', script: 'reconcile-source-freshness.mjs', stages: ['attest', 'reconcile'], scope: ['all-sources'], retries: 1 },
  {
    id: 'build-framework-data', script: 'build-framework-data.mjs',
    stages: ['normalize', 'structure', 'relationships', 'presentation', 'publish'],
    scope: ['all-catalogs'], retries: 1,
  },
  {
    id: 'enrich-commons-resources', script: 'enrich-commons-resources.mjs',
    stages: ['acquire', 'attest', 'parse', 'presentation'],
    scope: ['all-resources'], args: ['--refresh'], retries: 2,
  },
  {
    id: 'build-commons-index', script: 'build-commons-index.mjs',
    stages: ['normalize', 'structure', 'relationships', 'publish'],
    scope: ['all-resources'], retries: 1,
  },
  { id: 'build-source-count-ledger', script: 'reconcile-artifact-counts.mjs', stages: ['reconcile'], scope: ['all-sources', 'all-catalogs'], retries: 1 },
  { id: 'check-data-size', script: 'check-data-size.mjs', stages: ['publish'], scope: ['runtime-bundles'], retries: 1 },
  { id: 'audit-coverage', script: 'audit-coverage.mjs', stages: ['reconcile'], scope: ['all-catalogs'], retries: 1 },
  { id: 'verify-discovery', script: 'verify-discovery.mjs', stages: ['discover'], scope: ['all-sources'], retries: 1 },
  { id: 'verify-manifests', script: 'verify-manifests.mjs', stages: ['attest', 'reconcile'], scope: ['all-sources', 'all-catalogs'], retries: 1 },
  { id: 'verify-completeness', script: 'verify-completeness.mjs', stages: ['reconcile'], scope: ['all-catalogs'], retries: 1 },
  { id: 'verify-ingestion-contract', script: 'verify-ingestion-pipeline.mjs', stages: ['presentation', 'reconcile'], scope: ['all-sources', 'all-catalogs'], retries: 1 },
  { id: 'verify-resource-ingestion', script: 'verify-resource-ingestion.mjs', stages: ['discover', 'attest', 'presentation', 'reconcile'], scope: ['all-resources'], retries: 1 },
]);

export function validateIngestionPipelineDefinition(tasks = INGESTION_TASKS) {
  const errors = [];
  const ids = new Set();
  const covered = new Set();
  for (const task of tasks) {
    if (!task.id || ids.has(task.id)) errors.push(`duplicate or missing task id: ${task.id || '(missing)'}`);
    ids.add(task.id);
    if (!task.script || !Array.isArray(task.stages) || !task.stages.length) errors.push(`invalid task: ${task.id}`);
    for (const stage of task.stages || []) {
      if (!INGESTION_STAGES.includes(stage)) errors.push(`task ${task.id} uses unknown stage: ${stage}`);
      covered.add(stage);
    }
  }
  for (const stage of INGESTION_STAGES) {
    if (!covered.has(stage)) errors.push(`pipeline stage has no task: ${stage}`);
  }
  return errors;
}
