import frameworkLenses from "../../../data/curated/framework-lenses.json";
import { catalogProfileFor } from "./catalogProfiles";

/**
 * The three ways the Atlas landing groups its 28 publications.
 *
 * The landing used to draw all 28 at once as a dependency hierarchy, which put
 * SP 800-53 at the top of everything. That was wrong twice over: it is more
 * than anyone can read at a glance, and its top row was five unlike documents
 * — a control catalog, a threat knowledge base, an outcome framework, a
 * federal policy and a process — placed as peers because nothing else in this
 * corpus happens to build on them. Grouping first and drilling second says
 * something true on every screen and shows five or six things instead of
 * twenty-eight.
 *
 * See data/curated/framework-lenses.json for what each grouping claims and
 * which of them is derived rather than authored.
 */
export type AtlasLensFamily = {
  id: string;
  label: string;
  blurb: string;
  /** Why these belong together — empty for the derived lenses. */
  rationale: string;
  catalogIds: string[];
};

export type AtlasLensGrouping = {
  id: string;
  label: string;
  blurb: string;
  families: AtlasLensFamily[];
};

type LensFile = {
  kind: {
    label: string;
    blurb: string;
    prompt: string;
    families: { id: string; label: string; blurb: string; publicationKinds: string[] }[];
  };
  job: {
    label: string;
    blurb: string;
    prompt: string;
    families: {
      id: string;
      label: string;
      blurb: string;
      rationale: string;
      catalogIds: string[];
    }[];
  };
  publisher: {
    label: string;
    blurb: string;
    prompt: string;
    ecosystems: Record<string, string>;
    strips: { id: string; heading: string; note: string; landmarkIds: string[] }[];
  };
};

/** The shape the publisher lens needs from the built artifact. */
export type PublisherEcosystem = {
  id: string;
  label: string;
  catalogIds: string[];
};

const LENSES = frameworkLenses as unknown as LensFile;

/** The lens ids that may appear in the URL, in the order the buttons sit. */
export const ATLAS_LENS_GROUPING_IDS = ["kind", "publishers", "job"] as const;
export type AtlasLensGroupingId = (typeof ATLAS_LENS_GROUPING_IDS)[number];

export function isAtlasLensGroupingId(value: string): value is AtlasLensGroupingId {
  return (ATLAS_LENS_GROUPING_IDS as readonly string[]).includes(value);
}

/**
 * Kind families, resolved against the publicationKind already recorded for
 * every catalog rather than by listing catalog ids again here. A catalog whose
 * kind no lens family claims would silently vanish from the landing, so
 * `unclaimedPublicationKinds` exists for the graph test to assert against.
 */
export function kindFamiliesFor(catalogIds: string[]): AtlasLensFamily[] {
  const byKind = new Map<string, string[]>();
  for (const catalogId of catalogIds) {
    const kind = catalogProfileFor(catalogId).publicationKind;
    const bucket = byKind.get(kind) || [];
    bucket.push(catalogId);
    byKind.set(kind, bucket);
  }
  return LENSES.kind.families.map((family) => ({
    id: family.id,
    label: family.label,
    blurb: family.blurb,
    rationale: "",
    catalogIds: family.publicationKinds.flatMap((kind) => byKind.get(kind) || []),
  }));
}

/** Publication kinds present in the corpus that no kind family claims. */
export function unclaimedPublicationKinds(catalogIds: string[]): string[] {
  const claimed = new Set(
    LENSES.kind.families.flatMap((family) => family.publicationKinds),
  );
  const missing = new Set<string>();
  for (const catalogId of catalogIds) {
    const kind = catalogProfileFor(catalogId).publicationKind;
    if (!claimed.has(kind)) missing.add(kind);
  }
  return [...missing].sort();
}

/** Job families, restricted to the catalogs actually present in the corpus. */
export function jobFamiliesFor(catalogIds: string[]): AtlasLensFamily[] {
  const present = new Set(catalogIds);
  return LENSES.job.families.map((family) => ({
    id: family.id,
    label: family.label,
    blurb: family.blurb,
    rationale: family.rationale,
    catalogIds: family.catalogIds.filter((catalogId) => present.has(catalogId)),
  }));
}

/** Catalogs in the corpus that the authored job lens does not place. */
export function unplacedByJob(catalogIds: string[]): string[] {
  const placed = new Set(LENSES.job.families.flatMap((family) => family.catalogIds));
  return catalogIds.filter((catalogId) => !placed.has(catalogId)).sort();
}

/** Catalog ids the job lens names that are not in the corpus at all. */
export function unknownJobCatalogIds(catalogIds: string[]): string[] {
  const present = new Set(catalogIds);
  return [...new Set(LENSES.job.families.flatMap((family) => family.catalogIds))]
    .filter((catalogId) => !present.has(catalogId))
    .sort();
}


/**
 * Publisher families, read from the artifact's own ecosystems.
 *
 * Membership is not authored here: who published a document is a fact the
 * build already records, and re-stating it in a curated file would only create
 * something to drift. The curated file supplies one line about who each
 * publisher is, because the generated description is the same sentence with a
 * different name in it for all eight.
 *
 * Ordered by how much they publish. That is a ranking, but an honest and
 * useful one here — unlike dependency depth, "who has the most in the Atlas"
 * is exactly what the number on the card says.
 */
export function publisherFamiliesFor(
  ecosystems: PublisherEcosystem[],
  catalogIds: string[],
): AtlasLensFamily[] {
  const present = new Set(catalogIds);
  return ecosystems
    .map((ecosystem) => ({
      id: ecosystem.id,
      label: ecosystem.label,
      blurb: LENSES.publisher.ecosystems[ecosystem.id] || "",
      rationale: "",
      catalogIds: ecosystem.catalogIds.filter((catalogId) => present.has(catalogId)),
    }))
    .filter((family) => family.catalogIds.length > 0)
    .sort(
      (a, b) =>
        b.catalogIds.length - a.catalogIds.length || a.label.localeCompare(b.label),
    );
}

/**
 * Publications no ecosystem claims. Not every publisher in this corpus is a
 * federal one, and a board that quietly dropped what it could not file would
 * be telling the reader they were looking at everything when they were not.
 */
export function publicationsWithoutPublisher(
  ecosystems: PublisherEcosystem[],
  catalogIds: string[],
): string[] {
  const claimed = new Set(ecosystems.flatMap((ecosystem) => ecosystem.catalogIds));
  return catalogIds.filter((catalogId) => !claimed.has(catalogId)).sort();
}

/** The non-publisher landmarks the publisher board names beneath its groups. */
export function publisherStrips(): {
  id: string;
  heading: string;
  note: string;
  landmarkIds: string[];
}[] {
  return LENSES.publisher.strips.map((strip) => ({ ...strip }));
}

export const ATLAS_LENS_LABELS: Record<
  string,
  { label: string; blurb: string; prompt: string }
> = {
  kind: {
    label: LENSES.kind.label,
    blurb: LENSES.kind.blurb,
    prompt: LENSES.kind.prompt,
  },
  publishers: {
    label: LENSES.publisher.label,
    blurb: LENSES.publisher.blurb,
    prompt: LENSES.publisher.prompt,
  },
  job: {
    label: LENSES.job.label,
    blurb: LENSES.job.blurb,
    prompt: LENSES.job.prompt,
  },
};
