export const PROVENANCE_CLASSES = new Set([
  'mandated',
  'federal_published',
  'federal_program',
  'federal_utilized',
  'federal_referenced',
  'mitre_published',
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
export const SYNC_MODELS = new Set(['auto_synced', 'curated', 'link_out']);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;

const REQUIRED_FIELDS = [
  'id',
  'name',
  'display_name',
  'display_group',
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

  const freshness = registry.freshness;
  if (!Number.isInteger(freshness?.stale_after_days) || freshness.stale_after_days < 1) {
    errors.push('source registry freshness.stale_after_days must be a positive integer');
  }
  if (!Array.isArray(freshness?.sources)) {
    errors.push('source registry freshness.sources must be an array');
    return errors;
  }

  const sourceIds = new Set(registry.sources.map((source) => source.id));
  const freshnessIds = new Set();
  for (const entry of freshness.sources) {
    if (!sourceIds.has(entry.source_id)) {
      errors.push(`freshness entry references unknown source: ${entry.source_id || 'missing'}`);
    }
    if (freshnessIds.has(entry.source_id)) {
      errors.push(`duplicate freshness entry: ${entry.source_id}`);
    }
    freshnessIds.add(entry.source_id);
    if (!SYNC_MODELS.has(entry.sync_model)) {
      errors.push(`source ${entry.source_id} has unsupported sync_model: ${entry.sync_model || 'missing'}`);
    }
    if (!isIsoDate(entry.last_checked)) {
      errors.push(`source ${entry.source_id} last_checked must be a valid YYYY-MM-DD date`);
    }
    if (entry.sync_model === 'link_out') {
      if (entry.last_imported !== null) {
        errors.push(`link-out source ${entry.source_id} last_imported must be null`);
      }
      if (entry.hash !== null) {
        errors.push(`link-out source ${entry.source_id} hash must be null`);
      }
    } else if (!isIsoDate(entry.last_imported)) {
      errors.push(`source ${entry.source_id} last_imported must be a valid YYYY-MM-DD date`);
    }
    if (entry.hash !== null && !SHA256.test(entry.hash)) {
      errors.push(`source ${entry.source_id} hash must be null or a sha256 digest`);
    }
  }
  for (const sourceId of sourceIds) {
    if (!freshnessIds.has(sourceId)) errors.push(`source ${sourceId} missing freshness entry`);
  }
  return errors;
}

function isIsoDate(value) {
  if (!ISO_DATE.test(String(value || ''))) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function loadSourceRegistry(registry) {
  const errors = validateSourceRegistry(registry);
  if (errors.length) throw new Error(`Invalid source registry:\n- ${errors.join('\n- ')}`);
  const freshnessById = new Map(
    registry.freshness.sources.map((entry) => [entry.source_id, entry]),
  );
  const sources = registry.sources.map((source) => {
    const freshness = { ...freshnessById.get(source.id) };
    delete freshness.source_id;
    return {
      ...source,
      ...freshness,
      stale_after_days: registry.freshness.stale_after_days,
    };
  });
  return {
    registry,
    byId: new Map(sources.map((source) => [source.id, source])),
    sources,
  };
}

export function getSource(registryState, sourceId) {
  return registryState.byId.get(sourceId) || null;
}
