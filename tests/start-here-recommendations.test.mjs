import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStartHereRecommendations, hasCompleteStartHereContext } from '../src/ui/lib/startHereRecommendations.mjs';

const complete = { systemType: 'Cloud SaaS', dataSensitivity: 'Not sure', environment: 'DoD' };

test('Start Here is a source navigator for every complete answer combination', () => {
  const result = buildStartHereRecommendations(complete);
  assert.equal(result.situation.pathLabel, 'Source navigator');
  assert.match(result.situation.narrative, /do not determine a classification, baseline, authorization path, or applicability result/i);
  assert.equal(result.compare.length, 0);
  assert.equal(result.patterns.length, 0);
  assert.equal(result.templates.length, 0);
  assert.ok(result.library.every((entry) => entry.kind === 'library-catalog'));
  assert.ok(result.library.some((entry) => entry.catalogId === 'nist-800-53'));
  assert.ok(result.library.some((entry) => entry.catalogId === 'disa-stig'));
});

test('Start Here requires answers but never substitutes a default', () => {
  assert.equal(hasCompleteStartHereContext({ ...complete, environment: '' }), false);
  assert.equal(buildStartHereRecommendations({ ...complete, environment: '' }), null);
  assert.deepEqual(buildStartHereRecommendations({ ...complete, dataSensitivity: 'Not sure' }).situation.assumptions, []);
});
