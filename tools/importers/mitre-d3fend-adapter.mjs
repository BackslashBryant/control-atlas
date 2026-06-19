const D3FEND_ONTOLOGY_SOURCE = 'mitre-d3fend-ontology';
const D3FEND_MAPPINGS_SOURCE = 'mitre-d3fend-mappings';

function literalValue(binding, key) {
  return binding?.[key]?.value || '';
}

function uriLocalName(uri) {
  if (!uri || typeof uri !== 'string') return '';
  const hash = uri.split('#').pop() || '';
  const slash = hash.split('/').pop() || hash;
  return slash.replace(/^d3f:/, '');
}

function normalizeNistControlId(label = '') {
  const match = String(label).trim().match(/^([A-Z]{2,3})-(\d+)(?:\((\d+)\))?$/);
  if (!match) return null;
  const [, family, base, enhancement] = match;
  return enhancement ? `${family}-${base}.${enhancement}` : `${family}-${base}`;
}

function techniqueSlugFromUri(uri) {
  return uriLocalName(uri);
}

export function parseD3fendTechniques(techniqueDocument) {
  const graph = techniqueDocument?.['@graph'] || [];
  const records = [];
  for (const entry of graph) {
    const d3fendId = entry['d3f:d3fend-id'];
    if (!d3fendId) continue;
    const label = entry['rdfs:label'] || d3fendId;
    const definition = entry['d3f:definition'] || entry['d3f:kb-article'] || '';
    const slug = uriLocalName(entry['@id']);
    records.push({
      id: d3fendId,
      type: 'defend_countermeasure',
      title: `${d3fendId} ${label}`,
      description: String(definition).replace(/\s+/g, ' ').trim(),
      status: 'active',
      family: entry['d3f:enables']
        ? uriLocalName(
            typeof entry['d3f:enables'] === 'object'
              ? entry['d3f:enables']['@id']
              : entry['d3f:enables'],
          )
        : '',
      metadata: {
        technique_slug: slug,
        synonym: entry['d3f:synonym'] || null,
      },
      source: {
        key: D3FEND_ONTOLOGY_SOURCE,
        snapshot_date: '',
        version: '',
        locator: `technique/all.json#${d3fendId}`,
      },
    });
  }
  records.sort((left, right) => left.id.localeCompare(right.id));
  return records;
}

export function buildD3fendCatalogDocument(records, metadata) {
  return {
    schema_version: '2.0',
    source_key: D3FEND_ONTOLOGY_SOURCE,
    source_artifact: metadata.artifactUrl,
    source_version: metadata.version,
    snapshot_date: metadata.snapshotDate,
    checksum: metadata.checksum,
    provenance: metadata.provenance || 'MITRE D3FEND defensive technique catalog',
    records,
  };
}

export function buildSlugToD3fendIdMap(records) {
  const map = new Map();
  for (const record of records) {
    if (record.metadata?.technique_slug) {
      map.set(record.metadata.technique_slug, record.id);
    }
    map.set(record.id, record.id);
  }
  return map;
}

export function buildAttackCatalogLookup(enterpriseRecords = [], icsRecords = []) {
  const lookup = new Map();
  for (const record of enterpriseRecords) {
    lookup.set(record.id, 'mitre-attack');
  }
  for (const record of icsRecords) {
    if (!lookup.has(record.id)) {
      lookup.set(record.id, 'mitre-attack-ics');
    }
  }
  return lookup;
}

export function buildAttackToD3fendRelationships(bindings, slugToD3fendId, attackCatalogLookup, metadata) {
  const relationships = [];
  const seen = new Set();
  for (const binding of bindings) {
    const attackId = literalValue(binding, 'off_tech_id');
    const defSlug = techniqueSlugFromUri(literalValue(binding, 'def_tech'));
    const defId = slugToD3fendId.get(defSlug);
    const sourceCatalog = attackCatalogLookup.get(attackId);
    if (!attackId || !defId || !sourceCatalog) continue;
    const key = `${sourceCatalog}:${attackId}->mitre-d3fend:${defId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    relationships.push({
      source_catalog: sourceCatalog,
      source_id: attackId,
      target_catalog: 'mitre-d3fend',
      target_id: defId,
      relationship_type: 'mitigates',
      why: `MITRE D3FEND maps ATT&CK technique ${attackId} to defensive technique ${defId} (${literalValue(binding, 'def_tech_label') || defSlug}).`,
      source_locator: `d3fend-full-mappings.json#${attackId}:${defId}`,
      evidence_source: D3FEND_MAPPINGS_SOURCE,
    });
  }
  relationships.sort((left, right) =>
    `${left.source_catalog}:${left.source_id}:${left.target_id}`.localeCompare(
      `${right.source_catalog}:${right.source_id}:${right.target_id}`,
    ),
  );
  return relationships;
}

export function buildD3fendToNistRelationships(ontologyDocument, slugToD3fendId, metadata) {
  const graph = ontologyDocument?.['@graph'] || [];
  const relationships = [];
  const seen = new Set();
  for (const entry of graph) {
    const types = Array.isArray(entry['@type']) ? entry['@type'] : [entry['@type']];
    if (!types.includes('d3f:NISTControl')) continue;
    const controlLabel = entry['rdfs:label'];
    const targetControlId = normalizeNistControlId(controlLabel);
    const narrower = entry['d3f:narrower'];
    const defSlug = uriLocalName(
      typeof narrower === 'object' ? narrower?.['@id'] : narrower,
    );
    const sourceDefId = slugToD3fendId.get(defSlug);
    if (!targetControlId || !sourceDefId) continue;
    const key = `${sourceDefId}->nist-800-53:${targetControlId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    relationships.push({
      source_catalog: 'mitre-d3fend',
      source_id: sourceDefId,
      target_catalog: 'nist-800-53',
      target_id: targetControlId,
      relationship_type: 'supports',
      why: `MITRE D3FEND maps defensive technique ${sourceDefId} to NIST SP 800-53 Rev. 5 control ${controlLabel}.`,
      source_locator: `d3fend.json#${controlLabel}:${sourceDefId}`,
      evidence_source: D3FEND_MAPPINGS_SOURCE,
    });
  }
  relationships.sort((left, right) =>
    `${left.source_id}:${left.target_id}`.localeCompare(`${right.source_id}:${right.target_id}`),
  );
  return relationships;
}

export function buildMappingDocument(relationships, metadata) {
  return {
    schema_version: '2.0',
    source_key: metadata.sourceKey || D3FEND_MAPPINGS_SOURCE,
    source_artifact: metadata.artifactUrl,
    source_version: metadata.version,
    snapshot_date: metadata.snapshotDate,
    checksum: metadata.checksum,
    provenance: metadata.provenance,
    relationships,
  };
}

export { D3FEND_MAPPINGS_SOURCE, D3FEND_ONTOLOGY_SOURCE };
