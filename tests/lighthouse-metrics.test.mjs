import assert from 'node:assert/strict';
import test from 'node:test';

import {
  median,
  routeThresholdFailures,
  selectLatestRouteRuns,
  summarizeRouteMedians,
} from '../tools/lighthouse-metrics.mjs';

test('median reports the middle run for the required three-run route sample', () => {
  assert.equal(median([3_800, 1_900, 2_200]), 2_200);
});

test('route medians remain distinct for hash routes', () => {
  const routeMedians = summarizeRouteMedians([
    ...runsFor('http://localhost:4317/#/catalog', [2_100, 2_200, 2_300]),
    ...runsFor('http://localhost:4317/#/build', [1_800, 1_900, 2_000]),
  ]);

  assert.deepEqual(
    routeMedians.map((route) => [route.url, route.lcpMs]),
    [
      ['http://localhost:4317/#/build', 1_900],
      ['http://localhost:4317/#/catalog', 2_200],
    ],
  );
});

test('route gate fails closed on missing runs and every launch threshold', () => {
  const failures = routeThresholdFailures([
    {
      url: 'http://localhost:4317/#/record/nist-800-53/AC-2',
      runs: 2,
      performance: 90,
      accessibility: 100,
      lcpMs: 2_501,
      tbtMs: 201,
      cls: 0.101,
    },
  ]);

  assert.equal(failures.length, 1);
  assert.deepEqual(failures[0].failures, [
    'requires 3 runs; found 2',
    'LCP 2501ms > 2500ms',
    'TBT 201ms > 200ms',
    'CLS 0.101 > 0.1',
  ]);
});

test('stale reports cannot enter the current three-run route median', () => {
  const current = selectLatestRouteRuns([
    ...runsFor('http://localhost:4317/#/catalog', [18_000, 18_100, 18_200], 1),
    ...runsFor('http://localhost:4317/#/catalog', [1_900, 2_000, 2_100], 2),
  ]);

  assert.deepEqual(
    current.map((run) => run.lcpMs).sort((left, right) => left - right),
    [1_900, 2_000, 2_100],
  );
});

test('two collector warmups are excluded from the measured three-run median', () => {
  const measured = selectLatestRouteRuns(
    runsFor(
      'http://localhost:4317/#/catalog',
      [9_000, 8_000, 1_900, 2_000, 2_100],
    ),
  );

  assert.deepEqual(
    measured.map((run) => run.lcpMs).sort((left, right) => left - right),
    [1_900, 2_000, 2_100],
  );
});

function runsFor(url, lcpValues, day = 1) {
  return lcpValues.map((lcpMs, index) => ({
    url,
    fetchTime: `2026-07-0${day}T00:00:0${index}.000Z`,
    performance: 95,
    accessibility: 100,
    lcpMs,
    cls: 0.02,
    tbtMs: 50,
  }));
}
