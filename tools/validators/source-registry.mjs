export const PROVENANCE_CLASSES = new Set([
  'mandated',
  'federal_published',
  'federal_program',
  'federal_utilized',
  'federal_referenced',
]);

export const ELIGIBILITY_STATUSES = new Set(['eligible', 'limited', 'excluded', 'pending_review']);
export const LIFECYCLE_STATUSES = new Set(['active', 'archived', 'deprecated', 'draft', 'restricted']);
export const ACCESS_STATUSES = new Set(['public', 'restricted', 'authenticated']);
export const RETRIEVAL_METHODS = new Set(['download', 'api', 'committed_artifact', 'manual_review']);
export const ARTIFACT_TYPES = new Set([
  'publication',
  'spreadsheet',
  'oscal_json',
  'oscal_xml',
  'api',
  'stix',
  'xccdf',
  'other',
]);
export const SOURCE_TIERS = new Set(['gold', 'silver', 'bronze']);

const REQUIRED_FIELDS = [
  'id',
  'name',
  'owner',
  'provenance_class',
  'mandate_basis',
  'version',
  'retrieved_at',
  'retrieval_method',
  'artifact_url',
  'artifact_type',
  'checksum',
  'access_status',
  'license_or_use',
  'lifecycle_status',
  'eligibility_status',
  'federal_referenced_by',
  'graph_eligible',
];

function requireAllowed(errors, source, field, values) {
  if (!values.has(source[field])) {
    errors.push(`source ${source.id || '<unknown>'} has unsupported ${field}: ${source[field] || 'missing'}`);
  }
}

export function validateSourceRegistry(registry) {
  const errors = [];
  if (registry?.schema_version !== '4.0') {
    errors.push(`source registry schema_version must be 4.0 (got ${registry?.schema_version || 'missing'})`);
  }
  if (!registry?.sources?.length) {
    errors.push('source registry must include at least one source');
    return errors;
  }

  const seen = new Set();
  for (const source of registry.sources) {
    for (const field of REQUIRED_FIELDS) {
      if (source[field] === undefined || source[field] === null || source[field] === '') {
        errors.push(`source ${source.id || '<unknown>'} missing required field: ${field}`);
      }
    }
    if (source.id) {
      if (seen.has(source.id)) errors.push(`duplicate source id: ${source.id}`);
      seen.add(source.id);
    }

    requireAllowed(errors, source, 'provenance_class', PROVENANCE_CLASSES);
    requireAllowed(errors, source, 'eligibility_status', ELIGIBILITY_STATUSES);
    requireAllowed(errors, source, 'lifecycle_status', LIFECYCLE_STATUSES);
    requireAllowed(errors, source, 'access_status', ACCESS_STATUSES);
    requireAllowed(errors, source, 'retrieval_method', RETRIEVAL_METHODS);
    requireAllowed(errors, source, 'artifact_type', ARTIFACT_TYPES);

    if (!Array.isArray(source.mandate_basis)) errors.push(`source ${source.id} mandate_basis must be an array`);
    if (!Array.isArray(source.federal_referenced_by)) errors.push(`source ${source.id} federal_referenced_by must be an array`);
    if (typeof source.graph_eligible !== 'boolean') errors.push(`source ${source.id} graph_eligible must be boolean`);
    if (source.eligibility_status === 'excluded' && source.graph_eligible) {
      errors.push(`excluded source ${source.id} cannot be graph_eligible`);
    }
    if (source.access_status !== 'public' && source.graph_eligible) {
      errors.push(`non-public source ${source.id} cannot be graph_eligible`);
    }
    const authority = source.metadata?.source_authority;
    if (authority !== undefined) {
      if (!SOURCE_TIERS.has(authority.tier)) {
        errors.push(`source ${source.id} has unsupported source_authority.tier: ${authority?.tier || 'missing'}`);
      }
      if (!SOURCE_TIERS.has(authority.resolved_from)) {
        errors.push(`source ${source.id} has unsupported source_authority.resolved_from: ${authority?.resolved_from || 'missing'}`);
      }
      if (!Array.isArray(authority.fallbacks)) {
        errors.push(`source ${source.id} source_authority.fallbacks must be an array`);
      }
    }
  }
  return errors;
}

export function loadSourceRegistry(registry) {
  const errors = validateSourceRegistry(registry);
  if (errors.length) throw new Error(`Invalid source registry:\n- ${errors.join('\n- ')}`);
  return {
    registry,
    byId: new Map(registry.sources.map((source) => [source.id, source])),
    sources: registry.sources,
  };
}

export function getSource(registryState, sourceId) {
  return registryState.byId.get(sourceId) || null;
}
