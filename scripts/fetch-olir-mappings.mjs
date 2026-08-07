#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build80053To800171Map } from '../tools/relationship-builders/800-171-mapping-adapter.mjs';
import { build80053ToCsf20Map, build800171ToCsf20Map } from '../tools/relationship-builders/olir-adapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function fetchOlirMappings() {
  const [csfMap, map171, csf171Map] = await Promise.all([
    build80053ToCsf20Map(),
    build80053To800171Map(),
    build800171ToCsf20Map(),
  ]);

  writeFileSync(join(ROOT, 'maps', '800-53-to-csf.json'), `${JSON.stringify(csfMap, null, 2)}\n`, 'utf8');
  writeFileSync(join(ROOT, 'maps', '800-53-to-800-171.json'), `${JSON.stringify(map171, null, 2)}\n`, 'utf8');
  writeFileSync(join(ROOT, 'maps', '800-171-to-csf.json'), `${JSON.stringify(csf171Map, null, 2)}\n`, 'utf8');

  return {
    csf_relationships: csfMap.relationships.length,
    map171_relationships: map171.relationships.length,
    csf171_relationships: csf171Map.relationships.length,
  };
}

if (process.argv[1]?.includes('fetch-olir-mappings.mjs')) {
  fetchOlirMappings()
    .then((result) => console.log(`Wrote ${result.csf_relationships} CSF mappings, ${result.map171_relationships} 800-171 mappings, and ${result.csf171_relationships} CSF-to-800-171 OLIR mappings`))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
