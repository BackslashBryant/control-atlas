import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildStartHereRecommendations,
  hasCompleteStartHereContext,
} from '../src/ui/lib/startHereRecommendations.mjs';

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
  assert.ok(!recommendations.library.some((entry) => entry.catalogId === 'disa-srg'));
});

test('dod cloud path additionally recommends the DISA SRG library for Impact Level scoping', () => {
  const recommendations = buildStartHereRecommendations({
    systemType: 'Cloud SaaS',
    dataSensitivity: 'Moderate',
    environment: 'DoD',
  });

  assert.ok(recommendations);
  assert.ok(recommendations.library.some((entry) => entry.kind === 'library-catalog' && entry.catalogId === 'disa-stig'));
  const srgEntry = recommendations.library.find((entry) => entry.catalogId === 'disa-srg');
  assert.ok(srgEntry, 'expected a disa-srg library recommendation for DoD cloud systems');
  assert.match(srgEntry.rationale, /Impact Level/);
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

test('start here only enables recommendations after all three answers are selected', () => {
  assert.equal(
    hasCompleteStartHereContext({
      systemType: 'Cloud SaaS',
      dataSensitivity: '',
      environment: 'CSP',
    }),
    false,
  );
  assert.equal(
    hasCompleteStartHereContext({
      systemType: 'Cloud SaaS',
      dataSensitivity: 'Moderate',
      environment: 'CSP',
    }),
    true,
  );
});
