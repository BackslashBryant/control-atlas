const ENTERPRISE_SOURCE = 'mitre-attack-enterprise';
const ICS_SOURCE = 'mitre-attack-ics';

function textValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object' && value['#text'] !== undefined) return String(value['#text']).trim();
  return String(value).trim();
}

function externalId(object, sourceName) {
  const reference = (object.external_references || []).find(
    (entry) => entry.source_name === sourceName && entry.external_id,
  );
  return reference?.external_id || null;
}

function tacticNames(object) {
  return (object.kill_chain_phases || [])
    .map((phase) => phase.phase_name)
    .filter(Boolean);
}

function platformNames(object) {
  return (object.x_mitre_platforms || []).filter(Boolean);
}

function normalizeAttackRecord(object, options) {
  const techniqueId = externalId(object, options.externalSourceName);
  if (!techniqueId) return null;

  const name = textValue(object.name) || techniqueId;
  const description = textValue(object.description);
  const tactics = tacticNames(object);
  const platforms = platformNames(object);

  return {
    id: techniqueId,
    type: 'attack_technique',
    title: `${techniqueId} ${name}`,
    description,
    status: object.revoked || object.x_mitre_deprecated ? 'deprecated' : 'active',
    family: tactics[0] || '',
    metadata: {
      attack_domain: options.domain,
      tactics,
      platforms,
      is_subtechnique: Boolean(object.x_mitre_is_subtechnique),
      stix_id: object.id,
    },
    source: {
      key: options.sourceKey,
      snapshot_date: options.snapshotDate,
      version: options.version,
      locator: `${options.locatorPrefix}#${techniqueId}`,
    },
  };
}

export function parseAttackStixBundle(stixDocument, options = {}) {
  const objects = stixDocument?.objects || [];
  const records = [];
  for (const object of objects) {
    if (object.type !== 'attack-pattern') continue;
    if (object.revoked || object.x_mitre_deprecated) continue;
    const record = normalizeAttackRecord(object, options);
    if (record) records.push(record);
  }
  records.sort((left, right) => left.id.localeCompare(right.id));
  return records;
}

export function buildAttackCatalogDocument(records, metadata) {
  return {
    schema_version: '2.0',
    source_key: metadata.sourceKey,
    source_artifact: metadata.artifactUrl,
    source_version: metadata.version,
    snapshot_date: metadata.snapshotDate,
    checksum: metadata.checksum,
    provenance: metadata.provenance,
    records,
  };
}

export function parseEnterpriseAttackStix(stixDocument, metadata) {
  return buildAttackCatalogDocument(
    parseAttackStixBundle(stixDocument, {
      domain: 'enterprise',
      sourceKey: ENTERPRISE_SOURCE,
      externalSourceName: 'mitre-attack',
      snapshotDate: metadata.snapshotDate,
      version: metadata.version,
      locatorPrefix: metadata.locatorPrefix || 'enterprise-attack.json',
    }),
    {
      ...metadata,
      sourceKey: ENTERPRISE_SOURCE,
      provenance: metadata.provenance || 'MITRE ATT&CK Enterprise STIX bundle',
    },
  );
}

export function parseIcsAttackStix(stixDocument, metadata) {
  return buildAttackCatalogDocument(
    parseAttackStixBundle(stixDocument, {
      domain: 'ics',
      sourceKey: ICS_SOURCE,
      externalSourceName: 'mitre-attack',
      snapshotDate: metadata.snapshotDate,
      version: metadata.version,
      locatorPrefix: metadata.locatorPrefix || 'ics-attack.json',
    }),
    {
      ...metadata,
      sourceKey: ICS_SOURCE,
      provenance: metadata.provenance || 'MITRE ATT&CK for ICS STIX bundle',
    },
  );
}

export { ENTERPRISE_SOURCE, ICS_SOURCE };
