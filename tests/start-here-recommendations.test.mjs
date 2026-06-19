import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStartHereRecommendations } from '../src/ui/lib/startHereRecommendations.mjs';

function allRationales(recommendations) {
  return [
    ...recommendations.library,
    ...recommendations.compare,
    ...recommendations.patterns,
    ...recommendations.templates,
  ].map((entry) => entry.rationale);
}

test('csp cloud path recommends fedramp library, inheritance template, and baseline compare', () => {
  const recommendations = buildStartHereRecommendations({
    systemType: 'Cloud SaaS',
    dataSensitivity: 'Moderate',
    environment: 'CSP',
  });

  assert.ok(recommendations);
  assert.ok(recommendations.library.some((entry) => entry.kind === 'library-catalog' && entry.catalogId === 'fedramp-rev5'));
  assert.ok(recommendations.library.some((entry) => entry.kind === 'library-node' && entry.nodeId === 'fedramp-rev5:MODERATE'));
  assert.ok(recommendations.templates.some((entry) => entry.templateType === 'inheritance_worksheet'));
  assert.ok(recommendations.compare.some((entry) => entry.workbench === 'baseline-compare'));

  for (const rationale of allRationales(recommendations)) {
    assert.ok(rationale.length > 0);
  }
});

test('dod high path recommends stig chain compare and stig evidence checklist', () => {
  const recommendations = buildStartHereRecommendations({
    systemType: 'Hybrid',
    dataSensitivity: 'High',
    environment: 'DoD',
  });

  assert.ok(recommendations);
  assert.ok(recommendations.library.some((entry) => entry.kind === 'library-catalog' && entry.catalogId === 'disa-stig'));
  assert.ok(recommendations.compare.some((entry) => entry.workbench === 'stig-chain'));
  assert.ok(recommendations.templates.some((entry) => entry.templateType === 'stig_evidence_checklist'));
});

test('incomplete answers return null recommendations', () => {
  assert.equal(
    buildStartHereRecommendations({
      systemType: 'Cloud SaaS',
      dataSensitivity: '',
      environment: 'CSP',
    }),
    null,
  );
});
