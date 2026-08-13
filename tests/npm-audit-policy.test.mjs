import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAuditPolicy } from '../scripts/security/npm-audit.mjs';

const advisory = {
  source: 1234,
  severity: 'high',
  title: 'Test advisory',
  url: 'https://example.test/advisory',
};

function reportWith(advisories = [advisory]) {
  return { vulnerabilities: { dependency: { name: 'dependency', via: advisories } } };
}

test('audit policy rejects an unapproved high-severity advisory', () => {
  const result = evaluateAuditPolicy(reportWith(), { version: 1, threshold: 'high', exceptions: [] }, '2026-08-13');
  assert.deepEqual(result.remaining.map(({ package: packageName, id }) => [packageName, id]), [['dependency', 1234]]);
});

test('audit policy rejects expired and stale exceptions', () => {
  const expired = evaluateAuditPolicy(
    reportWith(),
    {
      version: 1,
      threshold: 'high',
      exceptions: [{ package: 'dependency', id: 1234, reviewBy: '2026-08-12' }],
    },
    '2026-08-13',
  );
  assert.equal(expired.expired.length, 1);
  assert.equal(expired.stale.length, 0);

  const stale = evaluateAuditPolicy(
    { vulnerabilities: {} },
    {
      version: 1,
      threshold: 'high',
      exceptions: [{ package: 'dependency', id: 1234, reviewBy: '2026-08-14' }],
    },
    '2026-08-13',
  );
  assert.equal(stale.expired.length, 0);
  assert.equal(stale.stale.length, 1);
});

test('audit policy accepts an active exception and ignores below-threshold findings', () => {
  const result = evaluateAuditPolicy(
    reportWith([advisory, { ...advisory, source: 5678, severity: 'moderate' }]),
    {
      version: 1,
      threshold: 'high',
      exceptions: [{ package: 'dependency', id: 1234, reviewBy: '2026-08-14' }],
    },
    '2026-08-13',
  );
  assert.deepEqual(result.remaining, []);
  assert.deepEqual(result.expired, []);
  assert.deepEqual(result.stale, []);
  assert.equal(result.activeExceptionCount, 1);
});
