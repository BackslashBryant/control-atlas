import { COMMONS_GROUPS } from "./commonsPresentation.mjs";
import { searchResourceDocuments } from "./resourceSearch.mjs";

/**
 * The approved browse taxonomy is derived from the existing, complete
 * resourceType mapping. It deliberately does not add unverified editorial
 * claims to individual resources.
 */
export const PRIMARY_BROWSE_CATEGORIES = COMMONS_GROUPS.map(({ id, label, blurb }) => ({
  id,
  label,
  blurb,
}));

const CATEGORY_BY_TYPE = new Map(
  COMMONS_GROUPS.flatMap((category) => category.types.map((type) => [type, category.id])),
);

export function primaryBrowseCategory(resource) {
  return CATEGORY_BY_TYPE.get(resource.resourceType) || "";
}

export function primaryBrowseCategoryCounts(resources) {
  const counts = new Map(PRIMARY_BROWSE_CATEGORIES.map((category) => [category.id, 0]));
  for (const resource of resources) {
    const category = primaryBrowseCategory(resource);
    if (category) counts.set(category, (counts.get(category) || 0) + 1);
  }
  return PRIMARY_BROWSE_CATEGORIES.map((category) => ({ ...category, count: counts.get(category.id) || 0 }));
}

function includesQuery(value, query) {
  return String(value || "").toLowerCase().includes(String(query || "").toLowerCase());
}

export function resourceSearchEvidence(resource, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const fields = [
    ["name", resource.name],
    ["short name", resource.shortName],
    ["resource ID", resource.id],
    ["search alias", ...(resource.searchAliases || [])],
    ["search keyword", ...(resource.searchKeywords || [])],
    ["framework", ...(resource.frameworks || [])],
    ["summary", resource.summary],
    ["why included", resource.whyIncluded],
  ];
  return fields.filter(([, ...values]) => values.some((value) => includesQuery(value, normalized))).map(([field]) => field);
}

export function filterDirectoryResources(resources, filters = {}) {
  return resources.filter((resource) => {
    if (filters.category && primaryBrowseCategory(resource) !== filters.category) return false;
    if (filters.collection && !(resource.featuredCollections || []).includes(filters.collection)) return false;
    if (filters.lane && filters.lane !== "all" && resource.resourceLane !== filters.lane) return false;
    if (filters.owner && !includesQuery(resource.publisher, filters.owner)) return false;
    if (filters.framework && !resource.frameworks.some((value) => includesQuery(value, filters.framework))) return false;
    if (filters.lifecycle && !resource.lifecycleStages.some((value) => value.toLowerCase() === filters.lifecycle.toLowerCase())) return false;
    if (filters.audience && !resource.audiences.some((value) => includesQuery(value, filters.audience))) return false;
    if (filters.resourceType && resource.resourceType !== filters.resourceType) return false;
    if (filters.accessType && resource.accessType !== filters.accessType) return false;
    if (filters.costType && resource.costType !== filters.costType) return false;
    return true;
  });
}

/** Filter eligibility before applying editorial ordering. */
export function searchDirectoryResources(resources, query) {
  return searchResourceDocuments(resources, query).map(
    ({ document }) => document,
  );
}

export function sortDirectoryResources(resources, sort = "relevance") {
  if (sort === "name") return [...resources].sort((left, right) => left.name.localeCompare(right.name));
  if (sort === "checked") return [...resources].sort((left, right) => String(right.lastCheckedAt).localeCompare(String(left.lastCheckedAt)) || left.name.localeCompare(right.name));
  return resources;
}
