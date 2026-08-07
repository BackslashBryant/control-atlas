export const SOURCE_ROLES = new Set([
  'publication',
  'primary_data',
  'enrichment',
  'mapping',
  'assessment',
  'automation',
  'reconciliation',
  'reference_only',
  'editorial',
  'historical',
]);

export const AUTHORITY_CLASSES = new Set([
  'publisher',
  'publisher_supplement',
  'government_mapping',
  'validated_third_party',
  'community',
  'historical',
]);

export const RETRIEVAL_METHODS = new Set([
  'api_import',
  'direct_file_import',
  'official_structured_export',
  'repository_snapshot',
  'extracted_from_official_publication',
  'supplemental_mapping',
  'reconciliation_source',
  'reference_only',
  // Backward-compatibility aliases
  'download',
  'api',
  'committed_artifact',
  'manual_review',
]);

export const LIFECYCLE_STATUSES = new Set([
  'active',
  'draft',
  'superseded',
  'sunset',
  'historical',
  'restricted',
  'ignored',
  'failed',
  // Legacy aliases
  'archived',
  'deprecated',
]);

export const ACCESS_STATUSES = new Set(['public', 'restricted', 'authenticated']);

export const FORMATS = new Set([
  'oscal_json',
  'oscal_xml',
  'json',
  'json_ld',
  'xml',
  'csv',
  'spreadsheet',
  'stix',
  'xccdf',
  'html',
  'pdf',
  'api',
  'git',
  'publication',
  'other',
]);

export const PROVENANCE_CLASSES = new Set([
  'mandated',
  'federal_published',
  'federal_program',
  'federal_utilized',
  'federal_referenced',
  'mitre_published',
  'control_atlas_derived',
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX64 = /^[a-f0-9]{64}$/i;

export function isRealSha256(str) {
  if (typeof str !== 'string') return false;
  if (str.includes('placeholder') || str.includes('fabricated') || str.includes('estimated')) return false;
  const hex = str.startsWith('sha256:') ? str.slice(7) : str;
  return HEX64.test(hex);
}

export function validateSourceRegistry(registry) {
  const errors = [];
  if (registry?.schema_version !== '5.0') {
    errors.push(`source registry schema_version must be 5.0 (got ${registry?.schema_version || 'missing'})`);
  }

  // Handle both 5.0 publications/artifacts format and flat sources format
  const publications = registry?.publications || [];
  const artifacts = registry?.artifacts || [];
  const legacySources = registry?.sources || [];

  if (!publications.length && !legacySources.length) {
    errors.push('source registry must include at least one publication or source');
    return errors;
  }

  const seenPubs = new Set();
  for (const pub of publications) {
    if (!pub.id) errors.push('publication missing required field: id');
    else {
      if (seenPubs.has(pub.id)) errors.push(`duplicate publication id: ${pub.id}`);
      seenPubs.add(pub.id);
    }
    if (!pub.name) errors.push(`publication ${pub.id || '<unknown>'} missing required field: name`);
    if (!pub.license_or_use) errors.push(`publication ${pub.id || '<unknown>'} missing required field: license_or_use`);
    if (pub.provenance_class && !PROVENANCE_CLASSES.has(pub.provenance_class)) {
      errors.push(`publication ${pub.id} has unsupported provenance_class: ${pub.provenance_class}`);
    }
    if (pub.authority_class && !AUTHORITY_CLASSES.has(pub.authority_class)) {
      errors.push(`publication ${pub.id} has unsupported authority_class: ${pub.authority_class}`);
    }
    if (pub.lifecycle_status && !LIFECYCLE_STATUSES.has(pub.lifecycle_status)) {
      errors.push(`publication ${pub.id} has unsupported lifecycle_status: ${pub.lifecycle_status}`);
    }
    if (pub.eligibility_status === 'excluded' && pub.graph_eligible) {
      errors.push(`excluded source ${pub.id} cannot be graph_eligible`);
    }
  }

  // Also validate legacy sources if provided
  const sourceList = legacySources.length ? legacySources : publications;
  for (const source of sourceList) {
    if (source.provenance_class && !PROVENANCE_CLASSES.has(source.provenance_class)) {
      errors.push(`source ${source.id} has unsupported provenance_class: ${source.provenance_class}`);
    }
    if (source.eligibility_status === 'excluded' && source.graph_eligible) {
      errors.push(`excluded source ${source.id} cannot be graph_eligible`);
    }
    if (!source.license_or_use) {
      errors.push(`source ${source.id} missing required field: license_or_use`);
    }
    if (source.retrieval_method === 'manual_review' && source.checksum !== null && !isRealSha256(source.checksum)) {
      errors.push(`manual-review source ${source.id} checksum must be null or a sha256 digest`);
    }
  }

  // Validate freshness block if present
  if (registry?.freshness) {
    const freshnessSources = registry.freshness.sources || [];
    const sourceIds = new Set((sourceList).map((s) => s.id));
    const registeredFreshnessIds = new Set();

    for (const entry of freshnessSources) {
      registeredFreshnessIds.add(entry.source_id);
      if (entry.last_checked && !isIsoDate(entry.last_checked)) {
        errors.push(`freshness entry ${entry.source_id} has invalid last_checked date: ${entry.last_checked}`);
      }
      if (entry.sync_model !== 'link_out' && entry.hash && !isRealSha256(entry.hash)) {
        errors.push(`freshness entry ${entry.source_id} sha256 digest invalid`);
      }
      if (entry.sync_model === 'link_out' && entry.last_imported) {
        errors.push(`link-out source ${entry.source_id} cannot specify last_imported`);
      }
    }

    for (const id of sourceIds) {
      if (!registeredFreshnessIds.has(id)) {
        errors.push(`missing freshness entry for source ${id}`);
      }
    }
  }

  const seenArtifacts = new Set();
  for (const art of artifacts) {
    if (!art.id) errors.push('artifact missing required field: id');
    else {
      if (seenArtifacts.has(art.id)) errors.push(`duplicate artifact id: ${art.id}`);
      seenArtifacts.add(art.id);
    }
    if (!art.publication_source_id) {
      errors.push(`artifact ${art.id} missing required field: publication_source_id`);
    } else if (seenPubs.size > 0 && !seenPubs.has(art.publication_source_id)) {
      errors.push(`artifact ${art.id} references unknown publication_source_id: ${art.publication_source_id}`);
    }
    if (!art.source_role || !SOURCE_ROLES.has(art.source_role)) {
      errors.push(`artifact ${art.id} has unsupported source_role: ${art.source_role || 'missing'}`);
    }
    if (!art.authority_class || !AUTHORITY_CLASSES.has(art.authority_class)) {
      errors.push(`artifact ${art.id} has unsupported authority_class: ${art.authority_class || 'missing'}`);
    }
    if (!art.format || !FORMATS.has(art.format)) {
      errors.push(`artifact ${art.id} has unsupported format: ${art.format || 'missing'}`);
    }
    if (art.retrieval_method && !RETRIEVAL_METHODS.has(art.retrieval_method)) {
      errors.push(`artifact ${art.id} has unsupported retrieval_method: ${art.retrieval_method}`);
    }
    if (typeof art.byte_length !== 'number' || art.byte_length < 0) {
      errors.push(`artifact ${art.id} byte_length must be a non-negative integer`);
    }
    if (!art.sha256 || !isRealSha256(art.sha256)) {
      errors.push(`artifact ${art.id} sha256 must be a valid 64-char hex SHA-256 digest without placeholder/fabricated strings (got ${art.sha256 || 'missing'})`);
    }
    if (typeof art.record_count !== 'number' || art.record_count < 0) {
      errors.push(`artifact ${art.id} record_count must be a non-negative integer`);
    }
    if (typeof art.relationship_count !== 'number' || art.relationship_count < 0) {
      errors.push(`artifact ${art.id} relationship_count must be a non-negative integer`);
    }
  }

  // Validate catalog_source_bundles
  if (Array.isArray(registry?.catalog_source_bundles)) {
    for (const bundle of registry.catalog_source_bundles) {
      if (!bundle.catalog_id) errors.push('catalog_source_bundle missing catalog_id');
      if (!bundle.publication_source_id) errors.push(`catalog_source_bundle ${bundle.catalog_id} missing publication_source_id`);
      for (const field of [
        'primary_artifact_ids',
        'enrichment_artifact_ids',
        'mapping_source_ids',
        'assessment_source_ids',
        'automation_source_ids',
        'reconciliation_source_ids',
      ]) {
        if (!Array.isArray(bundle[field])) {
          errors.push(`catalog_source_bundle ${bundle.catalog_id} field ${field} must be an array`);
        }
      }
    }
  }

  return errors;
}

export function isIsoDate(value) {
  if (!ISO_DATE.test(String(value || ''))) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function loadSourceRegistry(registry) {
  const errors = validateSourceRegistry(registry);
  if (errors.length) throw new Error(`Invalid source registry:\n- ${errors.join('\n- ')}`);

  const publications = registry.publications || [];
  const artifacts = registry.artifacts || [];
  const bundles = registry.catalog_source_bundles || [];

  // Build unified sources list for backward compatibility
  const sources = [];
  const byId = new Map();

  for (const pub of publications) {
    const pubObj = {
      ...pub,
      display_name: pub.display_name || pub.name,
      owner: pub.owner || 'Publisher not recorded',
      provenance_class: pub.provenance_class || 'federal_published',
      eligibility_status: pub.eligibility_status || 'eligible',
      lifecycle_status: pub.lifecycle_status || 'active',
      access_status: pub.access_status || 'public',
      graph_eligible: pub.graph_eligible ?? true,
      license_or_use: pub.license_or_use || '',
      artifact_url: pub.artifact_url || pub.catalog_browse_url || '',
    };
    sources.push(pubObj);
    byId.set(pub.id, pubObj);
  }

  for (const art of artifacts) {
    if (!byId.has(art.id)) {
      const artObj = {
        ...art,
        name: art.name || art.id,
        display_name: art.display_name || art.name || art.id,
        owner: art.owner || 'Publisher not recorded',
        provenance_class: art.authority_class || 'federal_published',
        eligibility_status: art.lifecycle_status === 'active' ? 'eligible' : 'limited',
        lifecycle_status: art.lifecycle_status || 'active',
        access_status: 'public',
        graph_eligible: false,
        artifact_type: art.format || 'json',
        checksum: art.sha256,
      };
      sources.push(artObj);
      byId.set(art.id, artObj);
    }
  }

  // Merge legacy sources array if present
  if (Array.isArray(registry.sources)) {
    for (const src of registry.sources) {
      const existing = byId.get(src.id);
      const merged = existing ? { ...src, ...existing, metadata: { ...(src.metadata || {}), ...(existing.metadata || {}) } } : src;
      byId.set(src.id, merged);
      const idx = sources.findIndex((s) => s.id === src.id);
      if (idx !== -1) sources[idx] = merged;
      else sources.push(merged);
    }
  }

  // Merge freshness metadata if present
  if (registry.freshness) {
    const freshnessMap = new Map((registry.freshness.sources || []).map((f) => [f.source_id, f]));
    const staleDays = registry.freshness.stale_after_days || 45;
    for (const [id, source] of byId.entries()) {
      const f = freshnessMap.get(id);
      if (f) {
        source.sync_model = f.sync_model;
        source.stale_after_days = staleDays;
        source.last_checked = f.last_checked || source.last_checked || '2026-08-05';
        source.last_imported = f.last_imported ?? null;
        source.hash = f.hash ?? null;
      }
    }
  }

  return {
    registry,
    publications,
    artifacts,
    catalogSourceBundles: bundles,
    byId,
    sources,
  };
}

export function getSource(registryState, sourceId) {
  return registryState.byId.get(sourceId) || null;
}

