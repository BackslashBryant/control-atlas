import { humanizeSlug } from "../../app/display-names.mjs";
import { catalogDisplayNameFor } from "./catalogProfiles";
import { sourceIdentityPresentationFor } from "./sourceIdentity";
import publicationIdentityIndexArtifact from "../../../data/generated/publication-identity-index.json";

export type SourceLayerId =
  | "publication"
  | "connection"
  | "ingestion"
  | "organization";

export type SourceFieldState =
  | "recorded"
  | "derived"
  | "not_applicable"
  | "missing"
  | "blocked";

export type SourceField<T> = {
  value: T | null;
  state: SourceFieldState;
  reason: string;
};

export type SourceRegisterFilters = {
  query?: string;
  publisher?: string;
  provenance?: string;
  eligibility?: string;
  lifecycle?: string;
  access?: string;
};

export type CatalogSummary = {
  id: string;
  name: string;
  source_id: string;
  leaf_record_count: number;
  source_review?: {
    reviewed_at: string;
    semantic_content_review:
      | "reviewed_no_known_mismatch"
      | "remediation_required"
      | "blocked";
    upstream_currentness_review:
      | "current_as_checked"
      | "refresh_required"
      | "superseded"
      | "blocked";
  };
};

export type SourcePublicationReview = {
  catalogId: string;
  publicationName: string;
  reviewedAt: string;
  semanticContentReview: NonNullable<
    CatalogSummary["source_review"]
  >["semantic_content_review"];
  upstreamCurrentnessReview: NonNullable<
    CatalogSummary["source_review"]
  >["upstream_currentness_review"];
};

export type SourceMaterialItem = {
  id: string;
  displayTitle: string;
  publisher: string;
  format: string;
  retrievedAt: string | null;
  recordCount: number | null;
  relationshipCount: number | null;
  url: string;
  role: "primary" | "enrichment" | "reference" | "supplemental";
  provenance: string;
  isCommunity: boolean;
};

export type ConnectionEvidenceItem = {
  id: string;
  displayTitle: string;
  publisher: string;
  format: string;
  retrievedAt: string | null;
  relationshipCount: number | null;
  recordCount: number | null;
  url: string;
};

export type SourceRegisterRow = {
  id: string;
  layer: SourceLayerId;
  displayTitle: string;
  publicationSourceId: string | null;
  publisher: SourceField<string>;
  coverage: SourceField<string[]>;
  format: SourceField<string>;
  version: SourceField<string>;
  retrievedAt: SourceField<string>;
  verifiedAt: SourceField<string>;
  lifecycle: SourceField<string>;
  recordCount: SourceField<number>;
  relationshipCount: SourceField<number>;
  officialLink: string;
  artifactLink: string;
  provenance: string;
  eligibility: string;
  access: string;
};

export type PublicationRegisterRow = SourceRegisterRow & {
  familyName: string;
  catalogId: string | null;
  catalogCounts: { discovered_records: number; normalized_records: number } | null;
  coverageSummary: string;
  sourceMaterials: {
    primary: SourceMaterialItem[];
    enrichment: SourceMaterialItem[];
    reference: SourceMaterialItem[];
    supplemental: SourceMaterialItem[];
  };
  connectionEvidence: ConnectionEvidenceItem[];
  reviews: SourcePublicationReview[];
  rawSource: any;
};

export type SourceLayerOptions = {
  publishers: string[];
  lifecycleStatuses: string[];
};

export type SourceLayerCompleteness = {
  total: number;
  fields: Record<
    keyof Pick<
      SourceRegisterRow,
      | "publisher"
      | "coverage"
      | "format"
      | "version"
      | "retrievedAt"
      | "verifiedAt"
      | "lifecycle"
      | "recordCount"
      | "relationshipCount"
    >,
    Record<SourceFieldState, number>
  >;
};

const CONNECTION_ROLES = new Set(["mapping"]);
const INGESTION_ROLES = new Set([
  "primary_data",
  "enrichment",
  "assessment",
  "automation",
  "reconciliation",
  "reference_only",
  "historical",
  // Real publisher content that supports a canonical publication identity
  // without being the landmark itself (Phase 2 T2.2/T2.3).
  "supplemental",
  // OSCAL-only ingestion sources that never resolve to a publication
  // identity (see INGESTION_ONLY_SOURCE_IDS in catalog-publication-identity.mjs).
  "ingestion",
]);

function isRecordedString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !/^(?:not recorded|publisher not recorded|coverage not recorded)$/i.test(
      value.trim(),
    )
  );
}

function recorded<T>(value: T, reason = "Recorded by the source registry."): SourceField<T> {
  return { value, state: "recorded", reason };
}

function derived<T>(value: T, reason: string): SourceField<T> {
  return { value, state: "derived", reason };
}

function missing<T>(reason: string): SourceField<T> {
  return { value: null, state: "missing", reason };
}

function notApplicable<T>(reason: string): SourceField<T> {
  return { value: null, state: "not_applicable", reason };
}

function blocked<T>(reason: string): SourceField<T> {
  return { value: null, state: "blocked", reason };
}

function stringField(value: unknown, missingReason: string): SourceField<string> {
  return isRecordedString(value) ? recorded(value.trim()) : missing(missingReason);
}

function numberField(value: unknown, missingReason: string): SourceField<number> {
  return typeof value === "number" && Number.isFinite(value)
    ? recorded(value)
    : missing(missingReason);
}

export function canonicalSourceIdsFromCatalogs(
  catalogs: CatalogSummary[],
): Set<string> {
  return new Set(catalogs.map((catalog) => catalog.source_id));
}

export function publicationReviewsForSource(
  sourceId: string,
  sources: any[],
  catalogs: CatalogSummary[],
): SourcePublicationReview[] {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const source = sourceById.get(sourceId);
  if (!source) return [];

  const catalogIds = new Set<string>();
  const addSourceCatalogs = (candidate: any) => {
    for (const catalogId of candidate?.metadata?.frameworks || []) {
      catalogIds.add(catalogId);
    }
    for (const catalog of catalogs) {
      if (catalog.source_id === candidate?.id) catalogIds.add(catalog.id);
    }
  };

  addSourceCatalogs(source);
  if (isRecordedString(source.publication_source_id)) {
    addSourceCatalogs(sourceById.get(source.publication_source_id));
  }

  return catalogs
    .filter((catalog) => catalogIds.has(catalog.id) && catalog.source_review)
    .map((catalog) => ({
      catalogId: catalog.id,
      publicationName: catalogDisplayNameFor(catalog.id, catalog.name),
      reviewedAt: catalog.source_review!.reviewed_at,
      semanticContentReview: catalog.source_review!.semantic_content_review,
      upstreamCurrentnessReview:
        catalog.source_review!.upstream_currentness_review,
    }))
    .sort((left, right) =>
      left.publicationName.localeCompare(right.publicationName),
    );
}

export function classifySourceLayer(source: any): SourceLayerId {
  if (
    source.provenance_class === "control_atlas_derived" ||
    source.source_role === "editorial"
  ) {
    return "organization";
  }
  const role = source.source_role || source.metadata?.identity_kind;
  if (role === "publication") return "publication";
  if (CONNECTION_ROLES.has(role)) return "connection";
  if (INGESTION_ROLES.has(role) || role === "reference") return "ingestion";
  return "publication";
}

function recordedSourceDisplayName(source: any): string | null {
  const candidate = [source?.display_name, source?.name].find(
    (value) => isRecordedString(value) && value.trim() !== source?.id,
  );
  return candidate ? candidate.trim() : null;
}

function sourceDisplayName(source: any): string {
  return recordedSourceDisplayName(source) || humanizeSlug(source.id);
}

function parentPublicationReason(parent: any): string {
  const parentName = recordedSourceDisplayName(parent);
  return parentName
    ? `Inherited from parent publication ${parentName}.`
    : "Inherited from the linked parent publication.";
}

function sourceTitle(source: any, parent: any | null): string {
  const candidate = [source.display_name, source.name].find(
    (value) => isRecordedString(value) && value !== source.id,
  );
  if (candidate) return candidate.trim();
  if (parent) {
    const parentTitle = sourceDisplayName(parent);
    return `${parentTitle} ${humanizeSlug(source.source_role || "source material")}`;
  }
  return humanizeSlug(source.id);
}

function publisherField(source: any, parent: any | null): SourceField<string> {
  if (
    source.metadata?.owner_resolution === "parent_publication" &&
    isRecordedString(parent?.owner)
  ) {
    return derived(
      parent.owner.trim(),
      parentPublicationReason(parent),
    );
  }
  if (isRecordedString(source.owner)) return recorded(source.owner.trim());
  if (isRecordedString(parent?.owner)) {
    return derived(
      parent.owner.trim(),
      parentPublicationReason(parent),
    );
  }
  return missing("Publisher is not recorded on this source or its parent publication.");
}

function coverageField(
  layer: SourceLayerId,
  catalogs: CatalogSummary[],
): SourceField<string[]> {
  if (layer !== "publication") {
    return notApplicable("Catalog coverage is only applicable to publication identities.");
  }
  if (!catalogs.length) {
    return notApplicable("This publication is a source or authority reference, not a catalog profile.");
  }
  return derived(
    catalogs.map((catalog) => catalog.name || humanizeSlug(catalog.id)),
    "Derived from catalog profiles that name this publication as their source.",
  );
}

function formatField(source: any, layer: SourceLayerId): SourceField<string> {
  const value = source.format || source.artifact_type;
  if (isRecordedString(value)) return recorded(value);
  if (layer !== "ingestion" && layer !== "connection") {
    return notApplicable("File format is not applicable to publication identities.");
  }
  if (source.metadata?.identity_kind === "reference") {
    return notApplicable("This entry is a reference page, not a retrieved file.");
  }
  return missing("File format is not recorded for this retrieved source.");
}

function countField(
  value: unknown,
  layer: SourceLayerId,
  kind: "record" | "relationship",
): SourceField<number> {
  if (typeof value === "number" && Number.isFinite(value)) return recorded(value);
  if (layer === "publication" || layer === "organization") {
    return notApplicable(
      `${kind === "record" ? "Imported record" : "Published relationship"} counts belong to retrieved or mapping artifacts.`,
    );
  }
  return numberField(
    value,
    `${kind === "record" ? "Imported record" : "Published relationship"} count is not recorded for this source.`,
  );
}

function resolveSourceMaterialItems(
  ids: string[],
  sourcesById: Map<string, any>,
  parent: any,
  role: "primary" | "enrichment" | "reference" | "supplemental",
): SourceMaterialItem[] {
  return ids
    .map((id) => {
      const source = sourcesById.get(id);
      if (!source) return null;
      const displayTitle = sourceTitle(source, parent);
      const isCommunity =
        source.metadata?.identity_kind === "reference" ||
        /community|open source|unofficial/i.test(source.owner || "");
      return {
        id: source.id,
        displayTitle,
        publisher: source.owner || parent?.owner || "Publisher not recorded",
        format:
          source.format ||
          source.artifact_type ||
          (source.metadata?.identity_kind === "reference"
            ? "Reference page"
            : "Not recorded"),
        retrievedAt: source.retrieved_at || null,
        recordCount:
          typeof source.record_count === "number" ? source.record_count : null,
        relationshipCount:
          typeof source.relationship_count === "number"
            ? source.relationship_count
            : null,
        url: source.artifact_url || source.catalog_browse_url || "",
        role,
        provenance: source.provenance_class || "",
        isCommunity,
      };
    })
    .filter((item): item is SourceMaterialItem => item !== null)
    .sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
}

function resolveConnectionEvidenceItems(
  ids: string[],
  sourcesById: Map<string, any>,
  parent: any,
): ConnectionEvidenceItem[] {
  return ids
    .map((id) => {
      const source = sourcesById.get(id);
      if (!source) return null;
      const displayTitle = sourceTitle(source, parent);
      return {
        id: source.id,
        displayTitle,
        publisher: source.owner || parent?.owner || "Publisher not recorded",
        format: source.format || source.artifact_type || "Not recorded",
        retrievedAt: source.retrieved_at || null,
        relationshipCount:
          typeof source.relationship_count === "number"
            ? source.relationship_count
            : null,
        recordCount:
          typeof source.record_count === "number" ? source.record_count : null,
        url: source.artifact_url || source.catalog_browse_url || "",
      };
    })
    .filter((item): item is ConnectionEvidenceItem => item !== null)
    .sort((a, b) => a.displayTitle.localeCompare(b.displayTitle));
}

function matchesPublicationFilters(
  row: PublicationRegisterRow,
  filters: SourceRegisterFilters,
): boolean {
  if (filters.publisher && row.publisher.value !== filters.publisher) return false;
  if (filters.lifecycle && row.lifecycle.value !== filters.lifecycle) return false;
  if (filters.provenance && row.provenance !== filters.provenance) return false;
  if (filters.eligibility && row.eligibility !== filters.eligibility) return false;
  if (filters.access && row.access !== filters.access) return false;

  const query = (filters.query || "").trim().toLocaleLowerCase();
  if (!query) return true;

  const candidateStrings: string[] = [
    row.id,
    row.displayTitle,
    row.familyName,
    row.publisher.value || "",
    row.version.value || "",
    row.coverageSummary,
    row.catalogId || "",
    ...(row.coverage.value || []),
    ...row.sourceMaterials.primary.flatMap((m) => [m.id, m.displayTitle]),
    ...row.sourceMaterials.enrichment.flatMap((m) => [m.id, m.displayTitle]),
    ...row.sourceMaterials.supplemental.flatMap((m) => [m.id, m.displayTitle]),
    ...row.sourceMaterials.reference.flatMap((m) => [m.id, m.displayTitle]),
    ...row.connectionEvidence.flatMap((e) => [e.id, e.displayTitle]),
  ];

  return candidateStrings.some((value) =>
    (value || "").toLocaleLowerCase().includes(query),
  );
}

export function buildPublicationRegister(
  sources: any[],
  catalogs: CatalogSummary[],
  filters: SourceRegisterFilters = {},
  quarantine: Array<{ id: string; reason?: string }> = [],
): PublicationRegisterRow[] {
  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  const catalogsBySource = new Map<string, CatalogSummary[]>();
  for (const catalog of catalogs) {
    const current = catalogsBySource.get(catalog.source_id) || [];
    current.push(catalog);
    catalogsBySource.set(catalog.source_id, current);
  }

  const quarantineById = new Map(
    quarantine.map((entry) => [
      entry.id,
      entry.reason || "This publication is quarantined pending review.",
    ]),
  );

  const rawIdentities = publicationIdentityIndexArtifact.identities || [];

  const rows: PublicationRegisterRow[] = rawIdentities.map((identity) => {
    const source =
      sourcesById.get(identity.id) || {
        id: identity.id,
        name: identity.name,
        display_name: identity.name,
        owner: identity.publisher,
        lifecycle_status: "active",
      };

    const sourceCatalogs =
      catalogsBySource.get(source.id) ||
      (identity.catalog_id
        ? catalogs.filter((c) => c.id === identity.catalog_id)
        : []);

    const isAuthority = identity.id.startsWith("authority-");
    const quarantineReason = quarantineById.get(identity.id);
    const identityPresentation = sourceIdentityPresentationFor(source);

    const versionField = isRecordedString(source.version)
      ? recorded(source.version.trim())
      : isAuthority
        ? notApplicable(
            "Authority documents are identified by statutory citation, not release version.",
          )
        : missing("Publisher version is not recorded.");

    const verifiedField = isRecordedString(source.last_checked)
      ? recorded(source.last_checked.trim())
      : missing("Not checked.");

    const lifecycleField: SourceField<string> = quarantineReason
      ? blocked<string>(quarantineReason)
      : stringField(source.lifecycle_status, "Lifecycle status is not recorded.");

    const publisher = publisherField(source, null);
    const coverage = coverageField("publication", sourceCatalogs);
    const format = formatField(source, "publication");
    const recordCount = identity.catalog_counts
      ? recorded(identity.catalog_counts.normalized_records)
      : countField(source.record_count, "publication", "record");
    const relationshipCount = countField(
      source.relationship_count,
      "publication",
      "relationship",
    );

    const sourceMaterials = {
      primary: resolveSourceMaterialItems(
        identity.source_materials?.primary || [],
        sourcesById,
        source,
        "primary",
      ),
      enrichment: resolveSourceMaterialItems(
        identity.source_materials?.enrichment || [],
        sourcesById,
        source,
        "enrichment",
      ),
      reference: resolveSourceMaterialItems(
        identity.source_materials?.reference || [],
        sourcesById,
        source,
        "reference",
      ),
      supplemental: resolveSourceMaterialItems(
        identity.source_materials?.other || [],
        sourcesById,
        source,
        "supplemental",
      ),
    };

    const connectionEvidence = resolveConnectionEvidenceItems(
      identity.connection_evidence || [],
      sourcesById,
      source,
    );

    const reviews = publicationReviewsForSource(identity.id, sources, catalogs);

    const coverageSummary =
      sourceCatalogs.length > 0
        ? sourceCatalogs
            .map(
              (c) =>
                `${catalogDisplayNameFor(c.id, c.name)}${
                  c.leaf_record_count
                    ? ` (${c.leaf_record_count.toLocaleString()} records)`
                    : ""
                }`,
            )
            .join(", ")
        : isAuthority
          ? "Statutory authority"
          : "Reference publication";

    return {
      id: identity.id,
      layer: "publication",
      displayTitle: identity.name || sourceTitle(source, null),
      familyName: identityPresentation.familyName,
      publicationSourceId: null,
      publisher,
      coverage,
      format,
      version: versionField,
      retrievedAt: stringField(
        source.retrieved_at,
        "Retrieval date is not recorded.",
      ),
      verifiedAt: verifiedField,
      lifecycle: lifecycleField,
      recordCount,
      relationshipCount,
      officialLink:
        source.catalog_browse_url || source.artifact_url || "",
      artifactLink: source.artifact_url || "",
      provenance: source.provenance_class || "official",
      eligibility: source.eligibility_status || "eligible",
      access: source.access_status || "public",
      catalogId: identity.catalog_id || null,
      catalogCounts: identity.catalog_counts || null,
      coverageSummary,
      sourceMaterials,
      connectionEvidence,
      reviews,
      rawSource: source,
    };
  });

  const filtered = rows.filter((row) => matchesPublicationFilters(row, filters));

  filtered.sort(
    (left, right) =>
      (left.publisher.value || "").localeCompare(right.publisher.value || "") ||
      left.displayTitle.localeCompare(right.displayTitle),
  );

  return filtered;
}

function buildRows(
  sources: any[],
  catalogs: CatalogSummary[],
  quarantine: Map<string, string> = new Map(),
): SourceRegisterRow[] {
  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  const catalogsBySource = new Map<string, CatalogSummary[]>();
  for (const catalog of catalogs) {
    const current = catalogsBySource.get(catalog.source_id) || [];
    current.push(catalog);
    catalogsBySource.set(catalog.source_id, current);
  }

  return sources.map((source) => {
    const publicationSourceId = isRecordedString(source.publication_source_id)
      ? source.publication_source_id
      : null;
    const parent = publicationSourceId
      ? sourcesById.get(publicationSourceId) || null
      : null;
    const layer = classifySourceLayer(source);
    const sourceCatalogs = catalogsBySource.get(source.id) || [];
    const isReference = source.metadata?.identity_kind === "reference";
    const quarantineReason = quarantine.get(source.id);

    return {
      id: source.id,
      layer,
      displayTitle: sourceTitle(source, parent),
      publicationSourceId,
      publisher: publisherField(source, parent),
      coverage: coverageField(layer, sourceCatalogs),
      format: formatField(source, layer),
      version: stringField(source.version, "Publisher version is not recorded."),
      retrievedAt: stringField(source.retrieved_at, "Retrieval date is not recorded."),
      verifiedAt: stringField(source.last_checked, "Not checked."),
      lifecycle: quarantineReason
        ? blocked(quarantineReason)
        : stringField(source.lifecycle_status, "Lifecycle status is not recorded."),
      recordCount: isReference
        ? notApplicable("Reference pages do not import records.")
        : countField(source.record_count, layer, "record"),
      relationshipCount: isReference
        ? notApplicable("Reference pages do not publish imported relationships.")
        : countField(source.relationship_count, layer, "relationship"),
      officialLink: source.catalog_browse_url || parent?.catalog_browse_url || "",
      artifactLink: source.artifact_url || "",
      provenance: source.provenance_class || "",
      eligibility: source.eligibility_status || "",
      access: source.access_status || "",
    };
  });
}

function matchesFilters(
  row: SourceRegisterRow,
  filters: SourceRegisterFilters,
): boolean {
  if (filters.publisher && row.publisher.value !== filters.publisher) return false;
  if (filters.provenance && row.provenance !== filters.provenance) return false;
  if (filters.eligibility && row.eligibility !== filters.eligibility) return false;
  if (filters.lifecycle && row.lifecycle.value !== filters.lifecycle) return false;
  if (filters.access && row.access !== filters.access) return false;

  const query = (filters.query || "").trim().toLocaleLowerCase();
  if (!query) return true;
  return [
    row.id,
    row.displayTitle,
    row.publicationSourceId,
    row.publisher.value,
    row.format.value,
    row.version.value,
    ...(row.coverage.value || []),
  ].some((value) => String(value || "").toLocaleLowerCase().includes(query));
}

export function buildSourceLayers(
  sources: any[],
  catalogs: CatalogSummary[],
  filters: SourceRegisterFilters = {},
  quarantine: Array<{ id: string; reason?: string }> = [],
): Record<SourceLayerId, SourceRegisterRow[]> {
  const layers: Record<SourceLayerId, SourceRegisterRow[]> = {
    organization: [],
    publication: [],
    connection: [],
    ingestion: [],
  };
  const quarantineById = new Map(
    quarantine.map((entry) => [entry.id, entry.reason || "This source is quarantined pending review."]),
  );

  for (const row of buildRows(sources, catalogs, quarantineById)) {
    if (matchesFilters(row, filters)) layers[row.layer].push(row);
  }

  for (const rows of Object.values(layers)) {
    rows.sort(
      (left, right) =>
        (left.publisher.value || "").localeCompare(right.publisher.value || "") ||
        left.displayTitle.localeCompare(right.displayTitle),
    );
  }
  return layers;
}

export function sourceLayerOptions(rows: SourceRegisterRow[]): SourceLayerOptions {
  const sortedDistinct = (values: Array<string | null>) =>
    [...new Set(values.filter((value): value is string => Boolean(value)))].sort(
      (left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }),
    );
  return {
    publishers: sortedDistinct(rows.map((row) => row.publisher.value)),
    lifecycleStatuses: sortedDistinct(rows.map((row) => row.lifecycle.value)),
  };
}

export function sourceLayerCompleteness(
  rows: SourceRegisterRow[],
): SourceLayerCompleteness {
  const fieldNames = [
    "publisher",
    "coverage",
    "format",
    "version",
    "retrievedAt",
    "verifiedAt",
    "lifecycle",
    "recordCount",
    "relationshipCount",
  ] as const;
  const emptyCounts = (): Record<SourceFieldState, number> => ({
    recorded: 0,
    derived: 0,
    not_applicable: 0,
    missing: 0,
    blocked: 0,
  });
  const fields = Object.fromEntries(
    fieldNames.map((fieldName) => [fieldName, emptyCounts()]),
  ) as SourceLayerCompleteness["fields"];
  for (const row of rows) {
    for (const fieldName of fieldNames) {
      fields[fieldName][row[fieldName].state] += 1;
    }
  }
  return { total: rows.length, fields };
}

export function sourceLayerEntityLabel(layer: SourceLayerId, count: number): string {
  const labels: Record<SourceLayerId, [string, string]> = {
    publication: ["publication", "publications"],
    connection: ["connection source", "connection sources"],
    ingestion: ["source material", "source materials"],
    organization: ["structure record", "structure records"],
  };
  return labels[layer][count === 1 ? 0 : 1];
}
