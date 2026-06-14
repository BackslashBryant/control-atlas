#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build80053To800171Map } from '../tools/relationship-builders/800-171-mapping-adapter.mjs';
import { build80053ToCsf20Map } from '../tools/relationship-builders/olir-adapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function fetchOlirMappings() {
  const [csfMap, map171] = await Promise.all([
    build80053ToCsf20Map(),
    build80053To800171Map(),
  ]);

  writeFileSync(join(ROOT, 'maps', '800-53-to-csf.json'), `${JSON.stringify(csfMap, null, 2)}\n`, 'utf8');
  writeFileSync(join(ROOT, 'maps', '800-53-to-800-171.json'), `${JSON.stringify(map171, null, 2)}\n`, 'utf8');

  return {
    csf_relationships: csfMap.relationships.length,
    map171_relationships: map171.relationships.length,
  };
}

if (process.argv[1]?.includes('fetch-olir-mappings.mjs')) {
  fetchOlirMappings()
    .then((result) => console.log(`Wrote ${result.csf_relationships} CSF mappings and ${result.map171_relationships} 800-171 mappings`))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
