import type { AtlasCatalogMembership } from "./atlasGraphProjection";
import { catalogProfileFor } from "./catalogProfiles";

export type AtlasRegistryPublication = {
  id: string;
  display_name?: string;
  display_group?: string;
  owner?: string;
  lifecycle_status?: string;
  version?: string;
  metadata?: { transition_note?: string };
};

export type AtlasRegistryBundle = {
  catalog_id: string;
  publication_source_id: string;
};

export type AtlasSourceRegistry = {
  publications: AtlasRegistryPublication[];
  catalog_source_bundles: AtlasRegistryBundle[];
};

// This third-party questionnaire remains searchable source data, but is not
// one of the 27 authoritative publications in the Atlas browse hierarchy.
export const ATLAS_BROWSE_EXCLUSIONS = new Set(["microsoft-zt-maturity"]);

function ecosystemLabel(publication: AtlasRegistryPublication) {
  const group = String(publication.display_group || "").trim();
  if (group && group !== "Other") return group;
  return String(publication.owner || publication.display_name || publication.id).trim();
}

function ecosystemId(label: string) {
  return `ecosystem:${label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export function buildAtlasCatalogMemberships(
  registry: AtlasSourceRegistry,
): AtlasCatalogMembership[] {
  const publications = new Map(
    registry.publications.map((publication) => [publication.id, publication]),
  );
  return registry.catalog_source_bundles
    .filter((bundle) => !ATLAS_BROWSE_EXCLUSIONS.has(bundle.catalog_id))
    .map((bundle) => {
      const publication = publications.get(bundle.publication_source_id);
      if (!publication) {
        throw new Error(
          `Atlas catalog ${bundle.catalog_id} has no publication source ${bundle.publication_source_id}.`,
        );
      }
      const label = ecosystemLabel(publication);
      return {
        catalogId: bundle.catalog_id,
        publicationSourceId: bundle.publication_source_id,
        ecosystemId: ecosystemId(label),
        ecosystemLabel: label,
        ecosystemDescription: `Authoritative publications and source records issued by ${label}.`,
        publicationDescription:
          publication.metadata?.transition_note ||
          `${publication.display_name || bundle.catalog_id}${publication.version ? `, ${publication.version}` : ""}.`,
        lifecycleStatus: publication.lifecycle_status || "unknown",
        version: publication.version || "",
        publicationKind: catalogProfileFor(bundle.catalog_id).publicationKind,
      };
    });
}
