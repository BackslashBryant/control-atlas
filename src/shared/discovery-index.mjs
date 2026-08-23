import discoveryIndex from "../../data/generated/discovery-index.json" with { type: "json" };

export function queryDiscoveryIndex(tagFilters) {
  if (!tagFilters || tagFilters.length === 0) return [];
  return discoveryIndex.entries.filter((entry) => {
    const allTags = [...entry.direct_tags, ...entry.derived_tags];
    return tagFilters.every((filter) => allTags.includes(filter));
  });
}

export function discoveryEntries() {
  return discoveryIndex.entries;
}
