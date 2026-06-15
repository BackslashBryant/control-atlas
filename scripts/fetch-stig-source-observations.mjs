#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseCyberMilLanding,
  parseGithubOrganizationSignals,
  parseGithubRepoSignals,
  parseStigViewerCatalog,
  parseStigViewerPressRelease,
} from '../tools/importers/stig-source-observer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = join(ROOT, 'data', 'stig-source-observations.json');

const TARGETS = [
  {
    id: 'cyber-mil-stig-compilations',
    url: 'https://www.cyber.mil/stigs/compilations/',
    parser: parseCyberMilLanding,
  },
  {
    id: 'cyber-mil-stig-downloads',
    url: 'https://www.cyber.mil/stigs/downloads',
    parser: parseCyberMilLanding,
  },
  {
    id: 'cyber-mil-stig-gpo',
    url: 'https://www.cyber.mil/stigs/gpo/',
    parser: parseCyberMilLanding,
  },
  {
    id: 'stigviewer-catalog',
    url: 'https://www.stigviewer.com/stigs',
    parser: parseStigViewerCatalog,
  },
  {
    id: 'stigviewer-clkb-api',
    url: 'https://www.stigviewer.com/press-releases/2026-03-16',
    parser: parseStigViewerPressRelease,
  },
  {
    id: 'nuwcdivnpt-github-org',
    url: 'https://github.com/NUWCDIVNPT',
    parser: parseGithubOrganizationSignals,
  },
  {
    id: 'nuwcdivnpt-stig-manager',
    url: 'https://github.com/nuwcdivnpt/stig-manager',
    parser: parseGithubRepoSignals,
  },
];

async function fetchHtml(url, fetchImpl) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`fetch failed ${response.status} for ${url}`);
  }
  return response.text();
}

export async function fetchStigSourceObservations(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const observations = [];

  for (const target of TARGETS) {
    const html = await fetchHtml(target.url, fetchImpl);
    observations.push({
      source_id: target.id,
      observed_at: new Date().toISOString(),
      ...target.parser(html, target.url),
    });
  }

  return {
    schema_version: '1.0',
    generated_at: observations[0]?.observed_at || new Date().toISOString(),
    observations,
  };
}

async function main() {
  const document = await fetchStigSourceObservations();
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${document.observations.length} STIG source observations`);
}

if (process.argv[1]?.includes('fetch-stig-source-observations.mjs')) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
