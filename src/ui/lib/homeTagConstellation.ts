import librarySearchArtifact from "../../../data/generated/library-search.json";

import { TAXONOMY_CONTRACT } from "../../shared/taxonomy-contract.mjs";

export type HomeTagPresentation = {
  dimension: string;
  id: string;
  label: string;
};

export type HomeTagGroup = {
  id: string;
  label: string;
  tags: readonly HomeTagPresentation[];
};

const TAGS_PER_DIMENSION = 3;
const tagCounts = librarySearchArtifact.library_search.browse_counts.tags as Record<string, number>;

const selectedTags = TAXONOMY_CONTRACT.dimensions.flatMap((dimension) =>
  TAXONOMY_CONTRACT.tags
    .filter((tag) => tag.dimension === dimension.id && Number(tagCounts[tag.id] || 0) > 0)
    .map((tag) => ({
      dimension: dimension.id,
      id: tag.id,
      label: tag.label,
    }))
    .slice(0, TAGS_PER_DIMENSION),
);

export const HOME_TAG_GROUPS = Object.freeze(
  TAXONOMY_CONTRACT.dimensions.map((dimension) => Object.freeze({
    id: dimension.id,
    label: dimension.label,
    tags: Object.freeze(
      selectedTags
        .filter((tag) => tag.dimension === dimension.id)
        .map((tag) => Object.freeze(tag)),
    ),
  })),
) as readonly HomeTagGroup[];

export const HOME_TAG_COUNT = HOME_TAG_GROUPS.reduce((total, group) => total + group.tags.length, 0);
