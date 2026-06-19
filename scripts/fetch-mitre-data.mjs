#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseEnterpriseAttackStix,
  parseIcsAttackStix,
} from '../tools/importers/mitre-attack-adapter.mjs';
import {
  buildAttackCatalogLookup,
  buildAttackToD3fendRelationships,
  buildD3fendCatalogDocument,
  buildD3fendToNistRelationships,
  buildMappingDocument,
  buildSlugToD3fendIdMap,
  parseD3fendTechniques,
} from '../tools/importers/mitre-d3fend-adapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMMITTED = {
  enterprise: join(ROOT, 'data', 'attack-techniques-enterprise.json'),
  ics: join(ROOT, 'data', 'attack-techniques-ics.json'),
  d3fend: join(ROOT, 'data', 'd3fend-countermeasures.json'),
  attackMap: join(ROOT, 'maps', 'attack-to-d3fend.json'),
  nistMap: join(ROOT, 'maps', 'd3fend-to-800-53.json'),
};

const REMOTE = {
  enterpriseAttack:
    'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json',
  icsAttack:
    'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/ics-attack/ics-attack.json',
  d3fendTechniques: 'https://d3fend.mitre.org/api/technique/all.json',
  d3fendOntology: 'https://d3fend.mitre.org/ontologies/d3fend.json',
  d3fendMappings: 'https://d3fend.mitre.org/api/ontology/inference/d3fend-full-mappings.json',
};

function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function snapshotDateFromStix(document) {
  const modified = (document.objects || [])
    .filter((object) => object.type === 'x-mitre-collection' || object.modified)
    .map((object) => object.modified || object.created)
    .sort()
    .pop();
  return modified ? String(modified).slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function loadCommittedArtifacts() {
  return {
    enterprise: readJson(COMMITTED.enterprise),
    ics: readJson(COMMITTED.ics),
    d3fend: readJson(COMMITTED.d3fend),
    attackMap: readJson(COMMITTED.attackMap),
    nistMap: readJson(COMMITTED.nistMap),
    fallbackMode: 'committed-official-snapshot',
  };
}

function committedArtifactsPresent() {
  return Object.values(COMMITTED).every((path) => existsSync(path));
}

async function fetchJson(url, fetchImpl = fetch) {
  const response = await fetchImpl(url);
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${url}`);
  }
  return response.json();
}

export async function fetchMitreData(options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const useCommittedOnly = options.committedOnly === true;

  if (useCommittedOnly && committedArtifactsPresent()) {
    return loadCommittedArtifacts();
  }

  try {
    const [
      enterpriseStix,
      icsStix,
      d3fendTechniques,
      d3fendOntology,
      d3fendMappings,
    ] = await Promise.all([
      fetchJson(REMOTE.enterpriseAttack, fetchImpl),
      fetchJson(REMOTE.icsAttack, fetchImpl),
      fetchJson(REMOTE.d3fendTechniques, fetchImpl),
      fetchJson(REMOTE.d3fendOntology, fetchImpl),
      fetchJson(REMOTE.d3fendMappings, fetchImpl),
    ]);

    const snapshotDate = new Date().toISOString().slice(0, 10);
    const enterpriseVersion = snapshotDateFromStix(enterpriseStix);
    const icsVersion = snapshotDateFromStix(icsStix);
    const d3fendVersion =
      d3fendOntology?.['@graph']?.find((entry) => entry['d3f:version'])?.['d3f:version'] ||
      snapshotDate;

    const enterpriseChecksum = checksum(JSON.stringify(enterpriseStix));
    const icsChecksum = checksum(JSON.stringify(icsStix));
    const d3fendChecksum = checksum(JSON.stringify(d3fendTechniques));
    const mappingsChecksum = checksum(JSON.stringify(d3fendMappings));

    const enterprise = parseEnterpriseAttackStix(enterpriseStix, {
      artifactUrl: REMOTE.enterpriseAttack,
      version: enterpriseVersion,
      snapshotDate,
      checksum: enterpriseChecksum,
      locatorPrefix: 'enterprise-attack.json',
    });
    const ics = parseIcsAttackStix(icsStix, {
      artifactUrl: REMOTE.icsAttack,
      version: icsVersion,
      snapshotDate,
      checksum: icsChecksum,
      locatorPrefix: 'ics-attack.json',
    });

    const d3fendRecords = parseD3fendTechniques(d3fendTechniques);
    for (const record of d3fendRecords) {
      record.source.snapshot_date = snapshotDate;
      record.source.version = String(d3fendVersion);
    }
    const d3fend = buildD3fendCatalogDocument(d3fendRecords, {
      artifactUrl: REMOTE.d3fendTechniques,
      version: String(d3fendVersion),
      snapshotDate,
      checksum: d3fendChecksum,
    });

    const slugToD3fendId = buildSlugToD3fendIdMap(d3fendRecords);
    const attackCatalogLookup = buildAttackCatalogLookup(
      enterprise.records,
      ics.records,
    );
    const bindings = d3fendMappings?.results?.bindings || [];
    const attackRelationships = buildAttackToD3fendRelationships(
      bindings,
      slugToD3fendId,
      attackCatalogLookup,
      {
        artifactUrl: REMOTE.d3fendMappings,
        version: snapshotDate,
        snapshotDate,
        checksum: mappingsChecksum,
      },
    );
    const nistRelationships = buildD3fendToNistRelationships(
      d3fendOntology,
      slugToD3fendId,
      {
        artifactUrl: REMOTE.d3fendOntology,
        version: String(d3fendVersion),
        snapshotDate,
        checksum: checksum(JSON.stringify(d3fendOntology)),
      },
    );

    const attackMap = buildMappingDocument(attackRelationships, {
      artifactUrl: REMOTE.d3fendMappings,
      version: snapshotDate,
      snapshotDate,
      checksum: mappingsChecksum,
      provenance: 'MITRE D3FEND inferred ATT&CK technique to defensive technique mappings',
    });
    const nistMap = buildMappingDocument(nistRelationships, {
      artifactUrl: REMOTE.d3fendOntology,
      version: String(d3fendVersion),
      snapshotDate,
      checksum: checksum(JSON.stringify(d3fendOntology)),
      provenance: 'MITRE D3FEND NIST SP 800-53 Rev. 5 control to defensive technique mappings',
    });

    return {
      enterprise,
      ics,
      d3fend,
      attackMap,
      nistMap,
      fallbackMode: null,
    };
  } catch (error) {
    if (committedArtifactsPresent()) {
      const committed = loadCommittedArtifacts();
      return {
        ...committed,
        fallbackMode: `network-error:${error.message}`,
      };
    }
    throw error;
  }
}

async function main() {
  const result = await fetchMitreData();
  writeFileSync(COMMITTED.enterprise, `${JSON.stringify(result.enterprise, null, 2)}\n`, 'utf8');
  writeFileSync(COMMITTED.ics, `${JSON.stringify(result.ics, null, 2)}\n`, 'utf8');
  writeFileSync(COMMITTED.d3fend, `${JSON.stringify(result.d3fend, null, 2)}\n`, 'utf8');
  writeFileSync(COMMITTED.attackMap, `${JSON.stringify(result.attackMap, null, 2)}\n`, 'utf8');
  writeFileSync(COMMITTED.nistMap, `${JSON.stringify(result.nistMap, null, 2)}\n`, 'utf8');

  if (result.fallbackMode) {
    console.log(`MITRE fetch fallback: ${result.fallbackMode}`);
  }
  console.log(
    `Wrote ${result.enterprise.records.length} enterprise techniques, ${result.ics.records.length} ICS techniques, ${result.d3fend.records.length} D3FEND countermeasures, ${result.attackMap.relationships.length} attack mappings, and ${result.nistMap.relationships.length} NIST mappings`,
  );
}

if (process.argv[1]?.includes('fetch-mitre-data.mjs')) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
