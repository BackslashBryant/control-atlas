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

test('recommendations lead with a plain-language situation summary and labeled path', () => {
  const recommendations = buildStartHereRecommendations({
    systemType: 'Cloud SaaS',
    dataSensitivity: 'Moderate',
    environment: 'CSP',
  });

  assert.ok(recommendations.situation, 'expected a situation summary');
  assert.equal(recommendations.situation.pathLabel, 'FedRAMP authorization path');
  assert.match(recommendations.situation.narrative, /FedRAMP/);
  assert.ok(recommendations.situation.narrative.length > 80, 'narrative should be a real sentence, not a stub');
  assert.deepEqual(recommendations.situation.assumptions, []);
  assert.deepEqual(recommendations.situation.answers, {
    systemType: 'Cloud SaaS',
    dataSensitivity: 'Moderate',
    environment: 'CSP',
  });
});

test('pattern and template rationales are specific per item, not one boilerplate string', () => {
  const recommendations = buildStartHereRecommendations({
    systemType: 'Cloud SaaS',
    dataSensitivity: 'Moderate',
    environment: 'CSP',
  });

  const patternRationales = recommendations.patterns.map((entry) => entry.rationale);
  const templateRationales = recommendations.templates.map((entry) => entry.rationale);

  assert.ok(patternRationales.length >= 2);
  assert.equal(new Set(patternRationales).size, patternRationales.length, 'each pattern rationale should be distinct');
  assert.ok(templateRationales.length >= 2);
  assert.equal(new Set(templateRationales).size, templateRationales.length, 'each template rationale should be distinct');
});

test('"Not sure" answers fall back to a safe default and record the assumption', () => {
  const recommendations = buildStartHereRecommendations({
    systemType: 'Cloud SaaS',
    dataSensitivity: 'Not sure',
    environment: 'Not sure',
  });

  assert.ok(recommendations, 'a "Not sure" combination should still produce recommendations');
  // Sensitivity falls back to Moderate -> a concrete baseline is still recommended.
  assert.ok(
    recommendations.library.some((entry) => entry.kind === 'library-node' && entry.nodeId === 'fedramp-rev5:MODERATE'),
    'expected the Moderate fallback baseline',
  );
  assert.equal(recommendations.situation.assumptions.length, 2, 'expected one assumption note per "Not sure" answer');
  assert.ok(recommendations.situation.assumptions.some((note) => /Moderate/.test(note)));
  assert.ok(recommendations.situation.assumptions.some((note) => /federal civilian/i.test(note)));
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

test('contractor handling CUI receives a cautious 800-171 starting point even for cloud SaaS', () => {
  const recommendations = buildStartHereRecommendations({
    systemType: 'Cloud SaaS',
    dataSensitivity: 'CUI',
    environment: 'Contractor',
  });

  assert.equal(recommendations.situation.pathLabel, 'Contractor handling CUI');
  assert.match(recommendations.situation.narrative, /contract and agency guidance determine which revision applies/i);
  assert.ok(recommendations.library.some(
    (entry) => entry.kind === 'library-catalog' && entry.catalogId === 'nist-800-171-rev2',
  ));
  assert.ok(!recommendations.library.some(
    (entry) => entry.kind === 'library-catalog' && entry.catalogId === 'fedramp-rev5',
  ));
});

test('contractor status without CUI does not imply SP 800-171', () => {
  const recommendations = buildStartHereRecommendations({
    systemType: 'On-premises',
    dataSensitivity: 'Low',
    environment: 'Contractor',
  });

  assert.equal(recommendations.situation.pathLabel, 'Confirm the contract requirements');
  assert.match(recommendations.situation.narrative, /Contractor status alone does not determine/i);
  assert.ok(!recommendations.library.some(
    (entry) => entry.kind === 'library-catalog' && entry.catalogId === 'nist-800-171-rev2',
  ));
  assert.ok(recommendations.library.some(
    (entry) => entry.kind === 'library-node' && entry.nodeId === 'cui-policy:CUI-PROGRAM',
  ));
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
