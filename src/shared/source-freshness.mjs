export const DEFAULT_STALE_AFTER_DAYS = 45;

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const timestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(timestamp);
  if (date.toISOString().slice(0, 10) !== value) return null;
  return timestamp;
}

export function sourceFreshness(source, now = new Date()) {
  const checkedAt = utcDay(source?.last_checked);
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const staleAfterDays = Number.isInteger(source?.stale_after_days)
    ? source.stale_after_days
    : DEFAULT_STALE_AFTER_DAYS;
  if (checkedAt === null || Number.isNaN(nowDay)) {
    return { age_days: null, is_stale: true, stale_after_days: staleAfterDays };
  }
  const ageDays = Math.max(0, Math.floor((nowDay - checkedAt) / DAY_MS));
  return {
    age_days: ageDays,
    is_stale: ageDays > staleAfterDays,
    stale_after_days: staleAfterDays,
  };
}

export function sourceCurrentAsOf(source, now = new Date()) {
  const version = source?.version || 'not recorded';
  return source?.last_checked
    ? `Version ${version} · Source last checked ${source.last_checked}`
    : `Version ${version} · Source check date not recorded`;
}

export function sourceFreshnessWarning(source, now = new Date()) {
  const freshness = sourceFreshness(source, now);
  if (!freshness.is_stale) return null;
  return source?.last_checked
    ? `Source last checked on ${source.last_checked}. The source may have changed since then; open the official source for the latest version.`
    : 'No source check date is recorded. Open the official source for the latest version.';
}
