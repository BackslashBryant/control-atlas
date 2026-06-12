#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCmmcPublicCatalog,
  buildDodRaiPublicCatalog,
  buildFedrampPublicCatalog,
  parseAiRmfPlaybook,
  parseSsdfCatalog,
} from './lib/framework-adapters.mjs';
import {
  enrichCatalogMetadata,
  fetch80053BBaselines,
  fetchFedrampBaselineMembership,
} from './lib/catalog-adapters-ext.mjs';
import {
  parse80053Catalog,
  parse800171Catalog,
  parseCsfCatalog,
} from './lib/oscal-normalize.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = new Date().toISOString();

const REMOTE_CATALOGS = [
  {
    id: 'nist-800-53-rev5',
    url: 'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_catalog.json',
    outfile: 'controls-800-53.json',
    parse: parse80053Catalog,
    enrich: async (records) => {
      const [fedramp, baselines] = await Promise.all([
        fetchFedrampBaselineMembership(),
        fetch80053BBaselines(),
      ]);
      const enrichment = {};
      for (const record of records) {
        const fedrampBaselines = Object.entries(fedramp)
          .filter(([, controls]) => controls.includes(record.id))
          .map(([baseline]) => baseline);
        const nistBaselines = Object.entries(baselines)
          .filter(([, controls]) => controls.includes(record.id))
          .map(([baseline]) => baseline);
        if (fedrampBaselines.length || nistBaselines.length) {
          enrichment[record.id] = {
            fedramp_baselines: fedrampBaselines,
            nist_800_53b_baselines: nistBaselines,
          };
        }
      }
      return enrichCatalogMetadata(records, enrichment);
    },
  },
  {
    id: 'nist-csf-2',
    url: 'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/CSF/v2.0/json/NIST_CSF_v2.0_catalog.json',
    outfile: 'csf-subcategories.json',
    parse: parseCsfCatalog,
  },
  {
    id: 'nist-800-171-rev3',
    url: 'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-171/rev3/json/NIST_SP800-171_rev3_catalog.json',
    outfile: 'requirements-800-171.json',
    parse: parse800171Catalog,
  },
  {
    id: 'nist-ai-rmf-playbook',
    url: 'https://airc.nist.gov/docs/playbook.json',
    outfile: 'ai-rmf.json',
    parse: (json) => parseAiRmfPlaybook(json, SNAPSHOT),
  },
  {
    id: 'nist-ssdf-oscal',
    url: 'https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-218/ver1/json/NIST_SP800-218_ver1_catalog.json',
    outfile: 'ssdf.json',
    parse: (json) => parseSsdfCatalog(json, SNAPSHOT),
  },
];

const PUBLIC_CATALOGS = [
  ['cmmc-practices.json', buildCmmcPublicCatalog],
  ['fedramp-baselines.json', buildFedrampPublicCatalog],
  ['dod-rai.json', buildDodRaiPublicCatalog],
];

function writeCatalog(filename, document) {
  writeFileSync(join(ROOT, 'data', filename), `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return { filename, records: document.records.length };
}

export async function fetchFrameworkCatalogs() {
  const results = [];
  let fedrampMembership = null;
  try {
    fedrampMembership = await fetchFedrampBaselineMembership();
  } catch (err) {
    console.warn('Failed to pre-fetch FedRAMP baseline membership:', err.message);
  }

  for (const target of REMOTE_CATALOGS) {
    const response = await fetch(target.url);
    if (!response.ok) throw new Error(`${target.id} fetch failed: ${response.status} ${target.url}`);
    let document = target.parse(await response.json(), target.id);
    if (target.enrich) {
      document = { ...document, records: await target.enrich(document.records) };
    }
    results.push(writeCatalog(target.outfile, document));
  }
  for (const [filename, build] of PUBLIC_CATALOGS) {
    const doc = build === buildFedrampPublicCatalog ? build(SNAPSHOT, fedrampMembership) : build(SNAPSHOT);
    results.push(writeCatalog(filename, doc));
  }
  return results;
}

if (process.argv[1]?.includes('fetch-framework-catalogs.mjs')) {
  fetchFrameworkCatalogs()
    .then((results) => results.forEach((result) => console.log(`Wrote ${result.filename}: ${result.records} records`)))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
