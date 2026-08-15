import librarySearchArtifact from "../../../data/generated/library-search.json";

import { TAXONOMY_CONTRACT } from "../../shared/taxonomy-contract.mjs";

export type HomeTagPresentation = {
  count: number;
  dimension: string;
  id: string;
  label: string;
  scale: number;
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
      count: Number(tagCounts[tag.id]),
      dimension: dimension.id,
      id: tag.id,
      label: tag.label,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, TAGS_PER_DIMENSION),
);

const logCounts = selectedTags.map((tag) => Math.log10(tag.count + 1));
const minimumLogCount = Math.min(...logCounts);
const maximumLogCount = Math.max(...logCounts);
const logRange = maximumLogCount - minimumLogCount || 1;

export const HOME_TAG_GROUPS = Object.freeze(
  TAXONOMY_CONTRACT.dimensions.map((dimension) => Object.freeze({
    id: dimension.id,
    label: dimension.label,
    tags: Object.freeze(
      selectedTags
        .filter((tag) => tag.dimension === dimension.id)
        .map((tag) => Object.freeze({
          ...tag,
          scale: Number(((Math.log10(tag.count + 1) - minimumLogCount) / logRange).toFixed(4)),
        })),
    ),
  })),
) as readonly HomeTagGroup[];

export const HOME_TAG_COUNT = HOME_TAG_GROUPS.reduce((total, group) => total + group.tags.length, 0);
