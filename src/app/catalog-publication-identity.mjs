export const INGESTION_ONLY_SOURCE_IDS = new Set([
  "nist-oscal",
  "nist-ssdf-oscal",
]);

export const OSCAL_PUBLICATION_SOURCE_BY_CATALOG = Object.freeze({
  "nist-800-53": "nist-800-53",
  "nist-800-53a": "nist-800-53a-assessment-procedures",
  "nist-800-171": "nist-800-171",
  "csf-2": "nist-csf-2",
  "nist-ssdf": "nist-ssdf",
});

export function resolveCatalogPublicationIdentity({
  catalogId,
  ingestionSourceId,
  sourceById,
}) {
  const publicationSourceId = INGESTION_ONLY_SOURCE_IDS.has(ingestionSourceId)
    ? OSCAL_PUBLICATION_SOURCE_BY_CATALOG[catalogId]
    : ingestionSourceId;
  if (
    !publicationSourceId ||
    INGESTION_ONLY_SOURCE_IDS.has(publicationSourceId) ||
    !sourceById.has(publicationSourceId)
  ) {
    return null;
  }
  return {
    publicationSourceId,
    ingestionSourceId,
  };
}

// Control Atlas's own structural scaffold (trunk + limbs) is not published
// catalog content — it carries no catalog_id and is exempt from catalog
// publication identity. Its edges are always publication_status 'editorial'.
export const ORGANIZING_STRUCTURE_SOURCE_ID = "control-atlas-structure";
export const AUTHORITY_NODE_TYPES = new Set([
  "statute",
  "regulation",
  "policy_directive",
]);

export function validateCatalogPublicationIdentity(nodes, sources) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const errors = [];
  for (const node of nodes) {
    if (node.source_id === ORGANIZING_STRUCTURE_SOURCE_ID) continue;
    if (AUTHORITY_NODE_TYPES.has(node.node_type)) {
      const ingestionSourceId = node.metadata?.ingestion_source_id;
      if (!ingestionSourceId || !sourceById.has(ingestionSourceId)) {
        errors.push(`${node.id} is missing valid ingestion provenance`);
      }
      if (!node.source_id || !sourceById.has(node.source_id)) {
        errors.push(`${node.id} is missing valid publication identity`);
      }
      continue;
    }
    const catalogId = node.metadata?.catalog_id;
    const ingestionSourceId = node.metadata?.ingestion_source_id;
    if (!catalogId) {
      errors.push(`${node.id} is missing catalog identity`);
      continue;
    }
    if (!ingestionSourceId || !sourceById.has(ingestionSourceId)) {
      errors.push(`${node.id} is missing valid ingestion provenance`);
      continue;
    }
    if (!node.source_id || !sourceById.has(node.source_id)) {
      errors.push(`${node.id} is missing valid publication identity`);
      continue;
    }
    if (INGESTION_ONLY_SOURCE_IDS.has(node.source_id)) {
      errors.push(`${node.id} uses ingestion source ${node.source_id} as publication identity`);
    }
    const resolved = resolveCatalogPublicationIdentity({
      catalogId,
      ingestionSourceId,
      sourceById,
    });
    if (!resolved) {
      errors.push(`${node.id} cannot resolve an exact publication identity`);
      continue;
    }
    if (node.source_id !== resolved.publicationSourceId) {
      errors.push(
        `${node.id} publication mismatch: ${node.source_id} != ${resolved.publicationSourceId}`,
      );
    }
  }
  return errors;
}
