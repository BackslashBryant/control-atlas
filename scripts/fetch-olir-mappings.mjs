#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build80053To800171Map } from '../tools/relationship-builders/800-171-mapping-adapter.mjs';
import { build80053ToCsf20Map, parseOlirExcel, checksum, fetchBuffer } from '../tools/relationship-builders/olir-adapter.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const FALLBACK_SOURCES = [
  {
    id: 111,
    name: "Cybersecurity Framework v2.0",
    url: "https://csrc.nist.gov/csrc/media/projects/olir/documents/submissions/Cybersecurity_Framework_v2-0_Concept_Crosswalk_800-53_5_2_0_draft.xlsx",
    focal: "CSF 2.0"
  },
  {
    id: 136,
    name: "SP 800-171 Rev 3",
    url: "https://raw.githubusercontent.com/usnistgov/oscal-content/main/nist.gov/SP800-171/rev3/json/NIST_SP800-171_rev3_catalog.json",
    focal: "SP 800-171"
  }
];

export async function fetchOlirMappings() {
  console.log('Discovering OLIR catalog...');
  const catalogRes = await fetch('https://csrc.nist.gov/extensions/nudp/services/json/olir/informative-reference-catalog');
  const catalogJson = await catalogRes.json();
  const searchResults = catalogJson.response.searchResults || [];
  
  const manifest = {
    generated_at: new Date().toISOString(),
    source: "https://csrc.nist.gov/projects/olir/informative-reference-catalog",
    total_entries: searchResults.length,
    processed_items: []
  };

  const [csfMap, map171] = await Promise.all([
    build80053ToCsf20Map(),
    build80053To800171Map(),
  ]);

  writeFileSync(join(ROOT, 'maps', '800-53-to-csf.json'), `${JSON.stringify(csfMap, null, 2)}\n`, 'utf8');
  writeFileSync(join(ROOT, 'maps', '800-53-to-800-171.json'), `${JSON.stringify(map171, null, 2)}\n`, 'utf8');

  // Push known fallbacks to manifest
  manifest.processed_items.push({
    id: 111,
    name: "Cybersecurity Framework v2.0 to SP 800-53 Rev 5.2.0",
    source_url: FALLBACK_SOURCES[0].url,
    relationships_count: csfMap.relationships.length,
    checksum: csfMap.checksum,
    status: csfMap.olir_status
  });
  manifest.processed_items.push({
    id: 136,
    name: "SP 800-171 Rev 3 to SP 800-53 Rev 5.2.0",
    source_url: FALLBACK_SOURCES[1].url,
    relationships_count: map171.relationships.length,
    checksum: map171.checksum,
    status: map171.olir_status
  });

  // Attempt to fetch extra dynamic entries (just metadata and links)
  for (const item of searchResults) {
    if (item.informativeReferenceFrameworkVersionId === 111 || item.informativeReferenceFrameworkVersionId === 136) continue;
    
    try {
      const detailsRes = await fetch(`https://csrc.nist.gov/extensions/nudp/services/json/olir/informative-reference-catalog/details/${item.informativeReferenceFrameworkVersionId}`);
      const detailsJson = await detailsRes.json();
      const website = detailsJson.response[0]?.webSite || '';
      
      if (website.includes('.xls') || website.includes('.csv')) {
        manifest.processed_items.push({
          id: item.informativeReferenceFrameworkVersionId,
          name: item.name,
          source_url: website,
          status: "discovered_but_not_ingested"
        });
      }
    } catch (err) {
      console.warn(`Failed to inspect OLIR entry ${item.informativeReferenceFrameworkVersionId}: ${err.message}`);
    }
  }

  writeFileSync(join(ROOT, 'data', 'olir-catalog-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    csf_relationships: csfMap.relationships.length,
    map171_relationships: map171.relationships.length,
    total_manifest: manifest.processed_items.length
  };
}

if (process.argv[1]?.includes('fetch-olir-mappings.mjs')) {
  fetchOlirMappings()
    .then((result) => console.log(`Wrote ${result.csf_relationships} CSF mappings, ${result.map171_relationships} 800-171 mappings, and ${result.total_manifest} manifest items`))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
