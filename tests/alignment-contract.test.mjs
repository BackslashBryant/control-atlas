import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const requiredDocs = [
  'CONTRIBUTING.md',
  'SECURITY.md',
  'docs/inventory/repository-inventory.md',
  'docs/inventory/out-of-scope.md',
  'docs/SECDEVOPS_GAP_ANALYSIS.md',
  'docs/adr/0001-static-first-github-pages.md',
  'docs/adr/0002-public-data-only-boundary.md',
  'docs/adr/0003-no-user-org-system-data.md',
  'docs/adr/0004-client-side-template-generation.md',
  'docs/adr/0005-relationship-type-and-provenance-class.md',
  'docs/adr/0006-build-time-imports-not-runtime-ingestion.md',
  'docs/adr/0007-control-atlas-branding.md',
];

test('alignment deliverables exist', () => {
  for (const path of requiredDocs) assert.ok(existsSync(path), `${path} must exist`);
});

test('core product docs state the canonical Control Atlas boundary', () => {
  for (const path of ['README.md', 'docs/vision.md', 'docs/architecture/ARCHITECTURE.md', 'docs/context.md']) {
    const content = readFileSync(path, 'utf8');
    assert.match(content, /Control Atlas/);
    assert.match(content, /public.data.only/i);
    assert.match(content, /no (?:backend|user\/org\/system data|user, organization, or system data)/i);
  }
});

test('roadmap contains all nine Control Atlas epics', () => {
  const roadmap = readFileSync('docs/roadmap.md', 'utf8');
  for (const epic of [
    'Project Foundation',
    'Source Registry',
    'Data Normalization Pipeline',
    'Library Browser',
    'Crosswalk Workbench',
    'Template Factory',
    'Pattern Library',
    'Relationship Graph',
    'QA, Accessibility, and Release Hardening',
  ]) {
    assert.match(roadmap, new RegExp(epic));
  }
});
