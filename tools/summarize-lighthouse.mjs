#!/usr/bin/env node

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const REPORT_DIR = join(process.cwd(), 'artifacts', 'lighthouse-ci');
const reportFiles = (await readdir(REPORT_DIR)).filter((name) =>
  name.endsWith('.report.json'),
);

if (reportFiles.length === 0) {
  throw new Error(`No Lighthouse JSON reports found in ${REPORT_DIR}`);
}

const rows = [];
for (const reportFile of reportFiles) {
  const report = JSON.parse(await readFile(join(REPORT_DIR, reportFile), 'utf8'));
  rows.push({
    url: report.finalDisplayedUrl || report.finalUrl || report.requestedUrl,
    performance: Math.round((report.categories.performance?.score ?? 0) * 100),
    accessibility: Math.round((report.categories.accessibility?.score ?? 0) * 100),
    lcpMs: Math.round(report.audits['largest-contentful-paint']?.numericValue ?? 0),
    cls: Number((report.audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)),
    tbtMs: Math.round(report.audits['total-blocking-time']?.numericValue ?? 0),
  });
}

rows.sort((a, b) => a.url.localeCompare(b.url));
const summary = {
  generatedAt: new Date().toISOString(),
  evidence: 'local-or-CI synthetic Lighthouse; not field, real-device, or deployed evidence',
  runs: rows,
};

await writeFile(
  join(REPORT_DIR, 'summary.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
);

console.table(rows);
