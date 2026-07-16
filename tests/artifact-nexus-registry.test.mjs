import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RETRIEVED_ON = '2026-07-16';
const COMPATIBILITY_LEVELS = [
  'official_current',
  'official_legacy',
  'official_guidance',
  'schema_aligned',
  'community_reference',
  'unverified',
];

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
}

function assertUniqueIds(items, key, label) {
  const ids = items.map((item) => item[key]);
  assert.equal(new Set(ids).size, ids.length, `${label} IDs must be unique`);
  for (const id of ids) {
    assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${label} ID must be URL-safe: ${id}`);
  }
}

function assertHttps(value, label) {
  assert.match(value, /^https:\/\//, `${label} must use HTTPS`);
}

test('artifact nexus registries are internally consistent', async (t) => {
  const artifactsRegistry = readJson('data/official-artifact-registry.json');
  const workflowsRegistry = readJson('data/compliance-workflows.json');
  const toolsRegistry = readJson('data/compliance-tool-registry.json');
  const templateRegistry = readJson('data/template-registry.json');

  await t.test('registry metadata and compatibility vocabulary are pinned', () => {
    for (const [name, registry] of [
      ['artifacts', artifactsRegistry],
      ['workflows', workflowsRegistry],
      ['tools', toolsRegistry],
    ]) {
      assert.equal(registry.schema_version, '1.0', `${name} schema version must be explicit`);
      assert.equal(registry.retrieved_on, RETRIEVED_ON, `${name} retrieval date must be pinned`);
    }
    assert.deepEqual(artifactsRegistry.compatibility_levels, COMPATIBILITY_LEVELS);
  });

  await t.test('artifact records are attributable, dated, and honestly classified', () => {
    assert.ok(artifactsRegistry.artifacts.length >= 30, 'catalog must cover the initial federal artifact families');
    assertUniqueIds(artifactsRegistry.artifacts, 'artifact_id', 'artifact');

    for (const artifact of artifactsRegistry.artifacts) {
      for (const field of [
        'title',
        'artifact_family',
        'publisher',
        'classification',
        'status',
        'version',
        'retrieved_on',
        'landing_url',
        'summary',
        'provenance_note',
        'license_or_use_note',
      ]) {
        assert.equal(typeof artifact[field], 'string', `${artifact.artifact_id}.${field} must be a string`);
        assert.ok(artifact[field].trim(), `${artifact.artifact_id}.${field} must not be blank`);
      }
      assert.ok(COMPATIBILITY_LEVELS.includes(artifact.classification), `${artifact.artifact_id} has an unknown classification`);
      assert.equal(artifact.retrieved_on, RETRIEVED_ON, `${artifact.artifact_id} retrieval date must be pinned`);
      assertHttps(artifact.landing_url, `${artifact.artifact_id}.landing_url`);
      if (artifact.download_url !== null) {
        assertHttps(artifact.download_url, `${artifact.artifact_id}.download_url`);
      }
      assert.ok(Array.isArray(artifact.formats) && artifact.formats.length > 0, `${artifact.artifact_id} must name at least one format`);
      assert.ok(Array.isArray(artifact.limitations), `${artifact.artifact_id}.limitations must be an array`);
    }
  });

  await t.test('FedRAMP current schemas and legacy transition artifacts are distinct', () => {
    const currentSchemas = artifactsRegistry.artifacts.filter(
      (artifact) => artifact.artifact_id.startsWith('fedramp-schema-') && artifact.classification === 'official_current',
    );
    assert.equal(currentSchemas.length, 11, 'all eleven dated FedRAMP 2026 schemas must be cataloged');
    assert.ok(currentSchemas.every((artifact) => artifact.download_url?.endsWith('.json')));

    const legacyIds = new Set(
      artifactsRegistry.artifacts
        .filter((artifact) => artifact.classification === 'official_legacy')
        .map((artifact) => artifact.artifact_id),
    );
    for (const id of [
      'fedramp-legacy-assets-2026-transition',
      'fedramp-legacy-package-checklist',
      'fedramp-legacy-ssp',
      'fedramp-legacy-crm-cis',
      'fedramp-legacy-integrated-inventory',
      'fedramp-legacy-poam',
      'fedramp-legacy-sap',
      'fedramp-legacy-sar',
      'fedramp-legacy-conmon-deliverables',
    ]) {
      assert.ok(legacyIds.has(id), `missing legacy artifact: ${id}`);
    }
  });

  await t.test('foundational DCSA, STIG, PPSM, OSCAL, and eMASS sources are present', () => {
    const ids = new Set(artifactsRegistry.artifacts.map((artifact) => artifact.artifact_id));
    for (const id of [
      'dcsa-daapm-v2-2',
      'dcsa-hardware-list-2020',
      'dcsa-software-list-2020',
      'dcsa-access-authorization-2020',
      'dcsa-privileged-access-authorization-2020',
      'dcsa-maintenance-change-log-2020',
      'disa-stig-viewer-guide-v1r7',
      'disa-stig-viewer-csv-contract-v1r7',
      'disa-stig-viewer-cklb-emass-guidance-v1r7',
      'dodi-8551-01-ppsm-2023',
      'disa-ppsm-registry-training',
      'nist-oscal-models-v1-2-2',
      'mitre-emass-api-openapi-v3-22',
    ]) {
      assert.ok(ids.has(id), `missing foundational artifact: ${id}`);
    }

    const emassSchema = artifactsRegistry.artifacts.find(
      (artifact) => artifact.artifact_id === 'mitre-emass-api-openapi-v3-22',
    );
    assert.equal(emassSchema.classification, 'schema_aligned');
    assert.ok(emassSchema.limitations.some((item) => /not proof|not a DISA|trail/i.test(item)));
  });

  await t.test('tool records expose provenance, access, license, and limitations', () => {
    assertUniqueIds(toolsRegistry.tools, 'tool_id', 'tool');
    const requiredToolIds = [
      'disa-stig-viewer',
      'disa-evaluate-stig',
      'mitre-emass-client',
      'mitre-emasser',
      'mitre-saf-cli',
      'mitre-heimdall',
      'stig-manager-client-modules',
      'vulnerator',
      'openscap',
      'microsoft-powerstig',
      'complianceascode-content',
    ];
    const ids = new Set(toolsRegistry.tools.map((tool) => tool.tool_id));
    for (const id of requiredToolIds) assert.ok(ids.has(id), `missing tool: ${id}`);

    for (const tool of toolsRegistry.tools) {
      assert.ok(COMPATIBILITY_LEVELS.includes(tool.classification), `${tool.tool_id} has an unknown classification`);
      assert.equal(tool.retrieved_on, RETRIEVED_ON, `${tool.tool_id} retrieval date must be pinned`);
      assertHttps(tool.project_url, `${tool.tool_id}.project_url`);
      if (tool.repository_url !== null) assertHttps(tool.repository_url, `${tool.tool_id}.repository_url`);
      if (tool.license_url !== null) assertHttps(tool.license_url, `${tool.tool_id}.license_url`);
      for (const field of ['supported_inputs', 'supported_outputs', 'artifact_families', 'access_requirements', 'limitations']) {
        assert.ok(Array.isArray(tool[field]) && tool[field].length > 0, `${tool.tool_id}.${field} must be a non-empty array`);
      }
    }

    const evaluateStig = toolsRegistry.tools.find((tool) => tool.tool_id === 'disa-evaluate-stig');
    assert.equal(evaluateStig.classification, 'unverified');
    assert.match(evaluateStig.access_requirements.join(' '), /CAC|authorized/i);
    assert.match(evaluateStig.license, /not publicly verifiable/i);

    const vulnerator = toolsRegistry.tools.find((tool) => tool.tool_id === 'vulnerator');
    assert.equal(vulnerator.status, 'historical_reference');
    assert.ok(vulnerator.limitations.some((item) => /independently tested|stale|current/i.test(item)));
  });

  await t.test('workflow references resolve to catalog records', () => {
    assertUniqueIds(workflowsRegistry.workflows, 'workflow_id', 'workflow');
    const artifactIds = new Set(artifactsRegistry.artifacts.map((artifact) => artifact.artifact_id));
    const toolIds = new Set(toolsRegistry.tools.map((tool) => tool.tool_id));
    const templateIds = new Set(templateRegistry.templates.map((template) => template.template_id));

    for (const workflow of workflowsRegistry.workflows) {
      assert.ok(workflow.audiences.includes('novice') || workflow.audiences.length > 1, `${workflow.workflow_id} must identify its audience`);
      assert.ok(workflow.steps.length >= 3, `${workflow.workflow_id} must provide an executable sequence`);
      assert.ok(workflow.readiness_checks.length >= 3, `${workflow.workflow_id} must provide readiness checks`);
      assert.ok(workflow.boundary_note.trim(), `${workflow.workflow_id} must state its decision boundary`);

      for (const id of workflow.artifact_ids) assert.ok(artifactIds.has(id), `${workflow.workflow_id} references unknown artifact ${id}`);
      for (const id of workflow.tool_ids) assert.ok(toolIds.has(id), `${workflow.workflow_id} references unknown tool ${id}`);
      for (const id of workflow.companion_template_ids) assert.ok(templateIds.has(id), `${workflow.workflow_id} references unknown template ${id}`);

      const orders = workflow.steps.map((step) => step.order);
      assert.deepEqual(orders, orders.map((_, index) => index + 1), `${workflow.workflow_id} step order must be contiguous`);
      for (const step of workflow.steps) {
        for (const id of step.artifact_ids) assert.ok(artifactIds.has(id), `${workflow.workflow_id} step references unknown artifact ${id}`);
        for (const id of step.tool_ids) assert.ok(toolIds.has(id), `${workflow.workflow_id} step references unknown tool ${id}`);
        assert.ok(step.completion_signal.trim(), `${workflow.workflow_id} step ${step.order} needs a completion signal`);
      }
    }
  });

  await t.test('every generated template resolves its official resources', () => {
    const resourceIds = new Set([
      ...artifactsRegistry.artifacts.map((artifact) => artifact.artifact_id),
      ...toolsRegistry.tools.map((tool) => tool.tool_id),
    ]);
    for (const template of templateRegistry.templates) {
      assert.ok(
        Array.isArray(template.official_resource_ids) && template.official_resource_ids.length > 0,
        `${template.template_id} must link to at least one official or interoperability resource`,
      );
      for (const id of template.official_resource_ids) {
        assert.ok(resourceIds.has(id), `${template.template_id} references unknown official resource ${id}`);
      }
    }
  });
});
