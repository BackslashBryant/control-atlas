import assert from 'node:assert/strict';
import test from 'node:test';

import { sourceCurrentAsOf, sourceFreshness } from '../src/shared/source-freshness.mjs';

const now = new Date('2026-07-16T23:59:59.000Z');

test('source freshness becomes stale only after 45 full UTC calendar days', () => {
  assert.equal(sourceFreshness({ last_checked: '2026-06-02', stale_after_days: 45 }, now).age_days, 44);
  assert.equal(sourceFreshness({ last_checked: '2026-06-01', stale_after_days: 45 }, now).is_stale, false);
  assert.equal(sourceFreshness({ last_checked: '2026-05-31', stale_after_days: 45 }, now).is_stale, true);
});

test('source freshness handles leap boundaries and invalid dates deterministically', () => {
  assert.equal(sourceFreshness({ last_checked: '2024-02-29', stale_after_days: 45 }, new Date('2024-04-14T00:00:00Z')).is_stale, false);
  assert.equal(sourceFreshness({ last_checked: '2026-02-30' }, now).is_stale, true);
  assert.equal(sourceFreshness({}, now).age_days, null);
});

test('newcomer-facing freshness wording states the verified date calmly and never calls a stale source current', () => {
  const fresh = { version: 'Rev. 5', last_checked: '2026-06-09', stale_after_days: 45 };
  const stale = { version: 'Rev. 5', last_checked: '2025-01-23', stale_after_days: 45 };
  assert.equal(sourceCurrentAsOf(fresh, now), 'Version Rev. 5 · Current as of 2026-06-09');
  assert.equal(
    sourceCurrentAsOf(stale, now),
    'Last verified against the source on 2025-01-23. The source may have changed since then; open the official source for the latest version.',
  );
  assert.doesNotMatch(sourceCurrentAsOf(stale, now), /Current as of/);
  assert.equal(
    sourceCurrentAsOf({}, now),
    'No verified check date is recorded. Open the official source for the latest version.',
  );
});
