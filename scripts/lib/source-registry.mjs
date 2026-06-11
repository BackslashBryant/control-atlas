export const AUTHORITY_TYPES = new Set([
  'catalog_authority',
  'mapping_authority',
  'corroboration',
  'research_candidate',
]);

export const TIER_ORDER = ['gold', 'silver', 'bronze'];

const GOLD_REQUIRED_FIELDS = ['authority_type', 'artifact', 'parser', 'refresh_strategy', 'status'];
const ALL_REQUIRED_FIELDS = ['id', 'name', 'tier', 'issuer', 'artifact', 'frameworks', 'authority_type', 'status', 'parser', 'refresh_strategy'];

export function isMappingAuthority(source) {
  return source?.authority_type === 'mapping_authority';
}

export function isCatalogAuthority(source) {
  return source?.authority_type === 'catalog_authority';
}

export function canPublishCrosswalk(source) {
  return source?.tier === 'gold' && isMappingAuthority(source);
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
    if (source.tier === 'silver' && source.authority_type !== 'corroboration') {
      errors.push(`silver source ${source.id} must use corroboration authority_type`);
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
