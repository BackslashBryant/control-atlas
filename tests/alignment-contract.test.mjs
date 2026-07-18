import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const requiredDocs = [
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/inventory/repository-inventory.md',
  'docs/inventory/out-of-scope.md',
  'docs/SECDEVOPS_GAP_ANALYSIS.md',
  'docs/design/translation-first-design.md',
  'docs/design/content-style-guide.md',
  'docs/design/design-system.md',
  'docs/plans/EPIC Control Atlas Clarity System and Translation-First UX Governance.md',
  'docs/adr/0001-static-first-github-pages.md',
  'docs/adr/0002-public-data-only-boundary.md',
  'docs/adr/0003-no-user-org-system-data.md',
  'docs/adr/0004-client-side-template-generation.md',
  'docs/adr/0005-relationship-type-and-provenance-class.md',
  'docs/adr/0006-build-time-imports-not-runtime-ingestion.md',
  'docs/adr/0007-control-atlas-branding.md',
  'docs/adr/0008-govframe-baseline.md',
  'docs/adr/0009-provenance-registry-naming.md',
  'docs/adr/0010-d3-phase-0-baseline.md',
  'docs/adr/0011-defer-risky-renames.md',
  'docs/adr/ADR-translation-first-user-experience-boundary.md',
];

test('alignment deliverables exist', () => {
  for (const path of requiredDocs) assert.ok(existsSync(path), `${path} must exist`);
});

test('core product docs state the canonical Control Atlas boundary', () => {
  for (const path of [
    'README.md',
    'docs/context.md',
    'docs/vision.md',
    'docs/Plan.md',
    'docs/PRODUCTION_READINESS.md',
    'docs/architecture/ARCHITECTURE.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
  ]) {
    const content = readFileSync(path, 'utf8');
    assert.match(content, /Control Atlas/);
    assert.match(content, /Ctrl\+Alt\+Comply/);
    assert.match(content, /The public map for federal cyber compliance\./);
    assert.match(content, /Open-source reference workbench for mapping controls, tracing frameworks, and generating starter RMF\/ATO templates/i);
    assert.match(content, /public.data.only/i);
    assert.match(content, /no (?:backend|user\/org\/system data|user, organization, or system data)/i);
  }
});

test('roadmap contains the Phase 0 through Phase 6 Control Atlas epics', () => {
  const roadmap = readFileSync('docs/roadmap.md', 'utf8');
  for (const epic of [
    'Epic 0: GovFrame .+ Control Atlas Migration',
    'Epic 1: Data Backbone',
    'Epic 2: Library \\+ Search',
    'Epic 3: Compare',
    'Epic 4: Compliance Artifact and Template Nexus',
    'Epic 5: Patterns \\+ Glossary \\+ Start Here',
    'Epic 6: QA \\+ Accessibility \\+ Release',
  ]) {
    assert.match(roadmap, new RegExp(epic));
  }
  assert.match(roadmap, /Rename and rebrand/i);
  assert.match(roadmap, /CI\/CD pipeline/i);
  assert.match(roadmap, /five-artifact contract/i);
});

test('architecture and inventory docs reflect the adopted Phase 0 baseline', () => {
  const architecture = readFileSync('docs/architecture/ARCHITECTURE.md', 'utf8');
  assert.match(architecture, /Build-Time Importers/);
  assert.match(architecture, /Client-Side Search \/ Template Generation \/ Export/);
  assert.match(architecture, /React Flow \+ ELK/i);
  assert.match(architecture, /bounded relationship diagrams/i);
  assert.match(architecture, /MiniSearch/i);
  assert.match(architecture, /Zod \+ JSON Schema/i);
  assert.match(architecture, /JSON\/JSONL runtime bundles and YAML curated registry/i);
  assert.match(architecture, /tools\/build-static-site\.mjs/);
  assert.match(architecture, /dist\/site/);

  const inventory = readFileSync('docs/inventory/repository-inventory.md', 'utf8');
  for (const label of ['Keep As-Is', 'Reuse With Rename Or Refactor', 'Reuse Later', 'Deprecate', 'Remove']) {
    assert.match(inventory, new RegExp(label));
  }

  const scope = readFileSync('docs/inventory/out-of-scope.md', 'utf8');
  assert.match(scope, /Deprecated\/out-of-scope/i);
  assert.match(scope, /eMASS/i);
  assert.match(scope, /ServiceNow GRC/i);
  assert.match(scope, /No login/i);
});

test('translation-first governance docs and templates enforce clarity and action rules', () => {
  for (const path of [
    'CONTRIBUTING.md',
    'docs/PRD.md',
    'docs/Plan.md',
    'docs/roadmap.md',
    'docs/DESIGN_PRINCIPLES.md',
    'docs/design/translation-first-design.md',
    'docs/design/content-style-guide.md',
    'docs/design/design-system.md',
    'docs/plans/EPIC Control Atlas Clarity System and Translation-First UX Governance.md',
  ]) {
    const content = readFileSync(path, 'utf8');
    assert.match(content, /(Build for translation, not complexity|Translation-First Product Standard)/i, `${path} must carry the translation-first doctrine`);
  }

  const plan = readFileSync('docs/Plan.md', 'utf8');
  assert.match(plan, /## Active Sprint/);
  assert.match(plan, /## Epic Status/);
  assert.match(plan, /Epic 4.*Template Factory/i);

  const backlog = readFileSync('docs/plans/prd-v3-alignment-backlog.md', 'utf8');
  assert.match(backlog, /Open gaps only/i);
  assert.match(backlog, /\[`docs\/Plan\.md`\]/);
  assert.match(backlog, /## Deferred/i);
  assert.doesNotMatch(backlog, /entirely unimplemented/i);

  const context = readFileSync('docs/context.md', 'utf8');
  assert.match(context, /Shipped on `main`/i);
  assert.match(context, /SPR-20260708/i);
  assert.doesNotMatch(context, /Epic 2 is active/i);

  const designPrinciples = readFileSync('docs/DESIGN_PRINCIPLES.md', 'utf8');
  assert.match(designPrinciples, /What is this\? Why does it matter\? What should I do with it\?/i);

  const prd = readFileSync('docs/PRD.md', 'utf8');
  assert.match(prd, /\| \*\*Compare\*\* \|/);
  assert.match(prd, /\| \*\*Sources\*\* \|/);

  const prTemplate = readFileSync('.github/pull_request_template.md', 'utf8');
  assert.match(prTemplate, /reduces user confusion or improves a clear user action/i);
  assert.match(prTemplate, /No novice\/expert mode or split-personality UX was introduced/i);

  const epic = readFileSync('docs/plans/EPIC Control Atlas Clarity System and Translation-First UX Governance.md', 'utf8');
  assert.match(epic, /Implemented in `main` and verified live on GitHub Pages/i);
  assert.match(epic, /Local verification passed the full `npm run precommit` gate/i);
  assert.match(epic, /Treat this epic as implemented and publicly deployed/i);

  for (const path of [
    '.github/ISSUE_TEMPLATE/0-spec.md',
    '.github/ISSUE_TEMPLATE/1-plan.md',
    '.github/ISSUE_TEMPLATE/2-build.md',
  ]) {
    const content = readFileSync(path, 'utf8');
    assert.match(content, /What user confusion does this reduce\?/i);
    assert.match(content, /What action does this help the user take\?/i);
  }
});
