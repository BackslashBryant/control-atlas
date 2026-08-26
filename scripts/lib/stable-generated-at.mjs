import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCE_DATE_KEYS = new Set([
  'last_checked',
  'lastUpdated',
  'observed_at',
  'retrieved_at',
  'snapshot_date',
]);
const SOURCE_METADATA_FILES = [
  'data/source-registry.json',
  'data/commons-resource-dataset.json',
];

function validIsoTimestamp(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function collectSourceDates(value, dates = []) {
  if (Array.isArray(value)) {
    for (const entry of value) collectSourceDates(entry, dates);
    return dates;
  }
  if (!value || typeof value !== 'object') return dates;
  for (const [key, entry] of Object.entries(value)) {
    if (SOURCE_DATE_KEYS.has(key) && typeof entry === 'string') dates.push(entry);
    else collectSourceDates(entry, dates);
  }
  return dates;
}

function canonicalSourceTimestamp() {
  const dates = SOURCE_METADATA_FILES.flatMap((path) => collectSourceDates(
    JSON.parse(readFileSync(join(ROOT, path), 'utf8')),
  ));
  const timestamps = dates
    .map((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value)
    .filter(validIsoTimestamp)
    .map((value) => new Date(value).getTime());
  if (!timestamps.length) {
    throw new Error('Canonical source metadata contains no valid observation date.');
  }
  return new Date(Math.max(...timestamps)).toISOString();
}

/** Resolve one reproducible generation timestamp for every derived artifact. */
export function generatedAt() {
  const explicit = process.env.CONTROL_ATLAS_GENERATED_AT;
  if (explicit) {
    if (!validIsoTimestamp(explicit)) {
      throw new Error('CONTROL_ATLAS_GENERATED_AT must be an ISO-8601 timestamp.');
    }
    return new Date(explicit).toISOString();
  }

  const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH;
  if (sourceDateEpoch) {
    const seconds = Number(sourceDateEpoch);
    if (!Number.isInteger(seconds) || seconds < 0) {
      throw new Error('SOURCE_DATE_EPOCH must be a non-negative integer.');
    }
    return new Date(seconds * 1_000).toISOString();
  }

  return canonicalSourceTimestamp();
}

/** Keep the legacy call shape while making output independent of prior builds. */
export function preserveGeneratedAt(_path, nextDocument) {
  return { ...nextDocument, generated_at: generatedAt() };
}
