import registry from "../../data/generated/taxonomy-registry.json" with { type: "json" };

const RECORD_SOURCE_BASIS = {
  domain: ["family", "metadata.related_categories[]"],
  asset_class: ["metadata.benchmark_title", "metadata.identity_category", "family", "catalog_id"],
  environment: ["metadata.benchmark_title", "metadata.identity_category", "family"],
  technology: ["metadata.benchmark_title", "metadata.identity_category", "family"],
  vendor_brand: ["metadata.benchmark_title"],
  product: ["metadata.benchmark_title", "metadata.identity_category", "family"],
  organization: ["catalog_id"],
  framework: ["catalog_id"],
  program: ["catalog_id", "metadata.benchmark_title"],
};

const RESOURCE_SOURCE_BASIS = {
  technology: ["technologyScopes", "compatibility.operatingSystems"],
  product: ["technologyScopes", "compatibility.operatingSystems"],
  asset_class: ["technologyScopes"],
  environment: ["technologyScopes"],
  organization: ["publisher"],
  framework: ["frameworks"],
  program: ["programs"],
  tool: ["id", "shortName"],
  topic: ["programs"],
};

function sourceBasisForDimension(dimension) {
  return {
    record: RECORD_SOURCE_BASIS[dimension] ?? [],
    resource: RESOURCE_SOURCE_BASIS[dimension] ?? [],
    template: [],
    playbook: [],
    export: ["from_taxonomy_tags", "to_taxonomy_tags"],
  };
}

/**
 * Control Atlas taxonomy contract v2.
 *
 * Term definitions are governed in data/curated/taxonomy-terms.json and
 * resolved through data/generated/taxonomy-registry.json. Behavioral rules
 * (source_basis, filter semantics, applicability resolution) remain here.
 */
export const TAXONOMY_CONTRACT = {
  version: "2.0.0",
  owner: "Control Atlas data stewardship",
  review_date: "2026-08-23",
  supersession_rule: "A later version replaces this contract only through a reviewed migration with stable-ID reconciliation.",
  layers: {
    publisher: "Publisher-declared classifications and identifiers.",
    atlas_evidence: "Control Atlas facets supported by a declared source field and rule.",
    editorial: "Navigation concepts; never record applicability unless separately governed.",
  },
  assignment_provenance_layers: {
    publisher: "publisher",
    inferred: "atlas_evidence",
  },
  applicability_states: {
    applicable: "At least one approved tag in the dimension is supported by a declared source field and rule.",
    not_applicable: "A reviewed, source-backed rule explicitly states that the dimension does not apply to the record.",
    unreviewed: "No approved tag or explicit not-applicable decision has been recorded for the dimension.",
  },
  applicability_resolution: {
    positive_evidence: "metadata.taxonomy_tags",
    explicit_negative_evidence: "metadata.taxonomy_dimension_states",
    explicit_negative_shape: "Each decision records state=not_applicable, source_field, and rule.",
    absence_rule: "Absence of a tag is unreviewed, never implicitly not applicable.",
  },
  filter_semantics: {
    within_dimension: "or",
    across_dimensions: "and",
    url_parameter: "tag",
    unavailable_values: "suppress",
    aliases: "search_only",
  },
  dimensions: registry.dimensions,
  tags: registry.terms.map((term) => ({
    id: term.id,
    label: term.label,
    aliases: term.aliases ?? [],
    parent_id: term.dimension,
    hierarchy: term.hierarchy,
    dimension: term.dimension,
    entity_scope: registry.dimensions.find((d) => d.id === term.dimension)?.entity_scope
      ?? ["record", "resource", "template", "playbook", "export"],
    applicability: "Requires an explicit publisher field or catalog classification named in source_basis; never infer from incidental prose.",
    source_basis: sourceBasisForDimension(term.dimension),
    provenance: "atlas_evidence",
    confidence: "high",
    validation_state: "approved",
    owner: term.owner ?? "Control Atlas data stewardship",
    review_date: term.review_date ?? "2026-08-23",
    identity_key: term.identity_key ?? null,
  })),
};

export const TAXONOMY_TAGS = TAXONOMY_CONTRACT.tags;
export const TAXONOMY_TAG_BY_ID = new Map(TAXONOMY_TAGS.map((tag) => [tag.id, tag]));

export function taxonomyTagMatchesQuery(tag, query) {
  const needle = String(query || "").trim().toLocaleLowerCase();
  if (!needle) return true;
  return [tag.id, tag.label, ...tag.aliases]
    .some((value) => value.toLocaleLowerCase().includes(needle));
}
