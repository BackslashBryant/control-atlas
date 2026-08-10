export const AUTHORITY_MANDATE_VALUES = new Set([
  "statutory",
  "contractual",
  "federal_policy_or_regulatory_mandate",
  "issued_without_federal_mandate",
]);

export const AUTHORITY_INSTRUMENT_NODE_TYPES = new Set([
  "statute",
  "regulation",
  "policy_directive",
]);

const LIMITED_SCOPE_PUBLICATIONS = new Set([
  "csf-2",
  "nist-800-172",
  "fedramp-rev5",
]);

function refErrors(owner, refs, sourceIds) {
  const errors = [];
  if (!Array.isArray(refs) || refs.length === 0) {
    return [`${owner} must cite at least one official source_ref`];
  }
  for (const [index, reference] of refs.entries()) {
    if (!reference?.source_id || !sourceIds.has(reference.source_id)) {
      errors.push(
        `${owner} source_refs[${index}] has unresolved source_id ${reference?.source_id || "<missing>"}`,
      );
    }
    if (!String(reference?.locator || "").trim()) {
      errors.push(`${owner} source_refs[${index}] has no evidence locator`);
    }
  }
  return errors;
}

export function validateAuthoritySpine(
  spine,
  { catalogIds = new Set(), sourceIds = new Set() } = {},
) {
  const errors = [];
  if (spine?.schema_version !== "1.0") {
    errors.push("authority-spine schema_version must be 1.0");
  }
  const instruments = Array.isArray(spine?.instruments)
    ? spine.instruments
    : [];
  const publications = Array.isArray(spine?.publications)
    ? spine.publications
    : [];
  if (instruments.length === 0) errors.push("authority-spine has no instruments");
  if (publications.length === 0) errors.push("authority-spine has no publications");

  const instrumentById = new Map();
  for (const instrument of instruments) {
    const id = String(instrument?.id || "");
    if (!/^authority:[A-Z0-9][A-Z0-9.-]*$/.test(id)) {
      errors.push(`${id || "<missing instrument id>"} must use authority:<CITATION-SLUG>`);
    }
    if (instrumentById.has(id)) errors.push(`duplicate authority instrument ${id}`);
    instrumentById.set(id, instrument);
    if (!AUTHORITY_INSTRUMENT_NODE_TYPES.has(instrument?.node_type)) {
      errors.push(`${id} has unsupported node_type ${instrument?.node_type || "<missing>"}`);
    }
    if (!String(instrument?.label || "").trim()) errors.push(`${id} has no label`);
    if (!String(instrument?.blurb || "").trim()) errors.push(`${id} has no blurb`);
    if (!instrument?.source_id || !sourceIds.has(instrument.source_id)) {
      errors.push(`${id} has unresolved source_id ${instrument?.source_id || "<missing>"}`);
    }
    errors.push(...refErrors(id, instrument?.source_refs, sourceIds));
  }

  for (const instrument of instruments) {
    if (instrument.parent && !instrumentById.has(instrument.parent)) {
      errors.push(`${instrument.id} has unresolved parent ${instrument.parent}`);
    }
  }
  for (const instrument of instruments) {
    const seen = new Set();
    let current = instrument;
    while (current?.parent) {
      if (seen.has(current.id)) {
        errors.push(`authority relationship cycle includes ${current.id}`);
        break;
      }
      seen.add(current.id);
      current = instrumentById.get(current.parent);
    }
  }

  const publicationByCatalogId = new Map();
  for (const publication of publications) {
    const catalogId = String(publication?.catalog_id || "");
    if (!catalogId) errors.push("authority publication has no catalog_id");
    if (publicationByCatalogId.has(catalogId)) {
      errors.push(`duplicate authority publication ${catalogId}`);
    }
    publicationByCatalogId.set(catalogId, publication);
    if (!AUTHORITY_MANDATE_VALUES.has(publication?.mandate)) {
      errors.push(`${catalogId} has unsupported mandate ${publication?.mandate || "<missing>"}`);
    }
    if (!String(publication?.publication_type || "").trim()) {
      errors.push(`${catalogId} has no publication_type`);
    }
    if (!String(publication?.mandate_note || "").trim()) {
      errors.push(`${catalogId} has no mandate_note`);
    }
    if (
      publication?.mandate !== "issued_without_federal_mandate" &&
      !publication?.primary_authority
    ) {
      errors.push(`${catalogId} requires a primary_authority`);
    }
    if (
      publication?.primary_authority &&
      !instrumentById.has(publication.primary_authority)
    ) {
      errors.push(
        `${catalogId} has unresolved primary_authority ${publication.primary_authority}`,
      );
    }
    const alsoRequiredBy = Array.isArray(publication?.also_required_by)
      ? publication.also_required_by
      : [];
    if (!Array.isArray(publication?.also_required_by)) {
      errors.push(`${catalogId} also_required_by must be an array`);
    }
    if (new Set(alsoRequiredBy).size !== alsoRequiredBy.length) {
      errors.push(`${catalogId} has duplicate also_required_by entries`);
    }
    for (const authorityId of alsoRequiredBy) {
      if (!instrumentById.has(authorityId)) {
        errors.push(`${catalogId} has unresolved also_required_by ${authorityId}`);
      }
      if (authorityId === publication.primary_authority) {
        errors.push(`${catalogId} repeats primary_authority in also_required_by`);
      }
    }
    errors.push(...refErrors(catalogId, publication?.source_refs, sourceIds));
    if (
      LIMITED_SCOPE_PUBLICATIONS.has(catalogId) &&
      (!String(publication?.mandate_note || "").trim() ||
        !publication?.source_refs?.length)
    ) {
      errors.push(`${catalogId} requires a cited non-universal scope note`);
    }
  }

  for (const catalogId of catalogIds) {
    if (!publicationByCatalogId.has(catalogId)) {
      errors.push(`catalog ${catalogId} is missing from authority-spine publications`);
    }
  }
  for (const catalogId of publicationByCatalogId.keys()) {
    if (!catalogIds.has(catalogId)) {
      errors.push(`authority publication ${catalogId} is not declared by tree-spine`);
    }
  }

  return errors;
}
