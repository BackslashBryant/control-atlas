#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';
import { parseCciXml } from './lib/cci-adapter.mjs';

const CCI_URL = 'https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/U_CCI_List.zip';

function checksum(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

async function fetchOfficialXml() {
  const response = await fetch(CCI_URL);
  if (!response.ok) throw new Error(`CCI download failed: ${response.status} ${response.statusText}`);
  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
  if (!archive['U_CCI_List.xml']) throw new Error('CCI archive did not contain U_CCI_List.xml');
  return strFromU8(archive['U_CCI_List.xml']);
}

export async function fetchCcis(options = {}) {
  const xml = options.xml || await fetchOfficialXml();
  const parsed = parseCciXml(xml);
  const sourceChecksum = checksum(xml);
  const records = parsed.records.map((record) => ({
    ...record,
    source: { ...record.source, checksum: sourceChecksum },
  }));

  return {
    catalog: {
      schema_version: '2.0',
      source_key: 'disa-cci-list',
      source_artifact: CCI_URL,
      source_version: parsed.version,
      snapshot_date: parsed.publish_date,
      checksum: sourceChecksum,
      records,
    },
    mappings: {
      schema_version: '2.0',
      source_key: 'disa-cci-list',
      source_artifact: CCI_URL,
      source_version: parsed.version,
      snapshot_date: parsed.publish_date,
      checksum: sourceChecksum,
      provenance: 'Official DISA CCI List NIST SP 800-53 Revision 5 references',
      relationships: parsed.relationships,
    },
  };
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const result = await fetchCcis();
  writeFileSync(join(root, 'data', 'ccis.json'), `${JSON.stringify(result.catalog, null, 2)}\n`, 'utf8');
  writeFileSync(join(root, 'maps', 'cci-to-800-53.json'), `${JSON.stringify(result.mappings, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${result.catalog.records.length} official CCI records and ${result.mappings.relationships.length} CCI-to-control references`);
}

if (process.argv[1]?.includes('fetch-ccis.mjs')) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
