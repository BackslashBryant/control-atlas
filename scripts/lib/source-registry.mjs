export const AUTHORITY_TYPES = new Set([
  'catalog_authority',
  'owner_authority_mapping',
  'non_owner_authority_mapping',
  'corroboration',
  'research_candidate',
]);

export const TIER_ORDER = ['gold', 'silver', 'bronze'];

const GOLD_REQUIRED_FIELDS = ['authority_type', 'artifact', 'parser', 'refresh_strategy', 'status', 'snapshot_date', 'checksum'];
const ALL_REQUIRED_FIELDS = [
  'id',
  'name',
  'tier',
  'issuer',
  'artifact',
  'frameworks',
  'authority_type',
  'status',
  'parser',
  'refresh_strategy',
  'license_notes',
  'snapshot_date',
  'checksum'
];

export function isMappingAuthority(source) {
  return source?.authority_type === 'owner_authority_mapping' || source?.authority_type === 'non_owner_authority_mapping';
}

export function isCatalogAuthority(source) {
  return source?.authority_type === 'catalog_authority';
}

export function canPublishCrosswalk(source) {
  return source?.tier === 'gold' && source?.authority_type === 'owner_authority_mapping';
}

export function validateSourceRegistry(registry) {
  const errors = [];
  if (!registry?.sources?.length) {
    errors.push('source registry must include at least one source');
    return errors;
  }
  if (registry.schema_version !== '3.0') {
    errors.push(`source registry schema_version must be 3.0 (got ${registry.schema_version || 'missing'})`);
  }

  const seen = new Set();
  for (const source of registry.sources) {
    for (const field of ALL_REQUIRED_FIELDS) {
      if (source[field] === undefined || source[field] === null || source[field] === '') {
        errors.push(`source ${source.id || '<unknown>'} missing required field: ${field}`);
      }
    }
    if (source.id) {
      if (seen.has(source.id)) errors.push(`duplicate source id: ${source.id}`);
      seen.add(source.id);
    }
    if (source.tier === 'gold' && !source.authority_type) {
      errors.push(`gold source ${source.id} missing authority_type`);
    }
    if (source.tier === 'gold') {
      for (const field of GOLD_REQUIRED_FIELDS) {
        if (!source[field]) errors.push(`gold source ${source.id} missing ${field}`);
      }
    }
    if (source.authority_type && !AUTHORITY_TYPES.has(source.authority_type)) {
      errors.push(`source ${source.id} has unsupported authority_type: ${source.authority_type}`);
    }
    if (source.tier === 'gold' && source.authority_type === 'research_candidate') {
      errors.push(`gold source ${source.id} cannot use research_candidate authority_type`);
    }
    if (source.tier === 'bronze' && source.authority_type !== 'research_candidate') {
      errors.push(`bronze source ${source.id} must use research_candidate authority_type`);
    }
    if (source.tier === 'silver' && source.authority_type !== 'corroboration' && source.authority_type !== 'non_owner_authority_mapping') {
      errors.push(`silver source ${source.id} must use corroboration or non_owner_authority_mapping authority_type`);
    }

    // Manual seed mapping files must be bronze or candidate by default
    if (source.parser === 'manual-seed' && source.authority_type !== 'catalog_authority') {
      if (source.tier === 'gold' || source.tier === 'silver') {
        errors.push(`manual seed mapping source ${source.id} cannot be gold or silver`);
      }
    }

    // Third-party OLIR mappings are silver unless the submitter is the owner authority
    if (source.parser?.startsWith('olir-') && source.authority_type === 'owner_authority_mapping') {
      const isOwner = source.owner_authority === true || source.issuer === 'NIST' || source.submitter === 'NIST';
      if (!isOwner) {
        errors.push(`third-party OLIR mapping ${source.id} cannot be gold/owner_authority_mapping`);
      }
    }
  }

  return errors;
}

export function loadSourceRegistry(registry) {
  const errors = validateSourceRegistry(registry);
  if (errors.length) {
    throw new Error(`Invalid source registry:\n- ${errors.join('\n- ')}`);
  }
  const byId = new Map(registry.sources.map((source) => [source.id, source]));
  return { registry, byId, sources: registry.sources };
}

export function getSource(registryState, sourceId) {
  return registryState.byId.get(sourceId) || null;
}

