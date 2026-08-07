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
  const freshness = sourceFreshness(source, now);
  if (freshness.is_stale) {
    return `Freshness check overdue — last checked ${source?.last_checked || 'on an unknown date'}. This source may have changed. Verify the official source before relying on this page.`;
  }
  return `Version ${source?.version || 'not recorded'} · Current as of ${source.last_checked}`;
}
